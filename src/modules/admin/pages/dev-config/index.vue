<template>
  <section class="dev-config" v-loading="loading">
    <header class="dev-config__bar">
      <div>
        <h1>{{ t('admin.devConfig.title') }}</h1>
        <p>{{ t('admin.devConfig.formula') }}</p>
      </div>
      <div class="dev-config__actions">
        <el-button :loading="loading" @click="load">{{ t('admin.devConfig.refresh') }}</el-button>
        <el-button type="primary" :loading="savingAll" @click="saveAll">{{ t('admin.devConfig.saveAll') }}</el-button>
      </div>
    </header>

    <el-alert v-if="pageError" :title="pageError" type="error" show-icon :closable="false" />
    <el-alert v-if="usingSample" :title="t('admin.devConfig.sampleHint')" type="info" show-icon :closable="false" />

    <section class="dev-config__block">
      <header>
        <h2>{{ t('admin.devConfig.priceTitle') }}</h2>
        <el-button :loading="savingPrice" @click="savePrice">{{ t('admin.devConfig.saveSection') }}</el-button>
      </header>
      <p>{{ t('admin.devConfig.priceHint') }}</p>
      <el-radio-group v-model="mode">
        <el-radio value="ALL_SHOW">{{ t('admin.devConfig.modeShow') }}</el-radio>
        <el-radio value="ALL_HIDE">{{ t('admin.devConfig.modeHide') }}</el-radio>
        <el-radio value="DENYLIST">{{ t('admin.devConfig.modeDeny') }}</el-radio>
      </el-radio-group>
      <div v-if="mode === 'DENYLIST'" class="dev-config__tags">
        <span>{{ t('admin.devConfig.hideSpu') }}</span>
        <el-tag
          v-for="id in hideSpuIds"
          :key="id"
          closable
          @close="hideSpuIds = hideSpuIds.filter((item) => item !== id)"
        >{{ id }}</el-tag>
        <el-input
          v-model="hideDraft"
          :placeholder="t('admin.devConfig.hidePlaceholder')"
          @keyup.enter="addHideSpu"
        />
      </div>
      <p class="dev-config__raw">{{ t('admin.devConfig.raw') }}：{{ rawValue || '—' }}</p>
    </section>

    <section class="dev-config__block">
      <header>
        <h2>{{ t('admin.devConfig.workloadTitle') }}</h2>
        <div class="dev-config__actions">
          <el-button @click="fillSample">{{ t('admin.devConfig.fillSample') }}</el-button>
          <el-button :loading="savingWorkload" @click="saveWorkload">{{ t('admin.devConfig.saveSection') }}</el-button>
        </div>
      </header>
      <el-tabs v-model="ruleTab">
        <el-tab-pane name="services" :label="t('admin.devConfig.services')" />
        <el-tab-pane name="packages" :label="t('admin.devConfig.packages')" />
      </el-tabs>
      <p v-if="!activeRules.length" class="dev-config__empty">{{ t('admin.devConfig.emptyRules') }}</p>
      <article v-for="(card, index) in activeRules" :key="card.key" class="dev-config__card">
        <div class="dev-config__card-head">
          <label>
            {{ ruleTab === 'services' ? t('admin.devConfig.spuId') : t('admin.devConfig.packageId') }}
            <el-input-number v-model="card.id" :min="1" :precision="0" :step="1" :value-on-clear="null" controls-position="right" />
          </label>
          <label class="is-grow">
            {{ t('admin.devConfig.remark') }}
            <el-input v-model="card.remark" />
          </label>
          <el-button @click="copyCard(index)">{{ t('admin.devConfig.copy') }}</el-button>
          <el-button type="danger" plain @click="activeRules.splice(index, 1)">{{ t('admin.devConfig.remove') }}</el-button>
        </div>
        <el-table :data="card.addons" size="small" border>
          <el-table-column :label="t('admin.devConfig.attachValueId')" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.attachValueId" :min="1" :precision="0" :step="1" :value-on-clear="null" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.devConfig.addonName')" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.name" />
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.devConfig.addonType')" width="180">
            <template #default="{ row }">
              <el-select v-model="row.type">
                <el-option v-for="item in addonTypes" :key="item" :label="item" :value="item" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.devConfig.staffAdd')" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.staffAddPerUnit" :min="0" :precision="2" :step="1" :value-on-clear="0" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column :label="t('admin.devConfig.hourAdd')" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.hourAddPerUnit" :min="0" :precision="2" :step="0.5" :value-on-clear="0" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column width="88">
            <template #default="{ $index }">
              <el-button link type="danger" @click="card.addons.splice($index, 1)">{{ t('admin.devConfig.remove') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button link type="primary" @click="card.addons.push(blankAddon())">{{ t('admin.devConfig.addAddon') }}</el-button>
      </article>
      <el-button type="primary" plain @click="addCard">
        {{ ruleTab === 'services' ? t('admin.devConfig.addService') : t('admin.devConfig.addPackage') }}
      </el-button>
      <el-collapse class="dev-config__json">
        <el-collapse-item :title="t('admin.devConfig.advanced')" name="json">
          <el-input v-model="jsonText" type="textarea" :rows="12" />
          <el-button @click="jsonText = JSON.stringify(workloadJson(), null, 2)">{{ t('admin.devConfig.refresh') }}</el-button>
          <el-button type="primary" plain @click="applyJson">{{ t('admin.devConfig.applyJson') }}</el-button>
        </el-collapse-item>
      </el-collapse>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
  getDevConfig,
  saveAddonWorkload,
  saveDevConfig,
  saveShowOptionPrice,
} from '@/modules/admin/api/devConfig';

type AddonType = 'STAFF' | 'HOUR' | 'STAFF_AND_HOUR';
type AddonRow = {
  attachValueId: number | null;
  name: string;
  type: AddonType;
  staffAddPerUnit: number;
  hourAddPerUnit: number;
};
type RuleCard = {
  key: string;
  id: number | null;
  remark: string;
  addons: AddonRow[];
};

const addonTypes: AddonType[] = ['STAFF', 'HOUR', 'STAFF_AND_HOUR'];
const SAMPLE = {
  version: 1,
  services: [
    {
      spuId: 89,
      remark: '家庭维修和安装 / Home Fix & Installation',
      addons: [
        { attachValueId: 98, name: '额外 1 小时/技术', type: 'HOUR', staffAddPerUnit: 0, hourAddPerUnit: 1 },
        { attachValueId: 132, name: '额外的木工工作', type: 'STAFF', staffAddPerUnit: 1, hourAddPerUnit: 0 },
      ],
    },
    {
      spuId: 93,
      remark: '管道维修与保养 / Plumbing Repair & Maintenance',
      addons: [
        { attachValueId: 98, name: '额外 1 小时/技术', type: 'HOUR', staffAddPerUnit: 0, hourAddPerUnit: 1 },
        { attachValueId: 132, name: '额外的木工工作', type: 'STAFF', staffAddPerUnit: 1, hourAddPerUnit: 0 },
      ],
    },
    {
      spuId: 115,
      remark: '门窗锁维修 / Door & Window Lock Repair',
      addons: [
        { attachValueId: 98, name: '额外 1 小时/技术', type: 'HOUR', staffAddPerUnit: 0, hourAddPerUnit: 1 },
        { attachValueId: 132, name: '额外的木工工作', type: 'STAFF', staffAddPerUnit: 1, hourAddPerUnit: 0 },
      ],
    },
    {
      spuId: 116,
      remark: '电视安装 / TV Installation & Mounting',
      addons: [
        { attachValueId: 170, name: '小时', type: 'HOUR', staffAddPerUnit: 0, hourAddPerUnit: 1 },
      ],
    },
  ],
  packages: [] as unknown[],
};

const { t } = useI18n();
const loading = ref(false);
const savingAll = ref(false);
const savingPrice = ref(false);
const savingWorkload = ref(false);
const pageError = ref('');
const usingSample = ref(false);
const mode = ref('ALL_SHOW');
const hideSpuIds = ref<number[]>([]);
const hideDraft = ref('');
const rawValue = ref('');
const ruleTab = ref<'services' | 'packages'>('services');
const services = ref<RuleCard[]>([]);
const packages = ref<RuleCard[]>([]);
const jsonText = ref('');
let keySeed = 1;

const activeRules = computed(() => (ruleTab.value === 'services' ? services.value : packages.value));

const nextKey = () => `rule-${keySeed++}`;
const blankAddon = (): AddonRow => ({
  attachValueId: null,
  name: '',
  type: 'HOUR',
  staffAddPerUnit: 0,
  hourAddPerUnit: 0,
});
const positiveId = (value: unknown) => {
  const amount = Number(value);
  return Number.isInteger(amount) && amount > 0 ? amount : null;
};
const amountOf = (value: unknown) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100) / 100;
};
const unwrap = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return {};
  const row = payload as Record<string, unknown>;
  if ('showOptionPrice' in row || 'addonWorkload' in row || 'mode' in row || 'services' in row) return row;
  return row.data && typeof row.data === 'object' ? row.data as Record<string, unknown> : row;
};
const fail = (error: unknown, fallback: string) => {
  const message = error instanceof Error && error.message ? error.message : fallback;
  pageError.value = message;
  ElMessage.error(message);
};
const cardsFrom = (rows: unknown, idKey: 'spuId' | 'packageId'): RuleCard[] => {
  const list = Array.isArray(rows) ? rows : [];
  return list.flatMap((raw) => {
    const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : null;
    if (!item) return [];
    const addons = Array.isArray(item.addons) ? item.addons : [];
    return [{
      key: nextKey(),
      id: positiveId(item[idKey]),
      remark: String(item.remark || ''),
      addons: addons.flatMap((entry) => {
        const addon = entry && typeof entry === 'object' ? entry as Record<string, unknown> : null;
        if (!addon) return [];
        const type = String(addon.type || 'HOUR').toUpperCase();
        return [{
          attachValueId: positiveId(addon.attachValueId),
          name: String(addon.name || ''),
          type: (addonTypes.includes(type as AddonType) ? type : 'HOUR') as AddonType,
          staffAddPerUnit: amountOf(addon.staffAddPerUnit) ?? 0,
          hourAddPerUnit: amountOf(addon.hourAddPerUnit) ?? 0,
        }];
      }),
    }];
  });
};
const applyPrice = (raw: unknown) => {
  const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const next = String(item.mode || 'ALL_SHOW');
  mode.value = next === 'ALL_HIDE' || next === 'DENYLIST' ? next : 'ALL_SHOW';
  const ids = Array.isArray(item.hideSpuIds) ? item.hideSpuIds : [];
  hideSpuIds.value = ids.flatMap((id) => {
    const value = positiveId(id);
    return value == null ? [] : [value];
  });
  rawValue.value = String(item.rawValue || '');
};
const applyWorkload = (raw: unknown, allowSample: boolean) => {
  const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const nextServices = cardsFrom(item.services, 'spuId');
  const nextPackages = cardsFrom(item.packages, 'packageId');
  if (allowSample && !nextServices.length && !nextPackages.length) {
    fillSample();
    return;
  }
  services.value = nextServices;
  packages.value = nextPackages;
  usingSample.value = false;
  jsonText.value = JSON.stringify(workloadJson(), null, 2);
};
const applySnapshot = (raw: unknown, allowSample: boolean) => {
  const item = unwrap(raw);
  if (item.showOptionPrice) applyPrice(item.showOptionPrice);
  if ('addonWorkload' in item) applyWorkload(item.addonWorkload, allowSample);
};
const addHideSpu = () => {
  const id = positiveId(hideDraft.value.trim());
  hideDraft.value = '';
  if (id == null) {
    pageError.value = t('admin.devConfig.idRequired');
    return;
  }
  if (!hideSpuIds.value.includes(id)) hideSpuIds.value.push(id);
  pageError.value = '';
};
const priceBody = () => {
  pageError.value = '';
  if (mode.value === 'DENYLIST' && hideDraft.value.trim()) addHideSpu();
  if (pageError.value) return null;
  return {
    mode: mode.value,
    hideSpuIds: mode.value === 'DENYLIST' ? [...hideSpuIds.value] : [],
  };
};
const addonBody = (row: AddonRow) => ({
  attachValueId: row.attachValueId,
  name: row.name.trim(),
  type: row.type,
  staffAddPerUnit: row.staffAddPerUnit,
  hourAddPerUnit: row.hourAddPerUnit,
});
const rulesBody = (cards: RuleCard[], idKey: 'spuId' | 'packageId') => {
  const seen = new Set<number>();
  const rows = [];
  for (const card of cards) {
    const id = positiveId(card.id);
    if (id == null) {
      pageError.value = t('admin.devConfig.idRequired');
      return null;
    }
    if (seen.has(id)) {
      pageError.value = t('admin.devConfig.idDuplicate');
      return null;
    }
    seen.add(id);
    const addonIds = new Set<number>();
    const addons = [];
    for (const addon of card.addons) {
      const attachValueId = positiveId(addon.attachValueId);
      if (attachValueId == null) {
        pageError.value = t('admin.devConfig.addonRequired');
        return null;
      }
      if (addonIds.has(attachValueId)) {
        pageError.value = t('admin.devConfig.idDuplicate');
        return null;
      }
      if (amountOf(addon.staffAddPerUnit) == null || amountOf(addon.hourAddPerUnit) == null) {
        pageError.value = t('admin.devConfig.addonRequired');
        return null;
      }
      addonIds.add(attachValueId);
      addons.push(addonBody(addon));
    }
    rows.push({ [idKey]: id, remark: card.remark.trim(), addons });
  }
  return rows;
};
const workloadBody = () => {
  pageError.value = '';
  const serviceRows = rulesBody(services.value, 'spuId');
  const packageRows = serviceRows ? rulesBody(packages.value, 'packageId') : null;
  if (!serviceRows || !packageRows) return null;
  return { version: 1, services: serviceRows, packages: packageRows };
};
const workloadJson = () => ({
  version: 1,
  services: services.value.map((card) => ({
    spuId: card.id,
    remark: card.remark,
    addons: card.addons.map(addonBody),
  })),
  packages: packages.value.map((card) => ({
    packageId: card.id,
    remark: card.remark,
    addons: card.addons.map(addonBody),
  })),
});
const addCard = () => {
  activeRules.value.push({ key: nextKey(), id: null, remark: '', addons: [blankAddon()] });
};
const copyCard = (index: number) => {
  const source = activeRules.value[index];
  if (!source) return;
  activeRules.value.splice(index + 1, 0, {
    key: nextKey(),
    id: null,
    remark: source.remark,
    addons: source.addons.map((addon) => ({ ...addon })),
  });
};
const fillSample = () => {
  services.value = cardsFrom(SAMPLE.services, 'spuId');
  packages.value = cardsFrom(SAMPLE.packages, 'packageId');
  usingSample.value = true;
  jsonText.value = JSON.stringify(SAMPLE, null, 2);
};
const applyJson = () => {
  try {
    const parsed = JSON.parse(jsonText.value);
    applyWorkload(parsed, false);
    pageError.value = '';
  } catch {
    pageError.value = t('admin.devConfig.jsonInvalid');
    ElMessage.error(pageError.value);
  }
};
const load = async () => {
  loading.value = true;
  pageError.value = '';
  try {
    applySnapshot(await getDevConfig(), true);
  } catch (error) {
    fail(error, t('admin.devConfig.loadFailed'));
  } finally {
    loading.value = false;
  }
};
const saveAll = async () => {
  const showOptionPrice = priceBody();
  const addonWorkload = showOptionPrice ? workloadBody() : null;
  if (!showOptionPrice || !addonWorkload || savingAll.value) return;
  savingAll.value = true;
  try {
    applySnapshot(await saveDevConfig({ showOptionPrice, addonWorkload }), false);
    usingSample.value = false;
    pageError.value = '';
    ElMessage.success(t('admin.devConfig.saved'));
  } catch (error) {
    fail(error, t('admin.devConfig.saveFailed'));
  } finally {
    savingAll.value = false;
  }
};
const savePrice = async () => {
  const body = priceBody();
  if (!body || savingPrice.value) return;
  savingPrice.value = true;
  try {
    applyPrice(unwrap(await saveShowOptionPrice(body)));
    pageError.value = '';
    ElMessage.success(t('admin.devConfig.saved'));
  } catch (error) {
    fail(error, t('admin.devConfig.saveFailed'));
  } finally {
    savingPrice.value = false;
  }
};
const saveWorkload = async () => {
  const body = workloadBody();
  if (!body || savingWorkload.value) return;
  savingWorkload.value = true;
  try {
    applyWorkload(unwrap(await saveAddonWorkload(body)), false);
    usingSample.value = false;
    pageError.value = '';
    ElMessage.success(t('admin.devConfig.saved'));
  } catch (error) {
    fail(error, t('admin.devConfig.saveFailed'));
  } finally {
    savingWorkload.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.dev-config {
  display: grid;
  gap: 12px;
  color: #1d2a38;
}
.dev-config__bar,
.dev-config__block,
.dev-config__card {
  border: 1px solid var(--hx-line, #e5dccf);
  background: #fff;
  padding: 12px;
}
.dev-config__bar,
.dev-config__block > header,
.dev-config__card-head,
.dev-config__actions,
.dev-config__tags {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}
.dev-config h1,
.dev-config h2,
.dev-config p {
  margin: 0;
}
.dev-config h1 {
  font-size: 18px;
}
.dev-config h2 {
  font-size: 15px;
}
.dev-config__bar p,
.dev-config__block > p,
.dev-config__raw,
.dev-config__empty {
  color: #61738a;
  font-size: 12px;
}
.dev-config__block > p,
.dev-config__raw {
  margin-top: 6px;
}
.dev-config__tags {
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-top: 10px;
}
.dev-config__tags .el-input {
  width: 220px;
}
.dev-config__card {
  margin: 8px 0;
}
.dev-config__card-head {
  align-items: flex-end;
  margin-bottom: 8px;
}
.dev-config__card-head label {
  display: grid;
  gap: 4px;
  color: #61738a;
  font-size: 12px;
}
.dev-config__card-head .is-grow {
  flex: 1;
}
.dev-config__json {
  margin-top: 12px;
}
.dev-config__json .el-button {
  margin-top: 8px;
}
</style>
