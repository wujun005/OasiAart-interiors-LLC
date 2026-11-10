<template>
  <main class="order-addons" :class="{ 'order-addons--mobile': mobile }">
    <div class="order-addons__shell">
      <div class="order-addons__main" :inert="isCompact && reviewOpen">
        <button class="order-addons__back" type="button" :disabled="editingLocked" @click="goBack"><span aria-hidden="true">←</span>{{ t('client.orderAddons.back') }}</button>
        <header class="order-addons__hero"><h1>{{ t('client.orderAddons.menuTitle') }}</h1><p>{{ t('client.orderAddons.menuLead') }}</p></header>

        <p v-if="loading" class="order-addons__state" role="status">{{ t('client.orderAddons.loading') }}</p>
        <div v-else-if="gate !== 'allowed'" class="order-addons__state" role="status"><span class="order-addons__state-icon" aria-hidden="true">◇</span><p>{{ gateMessage }}</p><button v-if="gate === 'syncing' || gate === 'missing' || isPaymentPending" type="button" @click="load">{{ t('client.orderAddons.retry') }}</button></div>
        <template v-else>
          <section class="order-addons__context" :aria-label="t('client.orderAddons.currentBooking')">
            <span class="order-addons__context-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 5V3m8 2V3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/><path d="m8 14 3 3 5-5"/></svg></span>
            <div><h2>{{ serviceTitle || t('client.orderAddons.currentBooking') }}</h2><p><span v-if="order?.orderNo">{{ t('client.orderList.orderNo') }} {{ order.orderNo }}</span><span v-if="Number(order?.paymentStatus) === 1" class="order-addons__paid">{{ t('client.orderAddons.paidBooking') }}</span></p><small v-if="scheduleText">{{ scheduleText }}</small></div>
            <button type="button" :disabled="editingLocked" :aria-label="t('client.orderAddons.back')" @click="goBack">↗</button>
          </section>
          <details v-if="included.length" class="order-addons__history"><summary>{{ t('client.orderAddons.addedHistory', { count: included.length }) }}<span aria-hidden="true">⌄</span></summary><ul><li v-for="item in included" :key="item.key"><div><b>{{ item.label }} × {{ item.quantity }}</b><small v-if="item.source">{{ item.source }}</small><small v-if="item.unitPriceText">{{ item.unitPriceText }}</small></div><strong v-if="item.amountText">{{ item.amountText }}</strong></li></ul></details>
          <ol class="order-addons__steps" :aria-label="t('client.orderAddons.stepsLabel')"><li class="is-active">{{ t('client.orderAddons.chooseItems') }}</li><li>{{ t('client.orderAddons.reviewCost') }}</li><li>{{ t('client.orderAddons.paymentStep') }}</li></ol>
          <div v-if="!groups.length" class="order-addons__state" role="status"><span class="order-addons__state-icon" aria-hidden="true">◇</span><p>{{ t('client.orderAddons.empty') }}</p></div>
          <template v-else>
            <div v-if="moduleTitle || moduleDesc" class="order-addons__module"><h2 v-if="moduleTitle">{{ moduleTitle }}</h2><p v-if="moduleDesc">{{ moduleDesc }}</p></div>
            <div class="order-addons__filters">
              <nav class="order-addons__categories" :aria-label="t('client.orderAddons.browseItems')"><button type="button" :class="{ 'is-active': !activeGroup }" :aria-pressed="!activeGroup" :disabled="editingLocked" @click="activeGroup = ''">{{ t('client.orderAddons.allItems') }}</button><button v-for="group in groups" :key="group.id" type="button" :class="{ 'is-active': activeGroup === group.id }" :aria-pressed="activeGroup === group.id" :disabled="editingLocked" @click="activeGroup = group.id">{{ group.label }}</button></nav>
              <label class="order-addons__search"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="5"/><path d="m12 12 5 5"/></svg><input v-model="search" type="search" :disabled="editingLocked" :aria-label="t('client.orderAddons.searchItems')" :placeholder="t('client.orderAddons.searchItems')" /></label>
            </div>
            <section class="order-addons__catalog" :aria-label="moduleTitle || t('client.orderAddons.browseItems')">
              <article v-for="option in visibleOptions" :key="option.id" class="order-addons__option" :class="{ 'is-selected': (quantities[option.id] || 0) > 0 }">
                <span class="order-addons__option-icon" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4c0 6-4 10-10 10 6 0 10 4 10 10 0-6 4-10 10-10-6 0-10-4-10-10Z"/></svg></span>
                <div class="order-addons__option-copy"><span>{{ option.groupLabel }}</span><h3>{{ option.label }}</h3><strong>{{ priceText(option) }}</strong><small>{{ t('client.orderAddons.inclVat') }}</small></div>
                <button v-if="!quantities[option.id]" type="button" class="order-addons__add" :disabled="editingLocked" :aria-label="t('client.orderAddons.increaseItem', { item: option.label })" @click="changeQty(option.id, 1)"><span aria-hidden="true">＋</span>{{ t('client.orderAddons.addItem') }}</button>
                <div v-else class="order-addons__stepper"><button type="button" :disabled="editingLocked" :aria-label="t('client.orderAddons.decreaseItem', { item: option.label })" @click="changeQty(option.id, -1)">−</button><output :aria-label="t('client.orderAddons.quantityFor', { item: option.label })">{{ quantities[option.id] }}</output><button type="button" :disabled="editingLocked || quantities[option.id] >= 99" :aria-label="t('client.orderAddons.increaseItem', { item: option.label })" @click="changeQty(option.id, 1)">＋</button></div>
              </article>
            </section>
            <div v-if="!visibleOptions.length" class="order-addons__state" role="status"><p>{{ t('client.orderAddons.noMatches') }}</p><button type="button" :disabled="editingLocked" @click="clearFilters">{{ t('client.orderAddons.clearFilters') }}</button></div>
          </template>
        </template>
      </div>

      <button v-if="isCompact && reviewOpen" class="order-addons__scrim" type="button" :aria-label="t('client.orderAddons.closeReview')" :disabled="editingLocked" tabindex="-1" @click="closeReview" />
      <aside v-if="!loading && gate === 'allowed' && groups.length" ref="reviewPanel" class="order-addons__basket" :class="{ 'is-open': reviewOpen }" :role="isCompact ? 'dialog' : undefined" :aria-modal="isCompact && reviewOpen ? true : undefined" :aria-hidden="isCompact && !reviewOpen ? true : undefined" :inert="isCompact && !reviewOpen" :aria-label="t('client.orderAddons.basketTitle')" tabindex="-1" @keydown.esc.stop.prevent="closeReview" @keydown.tab="trapReviewFocus">
        <header><div><h2>{{ t('client.orderAddons.basketTitle') }}</h2><span v-if="selectedLines.length">{{ t('client.orderAddons.selectedItems', { count: selectedCount }) }}</span></div><button v-if="isCompact" ref="closeReviewButton" type="button" :disabled="editingLocked" :aria-label="t('client.orderAddons.closeReview')" @click="closeReview">×</button></header>
        <div v-if="!selectedLines.length" class="order-addons__basket-empty"><span aria-hidden="true">＋</span><p>{{ t('client.orderAddons.basketEmpty') }}</p></div>
        <ul v-else class="order-addons__basket-lines"><li v-for="line in selectedLines" :key="line.id"><div class="order-addons__basket-line-title"><b>{{ line.label }}</b><button type="button" :disabled="editingLocked" :aria-label="t('client.orderAddons.removeItem', { item: line.label })" @click="removeLine(line.id)">×</button></div><div class="order-addons__basket-line-bottom"><div class="order-addons__stepper"><button type="button" :disabled="editingLocked" :aria-label="t('client.orderAddons.decreaseItem', { item: line.label })" @click="changeQty(line.id, -1)">−</button><output :aria-label="t('client.orderAddons.quantityFor', { item: line.label })">{{ line.quantity }}</output><button type="button" :disabled="editingLocked || line.quantity >= 99" :aria-label="t('client.orderAddons.increaseItem', { item: line.label })" @click="changeQty(line.id, 1)">＋</button></div><strong>AED {{ line.withTax.toFixed(2) }}</strong></div></li></ul>
        <dl class="order-addons__summary"><div><dt>{{ t('client.orderAddons.subtotal') }}</dt><dd>AED {{ totals.without.toFixed(2) }}</dd></div><div><dt>{{ t('client.orderAddons.vat') }}</dt><dd>AED {{ totals.tax.toFixed(2) }}</dd></div><div class="is-total"><dt>{{ t('client.orderAddons.dueNow') }}</dt><dd>AED {{ totals.withTax.toFixed(2) }}</dd></div></dl>
        <small v-if="selectedLines.length" class="order-addons__rounding">{{ t('client.orderAddons.priceRoundingNote') }}</small>
        <button class="order-addons__pay" type="button" :disabled="!canPay" @click="startPayment">{{ paying ? t('client.orderAddons.paying') : t('client.orderAddons.confirmAndPay') }}<span aria-hidden="true">→</span></button>
        <p class="order-addons__additional-note">{{ t('client.orderAddons.additionalOnly') }}</p>
        <p v-if="selectedLines.length && totals.withTax < 0.01" class="order-addons__minimum" role="status">{{ t('client.orderAddons.minAmount') }}</p>
        <button v-if="isCompact" type="button" class="order-addons__continue" :disabled="editingLocked" @click="closeReview">{{ t('client.orderAddons.continueChoosing') }}</button>
      </aside>
    </div>
    <div v-if="!loading && gate === 'allowed' && groups.length" class="order-addons__mobile-basket" :inert="isCompact && reviewOpen"><div class="order-addons__basket-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 7h12l2 14H4L6 7Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg><span>{{ selectedCount }}</span></div><div><small>{{ t('client.orderAddons.selectedItems', { count: selectedCount }) }}</small><strong>AED {{ totals.withTax.toFixed(2) }}</strong></div><button ref="reviewTrigger" type="button" :disabled="!selectedLines.length || editingLocked" @click="openReview">{{ t('client.orderAddons.reviewBasket') }}</button></div>
    <StripePaymentModal :visible="stripeVisible" :client-secret="stripeClientSecret" :customer-session-client-secret="stripeCustomerSession" :locale="locale" :subtotal="totals.without" :tax="totals.tax" :total="totals.withTax" @close="handleStripeClose" @paid="handlePaid" @error="handlePayError" />
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import StripePaymentModal from "@/modules/client/components/StripePaymentModal.vue"
import {
  createOrderAddonPayment,
  getClientOrderDetail,
  getClientOrderDetailById,
  getProductDetail,
  listOrderAddonAttaches,
  type OrderAddonAttachOption,
  type OrderListRecord,
} from "@/modules/client/api"
import {
  addonCatalog,
  addonGate,
  addonGroupsFromOptions,
  addonLineCharge,
  localizedText,
  singleOrderKey,
  singleOrderReference,
  sumAddonCharges,
  type AddonGate,
  type AddonLineCharge,
} from "@/modules/client/utils/order-addons"
import { orderLineSourceLabel } from "@/modules/client/utils/order-localization"
import { formatServiceSchedule } from "@/modules/client/utils/order-date-time"

const props = withDefaults(defineProps<{ mobile?: boolean }>(), { mobile: false })
const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: "global" })

const loading = ref(true)
const paying = ref(false)
const gate = ref<AddonGate>("missing")
const order = ref<OrderListRecord | null>(null)
const attachOptions = ref<OrderAddonAttachOption[]>([])
const quantities = ref<Record<string, number>>({})
const stripeVisible = ref(false)
const stripeClientSecret = ref("")
const stripeCustomerSession = ref("")
const paymentCompleted = ref(false)
const search = ref("")
const activeGroup = ref("")
const reviewOpen = ref(false)
const narrowViewport = ref(false)
const reviewPanel = ref<HTMLElement | null>(null)
const reviewTrigger = ref<HTMLButtonElement | null>(null)
const closeReviewButton = ref<HTMLButtonElement | null>(null)
const isCompact = computed(() => props.mobile || narrowViewport.value)
const editingLocked = computed(() => paying.value || stripeVisible.value || paymentCompleted.value)
let requestSequence = 0
let paidRedirectTimer: number | null = null
let mediaQuery: MediaQueryList | null = null
let previousOverflow: string | null = null

const scheduleText = computed(() => {
  const value = String(order.value?.serviceDateTime || order.value?.serviceTimeDisplay || "").trim()
  return value ? formatServiceSchedule(value, locale.value, value) : ""
})

const serviceTitle = computed(() =>
  localizedText(order.value?.spuNameI18n, locale.value, String(order.value?.spuName || "").trim()),
)
const moduleTitle = computed(() => String(order.value?.attachModuleTitle || "").trim())
const moduleDesc = computed(() => String(order.value?.attachModuleDesc || "").trim())
const groups = computed(() => addonGroupsFromOptions(attachOptions.value, locale.value))
const catalogOptions = computed(() => groups.value.flatMap(group => group.options.map(option => ({
  ...option, groupId: group.id, groupLabel: group.label,
}))))
const visibleOptions = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  return catalogOptions.value.filter(option => (!activeGroup.value || option.groupId === activeGroup.value)
    && (!keyword || `${option.label} ${option.groupLabel} ${option.unit}`.toLocaleLowerCase().includes(keyword)))
})
const included = computed(() =>
  (order.value?.attachSelections || [])
    .map((item, index) => {
      const quantity = Math.max(0, Number(item.quantity || 0) || 0)
      const label = localizedText(
        item.attachValueNameI18n,
        locale.value,
        String(item.attachValueName || "").trim(),
      )
      if (!label || quantity < 1) return null
      const amountRaw = item.amountWithTax ?? item.amountWithoutTax
      const unitPriceRaw = item.unitPriceWithTax ?? item.unitPriceWithoutTax
      const amount = amountRaw == null || amountRaw === "" ? NaN : Number(amountRaw)
      const unitPrice = unitPriceRaw == null || unitPriceRaw === "" ? NaN : Number(unitPriceRaw)
      const unitPriceLabel = locale.value.startsWith("zh")
        ? (item.unitPriceWithTax != null ? "含税单价" : "不含税单价")
        : (item.unitPriceWithTax != null ? "Unit price incl. VAT" : "Unit price excl. VAT")
      return {
        key: `${item.attachValueId || index}-${index}`,
        label,
        quantity,
        source: orderLineSourceLabel(item, locale.value),
        unitPriceText: Number.isFinite(unitPrice) ? `${unitPriceLabel} AED ${unitPrice.toFixed(2)}` : "",
        amountText: Number.isFinite(amount) ? `AED ${amount.toFixed(2)}` : "",
      }
    })
    .filter((item): item is {
      key: string
      label: string
      quantity: number
      source: string
      unitPriceText: string
      amountText: string
    } => Boolean(item)),
)
const selectedLines = computed(() => {
  const lines: Array<AddonLineCharge & { label: string }> = []
  groups.value.forEach((group) => {
    group.options.forEach((option) => {
      const charge = addonLineCharge(option.id, option.price, quantities.value[option.id] || 0)
      if (charge) lines.push({ ...charge, label: option.label })
    })
  })
  return lines
})
const totals = computed(() => sumAddonCharges(selectedLines.value))
const selectedCount = computed(() => selectedLines.value.reduce((count, line) => count + line.quantity, 0))
const canPay = computed(() => gate.value === "allowed" && selectedLines.value.length > 0
  && totals.value.withTax >= 0.01 && !editingLocked.value)
const isPaymentPending = computed(() => {
  const current = order.value
  if (!current || current.packageOrder === true || Number(current.orderType) === 2
    || String(current.packageId ?? "").trim() !== "") return false
  return [current.orderStatus, current.paymentStatus].some(value => value != null
    && String(value).trim() !== "" && Number(value) === 0)
})
const gateMessage = computed(() => {
  if (gate.value === "package") return t("client.orderAddons.packageBlocked")
  if (gate.value === "syncing" || isPaymentPending.value) return t("client.orderAddons.syncing")
  if (gate.value === "missing") return t("client.orderAddons.missing")
  return t("client.orderAddons.ineligible")
})

const priceText = (option: { price: number; unit: string }) => {
  const amount = `AED ${(addonLineCharge("unit", option.price, 1)?.withTax ?? 0).toFixed(2)}`
  return option.unit ? `${amount} / ${option.unit}` : amount
}

const changeQty = (id: string, delta: number) => {
  if (editingLocked.value || !catalogOptions.value.some(option => option.id === id)) return
  const next = Math.max(0, Math.min(99, (quantities.value[id] || 0) + delta))
  quantities.value = { ...quantities.value, [id]: next }
}
const removeLine = (id: string) => {
  if (editingLocked.value) return
  const next = { ...quantities.value }
  delete next[id]
  quantities.value = next
}
const clearFilters = () => {
  if (editingLocked.value) return
  search.value = ""
  activeGroup.value = ""
}
const openReview = () => {
  if (!selectedLines.value.length || editingLocked.value) return
  reviewOpen.value = true
  void nextTick(() => closeReviewButton.value?.focus?.())
}
const closeReview = () => {
  if (editingLocked.value) return
  reviewOpen.value = false
  void nextTick(() => reviewTrigger.value?.focus?.())
}
const trapReviewFocus = (event: KeyboardEvent) => {
  if (!isCompact.value || !reviewOpen.value || !reviewPanel.value?.querySelectorAll) return
  const focusable = Array.from(reviewPanel.value.querySelectorAll<HTMLElement>("button:not(:disabled), [tabindex='0']"))
  const first = focusable[0], last = focusable[focusable.length - 1]
  if (!first || !last) { event.preventDefault(); reviewPanel.value.focus(); return }
  if (event.shiftKey && (document.activeElement === first || document.activeElement === reviewPanel.value)) {
    event.preventDefault(); last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus()
  }
}
const restoreBodyScroll = () => {
  if (previousOverflow != null && typeof document !== "undefined") {
    document.body.style.overflow = previousOverflow
    previousOverflow = null
  }
}
const clearPaidRedirect = () => {
  if (paidRedirectTimer != null) window.clearTimeout(paidRedirectTimer)
  paidRedirectTimer = null
}
watch([reviewOpen, isCompact], ([open, compact]) => {
  if (open && compact && typeof document !== "undefined") {
    if (previousOverflow == null) previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
  } else restoreBodyScroll()
})

const loadAttachOptions = async (detail: OrderListRecord, queryOrderId: string) => {
  if (Array.isArray(detail.availableAttaches)) return detail.availableAttaches
  const id = String(detail.orderId || queryOrderId || "").trim()
  if (id) {
    try {
      return await listOrderAddonAttaches(id)
    } catch (error) {
      console.error("list order addon attaches failed:", error)
    }
  }
  if (!detail.spuId) return []
  const product = await getProductDetail(detail.spuId)
  return addonCatalog(
    product && typeof product === "object" ? (product as Record<string, unknown>) : null,
    locale.value,
  ).flatMap((group) =>
    group.options.map((option) => ({
      attachTypeId: group.id,
      attachTypeName: group.label,
      attachValueId: option.id,
      attachValueName: option.label,
      unit: option.unit,
      unitPriceWithoutTax: option.price,
    })),
  )
}

const goBack = () => {
  if (editingLocked.value) return
  const orderNo = String(order.value?.orderNo || singleOrderKey(route.query.orderNo) || "").trim()
  if (orderNo) {
    void router.push({
      name: props.mobile ? "h5-order-detail" : "order-detail",
      params: { orderNo },
    })
    return
  }
  void router.push({ name: props.mobile ? "h5-orders" : "order-list" })
}

const load = async () => {
  const ticket = ++requestSequence
  clearPaidRedirect()
  paymentCompleted.value = false
  loading.value = true
  attachOptions.value = []
  quantities.value = {}
  order.value = null
  reviewOpen.value = false
  stripeVisible.value = false
  stripeClientSecret.value = ""
  stripeCustomerSession.value = ""
  search.value = ""
  activeGroup.value = ""
  gate.value = "missing"
  try {
    const reference = singleOrderReference(route.query.orderId, route.query.orderNo)
    if (!reference) return
    const { orderNo, orderId } = reference
    const detail = orderNo
      ? await getClientOrderDetail(orderNo)
      : orderId
        ? await getClientOrderDetailById(orderId)
        : null
    if (ticket !== requestSequence) return
    order.value = detail
    gate.value = addonGate(detail)
    if (gate.value !== "allowed" || !detail) return
    const options = await loadAttachOptions(detail, orderId)
    if (ticket === requestSequence) attachOptions.value = options
  } catch (error) {
    if (ticket !== requestSequence) return
    console.error("load order addons failed:", error)
    gate.value = "missing"
    ElMessage.error(t("client.orderAddons.loadFailed"))
  } finally {
    if (ticket === requestSequence) loading.value = false
  }
}

const startPayment = async () => {
  if (editingLocked.value || gate.value !== "allowed") return
  if (!selectedLines.value.length) {
    ElMessage.warning(t("client.orderAddons.selectOne"))
    return
  }
  if (totals.value.withTax < 0.01) {
    ElMessage.warning(t("client.orderAddons.minAmount"))
    return
  }
  const orderId = String(order.value?.orderId || "").trim()
  if (!orderId) {
    ElMessage.error(t("client.orderAddons.missing"))
    return
  }
  const ticket = requestSequence
  paying.value = true
  try {
    const result = await createOrderAddonPayment({
      orderId,
      paymentMethod: "stripe",
      attachItems: selectedLines.value.map((line) => ({
        attachValueId: line.id,
        quantity: line.quantity,
      })),
    })
    if (ticket !== requestSequence || String(order.value?.orderId || "").trim() !== orderId) return
    const clientSecret = String(result?.clientSecret || "").trim()
    if (!clientSecret) throw new Error(t("client.orderAddons.payFailed"))
    stripeClientSecret.value = clientSecret
    stripeCustomerSession.value = String(result?.customerSessionClientSecret || "").trim()
    reviewOpen.value = false
    stripeVisible.value = true
  } catch (error: any) {
    if (ticket !== requestSequence || String(order.value?.orderId || "").trim() !== orderId) return
    ElMessage.error(error?.message || t("client.orderAddons.payFailed"))
  } finally {
    paying.value = false
  }
}

const handleStripeClose = () => {
  if (paymentCompleted.value) return
  stripeVisible.value = false
  if (isCompact.value && selectedLines.value.length) {
    reviewOpen.value = true
    void nextTick(() => closeReviewButton.value?.focus?.())
  }
}

const handlePayError = (message: string) => {
  ElMessage.error(message || t("client.orderAddons.payFailed"))
}

const handlePaid = async () => {
  if (paymentCompleted.value || !stripeVisible.value || !order.value) return
  const ticket = requestSequence
  const orderId = String(order.value.orderId || "").trim()
  const orderNo = String(order.value.orderNo || "").trim()
  paymentCompleted.value = true
  stripeVisible.value = false
  reviewOpen.value = false
  ElMessage.success(t("client.orderAddons.paid"))
  clearPaidRedirect()
  paidRedirectTimer = window.setTimeout(() => {
    paidRedirectTimer = null
    if (ticket !== requestSequence || !paymentCompleted.value
      || String(order.value?.orderId || "").trim() !== orderId
      || String(order.value?.orderNo || "").trim() !== orderNo) return
    if (orderNo) {
      void router.replace({
        name: props.mobile ? "h5-order-detail" : "order-detail",
        params: { orderNo },
      })
      return
    }
    void router.replace({ name: props.mobile ? "h5-orders" : "order-list" })
  }, 900)
}

onMounted(() => {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    mediaQuery = window.matchMedia("(max-width: 800px)")
    updateViewport()
    mediaQuery.addEventListener("change", updateViewport)
  }
})
const updateViewport = () => { narrowViewport.value = mediaQuery?.matches || false }
watch(() => [route.query.orderId, route.query.orderNo], () => { void load() }, { immediate: true })
onBeforeUnmount(() => {
  ++requestSequence
  clearPaidRedirect()
  mediaQuery?.removeEventListener("change", updateViewport)
  restoreBodyScroll()
})
</script>

<style scoped lang="scss">
.order-addons { --addon-navy: #0d263f; --addon-mint: #13b79c; box-sizing: border-box; min-height: 100vh; padding: 34px 28px 64px; background: #faf9f6; color: var(--addon-navy); font-family: inherit; }
.order-addons *, .order-addons *::before, .order-addons *::after { box-sizing: border-box; }
.order-addons button, .order-addons input { font: inherit; }
.order-addons button { cursor: pointer; }
.order-addons button:disabled { cursor: default; opacity: .45; }
.order-addons button:focus-visible, .order-addons input:focus-visible { outline: 3px solid #9eddd0; outline-offset: 3px; }
.order-addons__shell { display: grid; grid-template-columns: minmax(0, 1fr) 310px; align-items: start; gap: 32px; max-width: 1180px; margin: 0 auto; }
.order-addons__main { min-width: 0; }
.order-addons__back { display: inline-flex; align-items: center; gap: 8px; padding: 0; border: 0; background: none; color: #657381; font-size: 13px !important; }
.order-addons__back > span { color: var(--addon-navy); font-size: 23px; line-height: 1; }
.order-addons__hero { margin: 26px 0 25px; }
.order-addons__hero h1 { margin: 0; color: var(--addon-navy); font-size: clamp(26px, 3vw, 36px); line-height: 1.3; letter-spacing: -.025em; font-weight: 750; }
.order-addons__hero p { margin: 9px 0 0; color: #74818b; font-size: 14px; line-height: 1.6; }
.order-addons__context { display: flex; align-items: center; gap: 13px; padding: 17px 18px; border: 1px solid #e3e6e7; border-radius: 13px; background: #fff; }
.order-addons__context-icon, .order-addons__option-icon { display: grid; flex: 0 0 48px; width: 48px; height: 48px; place-items: center; border-radius: 11px; background: #e6f7f1; color: #0d947e; }
.order-addons__context-icon svg, .order-addons__option-icon svg { width: 29px; height: 29px; }
.order-addons__context > div { flex: 1; min-width: 0; }
.order-addons__context h2 { margin: 0; color: var(--addon-navy); font-size: 16px; font-weight: 700; line-height: 1.4; }
.order-addons__context p { display: flex; flex-wrap: wrap; gap: 5px 12px; margin: 5px 0 0; color: #7d8790; font-size: 11px; line-height: 1.5; }
.order-addons__context .order-addons__paid { color: #548176; }
.order-addons__context small { display: block; margin-top: 4px; color: #8e989e; font-size: 10px; }
.order-addons__context > button { align-self: flex-start; padding: 4px; border: 0; background: none; color: #88949b; font-size: 19px; }
.order-addons__history { margin-top: -1px; overflow: hidden; border: 1px solid #e3e6e7; border-radius: 0 0 11px 11px; background: #fff; }
.order-addons__context:has(+ .order-addons__history) { border-radius: 13px 13px 0 0; }
.order-addons__history summary { display: flex; justify-content: space-between; gap: 8px; padding: 12px 18px; color: #65717d; font-size: 12px; list-style: none; cursor: pointer; }
.order-addons__history summary::-webkit-details-marker { display: none; }
.order-addons__history[open] summary span { transform: rotate(180deg); }
.order-addons__history ul { margin: 0; padding: 0 18px 12px; list-style: none; }
.order-addons__history li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 0; border-top: 1px solid #edf0ee; font-size: 12px; }
.order-addons__history b { font-weight: 600; }
.order-addons__history small { display: block; margin-top: 3px; color: #8a959e; font-size: 10px; }
.order-addons__history strong { flex-shrink: 0; font-size: 12px; }
.order-addons__steps { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 22px 0; padding: 0; list-style: none; color: #96a0a6; font-size: 11px; }
.order-addons__steps li + li::before { margin-right: 12px; color: #bdc5c8; content: '→'; }
.order-addons__steps .is-active { color: #4d6e65; font-weight: 600; }
.order-addons__module { margin: 24px 0 17px; }
.order-addons__module h2 { margin: 0; font-size: 18px; font-weight: 650; }
.order-addons__module p { margin: 7px 0 0; color: #8a959d; font-size: 12px; line-height: 1.5; }
.order-addons__filters { display: flex; align-items: center; flex-wrap: wrap; gap: 13px; margin: 18px 0; }
.order-addons__categories { display: flex; flex: 1; gap: 8px; min-width: 0; overflow-x: auto; padding: 2px; scrollbar-width: none; }
.order-addons__categories button { flex-shrink: 0; min-height: 35px; padding: 7px 14px; border: 1px solid #dbe1e3; border-radius: 22px; background: #fff; color: #63707c; font-size: 11px; line-height: 1.4; white-space: nowrap; }
.order-addons__categories .is-active { border-color: var(--addon-navy); background: var(--addon-navy); color: #fff; }
.order-addons__search { display: flex; flex: 0 0 190px; align-items: center; gap: 8px; min-width: 0; height: 35px; padding: 0 10px; border: 1px solid #dbe1e3; border-radius: 9px; background: #fff; color: #8c989f; }
.order-addons__search svg { flex-shrink: 0; width: 17px; height: 17px; }
.order-addons__search input { width: 100%; min-width: 0; padding: 0; border: 0; background: none; color: var(--addon-navy); font-size: 11px; }
.order-addons__search input:focus { outline: 0; }
.order-addons__catalog { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.order-addons__option { display: grid; grid-template-columns: 45px minmax(0, 1fr); align-items: start; gap: 9px 11px; min-width: 0; min-height: 151px; padding: 17px 15px; border: 1px solid #e0e5e5; border-radius: 13px; background: #fff; transition: border-color .15s, background-color .15s; }
.order-addons__option.is-selected { border-color: var(--addon-mint); background: #fcfffe; box-shadow: inset 0 0 0 .5px var(--addon-mint); }
.order-addons__option-icon { width: 45px; height: 45px; }
.order-addons__option-icon svg { width: 27px; height: 27px; }
.order-addons__option-copy { min-width: 0; }
.order-addons__option-copy > span { display: block; margin-bottom: 4px; color: #9aa3a7; font-size: 10px; line-height: 1.4; }
.order-addons__option h3 { margin: 0 0 9px; color: var(--addon-navy); font-size: 14px; font-weight: 650; line-height: 1.45; overflow-wrap: anywhere; }
.order-addons__option-copy strong { display: block; color: var(--addon-navy); font-size: 15px; font-weight: 700; line-height: 1.4; }
.order-addons__option-copy small { display: block; margin-top: 2px; color: #99a39f; font-size: 9px; }
.order-addons__add, .order-addons__stepper { grid-column: 2; justify-self: end; align-self: end; }
.order-addons__add { display: inline-flex; align-items: center; gap: 4px; min-height: 29px; padding: 3px 11px; border: 1px solid #83d6c4; border-radius: 8px; background: #fff; color: #159b82; font-size: 11px !important; }
.order-addons__add span { font-size: 16px; line-height: 1; }
.order-addons__stepper { display: inline-grid; grid-template-columns: 28px 28px 28px; align-items: center; overflow: hidden; border: 1px solid #bee7db; border-radius: 8px; background: #fff; }
.order-addons__stepper button, .order-addons__stepper output { display: grid; height: 28px; place-items: center; padding: 0; border: 0; background: transparent; color: #229c83; font-size: 14px; line-height: 1; }
.order-addons__stepper button { background: #f2fbf7; }
.order-addons__stepper output { color: var(--addon-navy); font-size: 11px; font-variant-numeric: tabular-nums; }
.order-addons__basket { position: sticky; top: 24px; margin-top: 62px; padding: 21px; border: 1px solid #e1e5e5; border-radius: 15px; background: #fff; outline: 0; }
.order-addons__basket > header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.order-addons__basket h2 { margin: 0; font-size: 19px; line-height: 1.3; font-weight: 700; }
.order-addons__basket header span { display: block; margin-top: 4px; color: #98a3a9; font-size: 10px; }
.order-addons__basket header > button { width: 29px; height: 29px; padding: 0; border: 0; border-radius: 50%; background: #f4f6f5; color: #75838a; font-size: 22px; line-height: 1; }
.order-addons__basket-empty { padding: 32px 8px; color: #8c9b9f; text-align: center; font-size: 12px; line-height: 1.6; }
.order-addons__basket-empty > span { display: grid; width: 40px; height: 40px; margin: 0 auto 10px; place-items: center; border-radius: 11px; background: #eff8f4; color: #8ecaba; font-size: 26px; }
.order-addons__basket-lines { max-height: 40vh; margin: 13px 0 0; padding: 0; overflow: auto; list-style: none; scrollbar-width: thin; }
.order-addons__basket-lines li { padding: 13px 0; border-bottom: 1px solid #edf0ef; }
.order-addons__basket-line-title, .order-addons__basket-line-bottom { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.order-addons__basket-line-title > b { min-width: 0; font-size: 12px; line-height: 1.5; font-weight: 600; }
.order-addons__basket-line-title > button { flex-shrink: 0; padding: 1px 3px; border: 0; background: none; color: #9ba8ab; font-size: 19px; line-height: 1; }
.order-addons__basket-line-bottom { margin-top: 10px; }
.order-addons__basket-line-bottom strong { font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.order-addons__summary { margin: 18px 0 0; }
.order-addons__summary > div { display: flex; justify-content: space-between; gap: 10px; padding: 7px 0; color: #849094; font-size: 12px; }
.order-addons__summary dt, .order-addons__summary dd { margin: 0; }
.order-addons__summary dd { color: #52616a; font-variant-numeric: tabular-nums; }
.order-addons__summary > .is-total { align-items: center; margin-top: 12px; padding: 18px 0 9px; border-top: 1px solid #e5e9e7; color: var(--addon-navy); font-size: 14px; font-weight: 650; }
.order-addons__summary .is-total dd { color: var(--addon-navy); font-size: 21px; font-weight: 750; }
.order-addons__rounding { display: block; margin-top: 7px; color: #a4acae; font-size: 9px; }
.order-addons__pay { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; min-height: 45px; margin-top: 19px; padding: 10px 16px; border: 0; border-radius: 10px; background: var(--addon-navy); color: #fff; font-size: 12px !important; font-weight: 600 !important; }
.order-addons__pay > span { font-size: 18px; }
.order-addons__additional-note { margin: 11px 0 0; color: #9aa4a8; font-size: 10px; line-height: 1.5; text-align: center; }
.order-addons__minimum { color: #a47c42; font-size: 11px; line-height: 1.5; }
.order-addons__state { padding: 35px 20px; border: 1px dashed #dee5e1; border-radius: 12px; background: #fff; color: #88959a; font-size: 13px; line-height: 1.6; text-align: center; }
.order-addons__state p { margin: 0; }
.order-addons__state-icon { display: grid; width: 44px; height: 44px; margin: 0 auto 12px; place-items: center; border-radius: 12px; background: #edf7f2; color: #70bca7; font-size: 28px; }
.order-addons__state button { min-height: 34px; margin-top: 15px; padding: 6px 13px; border: 0; border-radius: 8px; background: var(--addon-navy); color: #fff; font-size: 12px; }
.order-addons__mobile-basket, .order-addons__scrim, .order-addons__continue { display: none; }
@media (max-width: 1050px) { .order-addons__shell { grid-template-columns: minmax(0, 1fr) 285px; gap: 22px; }.order-addons__filters { align-items: stretch; }.order-addons__categories { flex-basis: 100%; }.order-addons__search { flex: 1; }.order-addons__option { padding: 15px 12px; } }
@mixin addon-mobile {
  padding: 20px 16px calc(110px + env(safe-area-inset-bottom));
  .order-addons__shell { display: block; max-width: 650px; }
  .order-addons__hero { margin: 22px 0; }.order-addons__hero h1 { font-size: 27px; }.order-addons__hero p { font-size: 12px; }
  .order-addons__context { padding: 13px; gap: 11px; }.order-addons__context h2 { font-size: 14px; }.order-addons__context p { font-size: 10px; }.order-addons__context-icon { flex-basis: 42px; width: 42px; height: 42px; }
  .order-addons__history summary { padding: 11px 14px; }.order-addons__steps { margin: 18px 0; font-size: 10px; gap: 9px; }.order-addons__steps li + li::before { margin-right: 9px; }
  .order-addons__module h2 { font-size: 16px; }.order-addons__module p { font-size: 11px; }.order-addons__filters { margin: 16px 0; }.order-addons__categories { flex-basis: 100%; gap: 7px; }.order-addons__categories button { min-height: 33px; padding: 6px 13px; font-size: 11px; }.order-addons__search { flex: 1; }
  .order-addons__catalog { grid-template-columns: minmax(0, 1fr); gap: 11px; }.order-addons__option { grid-template-columns: 47px minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 131px; padding: 16px 13px; }.order-addons__option-icon { align-self: start; width: 47px; height: 47px; }.order-addons__option h3 { margin-bottom: 7px; font-size: 14px; }.order-addons__option-copy strong { font-size: 15px; }.order-addons__add, .order-addons__stepper { grid-column: 3; grid-row: 1; align-self: end; }.order-addons__add { padding: 3px 9px; }.order-addons__option-copy small { font-size: 9px; }
  .order-addons__basket { display: none; position: fixed; inset: auto 0 0; z-index: 2001; width: min(100%, 600px); max-height: 88dvh; margin: 0 auto; padding: 22px 20px calc(18px + env(safe-area-inset-bottom)); overflow: auto; border-radius: 22px 22px 0 0; background: #fff; }.order-addons__basket.is-open { display: block; }.order-addons__basket h2 { font-size: 20px; }.order-addons__basket-lines { max-height: 38dvh; }.order-addons__basket-lines li { padding: 13px 0; }.order-addons__basket-line-title b { font-size: 13px; }.order-addons__basket-line-bottom strong { font-size: 14px; }.order-addons__summary .is-total dd { font-size: 23px; }.order-addons__pay { min-height: 48px; font-size: 13px !important; }
  .order-addons__scrim { display: block; position: fixed; inset: 0; z-index: 2000; width: 100%; height: 100%; padding: 0; border: 0; background: rgb(9 30 45 / 35%); backdrop-filter: blur(2px); }.order-addons__continue { display: block; margin: 15px auto 0; padding: 4px; border: 0; background: none; color: #7b8e96; font-size: 12px; }
  .order-addons__mobile-basket { display: flex; position: fixed; inset: auto 0 0; z-index: 100; align-items: center; gap: 11px; min-height: 86px; padding: 14px 18px calc(14px + env(safe-area-inset-bottom)); border-top: 1px solid #e5ebe7; border-radius: 18px 18px 0 0; background: rgb(255 255 255 / 97%); box-shadow: 0 -5px 24px rgb(13 38 63 / 5%); }.order-addons__mobile-basket > div:nth-child(2) { flex: 1; min-width: 0; }.order-addons__mobile-basket small { display: block; margin-bottom: 4px; color: #90a09f; font-size: 10px; }.order-addons__mobile-basket strong { color: var(--addon-navy); font-size: 19px; font-weight: 750; white-space: nowrap; }.order-addons__mobile-basket > button { min-height: 41px; padding: 9px 15px; border: 0; border-radius: 9px; background: var(--addon-navy); color: #fff; font-size: 11px; font-weight: 600; }.order-addons__basket-symbol { position: relative; display: grid; flex: 0 0 42px; height: 42px; place-items: center; border-radius: 50%; background: var(--addon-mint); color: #fff; }.order-addons__basket-symbol svg { width: 25px; height: 25px; }.order-addons__basket-symbol span { position: absolute; top: -5px; right: -2px; display: grid; min-width: 19px; height: 19px; padding: 0 3px; place-items: center; border: 2px solid white; border-radius: 50%; background: #0d947f; color: #fff; font-size: 9px; }
}
@media (max-width: 800px) { .order-addons { @include addon-mobile; } }
.order-addons--mobile { @include addon-mobile; }
@media (max-width: 380px) { .order-addons__option { grid-template-columns: 40px minmax(0, 1fr); gap: 8px 10px; }.order-addons__option-icon { width: 40px; height: 40px; }.order-addons__add, .order-addons__option > .order-addons__stepper { grid-column: 2; grid-row: auto; }.order-addons__mobile-basket { padding-inline: 13px; gap: 8px; }.order-addons__mobile-basket strong { font-size: 17px; }.order-addons__mobile-basket > button { padding-inline: 12px; } }
@media (prefers-reduced-motion: reduce) { .order-addons__option { transition: none; } }
</style>
