import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import * as Vue from 'vue'

const source = readFileSync(new URL('../src/modules/client/composables/usePromoCode.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
})

function loadPromoCode(quoteCoupon) {
  const exports = {}
  const modules = {
    vue: Vue,
    '@/modules/client/utils/promo-code': { quoteCoupon },
  }
  runInNewContext(outputText, {
    exports,
    require(name) {
      assert.ok(Object.hasOwn(modules, name), name)
      return modules[name]
    },
  })
  return exports.usePromoCode
}

const quote = { couponCode: 'SAVE10', discountAmount: 10, payableWithTax: 95 }
const booking = { spuId: 1, specValueIds: [11], attachItems: [] }

test('an in-flight voucher quote cannot apply after the booking options change', async () => {
  let finish
  let requests = 0
  const usePromoCode = loadPromoCode(() => {
    requests += 1
    return new Promise(resolve => { finish = resolve })
  })
  const signature = Vue.ref('service-1/spec-11')
  const promo = usePromoCode(() => signature.value)
  promo.code.value = 'save10'

  const verification = promo.apply(booking, 'en', 'Enter a voucher', 'Select options')
  assert.equal(await promo.apply(booking, 'en', 'Enter a voucher', 'Select options'), null)
  assert.equal(requests, 1)
  signature.value = 'service-1/spec-12'
  await Vue.nextTick()
  finish({ quote })

  assert.equal(await verification, null)
  assert.equal(promo.active.value, null)
  assert.equal(promo.dropped.value, true)
  assert.equal(promo.loading.value, false)
})

test('the verified voucher is active only for the submitted booking options', async () => {
  const usePromoCode = loadPromoCode(async () => ({ quote }))
  const signature = Vue.ref('service-1/spec-11')
  const promo = usePromoCode(() => signature.value)
  promo.code.value = 'save10'

  assert.equal(await promo.apply(booking, 'en', 'Enter a voucher', 'Select options'), quote)
  assert.equal(promo.active.value?.couponCode, 'SAVE10')
  signature.value = 'service-1/spec-11/add-on-31'
  await Vue.nextTick()
  assert.equal(promo.active.value, null)
  assert.equal(promo.dropped.value, true)
})
