<template>
  <el-dialog
    :model-value="modelValue"
    :title="currentDoc.title"
    width="860px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="legal-dialog">
      <p v-if="currentDoc.intro" class="legal-dialog__intro">{{ currentDoc.intro }}</p>
      <div class="legal-dialog__body">
        <section v-for="section in currentDoc.sections" :key="section.heading" class="legal-section">
          <h4>{{ section.heading }}</h4>
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
    </div>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">
        {{ t('client.login.legal.close') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { LEGAL_DOCS, resolveLegalLocale, type LegalDocType } from '@/modules/client/constants/legal';

const props = defineProps<{
  modelValue: boolean;
  docType: LegalDocType;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { locale, t } = useI18n({ useScope: 'global' });

const currentDoc = computed(() => {
  const lang = resolveLegalLocale(String(locale.value));
  return LEGAL_DOCS[lang][props.docType];
});
</script>

<style scoped lang="scss">
.legal-dialog__intro {
  margin: 0;
  font-size: 14px;
  color: rgba(15, 23, 42, 0.82);
  line-height: 1.6;
}

.legal-dialog__body {
  margin-top: 12px;
  max-height: 56vh;
  overflow: auto;
  padding-right: 8px;
}

.legal-section + .legal-section {
  margin-top: 14px;
}

.legal-section h4 {
  margin: 0 0 6px;
  font-size: 15px;
  line-height: 1.4;
  color: rgba(15, 23, 42, 0.9);
}

.legal-section p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(15, 23, 42, 0.8);
}

.legal-section p + p {
  margin-top: 6px;
}

.legal-section ul {
  margin: 0;
  padding-left: 18px;
}

.legal-section li {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(15, 23, 42, 0.8);
}
</style>
