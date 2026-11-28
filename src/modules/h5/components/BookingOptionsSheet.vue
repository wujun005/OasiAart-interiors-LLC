<template>
  <Teleport to="body">
    <dialog
      v-if="show"
      ref="dialog"
      class="h5-booking-sheet"
      data-booking-options
      :aria-labelledby="titleId"
      :aria-describedby="subtitle ? subtitleId : undefined"
      @cancel.prevent="requestClose"
      @click.self="requestClose"
    >
      <div class="h5-booking-sheet__panel">
        <header class="h5-booking-sheet__header">
          <img
            v-if="image && failedImage !== image"
            class="h5-booking-sheet__thumbnail"
            :src="image"
            alt=""
            decoding="async"
            @error="failedImage = image || ''"
          />
          <div class="h5-booking-sheet__heading">
            <h2 :id="titleId">{{ title }}</h2>
            <p v-if="subtitle" :id="subtitleId">{{ subtitle }}</p>
          </div>
          <button
            type="button"
            class="h5-booking-sheet__close"
            :aria-label="t('h5.productDetail.closeBookingOptions')"
            :disabled="busy"
            autofocus
            @click="requestClose"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5 5 10 10m0-10L5 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            </svg>
          </button>
        </header>

        <div class="h5-booking-sheet__body" tabindex="0" :inert="busy" :aria-busy="busy || undefined">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="h5-booking-sheet__footer">
          <slot name="footer" />
        </footer>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  show: boolean
  title: string
  subtitle?: string
  image?: string
  busy?: boolean
}>()
const emit = defineEmits<{ 'update:show': [show: boolean] }>()
const { t } = useI18n()
const dialog = ref<HTMLDialogElement | null>(null)
const failedImage = ref('')
const titleId = `booking-options-${useId()}`
const subtitleId = `${titleId}-subtitle`

function hide() {
  dialog.value?.close()
}

function requestClose() {
  if (props.busy) return
  hide()
  emit('update:show', false)
}

watch(() => props.show, (show) => {
  if (!show) hide()
}, { flush: 'sync' })

watch(dialog, (element, _, onCleanup) => {
  if (!element) return
  const viewport = window.visualViewport
  if (viewport) {
    const updateViewport = () => {
      const keyboard = viewport.scale === 1
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0
      element.style.setProperty('--booking-sheet-keyboard', `${keyboard}px`)
      element.style.setProperty('--booking-sheet-viewport', `${viewport.height}px`)
      element.toggleAttribute('data-keyboard', keyboard > 40)
    }
    updateViewport()
    viewport.addEventListener('resize', updateViewport)
    viewport.addEventListener('scroll', updateViewport)
    onCleanup(() => {
      viewport.removeEventListener('resize', updateViewport)
      viewport.removeEventListener('scroll', updateViewport)
    })
  }
  if (!element.open) element.showModal()
}, { flush: 'post' })

onBeforeUnmount(hide)
</script>

<style scoped>
:global(html:has(.h5-booking-sheet[open])) {
  overflow: hidden;
}

.h5-booking-sheet {
  --booking-sheet-viewport: 100vh;
  position: fixed;
  inset: auto 0 var(--booking-sheet-keyboard, 0px);
  box-sizing: border-box;
  width: min(100%, 40rem);
  max-width: none;
  max-height: min(calc(var(--booking-sheet-viewport) * 0.76), calc(var(--booking-sheet-viewport) - 1rem));
  margin: 0 auto;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 1.375rem 1.375rem 0 0;
  background: #fff;
  color: var(--hourx-client-text, #06182f);
  box-shadow: 0 -1rem 3.5rem rgb(6 24 47 / 18%);
}

@supports (height: 100dvh) {
  .h5-booking-sheet { --booking-sheet-viewport: 100dvh; }
}

.h5-booking-sheet[data-keyboard] {
  max-height: calc(var(--booking-sheet-viewport) - 0.75rem);
}

.h5-booking-sheet[open] {
  display: flex;
}

.h5-booking-sheet::backdrop {
  background: rgb(6 24 47 / 47%);
}

.h5-booking-sheet__panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.h5-booking-sheet__header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem max(1rem, env(safe-area-inset-right)) 0.875rem max(1rem, env(safe-area-inset-left));
  border-bottom: 1px solid var(--hourx-client-border, #e8e4dd);
}

.h5-booking-sheet__thumbnail {
  width: 3.25rem;
  height: 3.25rem;
  flex: none;
  border-radius: 0.75rem;
  background: var(--hourx-brand-soft, #f1eee8);
  object-fit: cover;
}

.h5-booking-sheet__heading {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.h5-booking-sheet__heading h2 {
  margin: 0;
  font-family: var(--hourx-client-heading-font, inherit);
  font-size: 1.125rem;
  font-weight: 800;
  line-height: 1.25;
}

.h5-booking-sheet__heading p {
  display: -webkit-box;
  margin: 0.25rem 0 0;
  overflow: hidden;
  color: var(--hourx-client-muted, #536071);
  font-size: 0.8125rem;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.h5-booking-sheet__close {
  display: grid;
  flex: none;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 1px solid var(--hourx-client-border, #e8e4dd);
  border-radius: 50%;
  background: #fff;
  color: inherit;
  cursor: pointer;
}

.h5-booking-sheet__close:disabled {
  opacity: 0.55;
  cursor: default;
}

.h5-booking-sheet__close svg {
  width: 1.25rem;
  height: 1.25rem;
}

.h5-booking-sheet__body {
  min-height: 0;
  padding: 0.875rem max(1rem, env(safe-area-inset-right)) 1rem max(1rem, env(safe-area-inset-left));
  overflow: auto;
  overscroll-behavior: contain;
}

.h5-booking-sheet__footer {
  flex: none;
  padding: 0.75rem max(1rem, env(safe-area-inset-right)) calc(0.75rem + env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
  border-top: 1px solid var(--hourx-client-border, #e8e4dd);
  background: #fff;
}

.h5-booking-sheet__close:focus-visible,
.h5-booking-sheet__body:focus-visible {
  outline: 2px solid #086946;
  outline-offset: -3px;
}

@media (max-height: 420px) {
  .h5-booking-sheet__header {
    padding-block: 0.5rem;
  }

  .h5-booking-sheet__thumbnail {
    width: 2.5rem;
    height: 2.5rem;
  }
}
</style>
