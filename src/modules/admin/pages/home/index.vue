<template>
  <div class="home-page" :aria-label="t('admin.home.title')">
    <section class="hero-panel">
      <img
        class="hero-panel__image"
        :src="operationsCommandCenter"
        alt=""
        fetchpriority="high"
      />
      <div class="hero-panel__veil" aria-hidden="true" />
      <div class="hero-panel__glow" aria-hidden="true" />

      <div class="hero-panel__content">
        <div class="hero-panel__eyebrow">
          <span class="live-dot" aria-hidden="true" />
          <span>{{ t('admin.home.hero.eyebrow') }}</span>
          <span class="hero-panel__date">{{ formattedDate }}</span>
        </div>

        <h1>{{ t('admin.home.hero.title') }}</h1>
        <p class="hero-panel__description">{{ t('admin.home.hero.desc') }}</p>

        <div class="hero-panel__actions">
          <button class="hero-action hero-action--primary" type="button" @click="goTo('/admin/orders')">
            <span>{{ t('admin.home.hero.primaryAction') }}</span>
            <ArrowRight aria-hidden="true" />
          </button>
          <button class="hero-action hero-action--secondary" type="button" @click="goTo('/admin/products')">
            <span>{{ t('admin.home.hero.secondaryAction') }}</span>
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>

      <div class="hero-status-grid">
        <article v-for="item in heroStatuses" :key="item.key" class="hero-status">
          <span class="hero-status__icon">
            <component :is="item.icon" aria-hidden="true" />
          </span>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="metric-grid" aria-live="polite">
      <article
        v-for="(metric, index) in metrics"
        :key="metric.key"
        class="metric-card"
        :class="[`metric-card--${metric.tone}`, { 'is-clickable': Boolean(metric.path) }]"
        :style="{ '--enter-delay': `${80 + index * 55}ms` }"
        :tabindex="metric.path ? 0 : undefined"
        :role="metric.path ? 'link' : undefined"
        @click="metric.path && goTo(metric.path)"
        @keydown.enter="metric.path && goTo(metric.path)"
        @keydown.space.prevent="metric.path && goTo(metric.path)"
      >
        <div class="metric-card__topline">
          <span class="metric-card__icon">
            <component :is="metric.icon" aria-hidden="true" />
          </span>
          <span class="metric-card__signal" :class="`is-${metric.state}`" aria-hidden="true" />
        </div>
        <div class="metric-card__value">
          <span v-if="metric.loading" class="metric-skeleton" aria-hidden="true" />
          <span v-else>{{ metric.displayValue }}</span>
        </div>
        <strong class="metric-card__label">{{ metric.label }}</strong>
        <p>{{ metric.hint }}</p>
        <ArrowRight v-if="metric.path" class="metric-card__arrow" aria-hidden="true" />
      </article>
    </section>

    <div class="dashboard-grid dashboard-grid--primary">
      <section class="dashboard-panel quick-panel">
        <header class="section-heading">
          <div>
            <span class="section-heading__line" aria-hidden="true" />
            <div>
              <h2>{{ t('admin.home.quickEntry.title') }}</h2>
              <p>{{ t('admin.home.quickEntry.subtitle') }}</p>
            </div>
          </div>
        </header>

        <div class="quick-grid">
          <button
            v-for="item in quickEntries"
            :key="item.key"
            class="quick-card"
            type="button"
            @click="goTo(item.path)"
          >
            <span class="quick-card__icon">
              <component :is="item.icon" aria-hidden="true" />
            </span>
            <span class="quick-card__copy">
              <strong>{{ item.title }}</strong>
              <small>{{ item.description }}</small>
            </span>
            <span class="quick-card__cta">
              {{ item.cta }}
              <ArrowRight aria-hidden="true" />
            </span>
          </button>
        </div>
      </section>

      <section class="dashboard-panel focus-panel">
        <header class="section-heading">
          <div>
            <span class="section-heading__line" aria-hidden="true" />
            <div>
              <h2>{{ t('admin.home.focus.title') }}</h2>
              <p>{{ t('admin.home.focus.subtitle') }}</p>
            </div>
          </div>
        </header>

        <div class="focus-list">
          <article v-for="(item, index) in focusItems" :key="item.key" class="focus-item">
            <span class="focus-item__number">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="focus-item__icon">
              <component :is="item.icon" aria-hidden="true" />
            </span>
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.description }}</p>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div class="dashboard-grid dashboard-grid--secondary">
      <section class="dashboard-panel radar-panel">
        <header class="section-heading section-heading--light">
          <div>
            <span class="section-heading__line" aria-hidden="true" />
            <div>
              <h2>{{ t('admin.home.radar.title') }}</h2>
              <p>{{ t('admin.home.radar.subtitle') }}</p>
            </div>
          </div>
        </header>

        <div class="radar-map">
          <div class="radar-map__orbit radar-map__orbit--outer" aria-hidden="true" />
          <div class="radar-map__orbit radar-map__orbit--inner" aria-hidden="true" />
          <div class="radar-map__axis radar-map__axis--horizontal" aria-hidden="true" />
          <div class="radar-map__axis radar-map__axis--vertical" aria-hidden="true" />
          <div class="radar-map__core" aria-hidden="true"><span>HX</span></div>
          <div
            v-for="(item, index) in radarItems"
            :key="item.key"
            class="radar-node"
            :class="`radar-node--${index + 1}`"
          >
            <span><component :is="item.icon" aria-hidden="true" /></span>
            <strong>{{ item.label }}</strong>
          </div>
        </div>
      </section>

      <section class="dashboard-panel system-panel">
        <header class="section-heading">
          <div>
            <span class="section-heading__line" aria-hidden="true" />
            <div>
              <h2>{{ t('admin.home.system.title') }}</h2>
              <p>{{ t('admin.home.system.subtitle') }}</p>
            </div>
          </div>
        </header>

        <div class="system-grid">
          <article
            v-for="(item, index) in systemItems"
            :key="item.key"
            class="system-item"
            :class="`is-${item.state}`"
          >
            <span class="system-item__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="system-item__icon"><component :is="item.icon" aria-hidden="true" /></span>
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.description }}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowRight,
  Calendar,
  CircleCheck,
  Collection,
  CollectionTag,
  DataAnalysis,
  Document,
  FolderOpened,
  Goods,
  List,
  PriceTag,
  Tickets,
  User,
  UserFilled,
  Wallet,
} from '@element-plus/icons-vue';
import { page as getOrdersPage } from '@/modules/admin/api/order';
import { page as getProductsPage } from '@/modules/admin/api/spu';
import { getPage as getUsersPage } from '@/modules/admin/api/user';
import operationsCommandCenter from '@/assets/images/admin/operations-command-center.webp';

type SummaryKey = 'orders' | 'services' | 'users';
type SummaryState = { value: number | null; loading: boolean; failed: boolean };
type SignalState = 'ready' | 'loading' | 'warning';

const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n({ useScope: 'global' });

const summary = reactive<Record<SummaryKey, SummaryState>>({
  orders: { value: null, loading: true, failed: false },
  services: { value: null, loading: true, failed: false },
  users: { value: null, loading: true, failed: false },
});

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const extractTotal = (payload: unknown): number | null => {
  const root = payload && typeof payload === 'object'
    ? payload as Record<string, unknown>
    : null;
  const nestedData = root?.data && typeof root.data === 'object'
    ? root.data as Record<string, unknown>
    : null;
  const deepData = nestedData?.data && typeof nestedData.data === 'object'
    ? nestedData.data as Record<string, unknown>
    : null;
  const candidates = [deepData, nestedData, root].filter(Boolean) as Array<Record<string, unknown>>;

  for (const candidate of candidates) {
    if (candidate.total !== undefined && candidate.total !== null && candidate.total !== '') {
      const total = Number(candidate.total);
      if (Number.isFinite(total) && total >= 0) return total;
    }
    if (Array.isArray(candidate.list)) return candidate.list.length;
  }
  return null;
};

const todayKey = toLocalDateKey(new Date());
let summaryRequestId = 0;

const loadSummary = async () => {
  const requestId = ++summaryRequestId;
  (Object.keys(summary) as SummaryKey[]).forEach((key) => {
    summary[key].loading = true;
    summary[key].failed = false;
  });

  const requests: Record<SummaryKey, () => Promise<unknown>> = {
    orders: () => getOrdersPage({
      pageNum: 1,
      pageSize: 1,
      serviceTimeStart: todayKey,
      serviceTimeEnd: todayKey,
    }),
    services: () => getProductsPage({ pageNum: 1, pageSize: 1, shelfStatus: '1' }),
    users: () => getUsersPage({ pageNum: 1, pageSize: 1 }),
  };

  await Promise.all((Object.keys(requests) as SummaryKey[]).map(async (key) => {
    try {
      const total = extractTotal(await requests[key]());
      if (total === null) throw new Error(`Missing total for ${key}`);
      if (requestId !== summaryRequestId) return;
      summary[key].value = total;
    } catch (error) {
      if (requestId !== summaryRequestId) return;
      summary[key].value = null;
      summary[key].failed = true;
      console.warn(`Failed to load dashboard metric: ${key}`, error);
    } finally {
      if (requestId === summaryRequestId) summary[key].loading = false;
    }
  }));
};

watch(
  () => route.query.t,
  () => { void loadSummary(); },
  { immediate: true },
);

const goTo = (path: string) => {
  if (route.path !== path) void router.push(path);
};

const formattedDate = computed(() => new Intl.DateTimeFormat(
  locale.value === 'zh' ? 'zh-CN' : 'en-US',
  { month: 'long', day: 'numeric', weekday: 'long' },
).format(new Date()));

const numberFormatter = computed(() => new Intl.NumberFormat(
  locale.value === 'zh' ? 'zh-CN' : 'en-US',
  { maximumFractionDigits: 0 },
));

const displayCount = (state: SummaryState) => (
  state.value === null || state.failed ? '—' : numberFormatter.value.format(state.value)
);

const metricSignal = (state: SummaryState): SignalState => {
  if (state.loading) return 'loading';
  return state.failed ? 'warning' : 'ready';
};

const summaryLoading = computed(() => Object.values(summary).some((item) => item.loading));
const summaryFailed = computed(() => Object.values(summary).some((item) => item.failed));
const healthValue = computed(() => {
  if (summaryLoading.value || summaryFailed.value) return '—';
  return locale.value === 'zh' ? '正常' : 'Online';
});
const healthSignal = computed<SignalState>(() => {
  if (summaryLoading.value) return 'loading';
  return summaryFailed.value ? 'warning' : 'ready';
});

const heroStatuses = computed(() => [
  {
    key: 'permission', icon: CircleCheck,
    title: t('admin.home.hero.status.permissionTitle'),
    description: t('admin.home.hero.status.permissionDesc'),
  },
  {
    key: 'locale', icon: CollectionTag,
    title: t('admin.home.hero.status.localeTitle'),
    description: t('admin.home.hero.status.localeDesc'),
  },
  {
    key: 'payment', icon: Wallet,
    title: t('admin.home.hero.status.paymentTitle'),
    description: t('admin.home.hero.status.paymentDesc'),
  },
]);

const metrics = computed(() => [
  {
    key: 'orders', tone: 'navy', icon: Tickets,
    label: t('admin.home.stats.orders.label'), hint: t('admin.home.stats.orders.hint'),
    displayValue: displayCount(summary.orders), loading: summary.orders.loading,
    state: metricSignal(summary.orders), path: '/admin/orders',
  },
  {
    key: 'services', tone: 'gold', icon: Goods,
    label: t('admin.home.stats.services.label'), hint: t('admin.home.stats.services.hint'),
    displayValue: displayCount(summary.services), loading: summary.services.loading,
    state: metricSignal(summary.services), path: '/admin/products',
  },
  {
    key: 'users', tone: 'blue', icon: UserFilled,
    label: t('admin.home.stats.users.label'), hint: t('admin.home.stats.users.hint'),
    displayValue: displayCount(summary.users), loading: summary.users.loading,
    state: metricSignal(summary.users), path: '/admin/users',
  },
  {
    key: 'health', tone: 'green', icon: CircleCheck,
    label: t('admin.home.stats.health.label'), hint: t('admin.home.stats.health.hint'),
    displayValue: healthValue.value, loading: summaryLoading.value,
    state: healthSignal.value, path: '',
  },
]);

const quickEntries = computed(() => [
  {
    key: 'orders', path: '/admin/orders', icon: Document,
    title: t('admin.home.quickEntry.orders.title'),
    description: t('admin.home.quickEntry.orders.desc'), cta: t('admin.home.quickEntry.orders.cta'),
  },
  {
    key: 'products', path: '/admin/products', icon: Goods,
    title: t('admin.home.quickEntry.products.title'),
    description: t('admin.home.quickEntry.products.desc'), cta: t('admin.home.quickEntry.products.cta'),
  },
  {
    key: 'users', path: '/admin/users', icon: User,
    title: t('admin.home.quickEntry.users.title'),
    description: t('admin.home.quickEntry.users.desc'), cta: t('admin.home.quickEntry.users.cta'),
  },
  {
    key: 'basic', path: '/admin/basic/categories', icon: FolderOpened,
    title: t('admin.home.quickEntry.basic.title'),
    description: t('admin.home.quickEntry.basic.desc'), cta: t('admin.home.quickEntry.basic.cta'),
  },
]);

const focusItems = computed(() => [
  {
    key: 'payment', icon: Wallet,
    title: t('admin.home.focus.items.payment.title'),
    description: t('admin.home.focus.items.payment.desc'),
  },
  {
    key: 'delivery', icon: Calendar,
    title: t('admin.home.focus.items.delivery.title'),
    description: t('admin.home.focus.items.delivery.desc'),
  },
  {
    key: 'content', icon: Collection,
    title: t('admin.home.focus.items.content.title'),
    description: t('admin.home.focus.items.content.desc'),
  },
  {
    key: 'pricing', icon: PriceTag,
    title: t('admin.home.focus.items.pricing.title'),
    description: t('admin.home.focus.items.pricing.desc'),
  },
]);

const radarItems = computed(() => [
  { key: 'booking', icon: Tickets, label: t('admin.home.radar.items.booking') },
  { key: 'fulfillment', icon: Calendar, label: t('admin.home.radar.items.fulfillment') },
  { key: 'localization', icon: CollectionTag, label: t('admin.home.radar.items.localization') },
  { key: 'security', icon: UserFilled, label: t('admin.home.radar.items.security') },
]);

const systemItems = computed(() => [
  {
    key: 'api', icon: DataAnalysis, state: healthSignal.value,
    title: t('admin.home.system.items.api.title'), description: t('admin.home.system.items.api.desc'),
  },
  {
    key: 'menu', icon: List, state: 'ready',
    title: t('admin.home.system.items.menu.title'), description: t('admin.home.system.items.menu.desc'),
  },
  {
    key: 'i18n', icon: CollectionTag, state: 'ready',
    title: t('admin.home.system.items.i18n.title'), description: t('admin.home.system.items.i18n.desc'),
  },
  {
    key: 'payment', icon: Wallet, state: 'ready',
    title: t('admin.home.system.items.payment.title'), description: t('admin.home.system.items.payment.desc'),
  },
  {
    key: 'pricing', icon: PriceTag, state: 'ready',
    title: t('admin.home.system.items.pricing.title'), description: t('admin.home.system.items.pricing.desc'),
  },
  {
    key: 'addons', icon: Collection, state: 'ready',
    title: t('admin.home.system.items.addons.title'), description: t('admin.home.system.items.addons.desc'),
  },
]);
</script>

<style scoped lang="scss">
.home-page {
  --home-ink: #05152b;
  --home-muted: #74685a;
  --home-line: #e4d9c8;
  --home-surface: #fffdf8;
  width: min(100%, 1640px);
  margin: 0 auto;
  padding: 2px 0 28px;
  color: var(--home-ink);
}

.hero-panel {
  position: relative;
  min-height: 520px;
  overflow: hidden;
  border: 1px solid rgba(226, 194, 132, 0.22);
  border-radius: 28px;
  isolation: isolate;
  color: #f8f4ec;
  background: #041426;
  box-shadow: 0 24px 54px rgba(5, 21, 43, 0.18);
  animation: home-rise 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

.hero-panel__image,
.hero-panel__veil,
.hero-panel__glow {
  position: absolute;
  inset: 0;
}

.hero-panel__image {
  z-index: -3;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1.015);
  animation: hero-drift 18s ease-in-out infinite alternate;
}

.hero-panel__veil {
  z-index: -2;
  background:
    linear-gradient(90deg, rgba(2, 13, 27, 0.98) 0%, rgba(3, 18, 35, 0.93) 38%, rgba(4, 22, 40, 0.48) 67%, rgba(4, 18, 33, 0.18) 100%),
    linear-gradient(0deg, rgba(2, 13, 26, 0.88) 0%, transparent 48%);
}

.hero-panel__glow {
  z-index: -1;
  background:
    radial-gradient(circle at 67% 70%, rgba(224, 184, 108, 0.16), transparent 26%),
    radial-gradient(circle at 12% 14%, rgba(77, 170, 179, 0.11), transparent 24%);
  pointer-events: none;
}

.hero-panel__content {
  width: min(620px, 58%);
  padding: 50px 48px 176px;
}

.hero-panel__eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #e8c27a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.hero-panel__date {
  margin-left: 4px;
  padding-left: 14px;
  border-left: 1px solid rgba(232, 194, 122, 0.36);
  color: rgba(244, 239, 230, 0.54);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: none;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #72d7bb;
  box-shadow: 0 0 0 5px rgba(114, 215, 187, 0.1);
}

.hero-panel h1 {
  max-width: 600px;
  margin: 25px 0 0;
  color: #fffdf8;
  font-family: Fraunces, "Songti SC", "Noto Serif SC", Georgia, serif;
  font-size: clamp(40px, 4.2vw, 62px);
  font-weight: 520;
  line-height: 1.06;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.hero-panel__description {
  max-width: 590px;
  margin: 22px 0 0;
  color: rgba(237, 242, 247, 0.7);
  font-size: 14px;
  line-height: 1.8;
}

.hero-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 11px;
  margin-top: 29px;
}

.hero-action {
  position: relative;
  height: 44px;
  overflow: hidden;
  padding: 0 17px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 11px;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.hero-action svg {
  width: 15px;
  transition: transform 0.2s ease;
}

.hero-action::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 25%, rgba(255, 255, 255, 0.28) 52%, transparent 78%);
  transform: translateX(-120%);
  transition: transform 0.55s ease;
}

.hero-action > * {
  position: relative;
  z-index: 1;
}

.hero-action:hover { transform: translateY(-1px); }
.hero-action:hover::before { transform: translateX(120%); }
.hero-action:hover svg { transform: translateX(2px); }

.hero-action--primary {
  color: #07182b;
  border: 1px solid #e8c27a;
  background: linear-gradient(135deg, #f2d291 0%, #d8ae62 100%);
  box-shadow: 0 12px 25px rgba(205, 162, 87, 0.2), inset 0 1px rgba(255, 255, 255, 0.45);
}

.hero-action--secondary {
  color: #f6f1e8;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(12px);
}

.hero-action--secondary:hover {
  border-color: rgba(232, 194, 122, 0.52);
  background: rgba(255, 255, 255, 0.11);
}

.hero-action:focus-visible,
.quick-card:focus-visible,
.metric-card:focus-visible {
  outline: 3px solid rgba(232, 194, 122, 0.45);
  outline-offset: 3px;
}

.hero-status-grid {
  position: absolute;
  right: 30px;
  bottom: 28px;
  left: 30px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 18px;
  background: rgba(4, 20, 38, 0.7);
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.17), inset 0 1px rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(18px);
}

.hero-status {
  min-width: 0;
  padding: 18px 19px;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.hero-status + .hero-status { border-left: 1px solid rgba(255, 255, 255, 0.1); }

.hero-status__icon {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(232, 194, 122, 0.25);
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #e8c27a;
  background: rgba(232, 194, 122, 0.08);
}

.hero-status__icon svg { width: 17px; }

.hero-status strong,
.hero-status p {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-status strong { color: #f9f5ed; font-size: 11px; }
.hero-status p { margin: 5px 0 0; color: rgba(225, 233, 241, 0.5); font-size: 9px; }

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.metric-card {
  --metric-accent: #4269b5;
  --metric-soft: #edf2fd;
  position: relative;
  min-width: 0;
  min-height: 164px;
  padding: 19px 19px 17px;
  overflow: hidden;
  border: 1px solid var(--home-line);
  border-radius: 19px;
  background: var(--home-surface);
  box-shadow: 0 6px 18px rgba(5, 21, 43, 0.035);
  animation: home-rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) var(--enter-delay) both;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.metric-card::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 112px;
  height: 112px;
  border-radius: 0 0 0 100%;
  background: radial-gradient(circle at 100% 0%, var(--metric-soft), transparent 68%);
  opacity: 0.86;
  pointer-events: none;
}

.metric-card.is-clickable { cursor: pointer; }

.metric-card.is-clickable:hover {
  transform: translateY(-3px);
  border-color: rgba(196, 163, 106, 0.58);
  box-shadow: 0 15px 28px rgba(5, 21, 43, 0.08);
}

.metric-card--navy { --metric-accent: #05152b; --metric-soft: #e8edf2; }
.metric-card--gold { --metric-accent: #9a682b; --metric-soft: #f7ead3; }
.metric-card--blue { --metric-accent: #4269b5; --metric-soft: #e8eefb; }
.metric-card--green { --metric-accent: #247a62; --metric-soft: #e2f2eb; }

.metric-card__topline {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-card__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: var(--metric-accent);
  background: var(--metric-soft);
}

.metric-card__icon svg { width: 16px; }
.metric-card__signal { width: 7px; height: 7px; border-radius: 50%; }
.metric-card__signal.is-ready { background: #2f9c78; box-shadow: 0 0 0 4px rgba(47, 156, 120, 0.1); }
.metric-card__signal.is-loading { background: #c4a36a; box-shadow: 0 0 0 4px rgba(196, 163, 106, 0.12); animation: signal-pulse 1.2s ease-in-out infinite; }
.metric-card__signal.is-warning { background: #b7545d; box-shadow: 0 0 0 4px rgba(183, 84, 93, 0.1); }

.metric-card__value {
  min-height: 41px;
  margin-top: 13px;
  color: var(--home-ink);
  font-family: Fraunces, Georgia, serif;
  font-size: 34px;
  font-weight: 520;
  line-height: 1;
  letter-spacing: -0.035em;
  font-variant-numeric: tabular-nums;
}

.metric-skeleton {
  display: block;
  width: 76px;
  height: 30px;
  overflow: hidden;
  border-radius: 7px;
  background: #ece7de;
}

.metric-skeleton::after {
  content: "";
  display: block;
  width: 45%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.88), transparent);
  animation: skeleton-slide 1.1s ease-in-out infinite;
}

.metric-card__label {
  display: block;
  color: #423b33;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.metric-card p {
  max-width: calc(100% - 18px);
  margin: 6px 0 0;
  color: #8a7d70;
  font-size: 10px;
  line-height: 1.45;
}

.metric-card__arrow {
  position: absolute;
  right: 16px;
  bottom: 17px;
  width: 14px;
  color: #b0a291;
  transition: color 0.2s ease, transform 0.2s ease;
}

.metric-card:hover .metric-card__arrow { color: var(--metric-accent); transform: translateX(2px); }

.dashboard-grid { display: grid; gap: 16px; margin-top: 16px; }
.dashboard-grid--primary { grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.75fr); }
.dashboard-grid--secondary { grid-template-columns: minmax(360px, 0.78fr) minmax(0, 1.22fr); }

.dashboard-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--home-line);
  border-radius: 22px;
  background: var(--home-surface);
  box-shadow: 0 8px 22px rgba(5, 21, 43, 0.035);
  animation: home-rise 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) 0.24s both;
}

.section-heading { padding: 21px 22px 17px; border-bottom: 1px solid #eee6da; }
.section-heading > div { display: flex; align-items: flex-start; gap: 12px; }

.section-heading__line {
  width: 3px;
  height: 34px;
  flex: 0 0 3px;
  border-radius: 99px;
  background: linear-gradient(180deg, #e8c27a, #8d5a32);
}

.section-heading h2 {
  margin: 0;
  color: var(--home-ink);
  font-family: Fraunces, "Songti SC", "Noto Serif SC", Georgia, serif;
  font-size: 21px;
  font-weight: 520;
  line-height: 1.12;
  letter-spacing: -0.02em;
}

.section-heading p { margin: 5px 0 0; color: var(--home-muted); font-size: 10px; line-height: 1.45; }

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.quick-card {
  position: relative;
  min-height: 154px;
  padding: 18px;
  overflow: hidden;
  border: 1px solid #e9dfd0;
  border-radius: 16px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  grid-template-rows: 1fr auto;
  gap: 10px 12px;
  color: var(--home-ink);
  font: inherit;
  text-align: left;
  background: #fffefa;
  cursor: pointer;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

.quick-card::after {
  content: "";
  position: absolute;
  width: 92px;
  height: 92px;
  top: -56px;
  right: -48px;
  border-radius: 50%;
  background: rgba(232, 194, 122, 0.16);
  transition: transform 0.3s ease;
}

.quick-card:hover {
  transform: translateY(-2px);
  border-color: #d7b878;
  background: #fffdf8;
  box-shadow: 0 13px 25px rgba(5, 21, 43, 0.07);
}

.quick-card:hover::after { transform: scale(1.35); }

.quick-card__icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  color: #8d5a32;
  background: #f6efe4;
}

.quick-card__icon svg { width: 18px; }
.quick-card__copy { min-width: 0; }
.quick-card__copy strong, .quick-card__copy small { display: block; }
.quick-card__copy strong { font-size: 13px; }
.quick-card__copy small { margin-top: 7px; color: #7a7166; font-size: 10px; line-height: 1.55; }

.quick-card__cta {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #8d5a32;
  font-size: 10px;
  font-weight: 700;
}

.quick-card__cta svg { width: 13px; transition: transform 0.2s ease; }
.quick-card:hover .quick-card__cta svg { transform: translateX(3px); }

.focus-list { padding: 4px 20px 8px; }

.focus-item {
  display: grid;
  grid-template-columns: 30px 34px minmax(0, 1fr);
  align-items: start;
  gap: 11px;
  padding: 16px 0;
  border-bottom: 1px solid #eee7dd;
}

.focus-item:last-child { border-bottom: 0; }
.focus-item__number { padding-top: 8px; color: #b4a797; font-family: Fraunces, Georgia, serif; font-size: 12px; }

.focus-item__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #8d5a32;
  background: #f6efe4;
}

.focus-item__icon svg { width: 15px; }
.focus-item strong { display: block; color: #1b2839; font-size: 11px; line-height: 1.45; }
.focus-item p { margin: 5px 0 0; color: #7a7166; font-size: 9.5px; line-height: 1.55; }

.radar-panel {
  position: relative;
  min-height: 486px;
  border-color: rgba(232, 194, 122, 0.16);
  color: #f6f1e8;
  background:
    radial-gradient(circle at 50% 63%, rgba(46, 136, 139, 0.2), transparent 34%),
    linear-gradient(150deg, #05152b 0%, #09233b 58%, #0b2b43 100%);
  box-shadow: 0 18px 36px rgba(5, 21, 43, 0.14);
}

.radar-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.14;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: linear-gradient(to bottom, #000, transparent 94%);
  pointer-events: none;
}

.section-heading--light { position: relative; z-index: 1; border-bottom-color: rgba(255, 255, 255, 0.1); }
.section-heading--light h2 { color: #fffdf8; }
.section-heading--light p { color: rgba(235, 241, 247, 0.5); }

.radar-map {
  position: relative;
  width: min(330px, calc(100% - 34px));
  aspect-ratio: 1;
  margin: 21px auto 28px;
}

.radar-map__orbit, .radar-map__axis, .radar-map__core, .radar-node { position: absolute; }
.radar-map__orbit { border: 1px solid rgba(232, 194, 122, 0.18); border-radius: 50%; }
.radar-map__orbit--outer { inset: 7%; }
.radar-map__orbit--inner { inset: 27%; border-color: rgba(100, 208, 201, 0.18); border-style: dashed; animation: orbit-spin 26s linear infinite; }

.radar-map__axis {
  top: 50%;
  left: 50%;
  background: linear-gradient(90deg, transparent, rgba(232, 194, 122, 0.16), transparent);
  transform-origin: center;
}

.radar-map__axis--horizontal { width: 82%; height: 1px; transform: translate(-50%, -50%); }
.radar-map__axis--vertical { width: 82%; height: 1px; transform: translate(-50%, -50%) rotate(90deg); }

.radar-map__core {
  z-index: 2;
  top: 50%;
  left: 50%;
  width: 68px;
  height: 68px;
  border: 1px solid rgba(232, 194, 122, 0.45);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #07182b;
  background: linear-gradient(145deg, #f2d18d, #c69b54);
  box-shadow: 0 0 0 11px rgba(232, 194, 122, 0.07), 0 13px 28px rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%);
}

.radar-map__core span { font-family: Fraunces, Georgia, serif; font-size: 21px; font-weight: 620; letter-spacing: -0.05em; }

.radar-node {
  z-index: 3;
  width: 112px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  color: rgba(245, 241, 233, 0.82);
  text-align: center;
}

.radar-node > span {
  width: 37px;
  height: 37px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 11px;
  display: grid;
  place-items: center;
  color: #e8c27a;
  background: rgba(7, 28, 50, 0.88);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
}

.radar-node svg { width: 16px; }
.radar-node strong { font-size: 9px; font-weight: 600; line-height: 1.35; }
.radar-node--1 { top: 0; left: 50%; transform: translateX(-50%); }
.radar-node--2 { top: 50%; right: -3px; transform: translateY(-50%); }
.radar-node--3 { bottom: 0; left: 50%; transform: translateX(-50%); }
.radar-node--4 { top: 50%; left: -3px; transform: translateY(-50%); }

.system-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 4px 21px 10px;
}

.system-item {
  position: relative;
  min-width: 0;
  padding: 18px 12px 18px 0;
  display: grid;
  grid-template-columns: 28px 36px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  border-bottom: 1px solid #eee7dd;
}

.system-item:nth-child(odd) { padding-right: 20px; border-right: 1px solid #eee7dd; }
.system-item:nth-child(even) { padding-left: 20px; }
.system-item:nth-last-child(-n + 2) { border-bottom: 0; }

.system-item::after {
  content: "";
  position: absolute;
  top: 20px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2f9c78;
  box-shadow: 0 0 0 4px rgba(47, 156, 120, 0.09);
}

.system-item.is-loading::after { background: #c4a36a; box-shadow: 0 0 0 4px rgba(196, 163, 106, 0.1); animation: signal-pulse 1.2s ease-in-out infinite; }
.system-item.is-warning::after { background: #b7545d; box-shadow: 0 0 0 4px rgba(183, 84, 93, 0.09); }
.system-item__index { padding-top: 9px; color: #b3a695; font-family: Fraunces, Georgia, serif; font-size: 11px; }

.system-item__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #8d5a32;
  background: #f6efe4;
}

.system-item__icon svg { width: 16px; }
.system-item strong { display: block; padding-right: 14px; color: #1b2839; font-size: 11px; line-height: 1.45; }
.system-item p { margin: 5px 0 0; color: #7a7166; font-size: 9.5px; line-height: 1.55; }

@keyframes home-rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes hero-drift {
  from { transform: scale(1.015); }
  to { transform: scale(1.045); }
}

@keyframes signal-pulse { 50% { opacity: 0.48; } }
@keyframes skeleton-slide { from { transform: translateX(-130%); } to { transform: translateX(260%); } }
@keyframes orbit-spin { to { transform: rotate(360deg); } }

@media (max-width: 1280px) {
  .hero-panel__content { width: min(590px, 64%); }
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dashboard-grid--primary, .dashboard-grid--secondary { grid-template-columns: 1fr; }
  .radar-panel { min-height: 500px; }
}

@media (max-width: 900px) {
  .hero-panel { min-height: 650px; }
  .hero-panel__image { object-position: 64% center; }
  .hero-panel__veil {
    background:
      linear-gradient(90deg, rgba(2, 13, 27, 0.98), rgba(3, 18, 35, 0.74)),
      linear-gradient(0deg, rgba(2, 13, 26, 0.92) 0%, transparent 55%);
  }
  .hero-panel__content { width: auto; padding: 44px 34px 264px; }
  .hero-status-grid { grid-template-columns: 1fr; }
  .hero-status { padding: 13px 16px; }
  .hero-status + .hero-status { border-top: 1px solid rgba(255, 255, 255, 0.1); border-left: 0; }
  .system-grid { grid-template-columns: 1fr; }
  .system-item,
  .system-item:nth-child(odd),
  .system-item:nth-child(even) { padding: 17px 4px 17px 0; border-right: 0; border-bottom: 1px solid #eee7dd; }
  .system-item:last-child { border-bottom: 0; }
}

@media (max-width: 640px) {
  .home-page { padding-bottom: 18px; }
  .hero-panel { min-height: 710px; border-radius: 21px; }
  .hero-panel__content { padding: 34px 22px 294px; }
  .hero-panel__eyebrow { flex-wrap: wrap; }
  .hero-panel__date { width: 100%; margin: 2px 0 0 17px; padding-left: 0; border-left: 0; }
  .hero-panel h1 { margin-top: 20px; font-size: clamp(34px, 11vw, 46px); }
  .hero-panel__actions { align-items: stretch; flex-direction: column; }
  .hero-action { width: 100%; }
  .hero-status-grid { right: 14px; bottom: 14px; left: 14px; }
  .metric-grid, .quick-grid { grid-template-columns: 1fr; }
  .metric-card { min-height: 150px; }
  .dashboard-panel { border-radius: 18px; }
  .section-heading { padding: 18px; }
  .quick-grid { padding: 12px; }
  .focus-list { padding-inline: 16px; }
  .focus-item { grid-template-columns: 26px 32px minmax(0, 1fr); gap: 8px; }
  .radar-map { width: min(286px, calc(100% - 20px)); }
  .radar-node { width: 94px; }
  .system-grid { padding-inline: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-panel,
  .metric-card,
  .dashboard-panel,
  .hero-panel__image,
  .metric-card__signal,
  .metric-skeleton::after,
  .radar-map__orbit--inner,
  .system-item::after { animation: none !important; }

  .hero-action,
  .hero-action svg,
  .quick-card,
  .quick-card::after,
  .quick-card__cta svg,
  .metric-card,
  .metric-card__arrow { transition: none !important; }
}
</style>
