<template>
  <Teleport to="body">
    <Transition name="legal-dialog-fade">
      <div
        v-if="modelValue"
        class="legal-dialog-overlay"
        role="presentation"
        @mousedown.self="close"
      >
        <section
          ref="panelRef"
          class="legal-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          @keydown.esc="close"
        >
          <header class="legal-dialog__header">
            <div>
              <span>{{ locale.startsWith('zh') ? 'HourX 法律文件' : 'HourX legal document' }}</span>
              <h2 :id="titleId">{{ currentDoc.title }}</h2>
            </div>
            <button type="button" :aria-label="closeLabel" @click="close">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div class="legal-dialog__body">
            <p v-if="currentDoc.intro" class="legal-dialog__intro">{{ currentDoc.intro }}</p>
            <section v-for="section in currentDoc.sections" :key="section.heading" class="legal-section">
              <h3>{{ section.heading }}</h3>
              <p v-for="(line, index) in section.paragraphs || []" :key="`${section.heading}-p-${index}`">
                {{ line }}
              </p>
              <ul v-if="section.bullets?.length">
                <li v-for="(line, index) in section.bullets" :key="`${section.heading}-b-${index}`">
                  {{ line }}
                </li>
              </ul>
            </section>
          </div>

          <footer class="legal-dialog__footer">
            <button type="button" @click="close">{{ closeLabel }}</button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { LEGAL_DOCS, resolveLegalLocale, type LegalDocType } from '@/modules/client/constants/legal';

const props = defineProps<{
  modelValue: boolean;
  docType: LegalDocType;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { locale } = useI18n({ useScope: 'global' });
const panelRef = ref<HTMLElement | null>(null);
const titleId = `hourx-legal-${Math.random().toString(36).slice(2)}`;
let previousOverflow = '';

const currentDoc = computed(() => LEGAL_DOCS[resolveLegalLocale(String(locale.value))][props.docType]);
const closeLabel = computed(() => (locale.value.startsWith('zh') ? '关闭' : 'Close'));
const close = () => emit('update:modelValue', false);

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      void nextTick(() => panelRef.value?.focus());
    } else {
      document.body.style.overflow = previousOverflow;
    }
  },
);

onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow;
});
</script>

<style scoped lang="scss">
.legal-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  padding: 24px;
  display: grid;
  place-items: center;
  background: rgba(5, 21, 43, 0.62);
  backdrop-filter: blur(8px);
}

.legal-dialog {
  width: min(880px, 100%);
  max-height: min(840px, calc(100dvh - 48px));
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 32px 90px rgba(5, 21, 43, 0.34);
  outline: none;
}

.legal-dialog__header {
  padding: 22px 24px 18px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid #e8edf3;
  background: linear-gradient(135deg, #05152b 0%, #0c2c52 100%);
  color: #fff;
}

.legal-dialog__header span {
  display: block;
  margin-bottom: 5px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.legal-dialog__header h2 {
  margin: 0;
  font-size: clamp(20px, 3vw, 28px);
  line-height: 1.25;
}

.legal-dialog__header button {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.09);
  color: #fff;
  cursor: pointer;
}

.legal-dialog__header svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 2;
}

.legal-dialog__body {
  overflow: auto;
  overscroll-behavior: contain;
  padding: 24px clamp(20px, 4vw, 34px) 30px;
  scrollbar-color: #cbd5e1 transparent;
}

.legal-dialog__intro {
  margin: 0 0 22px;
  padding: 16px 18px;
  border-left: 4px solid #1769c2;
  border-radius: 4px 14px 14px 4px;
  background: #f2f7fd;
  color: #334155;
  font-size: 14px;
  line-height: 1.75;
}

.legal-section + .legal-section {
  margin-top: 24px;
  padding-top: 22px;
  border-top: 1px solid #edf1f5;
}

.legal-section h3 {
  margin: 0 0 10px;
  color: #05152b;
  font-size: 16px;
  line-height: 1.45;
}

.legal-section p,
.legal-section li {
  color: #475569;
  font-size: 14px;
  line-height: 1.75;
}

.legal-section p {
  margin: 0;
}

.legal-section p + p {
  margin-top: 8px;
}

.legal-section ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

.legal-section li + li {
  margin-top: 7px;
}

.legal-dialog__footer {
  padding: 14px 24px calc(14px + env(safe-area-inset-bottom));
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e8edf3;
  background: #fff;
}

.legal-dialog__footer button {
  min-width: 126px;
  height: 44px;
  border: 0;
  border-radius: 13px;
  background: #05152b;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(5, 21, 43, 0.2);
}

.legal-dialog-fade-enter-active,
.legal-dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.legal-dialog-fade-enter-active .legal-dialog,
.legal-dialog-fade-leave-active .legal-dialog {
  transition: transform 0.24s ease, opacity 0.2s ease;
}

.legal-dialog-fade-enter-from,
.legal-dialog-fade-leave-to {
  opacity: 0;
}

.legal-dialog-fade-enter-from .legal-dialog,
.legal-dialog-fade-leave-to .legal-dialog {
  opacity: 0;
  transform: translateY(14px) scale(0.985);
}

@media (max-width: 640px) {
  .legal-dialog-overlay {
    padding: 54px 0 0;
    place-items: end stretch;
  }

  .legal-dialog {
    width: 100%;
    max-height: calc(100dvh - 54px);
    border: 0;
    border-radius: 24px 24px 0 0;
  }

  .legal-dialog__header {
    padding: 20px 18px 16px;
  }

  .legal-dialog__body {
    padding: 20px 18px 26px;
  }

  .legal-dialog__footer {
    padding-inline: 18px;
  }

  .legal-dialog__footer button {
    width: 100%;
  }

  .legal-dialog-fade-enter-from .legal-dialog,
  .legal-dialog-fade-leave-to .legal-dialog {
    transform: translateY(100%);
  }
}
</style>
