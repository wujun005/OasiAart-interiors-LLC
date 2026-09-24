<template>
  <section class="saved-payments">
    <header class="saved-payments__header">
      <div>
        <h3>{{ copy.title }}</h3>
        <p>{{ copy.description }}</p>
      </div>
      <button
        class="saved-payments__add"
        type="button"
        :disabled="loading || adding || initializing || !!busyId"
        @click="openAddDialog"
      >
        <span aria-hidden="true">＋</span>{{ copy.add }}
      </button>
    </header>
    <p v-if="feedback" class="saved-payments__feedback" aria-live="polite">
      {{ feedback }}
    </p>

    <div v-if="loading" class="saved-payments__state" aria-live="polite">
      <span class="saved-payments__spinner" />{{ copy.loading }}
    </div>
    <div
      v-else-if="loadError"
      class="saved-payments__state saved-payments__state--error"
    >
      <span>{{ loadError }}</span>
      <button type="button" @click="loadMethods">{{ copy.retry }}</button>
    </div>
    <div v-else-if="!methods.length" class="saved-payments__empty">
      <span class="saved-payments__empty-icon" aria-hidden="true">▭</span>
      <strong>{{ copy.empty }}</strong>
      <p>{{ copy.emptyHint }}</p>
    </div>
    <ul v-else class="saved-payments__list">
      <li
        v-for="method in methods"
        :key="method.paymentMethodId"
        class="saved-payments__card"
      >
        <div
          class="saved-payments__brand"
          :data-brand="normalizeBrand(method.brand)"
        >
          {{ brandLabel(method.brand) }}
        </div>
        <div class="saved-payments__card-copy">
          <div>
            <strong>•••• {{ method.last4 || "••••" }}</strong>
            <span v-if="method.isDefault" class="saved-payments__default">{{
              copy.default
            }}</span>
          </div>
          <small
            >{{ copy.expires }}
            {{ formatExpiry(method.expMonth, method.expYear) }}</small
          >
          <small
            :class="{
              'saved-payments__consent-needed':
                method.allowRedisplay !== 'always',
            }"
          >
            {{
              method.allowRedisplay === "always"
                ? copy.checkoutReady
                : copy.consentNeeded
            }}
          </small>
        </div>
        <div class="saved-payments__actions">
          <button
            v-if="method.allowRedisplay !== 'always'"
            type="button"
            :disabled="!!busyId"
            @click="enableReuse(method)"
          >
            {{ copy.enableReuse }}
          </button>
          <button
            v-if="!method.isDefault"
            type="button"
            :disabled="!!busyId"
            @click="makeDefault(method)"
          >
            {{ copy.makeDefault }}
          </button>
          <button
            class="saved-payments__remove"
            type="button"
            :disabled="!!busyId"
            @click="removeMethod(method)"
          >
            {{
              busyId === method.paymentMethodId ? copy.processing : copy.remove
            }}
          </button>
        </div>
      </li>
    </ul>

    <Teleport to="body">
      <div
        v-if="dialogVisible"
        class="saved-payment-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="copy.addTitle"
      >
        <button
          class="saved-payment-dialog__backdrop"
          type="button"
          :aria-label="copy.close"
          @click="closeDialog"
        />
        <section class="saved-payment-dialog__panel">
          <header>
            <div>
              <span>HOURX HOME</span>
              <h3>{{ copy.addTitle }}</h3>
            </div>
            <button
              type="button"
              :disabled="adding"
              :aria-label="copy.close"
              @click="closeDialog"
            >
              ×
            </button>
          </header>
          <p>{{ copy.secureHint }}</p>
          <div v-if="initializing" class="saved-payment-dialog__loading">
            <span class="saved-payments__spinner" />{{ copy.loadingForm }}
          </div>
          <div ref="paymentElementRef" class="saved-payment-dialog__element" />
          <label class="saved-payment-dialog__consent">
            <input
              v-model="saveConsent"
              type="checkbox"
              :disabled="initializing || adding"
            />
            <span>{{ copy.saveConsent }}</span>
          </label>
          <p v-if="formError" class="saved-payment-dialog__error" role="alert">
            {{ formError }}
          </p>
          <button
            class="saved-payment-dialog__submit"
            type="button"
            :disabled="initializing || adding || !formReady || !saveConsent"
            @click="saveMethod"
          >
            {{ adding ? copy.saving : copy.save }}
          </button>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import {
  createStripeSetupIntent,
  deleteSavedPaymentMethod,
  enableSavedPaymentMethodRedisplay,
  getSavedPaymentMethods,
  setDefaultSavedPaymentMethod,
  type SavedPaymentMethodRecord,
} from "@/modules/client/api"

const { locale } = useI18n({ useScope: "global" })
const methods = ref<SavedPaymentMethodRecord[]>([])
const loading = ref(false)
const loadError = ref("")
const busyId = ref("")
const dialogVisible = ref(false)
const initializing = ref(false)
const adding = ref(false)
const saveConsent = ref(false)
const formReady = ref(false)
const formError = ref("")
const feedback = ref("")
const paymentElementRef = ref<HTMLElement | null>(null)

let stripe: any = null
let elements: any = null
let paymentElement: any = null

const copy = computed(() =>
  locale.value === "zh"
    ? {
        title: "已保存的支付方式",
        description: "使用 Stripe 安全保存银行卡，结账时可直接选择。",
        add: "添加支付方式",
        loading: "正在加载支付方式…",
        retry: "重试",
        empty: "暂无已保存的支付方式",
        emptyHint: "添加银行卡后，下次付款会更快捷。",
        default: "默认",
        expires: "有效期",
        makeDefault: "设为默认",
        remove: "删除",
        processing: "处理中…",
        addTitle: "添加支付方式",
        close: "关闭",
        secureHint:
          "银行卡信息由 Stripe 安全处理，HourX 不会保存完整卡号或安全码。",
        loadingForm: "正在加载安全表单…",
        save: "保存支付方式",
        saving: "保存中…",
        loadFailed: "支付方式加载失败，请稍后重试。",
        setupFailed: "无法加载添加银行卡表单。",
        saveSuccess: "支付方式已保存。",
        saveFailed: "支付方式保存失败。",
        defaultSuccess: "默认支付方式已更新。",
        actionFailed: "操作失败，请稍后重试。",
        removeConfirm: "确定删除尾号为 {last4} 的支付方式吗？",
        saveConsent:
          "我同意由 Stripe 保存此卡，并在我今后主动结账时展示和使用。我可以随时在此删除此卡；本次保存不会扣款。",
        consentRequired: "请先同意保存此卡并用于后续结账。",
        consentNeeded: "需授权后才能在结账时选择",
        checkoutReady: "可在结账时选择",
        enableReuse: "启用结账使用",
        reuseConfirm:
          "是否同意由 Stripe 保存尾号为 {last4} 的银行卡，并在你今后主动结账时展示和使用？你可以随时在此删除此卡。本次授权不会扣款。",
        reuseSuccess: "已授权。下次打开付款窗口时可选择此卡。",
        savePending: "银行卡验证尚未完成，请完成验证后再试。",
      }
    : {
        title: "Saved payment methods",
        description:
          "Save cards securely with Stripe and select them at checkout.",
        add: "Add payment method",
        loading: "Loading payment methods…",
        retry: "Retry",
        empty: "No saved payment methods",
        emptyHint: "Add a card for a faster checkout next time.",
        default: "Default",
        expires: "Expires",
        makeDefault: "Make default",
        remove: "Remove",
        processing: "Processing…",
        addTitle: "Add payment method",
        close: "Close",
        secureHint:
          "Card details are securely handled by Stripe. HourX never stores your full card number or security code.",
        loadingForm: "Loading secure form…",
        save: "Save payment method",
        saving: "Saving…",
        loadFailed: "Unable to load payment methods. Please try again.",
        setupFailed: "Unable to load the card form.",
        saveSuccess: "Payment method saved.",
        saveFailed: "Unable to save payment method.",
        defaultSuccess: "Default payment method updated.",
        actionFailed: "Unable to complete this action.",
        removeConfirm: "Remove the payment method ending in {last4}?",
        saveConsent:
          "I agree to save this card with Stripe and display and use it when I choose to check out in the future. I can remove it here at any time. Saving it will not charge me.",
        consentRequired: "Please agree to save this card for future checkouts.",
        consentNeeded: "Consent required to select at checkout",
        checkoutReady: "Available at checkout",
        enableReuse: "Enable for checkout",
        reuseConfirm:
          "Do you agree to save the card ending in {last4} with Stripe and display and use it when you choose to check out in the future? You can remove it here at any time. This consent will not charge you.",
        reuseSuccess:
          "Card enabled. You can select it next time you open checkout.",
        savePending:
          "Card verification is not complete. Please complete verification and try again.",
      },
)

const notify = (message: string) => {
  feedback.value = message
  window.setTimeout(() => {
    if (feedback.value === message) feedback.value = ""
  }, 3200)
}

const loadMethods = async () => {
  loading.value = true
  loadError.value = ""
  try {
    methods.value = await getSavedPaymentMethods()
  } catch (error: any) {
    loadError.value = String(error?.message || copy.value.loadFailed)
  } finally {
    loading.value = false
  }
}

const loadStripeJs = async () => {
  if (typeof (window as any).Stripe === "function") return
  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      "hourx-stripe-js",
    ) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Stripe.js")),
        { once: true },
      )
      return
    }
    const script = document.createElement("script")
    script.id = "hourx-stripe-js"
    script.src = "https://js.stripe.com/v3/"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Stripe.js"))
    document.head.appendChild(script)
  })
}

const destroyStripe = () => {
  formReady.value = false
  try {
    paymentElement?.destroy?.()
  } catch {
    /* Stripe element may already be detached. */
  }
  paymentElement = null
  elements = null
  stripe = null
}

const openAddDialog = async () => {
  if (dialogVisible.value || initializing.value || adding.value || busyId.value)
    return
  saveConsent.value = false
  dialogVisible.value = true
  initializing.value = true
  formError.value = ""
  destroyStripe()
  try {
    const setupIntent = await createStripeSetupIntent()
    const clientSecret = String(setupIntent?.clientSecret || "").trim()
    if (!clientSecret) throw new Error(copy.value.setupFailed)
    await loadStripeJs()
    if (!dialogVisible.value) return
    const publishableKey = String(
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
    ).trim()
    if (!publishableKey)
      throw new Error(
        locale.value === "zh"
          ? "Stripe 公钥未配置。"
          : "Stripe publishable key is not configured.",
      )
    stripe = (window as any).Stripe(publishableKey, {
      locale: locale.value.startsWith("zh") ? "zh" : "en",
    })
    elements = stripe.elements({
      clientSecret,
      appearance: { theme: "stripe" },
    })
    paymentElement = elements.create("payment", { layout: "tabs" })
    await nextTick()
    if (!paymentElementRef.value) throw new Error(copy.value.setupFailed)
    paymentElement.mount(paymentElementRef.value)
    formReady.value = true
  } catch (error: any) {
    formError.value = String(error?.message || copy.value.setupFailed)
  } finally {
    initializing.value = false
  }
}

const closeDialog = () => {
  if (adding.value) return
  dialogVisible.value = false
  saveConsent.value = false
  destroyStripe()
}

const saveMethod = async () => {
  if (
    !stripe ||
    !elements ||
    !formReady.value ||
    initializing.value ||
    adding.value
  )
    return
  if (!saveConsent.value) {
    formError.value = copy.value.consentRequired
    return
  }
  adding.value = true
  formError.value = ""
  try {
    const result = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
        // 自定义授权复选框已由用户勾选，明确设置后续结账展示权限。
        payment_method_data: { allow_redisplay: "always" },
      },
      redirect: "if_required",
    })
    if (result?.error)
      throw new Error(result.error.message || copy.value.saveFailed)
    if (result?.setupIntent?.status !== "succeeded")
      throw new Error(copy.value.savePending)
    dialogVisible.value = false
    saveConsent.value = false
    destroyStripe()
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    await loadMethods()
    notify(copy.value.saveSuccess)
  } catch (error: any) {
    formError.value = String(error?.message || copy.value.saveFailed)
  } finally {
    adding.value = false
  }
}

const enableReuse = async (method: SavedPaymentMethodRecord) => {
  if (busyId.value || method.allowRedisplay === "always") return
  const consent = window.confirm(
    copy.value.reuseConfirm.replace("{last4}", method.last4 || "••••"),
  )
  if (!consent) return
  busyId.value = method.paymentMethodId
  try {
    await enableSavedPaymentMethodRedisplay(method.paymentMethodId, consent)
    await loadMethods()
    notify(copy.value.reuseSuccess)
  } catch (error: any) {
    notify(String(error?.message || copy.value.actionFailed))
  } finally {
    busyId.value = ""
  }
}

const makeDefault = async (method: SavedPaymentMethodRecord) => {
  if (busyId.value) return
  busyId.value = method.paymentMethodId
  try {
    await setDefaultSavedPaymentMethod(method.paymentMethodId)
    await loadMethods()
    notify(copy.value.defaultSuccess)
  } catch (error: any) {
    notify(String(error?.message || copy.value.actionFailed))
  } finally {
    busyId.value = ""
  }
}

const removeMethod = async (method: SavedPaymentMethodRecord) => {
  if (busyId.value) return
  const message = copy.value.removeConfirm.replace(
    "{last4}",
    method.last4 || "••••",
  )
  if (!window.confirm(message)) return
  busyId.value = method.paymentMethodId
  try {
    await deleteSavedPaymentMethod(method.paymentMethodId)
    await loadMethods()
  } catch (error: any) {
    notify(String(error?.message || copy.value.actionFailed))
  } finally {
    busyId.value = ""
  }
}

const normalizeBrand = (brand?: string) => String(brand || "card").toLowerCase()
const brandLabel = (brand?: string) => {
  const value = normalizeBrand(brand)
  const labels: Record<string, string> = {
    visa: "VISA",
    mastercard: "Mastercard",
    amex: "AMEX",
    unionpay: "UnionPay",
  }
  return (
    labels[value] ||
    value.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())
  )
}
const formatExpiry = (month?: number, year?: number) => {
  if (!month || !year) return "—"
  return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`
}

onMounted(loadMethods)
onBeforeUnmount(destroyStripe)
</script>

<style scoped>
.saved-payments {
  color: #0f2138;
}
.saved-payments__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}
.saved-payments__header h3 {
  margin: 0;
  font-size: 19px;
}
.saved-payments__header p {
  margin: 7px 0 0;
  color: #6b7a8e;
  font-size: 13px;
  line-height: 1.5;
}
.saved-payments__add {
  display: inline-flex;
  min-height: 42px;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  border: 0;
  border-radius: 12px;
  background: #1769c2;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}
.saved-payments__add:disabled,
.saved-payments__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.saved-payments__feedback {
  margin: -7px 0 14px;
  padding: 9px 12px;
  border-radius: 10px;
  background: #edf8f1;
  color: #147d45;
  font-size: 13px;
}
.saved-payments__state,
.saved-payments__empty {
  display: flex;
  min-height: 130px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px dashed #dce4ee;
  border-radius: 16px;
  color: #6b7a8e;
}
.saved-payments__state--error {
  flex-direction: column;
  color: #b42318;
  text-align: center;
}
.saved-payments__state button {
  border: 0;
  background: transparent;
  color: #1769c2;
  font-weight: 800;
  cursor: pointer;
}
.saved-payments__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #d7e1ec;
  border-top-color: #1769c2;
  border-radius: 50%;
  animation: saved-payments-spin 0.7s linear infinite;
}
.saved-payments__empty {
  flex-direction: column;
  padding: 24px;
  text-align: center;
}
.saved-payments__empty p {
  margin: 0;
  font-size: 13px;
}
.saved-payments__empty-icon {
  display: grid;
  width: 42px;
  height: 30px;
  place-items: center;
  border: 2px solid #b5c2d1;
  border-radius: 7px;
  font-size: 0;
}
.saved-payments__empty-icon::after {
  width: 24px;
  height: 3px;
  background: #b5c2d1;
  content: "";
}
.saved-payments__list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.saved-payments__card {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 17px;
  border: 1px solid #e1e8f0;
  border-radius: 16px;
  background: #fff;
}
.saved-payments__brand {
  color: #1a3f8b;
  font-size: 13px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 0.02em;
}
.saved-payments__brand[data-brand="mastercard"] {
  color: #bd2431;
}
.saved-payments__brand[data-brand="amex"] {
  color: #1479be;
}
.saved-payments__card-copy > div {
  display: flex;
  align-items: center;
  gap: 9px;
}
.saved-payments__card-copy strong {
  font-size: 15px;
  letter-spacing: 0.04em;
}
.saved-payments__card-copy small {
  display: block;
  margin-top: 5px;
  color: #738196;
}
.saved-payments__default {
  padding: 3px 7px;
  border-radius: 999px;
  background: #e9f7ef;
  color: #147d45;
  font-size: 10px;
  font-weight: 800;
}
.saved-payments__card-copy .saved-payments__consent-needed {
  color: #9a6700;
}
.saved-payments__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}
.saved-payments__actions button {
  padding: 7px 9px;
  border: 0;
  background: transparent;
  color: #1769c2;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.saved-payments__actions .saved-payments__remove {
  color: #bf2f3b;
}
.saved-payment-dialog {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: grid;
  place-items: center;
  padding: 16px;
}
.saved-payment-dialog__backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  border: 0;
  background: rgb(5 21 43 / 56%);
}
.saved-payment-dialog__panel {
  position: relative;
  width: min(540px, 100%);
  max-height: calc(100dvh - 32px);
  overflow: auto;
  padding: 24px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 24px 80px rgb(5 21 43 / 28%);
}
.saved-payment-dialog__panel header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.saved-payment-dialog__panel header span {
  color: #1769c2;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.16em;
}
.saved-payment-dialog__panel h3 {
  margin: 5px 0 0;
  color: #05152b;
  font-size: 23px;
}
.saved-payment-dialog__panel header button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: #f1f5f9;
  color: #475569;
  font-size: 22px;
  cursor: pointer;
}
.saved-payment-dialog__panel > p {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}
.saved-payment-dialog__loading {
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: #64748b;
}
.saved-payment-dialog__element {
  min-height: 150px;
  margin: 18px 0;
}
.saved-payment-dialog__consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
  cursor: pointer;
}
.saved-payment-dialog__consent input {
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  margin: 2px 0 0;
  accent-color: #1769c2;
}
.saved-payment-dialog__error {
  color: #c62828 !important;
}
.saved-payment-dialog__submit {
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 14px;
  background: #05152b;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}
.saved-payment-dialog__submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
@keyframes saved-payments-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 640px) {
  .saved-payments__header {
    align-items: stretch;
    flex-direction: column;
  }
  .saved-payments__add {
    justify-content: center;
  }
  .saved-payments__card {
    grid-template-columns: 70px minmax(0, 1fr);
    gap: 12px;
  }
  .saved-payments__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
    border-top: 1px solid #edf1f5;
    padding-top: 9px;
  }
  .saved-payment-dialog {
    align-items: end;
    padding: 0;
  }
  .saved-payment-dialog__panel {
    width: 100%;
    max-height: calc(100dvh - 10px);
    padding: 22px 18px calc(20px + env(safe-area-inset-bottom));
    border-radius: 24px 24px 0 0;
  }
}
</style>
