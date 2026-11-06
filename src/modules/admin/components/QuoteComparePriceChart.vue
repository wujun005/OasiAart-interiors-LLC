<template>
  <div v-if="selectedSku" class="compare-chart">
    <nav class="compare-chart__options" :aria-label="t('admin.quoteCompare.chooseOption')">
      <div class="compare-chart__options-title">{{ t('admin.quoteCompare.chooseOption') }}<span>{{ skus.length }}</span></div>
      <div class="compare-chart__choices">
        <button
          v-for="sku in skus"
          :key="sku.key"
          type="button"
          class="compare-chart__choice"
          :class="{ 'is-selected': sku.key === selectedSku.key }"
          :aria-pressed="sku.key === selectedSku.key"
          :title="[grouped ? sku.spuName : '', labelFor(sku), `SKU ${sku.skuCode}`].filter(Boolean).join(' · ')"
          @click="selectedKey = sku.key"
        >
          <span v-if="grouped && sku.spuName" class="compare-chart__service">{{ sku.spuName }}</span>
          <b>{{ labelFor(sku) }}</b>
          <small>SKU {{ sku.skuCode }}</small>
          <span class="compare-chart__range">{{ formatCompareMoney(sku.lowestPrice) }}<template v-if="sku.highestPrice != null && sku.highestPrice !== sku.lowestPrice"> – {{ formatCompareMoney(sku.highestPrice) }}</template><small>AED</small></span>
        </button>
      </div>
    </nav>
    <section class="compare-chart__detail" :aria-label="labelFor(selectedSku)">
      <header class="compare-chart__heading">
        <div><span v-if="grouped && selectedSku.spuName" class="compare-chart__service">{{ selectedSku.spuName }}</span><h3 :title="labelFor(selectedSku)">{{ labelFor(selectedSku) }}</h3><small>SKU {{ selectedSku.skuCode }}</small></div>
        <span class="compare-chart__unit">AED</span>
      </header>
      <div class="compare-chart__metrics">
        <div><span>{{ t('admin.quoteCompare.customerPrice') }}</span><b>{{ formatCompareMoney(customerPrice) }}</b></div>
        <div class="is-lowest"><span>{{ t('admin.quoteCompare.lowestQuote') }}</span><b>{{ formatCompareMoney(lowestQuote) }}</b></div>
        <div><span>{{ t('admin.quoteCompare.quoteSpread') }}</span><b>{{ formatCompareMoney(quoteSpread) }}</b><small v-if="quoteCount === 1">{{ t('admin.quoteCompare.singleQuote') }}</small></div>
      </div>
      <div class="compare-chart__legend"><span>{{ t('admin.quoteCompare.chartHint') }}</span><span v-if="customerPrice != null"><i aria-hidden="true" />{{ t('admin.quoteCompare.customerReference') }}</span></div>
      <ul class="compare-chart__rows" :aria-label="t('admin.quoteCompare.title')">
        <li
          v-for="row in supplierRows"
          :key="row.supplier.id"
          :data-supplier-id="row.supplier.id"
          class="compare-chart__row"
          :class="{ 'is-lowest': row.price != null && row.price === lowestQuote, 'is-above': row.price != null && customerPrice != null && row.price > customerPrice, 'is-empty': row.price == null }"
        >
          <div class="compare-chart__supplier"><b :title="row.supplier.name">{{ row.supplier.name }}</b><small>{{ row.supplier.no || `ID ${row.supplier.id}` }}</small></div>
          <div class="compare-chart__plot">
            <div class="compare-chart__price-line">
              <div class="compare-chart__track" aria-hidden="true">
                <span v-if="row.price != null" class="compare-chart__bar" :style="{ width: percentOf(row.price) }" />
                <span v-if="row.price === 0" class="compare-chart__zero" />
                <i v-if="customerPrice != null" class="compare-chart__reference" :style="{ left: percentOf(customerPrice) }" />
              </div>
              <strong class="compare-chart__amount">{{ formatCompareMoney(row.price) }}</strong>
            </div>
            <div v-if="row.price != null && row.cell" class="compare-chart__meta">
              <span v-if="statusLabel(row.cell)" class="compare-chart__status" :class="{ 'is-pending': row.cell.status === 1, 'is-approved': row.cell.status === 2 }">{{ statusLabel(row.cell) }}</span>
              <span v-if="modeLabel(row.cell)">{{ modeLabel(row.cell) }}</span>
              <span class="compare-chart__margin" :class="{ 'is-negative': row.cell.profitRate != null && row.cell.profitRate < 0 }">{{ t('admin.quoteCompare.margin') }} <b>{{ formatProfitPercent(row.cell.profitRate) }}</b></span>
              <span v-if="row.price === lowestQuote" class="compare-chart__lowest">{{ t('admin.quoteCompare.lowest') }}</span>
              <span v-if="customerPrice != null && row.price > customerPrice" class="compare-chart__warning">{{ t('admin.quoteCompare.aboveCustomerPrice') }}</span>
            </div>
            <div v-else class="compare-chart__missing" :class="{ 'is-filtered': row.excluded }">{{ t(row.excluded ? 'admin.quoteCompare.filteredOut' : 'admin.quoteCompare.noQuote') }}</div>
          </div>
        </li>
      </ul>
      <div class="compare-chart__scale" aria-hidden="true"><span>0</span><span>{{ formatCompareMoney(scaleMax) }} AED</span></div>
    </section>
  </div>
  <p v-else class="compare-chart__empty" role="status">{{ t('admin.quoteCompare.chartEmpty') }}</p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { pickI18nText } from '@/modules/admin/utils/i18n'
import type { FilteredCompareSkuRow } from '@/modules/admin/utils/quoteCompareFilters'
import { formatCompareMoney, formatProfitPercent, type CompareCell, type CompareSupplier } from '@/modules/admin/utils/supplierQuoteCompare'

const props = defineProps<{
  skus: FilteredCompareSkuRow[]
  suppliers: CompareSupplier[]
  labels: Record<string, string>
  grouped?: boolean
}>()
const { t, locale } = useI18n({ useScope: 'global' })
const selectedKey = ref('')
watch(() => props.skus.map(sku => sku.key), keys => {
  if (!keys.includes(selectedKey.value)) selectedKey.value = keys[0] || ''
}, { immediate: true })
const selectedSku = computed(() => props.skus.find(sku => sku.key === selectedKey.value) || null)
const labelFor = (sku: FilteredCompareSkuRow) => props.labels[sku.key] || sku.skuCode
const priceOf = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
const supplierRows = computed(() => props.suppliers.map((supplier, index) => {
  const cell = selectedSku.value?.cells[supplier.id]
  return { supplier, cell, index, price: priceOf(cell?.quotePrice), excluded: selectedSku.value?.excludedSupplierIds.includes(supplier.id) || false }
}).sort((left, right) => {
  if (left.price == null) return right.price == null ? left.index - right.index : 1
  if (right.price == null) return -1
  return left.price - right.price || left.index - right.index
}))
const prices = computed(() => supplierRows.value.flatMap(row => row.price == null ? [] : [row.price]))
const quoteCount = computed(() => prices.value.length)
const lowestQuote = computed(() => prices.value.length ? Math.min(...prices.value) : null)
const quoteSpread = computed(() => prices.value.length > 1 ? Math.max(...prices.value) - Math.min(...prices.value) : null)
const customerPrice = computed(() => priceOf(selectedSku.value?.platformPrice))
const scaleMax = computed(() => Math.max(customerPrice.value ?? 0, ...prices.value, 0))
const percentOf = (price: number) => `${Math.min(100, Math.max(0, price / (scaleMax.value || 1) * 100))}%`
const statusLabel = (cell: CompareCell) => pickI18nText(cell.statusI18n, locale.value,
  cell.status === 1 ? t('admin.quoteCompare.pending') : cell.status === 2 ? t('admin.quoteCompare.approved') : '')
const modeLabel = (cell: CompareCell) => pickI18nText(cell.quoteModeI18n, locale.value,
  cell.quoteMode === 1 ? t('admin.quoteCompare.fixed') : cell.quoteMode === 2 ? t('admin.quoteCompare.hourly') : '')
</script>

<style scoped>
.compare-chart { display: grid; grid-template-columns: 200px minmax(0, 1fr); flex: 1; min-height: 250px; max-height: min(60vh, 640px); overflow: hidden; border: 1px solid #e0e7ee; border-radius: 9px; background: #fff; color: #2d4055; font-size: 11px; line-height: 1.4; }
.compare-chart__options { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid #e5ebf0; background: #f8fafc; }
.compare-chart__options-title { display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; padding: 10px 12px; color: #687d92; font-size: 10px; font-weight: 600; }
.compare-chart__options-title > span { min-width: 18px; padding: 1px 4px; border-radius: 4px; background: #e9eff5; color: #64809b; text-align: center; }
.compare-chart__choices { flex: 1; min-height: 0; padding: 0 7px 7px; overflow: auto; scrollbar-width: thin; }
.compare-chart__choice { display: block; width: 100%; margin: 0 0 5px; padding: 9px 10px; border: 1px solid transparent; border-radius: 7px; background: transparent; color: #50667c; font: inherit; text-align: left; cursor: pointer; }
.compare-chart__choice:hover { background: #f0f4f8; }
.compare-chart__choice.is-selected { border-color: #c9d9e8; background: #edf4fb; box-shadow: inset 2px 0 0 #668eb9; color: #284a70; }
.compare-chart__choice:focus-visible { outline: 2px solid #7ba0c7; outline-offset: -2px; }
.compare-chart__choice > b { display: -webkit-box; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-size: 11px; line-height: 1.4; font-weight: 600; overflow-wrap: anywhere; }
.compare-chart__choice > small, .compare-chart__heading small { display: block; margin-top: 3px; color: #8a99a8; font-size: 9px; font-weight: 400; }
.compare-chart__service { display: block; margin-bottom: 3px; color: #8394a5; font-size: 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.compare-chart__range { display: block; margin-top: 5px; color: #4c715e; font-size: 10px; font-variant-numeric: tabular-nums; }
.compare-chart__range > small { margin-left: 4px; color: #93a19c; font-size: 8px; }
.compare-chart__detail { display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: 12px 16px 10px; }
.compare-chart__heading { display: flex; flex-shrink: 0; align-items: flex-start; gap: 10px; justify-content: space-between; }
.compare-chart__heading > div { min-width: 0; }
.compare-chart__heading h3 { margin: 0; color: #2a4058; font-size: 13px; line-height: 1.4; font-weight: 650; overflow-wrap: anywhere; }
.compare-chart__unit { padding: 2px 5px; border-radius: 4px; background: #f1f4f7; color: #8293a5; font-size: 9px; }
.compare-chart__metrics { display: grid; flex-shrink: 0; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 10px 0; }
.compare-chart__metrics > div { min-width: 0; padding: 7px 10px; border-radius: 6px; background: #f6f8fb; }
.compare-chart__metrics > .is-lowest { background: #f0f8f3; }
.compare-chart__metrics span { display: block; color: #8190a0; font-size: 9px; }
.compare-chart__metrics b { display: inline-block; margin-top: 3px; color: #3d5875; font-size: 15px; line-height: 1.25; font-weight: 650; font-variant-numeric: tabular-nums; }
.compare-chart__metrics .is-lowest b { color: #317553; }
.compare-chart__metrics small { margin-left: 5px; color: #92a0af; font-size: 8px; }
.compare-chart__legend { display: flex; flex-shrink: 0; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 5px 12px; padding-bottom: 7px; color: #8b98a7; font-size: 9px; }
.compare-chart__legend > span:last-child { display: inline-flex; align-items: center; gap: 5px; }
.compare-chart__legend i { height: 10px; border-left: 1px dashed #97a5b5; }
.compare-chart__rows { flex: 1; min-height: 0; margin: 0; padding: 0; overflow: auto; list-style: none; scrollbar-width: thin; }
.compare-chart__row { box-sizing: border-box; display: grid; grid-template-columns: minmax(100px, 180px) minmax(0, 1fr); align-items: center; gap: 14px; min-height: 50px; padding: 8px 0; border-top: 1px solid #edf1f5; }
.compare-chart__supplier { min-width: 0; }
.compare-chart__supplier > b { display: block; overflow: hidden; color: #40576f; font-size: 10px; line-height: 1.4; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }
.compare-chart__supplier > small { display: block; margin-top: 2px; color: #95a1af; font-size: 9px; }
.compare-chart__plot { min-width: 0; }
.compare-chart__price-line { display: grid; grid-template-columns: minmax(0, 1fr) 74px; align-items: center; gap: 9px; }
.compare-chart__track { position: relative; height: 13px; border-radius: 3px; background: #f1f5f9; }
.compare-chart__bar { display: block; height: 100%; border-radius: 3px; background: #abc6e3; }
.compare-chart__row.is-lowest .compare-chart__bar { background: #83b69a; }
.compare-chart__row.is-above .compare-chart__bar { background: #d5b071; }
.compare-chart__reference { position: absolute; top: -3px; bottom: -3px; z-index: 1; border-left: 1px dashed #8295a8; transform: translateX(-1px); }
.compare-chart__zero { position: absolute; top: 4px; left: 0; width: 5px; height: 5px; border-radius: 50%; background: #4f9672; }
.compare-chart__amount { color: #30465e; font-size: 15px; font-weight: 650; line-height: 1.2; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.compare-chart__row.is-lowest .compare-chart__amount { color: #337951; }
.compare-chart__row.is-above .compare-chart__amount { color: #a77b36; }
.compare-chart__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 3px 7px; margin-top: 6px; color: #8c9baa; font-size: 9px; }
.compare-chart__status { padding: 0 4px; border: 1px solid #e2e7ed; border-radius: 3px; line-height: 1.5; }
.compare-chart__status.is-pending { border-color: #f0dfbc; background: #fffbf3; color: #a8803d; }
.compare-chart__status.is-approved { border-color: #d5e8dd; background: #f5faf7; color: #4d8969; }
.compare-chart__margin b { color: #5d836f; font-weight: 500; font-variant-numeric: tabular-nums; }
.compare-chart__margin.is-negative b { color: #bd8351; }
.compare-chart__lowest { padding: 1px 4px; border-radius: 3px; background: #e5f2e9; color: #4a8b67; font-size: 8px; }
.compare-chart__warning { color: #ae8851; font-size: 8px; }
.compare-chart__missing { margin-top: 5px; color: #94a1af; font-size: 9px; }
.compare-chart__missing.is-filtered { color: #a6b1be; }
.compare-chart__row.is-empty .compare-chart__track { background: repeating-linear-gradient(110deg, #f4f6f9, #f4f6f9 5px, #f9fafc 5px, #f9fafc 10px); }
.compare-chart__row.is-empty .compare-chart__amount { color: #bbc4ce; }
.compare-chart__scale { display: flex; flex-shrink: 0; justify-content: space-between; margin: 5px 83px 0 194px; color: #a2adba; font-size: 8px; font-variant-numeric: tabular-nums; }
.compare-chart__empty { padding: 40px 16px; color: #8b99a7; text-align: center; font-size: 11px; }
@media (max-width: 1000px) {
  .compare-chart { grid-template-columns: 175px minmax(0, 1fr); }
  .compare-chart__detail { padding: 10px 12px; }
  .compare-chart__row { grid-template-columns: 120px minmax(0, 1fr); gap: 10px; }
  .compare-chart__scale { margin-left: 130px; }
}
@media (max-width: 760px) {
  .compare-chart { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); min-height: 350px; max-height: 65vh; }
  .compare-chart__options { border-right: 0; border-bottom: 1px solid #e5ebf0; }
  .compare-chart__options-title { padding: 6px 10px; }
  .compare-chart__choices { display: flex; gap: 5px; padding: 0 6px 6px; overflow-x: auto; }
  .compare-chart__choice { flex: 0 0 165px; width: 165px; margin: 0; padding: 6px 8px; }
  .compare-chart__choice > b { -webkit-line-clamp: 1; }
  .compare-chart__choice > small { margin-top: 1px; }
  .compare-chart__choice > .compare-chart__range { margin-top: 2px; }
  .compare-chart__choice.is-selected { box-shadow: inset 0 -2px 0 #668eb9; }
  .compare-chart__metrics { gap: 5px; margin: 8px 0; }
  .compare-chart__metrics > div { padding: 6px 8px; }
}
@media (max-width: 480px) {
  .compare-chart__row { grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .compare-chart__supplier { display: flex; align-items: center; gap: 6px; }
  .compare-chart__supplier > b { flex: 1; }
  .compare-chart__supplier > small { flex-shrink: 0; margin: 0; }
  .compare-chart__scale { margin-left: 0; }
  .compare-chart__metrics small { display: block; margin: 2px 0 0; }
}
</style>
