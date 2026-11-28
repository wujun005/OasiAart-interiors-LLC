import { computed, ref, watch } from 'vue'
import { quoteCoupon, type CouponQuote, type CouponVerifyBody } from '@/modules/client/utils/promo-code'

export function usePromoCode(signature: () => string) {
  const pendingCoupon = typeof sessionStorage === 'undefined'
    ? ''
    : (sessionStorage.getItem('hourx.pendingCoupon') || '')
  if (pendingCoupon) sessionStorage.removeItem('hourx.pendingCoupon')
  const code = ref(pendingCoupon)
  const loading = ref(false)
  const error = ref('')
  const quote = ref<CouponQuote | null>(null)
  const signed = ref('')
  const dropped = ref(false)

  const active = computed(() => (
    quote.value && signed.value === signature() ? quote.value : null
  ))

  watch(() => signature(), (next) => {
    if (!quote.value || next === signed.value) return
    quote.value = null
    signed.value = ''
    code.value = ''
    error.value = ''
    dropped.value = true
  })

  const reset = () => {
    code.value = ''
    loading.value = false
    error.value = ''
    quote.value = null
    signed.value = ''
    dropped.value = false
  }

  const apply = async (
    body: CouponVerifyBody | null,
    locale: string,
    emptyText: string,
    invalidText: string,
  ) => {
    if (loading.value) return null
    const couponCode = code.value.trim()
    error.value = ''
    dropped.value = false
    if (!couponCode) {
      quote.value = null
      signed.value = ''
      error.value = emptyText
      return null
    }
    if (!body) {
      error.value = invalidText
      return null
    }
    const requestedSignature = signature()
    loading.value = true
    try {
      const result = await quoteCoupon({ ...body, couponCode }, locale)
      if (requestedSignature !== signature()) {
        dropped.value = true
        return null
      }
      if (!result.quote) {
        quote.value = null
        signed.value = ''
        error.value = result.message
        return null
      }
      quote.value = result.quote
      signed.value = requestedSignature
      code.value = result.quote.couponCode
      return result.quote
    } catch (caught) {
      if (requestedSignature !== signature()) return null
      quote.value = null
      signed.value = ''
      const message = caught && typeof caught === 'object' && 'message' in caught
        ? String((caught as { message?: unknown }).message || '')
        : ''
      error.value = message || (locale.toLowerCase().startsWith('zh')
        ? '券码无法使用'
        : 'This coupon code cannot be used')
      return null
    } finally {
      loading.value = false
    }
  }

  return { code, loading, error, quote, signed, dropped, active, apply, reset }
}
