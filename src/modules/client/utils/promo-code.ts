import { verifyCoupon, type CouponVerifyResult, type PackageSkuSelection } from '@/modules/client/api'

export interface CouponQuote {
  couponCode: string
  discountAmount: number
  payableWithoutTax: number
  payableTax: number
  payableWithTax: number
}

export interface CouponVerifyBody {
  couponCode?: string
  spuId?: number | string
  specValueIds?: Array<number | string>
  attachItems?: Array<{ attachValueId: number | string; quantity: number }>
  packageId?: number | string
  selections?: PackageSkuSelection[]
}

const money = (value: unknown) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

export const couponRejectText = (
  result: Pick<CouponVerifyResult, 'message' | 'messageI18n'> | null | undefined,
  locale: string,
) => {
  const map = result?.messageI18n
  if (map) {
    if (locale.toLowerCase().startsWith('zh')) {
      return map.zh || map['zh-CN'] || map.en || result?.message || ''
    }
    return map.en || map.zh || result?.message || ''
  }
  return result?.message || ''
}

export async function quoteCoupon(body: CouponVerifyBody, locale: string) {
  const couponCode = String(body.couponCode || '').trim()
  const result = await verifyCoupon({ ...body, couponCode })
  if (!result?.usable) {
    const fallback = locale.toLowerCase().startsWith('zh')
      ? '券码无法使用'
      : 'This coupon code cannot be used'
    return { quote: null as CouponQuote | null, message: couponRejectText(result, locale) || fallback }
  }
  return {
    quote: {
      couponCode: String(result.couponCode || couponCode).trim(),
      discountAmount: money(result.discountAmount),
      payableWithoutTax: money(result.payableWithoutTax),
      payableTax: money(result.payableTax),
      payableWithTax: money(result.payableWithTax),
    } satisfies CouponQuote,
    message: '',
  }
}

export function cartItemCouponBody(item: {
  packageId?: string
  spuId?: string
  skuDetail?: {
    specValueIds?: Array<number | string>
    attachItems?: Array<{ attachValueId: number | string; quantity: number }>
  }
  packageSelections?: PackageSkuSelection[]
}): CouponVerifyBody | null {
  if (item.packageId) {
    return {
      packageId: item.packageId,
      selections: item.packageSelections || [],
    }
  }
  if (!item.spuId) return null
  return {
    spuId: item.spuId,
    specValueIds: item.skuDetail?.specValueIds || [],
    attachItems: item.skuDetail?.attachItems || [],
  }
}
