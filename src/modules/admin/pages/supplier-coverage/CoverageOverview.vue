<template>
  <div class="coverage-overview">
    <div class="coverage-overview__kpis">
      <article v-for="metric in metrics" :key="metric.id" class="coverage-metric" :class="`is-${metric.id}`">
        <div class="coverage-metric__top">
          <span class="coverage-metric__icon" aria-hidden="true"><component :is="metric.icon" /></span>
          <div class="coverage-metric__copy">
            <p>{{ metric.label }}</p>
            <strong>{{ metric.value }}</strong>
            <span v-if="metric.lines.length" class="coverage-metric__lines">
              <small v-for="(line, index) in metric.lines" :key="index">{{ line }}</small>
            </span>
          </div>
        </div>
        <div v-if="metric.progress !== undefined" class="coverage-metric__track" aria-hidden="true">
          <span :style="{ width: widthFor(metric.progress) }" />
        </div>
      </article>
    </div>

    <div class="coverage-overview__charts">
      <section class="coverage-chart">
        <div class="coverage-chart__head">
          <h2>{{ t(trendRange ? 'admin.coverage.trendCustom' : 'admin.coverage.trend') }}</h2>
          <el-date-picker
            :model-value="trendRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            size="small"
            clearable
            :disabled="trendLoading"
            :start-placeholder="t('admin.coverage.joinedFrom')"
            :end-placeholder="t('admin.coverage.joinedTo')"
            :aria-label="t('admin.coverage.trendCustom')"
            @update:model-value="onTrendRange"
          />
        </div>
        <p v-if="!trendDays.length" class="coverage-chart__empty">{{ t('admin.coverage.emptyTrend') }}</p>
        <div v-else class="coverage-trend__scroll" tabindex="0" :aria-label="t('admin.coverage.trend')">
          <div class="coverage-trend" :style="{ '--trend-days': trendDays.length }">
            <div class="coverage-trend__axis" aria-hidden="true">
              <span v-for="tick in trendTicks" :key="tick" :style="{ bottom: trendHeight(tick) }">{{ formatCount(tick) }}</span>
            </div>
            <div class="coverage-trend__plot">
              <div class="coverage-trend__grid" aria-hidden="true">
                <span v-for="tick in trendTicks" :key="tick" :style="{ bottom: trendHeight(tick) }" />
              </div>
              <ol class="coverage-trend__bars">
                <li v-for="day in trendDays" :key="day.key" :title="day.suppliers.length ? undefined : day.label" :style="{ '--bar-height': trendHeight(day.count) }">
                  <span class="coverage-overview__sr-only">{{ day.label }}</span>
                  <el-popover
                    v-if="day.suppliers.length"
                    placement="top"
                    :width="260"
                    trigger="hover"
                    :show-after="120"
                    :hide-after="80"
                    popper-class="coverage-trend-pop"
                  >
                    <template #reference>
                      <button type="button" class="coverage-trend__bar-space" :aria-label="day.label">
                        <span class="coverage-trend__value">{{ formatCount(day.count) }}</span>
                        <i v-if="day.count !== null" class="coverage-trend__bar" :class="{ 'is-zero': day.count === 0 }" />
                      </button>
                    </template>
                    <div class="coverage-trend-pop__body">
                      <p class="coverage-trend-pop__title">{{ day.label }}</p>
                      <a
                        v-for="supplier in day.suppliers"
                        :key="supplier.id"
                        class="coverage-trend-pop__link"
                        :href="supplier.href"
                        target="_blank"
                        rel="noopener noreferrer"
                        :aria-label="t('admin.coverage.openSupplier', { name: supplier.name })"
                      >{{ supplier.name }}</a>
                    </div>
                  </el-popover>
                  <div v-else class="coverage-trend__bar-space" aria-hidden="true">
                    <span class="coverage-trend__value">{{ formatCount(day.count) }}</span>
                    <i v-if="day.count !== null" class="coverage-trend__bar" :class="{ 'is-zero': day.count === 0 }" />
                  </div>
                  <span class="coverage-trend__date" aria-hidden="true">{{ day.shortDate }}</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section class="coverage-chart">
        <h2>{{ t('admin.coverage.bands') }}</h2>
        <p v-if="!marginBands.length" class="coverage-chart__empty">{{ t('admin.coverage.emptyBands') }}</p>
        <ul v-else class="coverage-margin">
          <li v-for="band in marginBands" :key="band.key" :class="`is-${band.code}`">
            <div class="coverage-margin__row">
              <div class="coverage-margin__name">
                <strong>{{ band.label }}</strong>
                <span v-if="band.threshold">{{ band.threshold }}</span>
              </div>
              <div class="coverage-margin__figures">
                <span>{{ band.count === null ? '—' : t('admin.coverage.bandSupplierCount', { count: formatCount(band.count) }) }}</span>
                <span v-if="band.quotes !== null">{{ t('admin.coverage.bandQuoteCount', { count: formatCount(band.quotes) }) }}</span>
                <strong>{{ formatPercent(band.share) }}</strong>
              </div>
            </div>
            <div class="coverage-margin__track" aria-hidden="true">
              <span :style="{ width: widthFor(band.share) }" />
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { CollectionTag, Coin, Connection, Files, User, UserFilled } from '@element-plus/icons-vue';
import { recordId, supplierPageHref } from './links';

type Statistic = number | string | null;
type TrendSupplier = { supplierId?: Statistic; supplierName?: string | null; supplierNo?: string | null };
type TrendRow = { date?: string | null; newSupplierCount?: Statistic; suppliers?: TrendSupplier[] };
type ProfitBand = {
  band?: Statistic;
  bandI18nZh?: string | null;
  bandI18nEn?: string | null;
  supplierCount?: Statistic;
  quotePairCount?: Statistic;
};
type Metric = {
  id: string;
  icon: Component;
  label: string;
  value: string;
  lines: string[];
  progress?: number | null;
};

const props = defineProps<{
  summary: Record<string, Statistic>;
  trend: TrendRow[];
  profitBands: ProfitBand[];
  registrations?: { week: number | null; total: number | null; failed?: boolean } | null;
  trendRange?: [string, string] | null;
  trendLoading?: boolean;
}>();
const emit = defineEmits<{ 'trend-range': [range: [string, string] | null] }>();
const router = useRouter();
const { t, locale } = useI18n();
function onTrendRange(value: [string, string] | null) {
  emit('trend-range', value?.[0] && value?.[1] ? [value[0], value[1]] : null);
}

function numberOf(value: unknown): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function countOf(value: unknown): number | null {
  const number = numberOf(value);
  return number !== null && Number.isSafeInteger(number) && number >= 0 ? number : null;
}

const countFormat = computed(() => new Intl.NumberFormat(locale.value));
const percentFormat = computed(() => new Intl.NumberFormat(locale.value, { style: 'percent', maximumFractionDigits: 1 }));
const dayFormat = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'full', timeZone: 'UTC' }));

const formatCount = (value: unknown) => {
  const number = countOf(value);
  return number === null ? '—' : countFormat.value.format(number);
};

const formatPercent = (value: unknown) => {
  const number = numberOf(value);
  return number === null ? '—' : percentFormat.value.format(number);
};

const widthFor = (fraction: number | null) => `${Math.max(0, Math.min(1, fraction ?? 0)) * 100}%`;

const coverageDetail = (covered: unknown, total: unknown) => t('admin.coverage.coveredCount', {
  covered: formatCount(covered),
  total: formatCount(total),
});

const metrics = computed<Metric[]>(() => {
  const data = props.summary;
  const serviceRate = countOf(data.onShelfServiceCount) === 0 ? null : numberOf(data.serviceCoverageRate);
  const packageRate = countOf(data.onShelfPackageCount) === 0 ? null : numberOf(data.packageCoverageRate);
  return [
    {
      id: 'service', icon: Files, label: t('admin.coverage.serviceCoverage'),
      value: formatPercent(serviceRate),
      lines: [coverageDetail(data.coveredServiceCount, data.onShelfServiceCount),
        t('admin.coverage.offShelfCount', { count: formatCount(data.offShelfServiceCount) })],
      progress: serviceRate,
    },
    {
      id: 'package', icon: CollectionTag, label: t('admin.coverage.packageCoverage'),
      value: formatPercent(packageRate),
      lines: [coverageDetail(data.coveredPackageCount, data.onShelfPackageCount),
        t('admin.coverage.offShelfCount', { count: formatCount(data.offShelfPackageCount) })],
      progress: packageRate,
    },
    {
      id: 'suppliers', icon: UserFilled, label: t('admin.coverage.supplierTotal'),
      value: formatCount(data.supplierTotal),
      lines: [
        `${t('admin.coverage.enabled')} ${formatCount(data.supplierEnabled)} · ${t('admin.coverage.onboarded')} ${formatCount(data.supplierOnboarded)}`,
        `${t('admin.coverage.companyCount', { count: formatCount(data.supplierCompanyCount) })} · ${t('admin.coverage.individualCount', { count: formatCount(data.supplierIndividualCount) })}`,
        t('admin.coverage.quoteLine', {
          quoted: formatCount(data.supplierWithQuote),
          effective: formatCount(data.supplierWithEffectiveQuote),
        }),
      ],
    },
    {
      id: 'new', icon: Connection, label: t('admin.coverage.new3'),
      value: formatCount(data.newSuppliersLast3Days),
      lines: [
        `${t('admin.coverage.deskJoinedToday')} ${formatCount(data.newSuppliersToday)}`,
        `${t('admin.coverage.new7')} ${formatCount(data.newSuppliersLast7Days)}`,
      ],
    },
    {
      id: 'users', icon: User, label: t('admin.coverage.newUsersWeek'),
      value: props.registrations?.failed ? '—' : formatCount(props.registrations?.week),
      lines: [props.registrations?.failed
        ? t('admin.coverage.registrationsFailed')
        : t('admin.coverage.registeredTotal', { count: formatCount(props.registrations?.total) })],
    },
    {
      id: 'margin', icon: Coin, label: t('admin.coverage.avgProfit'),
      value: formatPercent(data.avgProfitRate),
      lines: [t('admin.coverage.marginRange', {
        min: formatPercent(data.minProfitRate),
        max: formatPercent(data.maxProfitRate),
      })],
    },
  ];
});

const trendDays = computed(() => props.trend.map((row, index) => {
  const date = String(row.date ?? '').trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const parsed = iso ? new Date(`${date}T00:00:00Z`) : null;
  const fullDate = parsed && Number.isFinite(parsed.getTime()) ? dayFormat.value.format(parsed) : date || '—';
  const count = countOf(row.newSupplierCount);
  const suppliers = (row.suppliers ?? []).flatMap((supplier) => {
    const id = recordId(supplier.supplierId);
    if (!id) return [];
    const name = supplier.supplierName?.trim() || supplier.supplierNo?.trim() || id;
    return [{ id, name, href: supplierPageHref(router, id) }];
  });
  return {
    key: `${date}-${index}`,
    shortDate: iso ? date.slice(5) : date || '—',
    count,
    suppliers,
    label: t('admin.coverage.trendPoint', { date: fullDate, count: formatCount(count) }),
  };
}));

const trendScale = computed(() => {
  const peak = Math.max(1, ...trendDays.value.map(day => day.count ?? 0));
  const roughStep = peak / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const step = Math.max(1, ([1, 2, 5, 10].find(value => magnitude * value >= roughStep) ?? 10) * magnitude);
  const divisions = Math.ceil(peak / step);
  return { step, divisions, max: step * divisions };
});

const trendTicks = computed(() => Array.from({ length: trendScale.value.divisions + 1 }, (_, index) => index * trendScale.value.step));
const trendHeight = (count: number | null) => widthFor((count ?? 0) / trendScale.value.max);

const bandLabels: Record<number, { key: string; threshold: string }> = {
  1: { key: 'highMargin', threshold: '≥ 30%' },
  2: { key: 'midMargin', threshold: '20%–<30%' },
  3: { key: 'lowMargin', threshold: '< 20%' },
};

const marginBands = computed(() => {
  const rows = props.profitBands.map((band, index) => ({
    band, index, count: countOf(band.supplierCount), quotes: countOf(band.quotePairCount),
  }));
  const total = rows.reduce((sum, row) => sum + (row.count ?? 0), 0);
  const complete = total > 0 && rows.every(row => row.count !== null);
  const english = locale.value.startsWith('en');
  return rows.map(({ band, index, count, quotes }) => {
    const code = countOf(band.band) ?? 0;
    const definition = bandLabels[code];
    const label = (english ? band.bandI18nEn : band.bandI18nZh)?.trim()
      || (definition ? t(`admin.coverage.${definition.key}`) : '')
      || (english ? band.bandI18nZh : band.bandI18nEn)?.trim()
      || '—';
    return {
      key: `${code}-${index}`, code, label, count, quotes,
      threshold: definition?.threshold,
      share: complete && count !== null ? count / total : null,
    };
  });
});
</script>

<style scoped>
.coverage-overview {
  --coverage-teal: #087b64;
  --coverage-line: #e5dfd5;
  --coverage-muted: #5e6b7a;
  --coverage-panel: #fffdfa;
  display: grid;
  min-width: 0;
  gap: 14px;
  color: var(--hx-ink, #0a1d33);
}

.coverage-overview__kpis,
.coverage-overview__charts { display: grid; gap: 12px; }
.coverage-overview__kpis { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.coverage-overview__charts { grid-template-columns: minmax(0, 1.6fr) minmax(250px, 1fr); }

.coverage-metric,
.coverage-chart {
  box-sizing: border-box;
  min-width: 0;
  border: 1px solid var(--coverage-line);
  border-radius: 12px;
  background: var(--coverage-panel);
}

.coverage-metric {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 11px;
  min-height: 110px;
  padding: 13px 14px 12px;
}

.coverage-metric__top { display: flex; align-items: flex-start; gap: 10px; }
.coverage-metric__icon {
  display: grid;
  flex: 0 0 37px;
  height: 37px;
  place-items: center;
  border-radius: 8px;
  background: #e4f3ec;
  color: var(--coverage-teal);
}
.coverage-metric__icon svg { width: 22px; height: 22px; }
.coverage-metric.is-package .coverage-metric__icon,
.coverage-metric.is-users .coverage-metric__icon { background: #e6f0f6; color: #276689; }
.coverage-metric.is-margin .coverage-metric__icon { background: #fbefdb; color: #a96618; }
.coverage-metric__copy { min-width: 0; }
.coverage-metric__copy p { margin: 0 0 4px; font-size: 13px; font-weight: 640; line-height: 1.25; }
.coverage-metric__copy strong {
  display: block;
  font-size: clamp(23px, 2.2vw, 33px);
  font-weight: 730;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.coverage-metric__lines { display: grid; gap: 2px; margin-top: 6px; }
.coverage-metric__lines small { display: block; color: var(--coverage-muted); font-size: 11px; line-height: 1.4; }
.coverage-metric__track,
.coverage-margin__track { height: 7px; overflow: hidden; border-radius: 99px; background: #e8ebe9; }
.coverage-metric__track > span,
.coverage-margin__track > span { display: block; height: 100%; border-radius: inherit; background: var(--coverage-teal); }
.coverage-metric.is-package .coverage-metric__track > span { background: #3281af; }

.coverage-chart { padding: 13px 16px 15px; }
.coverage-chart__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 9px; }
.coverage-chart h2 { margin: 0; font-size: 16px; font-weight: 700; line-height: 1.35; }
.coverage-chart__head :deep(.el-date-editor) { width: 228px; max-width: 58%; }
.coverage-chart__empty { display: grid; min-height: 146px; margin: 0; place-items: center; color: var(--coverage-muted); font-size: 12px; }

.coverage-trend__scroll { overflow-x: auto; scrollbar-width: thin; }
.coverage-trend__scroll:focus-visible { outline: 2px solid #91c3b3; outline-offset: -2px; }
.coverage-trend {
  --trend-plot-height: 116px;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  min-width: calc(30px + var(--trend-days) * 34px);
  padding-top: 19px;
}
.coverage-trend__axis,
.coverage-trend__grid,
.coverage-trend__bar-space { height: var(--trend-plot-height); }
.coverage-trend__axis { position: relative; font-size: 11px; font-variant-numeric: tabular-nums; }
.coverage-trend__axis span { position: absolute; inset-inline-end: 7px; transform: translateY(50%); }
.coverage-trend__plot { position: relative; min-width: 0; }
.coverage-trend__grid { position: absolute; inset: 0 0 auto; border-inline-start: 1px solid #bbc7c9; pointer-events: none; }
.coverage-trend__grid span { position: absolute; inset-inline: 0; border-bottom: 1px solid #e2e8e7; }
.coverage-trend__grid span:first-child { border-bottom-color: #bbc7c9; }
.coverage-trend__bars {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--trend-days), minmax(0, 1fr));
  margin: 0;
  padding: 0 2px;
  list-style: none;
}
.coverage-trend__bar-space { position: relative; display: flex; align-items: flex-end; justify-content: center; }
button.coverage-trend__bar-space,
.coverage-trend__bars :deep(.el-tooltip__trigger) {
  display: flex;
  width: 100%;
  height: var(--trend-plot-height);
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.coverage-trend__value { position: absolute; bottom: calc(var(--bar-height) + 5px); font-size: 11px; line-height: 1; font-weight: 650; font-variant-numeric: tabular-nums; }
.coverage-trend__bar { width: min(72%, 34px); height: var(--bar-height); border-radius: 3px 3px 0 0; background: #64a88f; }
.coverage-trend__bar.is-zero { height: 2px; border-radius: 1px 1px 0 0; background: #c8dbd3; }
.coverage-trend__bars li:hover .coverage-trend__bar:not(.is-zero) { background: var(--coverage-teal); }
.coverage-trend__date { display: block; padding-top: 5px; color: var(--coverage-muted); text-align: center; font-size: 10px; line-height: 1.4; white-space: nowrap; }

.coverage-margin { display: grid; gap: 14px; margin: 16px 0 0; padding: 0; list-style: none; }
.coverage-margin__row,
.coverage-margin__name,
.coverage-margin__figures { display: flex; align-items: baseline; }
.coverage-margin__row { justify-content: space-between; gap: 6px 12px; margin-bottom: 6px; }
.coverage-margin__name { flex-wrap: wrap; gap: 2px 6px; min-width: 0; font-size: 12px; }
.coverage-margin__name span { color: var(--coverage-muted); font-size: 11px; white-space: nowrap; }
.coverage-margin__figures { flex: 1 1 140px; flex-wrap: wrap; justify-content: flex-end; gap: 2px 6px; font-size: 11px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.coverage-margin__figures strong { min-width: 38px; padding-inline-start: 6px; border-inline-start: 1px solid var(--coverage-line); text-align: end; }
.coverage-margin__track { height: 8px; }
.coverage-margin .is-2 .coverage-margin__track > span { background: #cb8b2e; }
.coverage-margin .is-3 .coverage-margin__track > span { background: #8192a7; }

.coverage-overview__sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

@media (max-width: 1180px) {
  .coverage-overview__kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .coverage-overview__charts { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 660px) {
  .coverage-overview__kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .coverage-metric { min-height: 95px; padding: 10px; }
  .coverage-metric__top { gap: 7px; }
  .coverage-metric__icon { flex-basis: 29px; height: 29px; }
  .coverage-metric__icon svg { width: 18px; height: 18px; }
  .coverage-metric__copy p { font-size: 11px; }
  .coverage-metric__copy small { font-size: 10px; }
  .coverage-chart { padding: 12px; }
}
</style>

<style>
.coverage-trend-pop__body { display: grid; gap: 6px; max-height: 240px; overflow: auto; }
.coverage-trend-pop__title { margin: 0 0 4px; color: #5e6b7a; font-size: 12px; }
.coverage-trend-pop__link { color: #087b64; font-size: 13px; font-weight: 650; text-decoration: none; }
.coverage-trend-pop__link:hover { text-decoration: underline; }
</style>
