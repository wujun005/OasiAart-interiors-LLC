<template>
  <div class="h5-detail-page h5-package-detail-page">
    <header class="h5-detail-topbar">
      <button
        class="h5-detail-topbar__back"
        type="button"
        :aria-label="t('client.home.packages.detailBack')"
        @click="emit('back')"
      >
        <van-icon name="arrow-left" />
      </button>
      <h1>{{ t('client.productDetail.pageTitle') }}</h1>
      <button
        class="h5-detail-topbar__cart"
        type="button"
        :aria-label="t('client.header.nav.cart')"
        @click="emit('cart')"
      >
        <van-icon name="cart-o" />
        <span v-if="cartCount">{{ cartCount > 99 ? '99+' : cartCount }}</span>
      </button>
    </header>

    <main class="h5-detail-main">
      <section v-if="loading || missing || !view" class="h5-detail-card h5-package-state" :aria-busy="loading">
        <p role="status">
          {{ t(loading ? 'client.productDetail.loading' : 'client.home.packages.unavailable') }}
        </p>
      </section>

      <template v-else>
        <section class="h5-detail-gallery">
          <van-swipe
            v-if="view.images.length"
            ref="swipeRef"
            class="h5-detail-gallery__swipe"
            :autoplay="view.images.length > 1 ? 3000 : 0"
            :initial-swipe="selectedImageIndex"
            lazy-render
            :show-indicators="false"
            @change="emit('image-change', $event)"
          >
            <van-swipe-item v-for="(image, index) in view.images" :key="`${image}-${index}`">
              <img :src="image" :alt="view.title" />
            </van-swipe-item>
          </van-swipe>
          <div v-else class="h5-package-gallery-empty" aria-hidden="true">{{ view.mark }}</div>
          <div v-if="view.images.length > 1" class="h5-detail-gallery__dots" aria-hidden="true">
            <span
              v-for="(image, index) in view.images"
              :key="`dot-${index}`"
              :class="{ 'h5-detail-gallery__dot--active': index === selectedImageIndex }"
            />
          </div>
        </section>

        <section class="h5-detail-card h5-detail-card--summary">
          <div class="h5-detail-card__title-row">
            <h2>{{ view.title }}</h2>
            <strong>{{ formatAed(view.saleAmount) }}</strong>
          </div>
          <div class="h5-package-price-meta">
            <span>{{ t('client.home.packages.dealPrice') }}</span>
            <del v-if="view.original">
              {{ t('client.home.packages.originalPrice') }} AED {{ view.original }}
            </del>
            <strong v-if="view.save">{{ view.save }}</strong>
          </div>
          <div v-if="!priceReady" class="package-price-status" :class="{ 'is-error': !!priceError }" :aria-busy="priceLoading" role="status">
            <span>{{ priceLoading ? t('client.home.packages.priceLoading') : priceError || t('client.home.packages.chooseSkuRequired') }}</span>
            <button v-if="priceError" type="button" @click="emit('retry-price')">{{ t('client.home.packages.retryPrice') }}</button>
          </div>
          <div v-if="view.tags.length" class="biz-tags">
            <span v-for="tag in view.tags" :key="tag">{{ tag }}</span>
          </div>
          <div v-if="view.visits || view.validDays || view.perVisit" class="h5-detail-card__meta-row">
            <span v-if="view.visits">{{ view.visits }}</span>
            <span v-if="view.visits && view.validDays" class="h5-detail-card__meta-separator" />
            <span v-if="view.validDays">{{ view.validDays }}</span>
            <span v-if="view.perVisit">{{ view.perVisit }}</span>
          </div>
          <div class="h5-detail-card__divider" />
          <div class="h5-detail-card__section">
            <h3>{{ t('client.productDetail.serviceDescription') }}</h3>
            <div v-if="view.descHtml" class="h5-detail-html" v-html="view.descHtml" />
            <p v-else class="h5-detail-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
          </div>
        </section>

        <section class="h5-detail-card">
          <div class="h5-detail-card__heading">
            <span />
            <h3>{{ t('client.home.packages.included') }}</h3>
          </div>
          <PackageSharedSpecs
            v-if="view.hasSharedSpecs"
            :groups="view.sharedGroups"
            :separate="view.separateSpecs"
            :disabled="selectionLocked"
            @select="(typeKey, valueKey) => emit('select-shared-spec', typeKey, valueKey)"
            @toggle-separate="emit('toggle-separate-specs')"
          />
          <div v-if="view.items.length" class="h5-attach-list h5-package-service-list">
            <div v-for="item in view.items" :key="item.id" class="h5-attach-item">
              <div class="h5-attach-item__meta">
                <strong>{{ item.name }}</strong>
                <span v-if="item.sharedSummary" class="package-shared-applied">{{ t('client.home.packages.sharedApplied', { specs: item.sharedSummary }) }}</span>
                <span v-else-if="item.spec && !item.groups.length">{{ item.spec }}</span>
                <div v-if="item.groups.length" class="package-sku-groups">
                  <div v-for="group in item.groups" :key="group.id" class="package-sku-group">
                    <p class="package-sku-group__label">{{ group.label }}</p>
                    <div class="package-sku-options" role="radiogroup" :aria-label="group.label">
                      <button
                        v-for="option in group.options"
                        :key="option.id"
                        type="button"
                        class="package-sku-option"
                        :class="{ 'is-selected': group.selectedId === option.id }"
                        :aria-pressed="group.selectedId === option.id"
                        :disabled="selectionLocked || option.disabled"
                        @click="emit('select-spec', item.id, group.id, option.id)"
                      >{{ option.label }}</button>
                    </div>
                  </div>
                </div>
              </div>
              <strong class="h5-package-service-times">{{ item.times }}</strong>
            </div>
          </div>
          <p v-else class="h5-detail-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
        </section>

        <section class="h5-detail-card">
          <div class="h5-detail-card__heading">
            <span />
            <h3>{{ t('client.productDetail.includesTitle') }}</h3>
          </div>
          <div v-if="view.aboutHtml" class="h5-detail-html" v-html="view.aboutHtml" />
          <p v-else class="h5-detail-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
        </section>

        <section class="h5-detail-card">
          <div class="h5-detail-card__heading">
            <span />
            <h3>{{ t('client.productDetail.noticeTitle') }}</h3>
          </div>
          <div v-if="view.noticeHtml" class="h5-detail-html" v-html="view.noticeHtml" />
          <p v-else class="h5-detail-card__empty">{{ t('client.productDetail.emptyDesc') }}</p>
        </section>

        <section class="h5-detail-card">
          <div class="h5-detail-card__review-head">
            <div class="h5-detail-card__heading h5-detail-card__heading--compact">
              <span />
              <h3>{{ t('client.productDetail.reviewsTitle') }}</h3>
            </div>
          </div>
          <p class="h5-detail-card__empty">{{ t('client.productDetail.emptyReviews') }}</p>
        </section>

        <section class="h5-detail-card">
          <div class="h5-detail-card__heading">
            <span />
            <h3>{{ t('client.productDetail.booking.summaryTitle') }}</h3>
          </div>
          <p class="h5-package-booking-note">{{ t('client.home.packages.visitLater') }}</p>
          <dl class="h5-package-price-breakdown">
            <div>
              <dt>{{ t('client.productDetail.booking.subtotal') }}</dt>
              <dd>{{ formatAed(view.saleAmount) }}</dd>
            </div>
            <div>
              <dt>{{ t('client.productDetail.booking.vat') }}</dt>
              <dd>{{ formatAed(view.vat) }}</dd>
            </div>
            <div class="h5-package-price-breakdown__total">
              <dt>{{ t('client.productDetail.booking.total') }}</dt>
              <dd>{{ formatAed(view.total) }}</dd>
            </div>
          </dl>
        </section>
      </template>
    </main>

    <footer class="h5-detail-bottom">
      <div class="h5-detail-bottom__summary">
        <div>
          <span>{{ t('client.productDetail.booking.total') }}</span>
          <strong>{{ purchasable && view ? formatAed(view.total) : '—' }}</strong>
        </div>
      </div>
      <div class="h5-detail-bottom__actions">
        <button
          class="h5-detail-bottom__cart"
          type="button"
          :disabled="!purchasable || busy"
          @click="purchasable && !busy && emit('add-to-cart')"
        >
          <van-icon name="cart-o" />
          <span>{{ t('client.productDetail.booking.addToCart') }}</span>
        </button>
        <button
          class="h5-detail-bottom__submit"
          type="button"
          :disabled="!purchasable || busy"
          @click="purchasable && !busy && emit('checkout')"
        >
          {{ t(priceLoading ? 'client.home.packages.priceLoading' : busy ? 'client.profile.actions.submitting' : 'client.productDetail.booking.bookNow') }}
        </button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import type { SharedSpecGroup } from '@/modules/client/utils/package-shared-specs'

export interface PackageDetailView {
  title: string
  tags: string[]
  mark: string
  category: string
  visits: string
  descHtml: string
  aboutHtml: string
  noticeHtml: string
  saleAmount: number | null
  original: string
  perVisit: string
  save: string
  validDays: string
  vat: number | null
  total: number | null
  images: string[]
  hasSharedSpecs: boolean
  separateSpecs: boolean
  sharedGroups: Array<SharedSpecGroup & { serviceNames: string }>
  items: Array<{
    id: string
    name: string
    spec: string
    times: string
    sharedSummary: string
    selectionSummary: string
    groups: Array<{
      id: string
      label: string
      selectedId: string
      options: Array<{ id: string; label: string; disabled: boolean }>
    }>
    selectedSkuId: string
  }>
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon as VanIcon, Swipe as VanSwipe, SwipeItem as VanSwipeItem, type SwipeInstance } from 'vant'
import PackageSharedSpecs from '@/modules/client/components/PackageSharedSpecs.vue'

const props = defineProps<{
  view: PackageDetailView | null
  loading: boolean
  missing: boolean
  busy: boolean
  priceReady: boolean
  priceLoading: boolean
  priceError: string
  selectionLocked: boolean
  selectedImageIndex: number
  cartCount: number
}>()

const emit = defineEmits<{
  back: []
  cart: []
  'image-change': [index: number]
  'add-to-cart': []
  checkout: []
  'select-spec': [itemId: string, typeKey: string, valueKey: string]
  'retry-price': []
  'select-shared-spec': [typeKey: string, valueKey: string]
  'toggle-separate-specs': []
}>()

const { t } = useI18n()
const swipeRef = ref<SwipeInstance>()
const purchasable = computed(() => !!props.view && !props.loading && !props.missing && props.priceReady)
const formatAed = (value: number | null) => value == null ? '—' : `AED ${value.toFixed(2)}`

watch(() => props.selectedImageIndex, (index) => {
  swipeRef.value?.swipeTo(index, { immediate: true })
})
</script>

<style scoped lang="scss" src="../styles/product-detail.scss"></style>

<style scoped lang="scss">
.h5-package-state {
  min-height: 240px;
  display: grid;
  place-items: center;
  color: #62748e;
  font-size: 13px;
  text-align: center;
}

.h5-package-gallery-empty {
  height: 192px;
  display: grid;
  place-items: center;
  background: var(--hourx-brand-soft);
  color: var(--hourx-brand);
  font-size: 48px;
  font-weight: 800;
}

.h5-detail-card__title-row h2 {
  min-width: 0;
  overflow-wrap: anywhere;
}

.h5-package-price-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  margin-top: 8px;
  color: #62748e;
  font-size: 11px;

  del {
    color: #90a1b9;
  }

  strong {
    padding: 3px 6px;
    border-radius: 5px;
    background: #ecfdf5;
    color: #047857;
    font-size: 11px;
  }
}

.h5-package-booking-note {
  margin: 10px 0 0;
  color: #62748e;
  font-size: 11px;
  line-height: 1.6;
}

.h5-package-service-list {
  margin-top: 14px;
}

.h5-attach-item__meta {
  min-width: 0;
  overflow-wrap: anywhere;
}

.h5-package-service-times {
  flex-shrink: 0;
  color: var(--hourx-brand);
  font-size: 12px;
}

.package-shared-applied { color: #527279; }

.package-sku-groups {
  display: grid;
  gap: 10px;
  margin-top: 8px;
}

.package-sku-group__label {
  margin: 0 0 6px;
  color: #61738a;
  font-size: 12px;
  line-height: 1.4;
}

.package-sku-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.package-sku-option {
  border: 1px solid #d7dee8;
  background: #fff;
  border-radius: 999px;
  padding: 6px 12px;
  color: #334155;
  font: inherit;
  font-size: 12px;
  line-height: 1.4;
}

.package-sku-option.is-selected {
  border-color: var(--hourx-brand);
  background: var(--hourx-brand-soft);
  color: var(--hourx-brand);
  font-weight: 650;
}

.package-sku-option:disabled { opacity: .6; }
.package-price-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  color: #61738a;
  font-size: 12px;
  line-height: 1.5;
}
.package-price-status.is-error { color: #a23928; }
.package-price-status button {
  padding: 5px 10px;
  color: var(--hourx-brand);
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font: inherit;
}

.h5-package-price-breakdown {
  display: grid;
  gap: 12px;
  margin: 16px 0 0;
  color: #62748e;
  font-size: 12px;

  > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  dt {
    min-width: 0;
  }

  dd {
    margin: 0;
    color: #1d293d;
    font-weight: 700;
    white-space: nowrap;
  }
}

.h5-package-price-breakdown__total {
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  color: #1d293d;
  font-weight: 700;
}

.h5-detail-bottom__cart:disabled {
  opacity: 0.7;
}
</style>
