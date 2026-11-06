<template>
  <el-dialog v-model="open" class="quote-compare-dialog" :title="t('admin.quoteCompare.title')" width="min(1440px, calc(100vw - 32px))" top="3vh" append-to-body destroy-on-close>
    <template #header>
      <div class="quote-compare__heading">
        <span class="quote-compare__heading-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20h16M6 16V9h3v7M11 16V4h3v12M16 16v-5h3v5" /></svg></span>
        <div><span class="quote-compare__eyebrow">{{ t('admin.quoteCompare.title') }}</span><h2>{{ title || t('admin.quoteCompare.service') }}</h2></div>
      </div>
    </template>
    <div v-loading="loading" class="quote-compare" :class="{ 'is-initial-loading': loading && !matrix.skus.length }" :aria-busy="loading">
      <template v-if="matrix.skus.length">
        <div class="quote-compare__summary">
          <div><span>{{ t('admin.quoteCompare.supplierCount') }}</span><strong>{{ view.suppliers.length }}<small>/ {{ matrix.suppliers.length }}</small></strong></div>
          <div><span>{{ t('admin.quoteCompare.skuCount') }}</span><strong>{{ view.skus.length }}<small>/ {{ matrix.skus.length }}</small></strong></div>
          <div><span>{{ t('admin.quoteCompare.quoteCount') }}</span><strong>{{ quoteCount }}<small>{{ t('admin.quoteCompare.quoteUnit') }}</small></strong></div>
          <div class="is-pending"><span>{{ t('admin.quoteCompare.pendingCount') }}</span><strong>{{ pendingCount }}<small>{{ t('admin.quoteCompare.quoteUnit') }}</small></strong></div>
        </div>
        <section class="quote-compare__filters" :aria-label="t('admin.quoteCompare.filterTitle')">
          <div class="quote-compare__filter-heading">
            <b>{{ t('admin.quoteCompare.filterTitle') }}<span v-if="activeFilterCount">{{ activeFilterCount }}</span></b>
            <div>
              <el-button link size="small" :disabled="!activeFilterCount" @click="resetFilters">{{ t('admin.quoteCompare.resetFilters') }}</el-button>
              <el-button link size="small" :aria-expanded="filtersExpanded" @click="filtersExpanded = !filtersExpanded">{{ t(filtersExpanded ? 'admin.quoteCompare.collapseFilters' : 'admin.quoteCompare.expandFilters') }}</el-button>
            </div>
          </div>
          <div v-show="filtersExpanded" class="quote-compare__filter-fields">
            <label class="quote-compare__field"><span>{{ t('admin.quoteCompare.keyword') }}</span><el-input v-model="search" size="small" :placeholder="t('admin.quoteCompare.search')" clearable :aria-label="t('admin.quoteCompare.search')" /></label>
            <label class="quote-compare__field"><span>{{ t('admin.quoteCompare.supplierFilter') }}</span><el-select v-model="selectedSupplierIds" size="small" multiple filterable clearable collapse-tags collapse-tags-tooltip :placeholder="t('admin.quoteCompare.allSuppliers')" :aria-label="t('admin.quoteCompare.supplierFilter')"><el-option v-for="supplier in matrix.suppliers" :key="supplier.id" :label="`${supplier.name} ${supplier.no}`" :value="supplier.id" /></el-select></label>
            <label class="quote-compare__field"><span>{{ t('admin.quoteCompare.skuFilter') }}</span><el-select v-model="selectedSkuKeys" size="small" multiple filterable clearable collapse-tags collapse-tags-tooltip :placeholder="t('admin.quoteCompare.allSkus')" :aria-label="t('admin.quoteCompare.skuFilter')"><el-option v-for="sku in matrix.skus" :key="sku.key" :label="skuOptionLabel(sku)" :value="sku.key" /></el-select></label>
            <label class="quote-compare__field"><span>{{ t('admin.quoteCompare.statusFilter') }}</span><el-select v-model="statusFilter" size="small" :aria-label="t('admin.quoteCompare.statusFilter')"><el-option :label="t('admin.quoteCompare.allStatuses')" :value="0" /><el-option :label="t('admin.quoteCompare.approved')" :value="2" /><el-option :label="t('admin.quoteCompare.pending')" :value="1" /></el-select></label>
            <div class="quote-compare__field quote-compare__price-filter"><span>{{ t('admin.quoteCompare.priceFilter') }} <small>AED</small></span><div><input :value="minPrice ?? ''" @input="minPrice = priceInputValue($event)" class="quote-compare__price-input" :aria-invalid="invalidPriceRange" type="number" min="0" step="0.01" inputmode="decimal" :placeholder="t('admin.quoteCompare.minPrice')" :aria-label="t('admin.quoteCompare.minPrice')" /><span>–</span><input :value="maxPrice ?? ''" @input="maxPrice = priceInputValue($event)" class="quote-compare__price-input" :aria-invalid="invalidPriceRange" type="number" min="0" step="0.01" inputmode="decimal" :placeholder="t('admin.quoteCompare.maxPrice')" :aria-label="t('admin.quoteCompare.maxPrice')" /></div></div>
            <label class="quote-compare__field"><span>{{ t('admin.quoteCompare.modeFilter') }}</span><el-select v-model="modeFilter" size="small" :aria-label="t('admin.quoteCompare.modeFilter')"><el-option :label="t('admin.quoteCompare.allModes')" :value="0" /><el-option :label="t('admin.quoteCompare.fixed')" :value="1" /><el-option :label="t('admin.quoteCompare.hourly')" :value="2" /></el-select></label>
            <label class="quote-compare__field"><span>{{ t('admin.quoteCompare.sortFilter') }}</span><el-select v-model="sortOrder" size="small" :aria-label="t('admin.quoteCompare.sortFilter')"><el-option :label="t('admin.quoteCompare.sortDefault')" value="default" /><el-option :label="t('admin.quoteCompare.sortPrice')" value="price-asc" /><el-option :label="t('admin.quoteCompare.sortSpread')" value="spread-desc" /></el-select></label>
            <div class="quote-compare__field quote-compare__comparable-filter"><el-checkbox v-model="onlyComparable" size="small">{{ t('admin.quoteCompare.onlyComparable') }}</el-checkbox></div>
          </div>
          <p v-if="invalidPriceRange" class="quote-compare__filter-error" role="alert">{{ priceError }}</p>
        </section>
        <p v-if="errorText" class="quote-compare__filter-error" role="alert">{{ t('admin.quoteCompare.refreshError', { message: errorText }) }}</p>
        <div class="quote-compare__toolbar">
          <div class="quote-compare__views" :aria-label="t('admin.quoteCompare.viewLabel')" role="group">
            <button type="button" :class="{ 'is-active': viewMode === 'chart' }" :aria-pressed="viewMode === 'chart'" @click="viewMode = 'chart'"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 3h11M2 8h8M2 13h5" /></svg>{{ t('admin.quoteCompare.priceChart') }}</button>
            <button type="button" :class="{ 'is-active': viewMode === 'table' }" :aria-pressed="viewMode === 'table'" @click="viewMode = 'table'"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1" /><path d="M2 6h12M6 2v12M10 2v12M2 10h12" /></svg>{{ t('admin.quoteCompare.comparisonTable') }}</button>
          </div>
          <div class="quote-compare__scope"><b>{{ t('admin.quoteCompare.currentScope', { skus: view.skus.length, suppliers: view.suppliers.length, quotes: quoteCount }) }}</b><span>{{ t('admin.quoteCompare.taxNote') }}</span></div>
          <el-button size="small" :loading="loading" @click="load">{{ t('admin.quoteCompare.refresh') }}</el-button>
        </div>
        <QuoteComparePriceChart v-if="view.skus.length && viewMode === 'chart'" class="quote-compare__chart" :skus="view.skus" :suppliers="view.suppliers" :labels="labels" :grouped="view.grouped" />
        <div v-else-if="view.skus.length" class="quote-compare__scroll" tabindex="0" :aria-label="t('admin.quoteCompare.title')">
          <table class="quote-compare__table" :style="{ '--supplier-count': view.suppliers.length }">
            <caption class="sr-only">{{ title }} · {{ t('admin.quoteCompare.title') }}</caption>
            <colgroup><col class="quote-compare__sku-col" /><col class="quote-compare__price-col" /><col class="quote-compare__range-col" /><col v-for="supplier in view.suppliers" :key="supplier.id" /></colgroup>
            <thead><tr>
              <th scope="col" class="is-sku">{{ t('admin.quoteCompare.sku') }}<small>{{ t('admin.quoteCompare.skuCaption') }}</small></th>
              <th scope="col" class="is-price">{{ t('admin.quoteCompare.customerPrice') }}<small>AED</small></th>
              <th scope="col" class="is-range">{{ t('admin.quoteCompare.quoteRange') }}<small>{{ t('admin.quoteCompare.lowToHigh') }}</small></th>
              <th v-for="(supplier, index) in view.suppliers" :key="supplier.id" scope="col" class="is-supplier"><div class="quote-compare__supplier"><span class="quote-compare__avatar" :class="{ 'is-alternate': index % 2 === 1 }" aria-hidden="true">{{ supplier.name.slice(0, 1).toUpperCase() }}</span><div><b :title="supplier.name">{{ supplier.name }}</b><small>{{ supplier.no || `ID ${supplier.id}` }} · {{ t('admin.quoteCompare.coverage', { count: supplierCoverage(supplier.id), total: view.skus.length }) }}</small></div></div></th>
            </tr></thead>
            <tbody><template v-for="(sku, index) in visibleSkus" :key="sku.key">
              <tr v-if="showGroup(index)" class="is-group"><th :colspan="view.suppliers.length + 3">{{ sku.spuName || t('admin.quoteCompare.service') }}</th></tr>
              <tr>
                <th scope="row" class="is-sku"><b :title="specFor(sku)?.details.join('\n')">{{ specFor(sku)?.label || sku.skuCode }}</b><small>SKU {{ sku.skuCode }}</small></th>
                <td class="is-price"><strong>{{ formatCompareMoney(sku.platformPrice) }}</strong></td>
                <td class="is-range"><strong>{{ formatCompareMoney(sku.lowestPrice) }}</strong><small v-if="sku.highestPrice != null && sku.highestPrice !== sku.lowestPrice">– {{ formatCompareMoney(sku.highestPrice) }}</small><span class="quote-compare__spread">{{ sku.lowestPrice == null ? t('admin.quoteCompare.noQuote') : sku.spread == null ? t('admin.quoteCompare.singleQuote') : t('admin.quoteCompare.spread', { amount: formatCompareMoney(sku.spread) }) }}</span></td>
                <td v-for="supplier in view.suppliers" :key="supplier.id" :class="cellClass(sku, supplier.id)" :title="cellTitle(sku.cells[supplier.id])">
                  <template v-if="sku.cells[supplier.id]">
                    <div class="quote-compare__amount"><strong>{{ formatCompareMoney(sku.cells[supplier.id].quotePrice) }}</strong><span v-if="sku.lowestSupplierIds.includes(supplier.id)" class="quote-compare__best">{{ t('admin.quoteCompare.lowest') }}</span></div>
                    <div class="quote-compare__margin" :class="rateClass(sku.cells[supplier.id].profitRate)">{{ t('admin.quoteCompare.margin') }} <b>{{ formatProfitPercent(sku.cells[supplier.id].profitRate) }}</b></div>
                    <div class="quote-compare__meta"><span class="quote-compare__status" :class="{ 'is-pending': sku.cells[supplier.id].status === 1, 'is-approved': sku.cells[supplier.id].status === 2 }">{{ statusLabel(sku.cells[supplier.id]) || '—' }}</span><small>{{ modeLabel(sku.cells[supplier.id]) }}</small></div>
                  </template>
                  <span v-else class="quote-compare__no-quote" :class="{ 'is-filtered': sku.excludedSupplierIds.includes(supplier.id) }">—<small>{{ t(sku.excludedSupplierIds.includes(supplier.id) ? 'admin.quoteCompare.filteredOut' : 'admin.quoteCompare.noQuote') }}</small></span>
                </td>
              </tr>
            </template></tbody>
          </table>
        </div>
        <div v-else class="quote-compare__empty quote-compare__empty--filtered" role="status"><span aria-hidden="true">⌕</span><b>{{ invalidPriceRange ? priceError : t('admin.quoteCompare.noResults') }}</b><el-button size="small" @click="resetFilters">{{ t('admin.quoteCompare.resetFilters') }}</el-button></div>
        <div class="quote-compare__footer"><span><i aria-hidden="true" />{{ t('admin.quoteCompare.bestNote') }}</span><span>{{ t('admin.quoteCompare.pendingNote') }}</span></div>
      </template>
      <div v-else-if="!loading" class="quote-compare__empty" role="status"><span aria-hidden="true">{{ errorText ? '!' : '—' }}</span><b>{{ errorText || t('admin.quoteCompare.empty') }}</b><el-button v-if="errorText" size="small" @click="load">{{ t('admin.quoteCompare.retry') }}</el-button></div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { supplierQuoteCompare } from '@/modules/admin/api/supplierWorkbench'
import { listBySpu } from '@/modules/admin/api/spu'
import QuoteComparePriceChart from '@/modules/admin/components/QuoteComparePriceChart.vue'
import { pickI18nText } from '@/modules/admin/utils/i18n'
import { buildQuoteCompareSpecs } from '@/modules/admin/utils/quoteCompareSpecs'
import { filterQuoteCompareMatrix, type FilteredCompareSkuRow } from '@/modules/admin/utils/quoteCompareFilters'
import { buildQuoteCompareMatrix, formatCompareMoney, formatProfitPercent, type CompareCell, type CompareSkuRow, type QuoteCompareRow } from '@/modules/admin/utils/supplierQuoteCompare'

const props = defineProps<{ modelValue: boolean; title?: string; spuId?: number | null; packageId?: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
const { t, locale } = useI18n({ useScope: 'global' })
const loading = ref(false)
const errorText = ref('')
const rows = ref<QuoteCompareRow[]>([])
const specPayloads = ref<Record<number, unknown>>({})
const search = ref('')
const selectedSupplierIds = ref<number[]>([])
const selectedSkuKeys = ref<string[]>([])
const statusFilter = ref(0)
const modeFilter = ref(0)
const minPrice = ref<number | ''>()
const maxPrice = ref<number | ''>()
const onlyComparable = ref(false)
const sortOrder = ref<'default' | 'price-asc' | 'spread-desc'>('default')
const filtersExpanded = ref(true)
const viewMode = ref<'chart' | 'table'>('chart')
let requestId = 0
const priceInputValue = (event: Event) => {
  const input = event.target as HTMLInputElement
  return input.value === '' ? undefined : Number(input.value)
}

const open = computed({ get: () => props.modelValue, set: (value: boolean) => emit('update:modelValue', value) })
const matrix = computed(() => buildQuoteCompareMatrix(rows.value))
const specMaps = computed(() => Object.fromEntries(Object.entries(specPayloads.value).map(([id, payload]) => [id, buildQuoteCompareSpecs(payload, locale.value)])))
const specFor = (sku: CompareSkuRow) => specMaps.value[sku.spuId]?.[sku.skuId]
const skuOptionLabel = (sku: CompareSkuRow) => [matrix.value.grouped ? sku.spuName : '', specFor(sku)?.label || sku.skuCode, `SKU ${sku.skuCode}`].filter(Boolean).join(' · ')
const labels = computed(() => Object.fromEntries(matrix.value.skus.map(sku => [sku.key, specFor(sku)?.label || sku.skuCode])))
const minBound = computed(() => minPrice.value === '' ? undefined : minPrice.value)
const maxBound = computed(() => maxPrice.value === '' ? undefined : maxPrice.value)
const invalidPriceValue = computed(() => [minBound.value, maxBound.value].some(value => value != null && (!Number.isFinite(value) || value < 0)))
const invalidPriceRange = computed(() => invalidPriceValue.value || (minBound.value != null && maxBound.value != null && minBound.value > maxBound.value))
const priceError = computed(() => t(invalidPriceValue.value ? 'admin.quoteCompare.invalidPriceValue' : 'admin.quoteCompare.invalidPriceRange'))
const view = computed(() => filterQuoteCompareMatrix(matrix.value, {
  supplierIds: selectedSupplierIds.value, skuKeys: selectedSkuKeys.value,
  status: statusFilter.value || null, quoteMode: modeFilter.value || null,
  minPrice: invalidPriceRange.value ? 1 : minBound.value, maxPrice: invalidPriceRange.value ? 0 : maxBound.value, search: search.value,
  onlyComparable: onlyComparable.value, sort: sortOrder.value,
}, labels.value))
const visibleSkus = computed(() => view.value.skus)
const quoteCount = computed(() => view.value.quoteCount)
const pendingCount = computed(() => view.value.pendingCount)
const activeFilterCount = computed(() => [search.value.trim(), selectedSupplierIds.value.length, selectedSkuKeys.value.length, statusFilter.value, modeFilter.value, minBound.value != null || maxBound.value != null, onlyComparable.value, sortOrder.value !== 'default'].filter(Boolean).length)
const supplierCoverage = (id: number) => view.value.skus.filter(sku => sku.cells[id]?.quotePrice != null).length
const showGroup = (index: number) => view.value.grouped && (index === 0 || visibleSkus.value[index - 1]?.spuId !== visibleSkus.value[index]?.spuId)
const labelOf = (map: Record<string, string> | null | undefined, fallback: string) => pickI18nText(map, locale.value, fallback)
const statusLabel = (cell: CompareCell) => labelOf(cell.statusI18n, cell.status === 1 ? t('admin.quoteCompare.pending') : cell.status === 2 ? t('admin.quoteCompare.approved') : '')
const modeLabel = (cell: CompareCell) => labelOf(cell.quoteModeI18n, cell.quoteMode === 1 ? t('admin.quoteCompare.fixed') : cell.quoteMode === 2 ? t('admin.quoteCompare.hourly') : '')
const cellClass = (sku: FilteredCompareSkuRow, id: number) => ({ 'is-best': sku.lowestSupplierIds.includes(id) })
const rateClass = (rate: number | null) => ({ 'is-negative': rate != null && rate < 0, 'is-muted': rate == null })
const cellTitle = (cell?: CompareCell) => cell?.versionNo == null ? '' : t('admin.quoteCompare.version', { version: cell.versionNo })
const resetFilters = () => {
  search.value = ''
  selectedSupplierIds.value = []
  selectedSkuKeys.value = []
  statusFilter.value = 0
  modeFilter.value = 0
  minPrice.value = undefined
  maxPrice.value = undefined
  onlyComparable.value = false
  sortOrder.value = 'default'
}
const load = async () => {
  const ticket = ++requestId
  const spuId = Number(props.spuId), packageId = Number(props.packageId)
  const params = Number.isSafeInteger(packageId) && packageId > 0 ? { packageId } : Number.isSafeInteger(spuId) && spuId > 0 ? { spuId } : null
  errorText.value = ''
  loading.value = false
  if (!params) { rows.value = []; specPayloads.value = {}; return }
  loading.value = true
  try {
    const list = await supplierQuoteCompare(params)
    if (ticket !== requestId) return
    rows.value = list
    const spuIds = [...new Set(list.map(row => Number(row.spuId)).filter(id => Number.isSafeInteger(id) && id > 0))]
    void Promise.allSettled(spuIds.map(async id => {
      const payload = await listBySpu(id)
      if (ticket === requestId) specPayloads.value = { ...specPayloads.value, [id]: payload }
    }))
  } catch (error: any) {
    if (ticket !== requestId) return
    errorText.value = error?.message || t('admin.quoteCompare.loadFailed')
  } finally {
    if (ticket === requestId) loading.value = false
  }
}
watch(() => [props.modelValue, props.spuId, props.packageId] as const, ([visible]) => {
  if (visible) { rows.value = []; specPayloads.value = {}; resetFilters(); filtersExpanded.value = true; viewMode.value = 'chart'; void load() }
  else { ++requestId; loading.value = false }
}, { immediate: true })
onBeforeUnmount(() => { ++requestId; loading.value = false })
</script>

<style scoped>
.quote-compare { --compare-ink: #24354b; --compare-muted: #728093; --sku-column-width: 160px; --price-column-width: 92px; --range-column-width: 108px; --supplier-column-width: 152px; display: flex; flex: 1; flex-direction: column; min-height: 0; color: var(--compare-ink); font-size: 11px; line-height: 1.4; }
.quote-compare.is-initial-loading { min-height: 180px; }
.quote-compare__summary, .quote-compare__filters, .quote-compare__toolbar, .quote-compare__footer { flex-shrink: 0; }
.quote-compare__heading { display: flex; align-items: center; gap: 10px; padding: 0 32px 2px 0; }
.quote-compare__heading-icon { display: grid; flex: 0 0 34px; height: 34px; place-items: center; border: 1px solid #e1e8ef; border-radius: 9px; color: #506d8b; background: #f2f6fa; }
.quote-compare__heading-icon svg { width: 22px; height: 22px; }
.quote-compare__eyebrow { color: #8b734e; font-size: 10px; font-weight: 600; letter-spacing: .05em; }
.quote-compare__heading h2 { margin: 4px 0 0; color: #24354b; font-size: 18px; line-height: 1.3; font-weight: 650; }
.quote-compare__summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
.quote-compare__summary > div { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; border: 1px solid #e8e9e8; border-radius: 8px; background: linear-gradient(125deg, #fafbfc, #fff); }
.quote-compare__summary > div > span { display: block; color: var(--compare-muted); font-size: 10px; line-height: 1.3; }
.quote-compare__summary strong { display: block; font-size: 18px; line-height: 1.15; font-weight: 650; font-variant-numeric: tabular-nums; white-space: nowrap; }
.quote-compare__summary small { margin-left: 5px; color: var(--compare-muted); font-size: 10px; font-weight: 400; }
.quote-compare__summary > .is-pending { background: #fffbf2; border-color: #f1e4c9; }
.quote-compare__summary .is-pending strong { color: #946a24; }
.quote-compare__filters { padding: 8px 10px 10px; border: 1px solid #e2e8ee; border-radius: 8px; background: #f7f9fb; }
.quote-compare__filter-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 22px; }
.quote-compare__filter-heading > b { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; }
.quote-compare__filter-heading > b > span { padding: 0 5px; border-radius: 4px; background: #e4ecf5; color: #456588; font-size: 10px; }
.quote-compare__filter-heading > div { display: flex; gap: 6px; }
.quote-compare__filter-heading .el-button { margin: 0; font-size: 10px; }
.quote-compare__filter-fields { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1.4fr) minmax(0, 1.5fr) minmax(0, 1fr); gap: 8px 12px; padding-top: 6px; }
.quote-compare__field { display: flex; flex-direction: column; gap: 4px; min-width: 0; margin: 0; }
.quote-compare__field > span { color: #6c7d90; font-size: 10px; line-height: 1.2; }
.quote-compare__field > span small { margin-left: 3px; color: #8c98a6; font-size: 9px; }
.quote-compare__field .el-select, .quote-compare__field .el-input { width: 100%; }
.quote-compare__field :deep(.el-input__inner), .quote-compare__field :deep(.el-select__wrapper), .quote-compare__field :deep(.el-tag) { font-size: 11px; }
.quote-compare__price-filter > div { display: flex; align-items: center; gap: 5px; color: #8390a0; }
.quote-compare__price-input { box-sizing: border-box; flex: 1; width: 0; min-width: 0; height: 24px; padding: 0 8px; border: 1px solid #dcdfe6; border-radius: 5px; background: #fff; color: #4b5f75; font: inherit; font-size: 11px; appearance: textfield; }
.quote-compare__price-input::placeholder { color: #a8abb2; }
.quote-compare__price-input:focus { border-color: #8fa8c4; outline: 1px solid #8fa8c4; }
.quote-compare__price-input::-webkit-inner-spin-button { appearance: none; }
.quote-compare__comparable-filter { justify-content: flex-end; padding-bottom: 1px; }
.quote-compare__comparable-filter :deep(.el-checkbox) { height: 24px; margin: 0; white-space: normal; }
.quote-compare__comparable-filter :deep(.el-checkbox__label) { padding-left: 5px; color: #5b6e83; font-size: 10px; line-height: 1.4; }
.quote-compare__filter-error { margin: 6px 0 0; color: #b35438; font-size: 10px; }
.quote-compare__toolbar { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
.quote-compare__toolbar .el-button { margin-left: auto; font-size: 11px; }
.quote-compare__views { display: flex; align-items: center; flex-shrink: 0; gap: 2px; padding: 2px; border: 1px solid #dce4ec; border-radius: 6px; background: #f3f6f9; }
.quote-compare__views > button { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border: 0; border-radius: 4px; background: transparent; color: #718297; font: inherit; font-size: 10px; cursor: pointer; }
.quote-compare__views > button.is-active { background: #fff; color: #294c71; box-shadow: 0 1px 3px #cad4e1; font-weight: 600; }
.quote-compare__views svg { width: 12px; height: 12px; }
.quote-compare__chart { flex: 1 1 auto; min-height: 180px; max-height: min(74vh, 820px); }
.quote-compare__scope { display: flex; align-items: baseline; flex-wrap: wrap; gap: 5px 14px; }
.quote-compare__scope > b { color: #465e76; font-size: 11px; font-weight: 600; }
.quote-compare__scope > span { color: #7e8c9d; font-size: 9px; }
.quote-compare__scroll { flex: 1 1 auto; min-height: 120px; max-height: min(74vh, 820px); overflow: auto; border: 1px solid #e0e6eb; border-radius: 8px; scrollbar-width: thin; scrollbar-color: #bdc9d5 #f4f6f8; }
.quote-compare__table { width: 100%; min-width: calc(var(--sku-column-width) + var(--price-column-width) + var(--range-column-width) + var(--supplier-count) * var(--supplier-column-width)); table-layout: fixed; border-collapse: separate; border-spacing: 0; font-size: 11px; line-height: 1.35; }
.quote-compare__sku-col { width: var(--sku-column-width); }
.quote-compare__price-col { width: var(--price-column-width); }
.quote-compare__range-col { width: var(--range-column-width); }
.quote-compare__table th, .quote-compare__table td { box-sizing: border-box; padding: 5px 10px; border-bottom: 1px solid #e9edf1; border-right: 1px solid #eef1f4; background: #fff; vertical-align: middle; text-align: left; }
.quote-compare__table tr:last-child > * { border-bottom: 0; }
.quote-compare__table tr > *:last-child { border-right: 0; }
.quote-compare__table thead th { position: sticky; top: 0; z-index: 2; background: #f4f7fa; color: #4c5e73; font-weight: 600; }
.quote-compare__table small { display: block; margin-top: 3px; color: var(--compare-muted); font-size: 9px; line-height: 1.3; font-weight: 400; }
.quote-compare__table .is-sku, .quote-compare__table .is-price { position: sticky; z-index: 1; background: #fff; }
.quote-compare__table .is-sku { left: 0; width: var(--sku-column-width); white-space: normal; }
.quote-compare__table .is-sku > b { font-size: 11px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
.quote-compare__table .is-sku > small { color: #8996a5; font-size: 9px; letter-spacing: .025em; }
.quote-compare__table .is-price { left: var(--sku-column-width); width: var(--price-column-width); box-shadow: 3px 0 5px -4px #94a3b8; }
.quote-compare__table .is-price strong { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
.quote-compare__table .is-range { background: #f8fafc; }
.quote-compare__table .is-range strong { color: #3c6851; font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
.quote-compare__table .is-range > small { margin-top: 1px; color: #7d8a98; font-size: 10px; font-variant-numeric: tabular-nums; }
.quote-compare__spread { display: block; margin-top: 4px; color: #7a8b9e; font-size: 9px; font-variant-numeric: tabular-nums; }
.quote-compare__table thead .is-sku, .quote-compare__table thead .is-price { z-index: 3; background: #f4f7fa; }
.quote-compare__supplier { display: flex; align-items: center; gap: 6px; }
.quote-compare__supplier > div { min-width: 0; }
.quote-compare__supplier b { display: block; color: #263b52; font-size: 10px; line-height: 1.4; white-space: normal; overflow-wrap: anywhere; }
.quote-compare__supplier small { margin-top: 2px; font-size: 9px; letter-spacing: .025em; }
.quote-compare__avatar { display: grid; place-items: center; flex: 0 0 24px; height: 24px; border-radius: 6px; background: #e5edf5; color: #476f98; font-size: 11px; font-weight: 600; }
.quote-compare__avatar.is-alternate { color: #8c7148; background: #f0e9dd; }
.quote-compare__table .is-group th { position: sticky; left: 0; padding: 6px 10px; background: #edf2f7; color: #526c87; font-size: 10px; }
.quote-compare__amount { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
.quote-compare__amount > strong { color: #25384d; font-size: 15px; font-weight: 650; line-height: 1.2; font-variant-numeric: tabular-nums; }
.quote-compare__best { padding: 1px 4px; border-radius: 3px; background: #dff1e8; color: #277253; font-size: 9px; line-height: 1.4; white-space: nowrap; }
.quote-compare__margin { margin-top: 2px; color: #7a8793; font-size: 9px; }
.quote-compare__margin b { margin-left: 3px; color: #287354; font-size: 10px; font-weight: 600; font-variant-numeric: tabular-nums; }
.quote-compare__margin.is-negative b { color: #b34b4b; }
.quote-compare__margin.is-muted b { color: #9aa4ae; }
.quote-compare__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; margin-top: 3px; }
.quote-compare__meta > small { margin: 0; font-size: 9px; }
.quote-compare__status { padding: 0 4px; border: 1px solid #e2e7ed; border-radius: 3px; color: #718092; font-size: 9px; line-height: 1.5; }
.quote-compare__status.is-pending { border-color: #efddb4; background: #fffaf0; color: #966c21; }
.quote-compare__status.is-approved { border-color: #cfe6da; background: #f1faf5; color: #2b7957; }
.quote-compare__table td.is-best { background: #f3faf6; }
.quote-compare__table tbody tr:hover > th, .quote-compare__table tbody tr:hover > td { background: #f8fafc; }
.quote-compare__table tbody tr:hover > td.is-best { background: #eaf6ef; }
.quote-compare__no-quote { display: block; color: #a6afb9; font-size: 14px; }
.quote-compare__no-quote small { margin-top: 2px; color: #8995a3; }
.quote-compare__no-quote.is-filtered { color: #bcc5ce; }
.quote-compare__no-quote.is-filtered small { color: #a1adba; }
.quote-compare__footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding-top: 7px; color: #7c8999; font-size: 9px; }
.quote-compare__footer > span:first-child { display: flex; align-items: center; gap: 5px; }
.quote-compare__footer i { width: 7px; height: 7px; border: 1px solid #bddcca; border-radius: 2px; background: #e3f2e9; }
.quote-compare__empty { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; min-height: 180px; color: var(--compare-muted); }
.quote-compare__empty > span { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: #f3f5f7; color: #9aa8b5; font-size: 20px; }
.quote-compare__empty b { font-size: 12px; font-weight: 500; }
.quote-compare__empty--filtered { flex: 1; min-height: 160px; border: 1px dashed #dce5ee; border-radius: 8px; background: #fbfcfd; }
.quote-compare__table .quote-compare__no-results { padding: 32px 14px; text-align: center; color: var(--compare-muted); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 760px) {
  .quote-compare { --sku-column-width: 144px; --price-column-width: 92px; --range-column-width: 100px; --supplier-column-width: 152px; }
  .quote-compare__heading h2 { font-size: 16px; }
  .quote-compare__summary { gap: 5px; }
  .quote-compare__summary > div { padding: 6px 8px; }
  .quote-compare__summary strong { font-size: 17px; }
  .quote-compare__summary small { display: none; }
  .quote-compare__table th, .quote-compare__table td { padding: 6px 8px; }
  .quote-compare__toolbar { gap: 6px; }
  .quote-compare__filter-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px 10px; }
  .quote-compare__filters { max-height: 30vh; overflow: auto; }
}
@media (max-width: 560px) {
  .quote-compare__summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .quote-compare__table .is-sku, .quote-compare__table .is-price { position: static; }
  .quote-compare__table thead .is-sku, .quote-compare__table thead .is-price { position: sticky; left: auto; }
  .quote-compare__toolbar { flex-wrap: wrap; }
  .quote-compare__scope { flex: 1; }
}
</style>
<style>
.el-dialog.quote-compare-dialog { display: flex; flex-direction: column; max-height: 94vh; padding: 16px; border-radius: 14px; }
.quote-compare-dialog .el-dialog__header { flex-shrink: 0; padding: 0 0 12px; border: 0; background: none; }
.quote-compare-dialog .el-dialog__headerbtn { top: 8px; right: 8px; width: 28px; height: 28px; }
.quote-compare-dialog .el-dialog__headerbtn .el-dialog__close { font-size: 16px; }
.quote-compare-dialog .el-dialog__body { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: auto; padding: 0; }
@media (max-width: 760px) { .el-dialog.quote-compare-dialog { padding: 12px; } }
</style>
