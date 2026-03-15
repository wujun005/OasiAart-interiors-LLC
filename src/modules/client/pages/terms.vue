<template>
  <section class="legal-page">
    <div class="legal-page__container">
      <div class="legal-page__toolbar">
        <button type="button" class="legal-page__home-btn" @click="goHome">
          {{ t('client.login.register.backHome') }}
        </button>
      </div>

      <article class="legal-card">
        <h1>{{ doc.title }}</h1>
        <p v-if="doc.intro" class="legal-card__intro">{{ doc.intro }}</p>
        <section
          v-for="section in doc.sections"
          :key="section.heading"
          class="legal-card__section"
        >
          <h2>{{ section.heading }}</h2>
          <p
            v-for="(line, index) in section.paragraphs || []"
            :key="`${section.heading}-p-${index}`"
          >
            {{ line }}
          </p>
          <ul v-if="section.bullets?.length">
            <li
              v-for="(line, index) in section.bullets"
              :key="`${section.heading}-b-${index}`"
            >
              {{ line }}
            </li>
          </ul>
        </section>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { LEGAL_DOCS, resolveLegalLocale } from '@/modules/client/constants/legal';

const router = useRouter();
const { locale, t } = useI18n({ useScope: 'global' });

const doc = computed(() => LEGAL_DOCS[resolveLegalLocale(String(locale.value))].terms);

const goHome = () => {
  router.push('/');
};
</script>

<style scoped lang="scss">
.legal-page {
  min-height: calc(100vh - 168px);
  background: #f8fafc;
  padding: 28px 20px 56px;
}

.legal-page__container {
  max-width: 980px;
  margin: 0 auto;
}

.legal-page__toolbar {
  margin-bottom: 14px;
}

.legal-page__home-btn {
  height: 36px;
  border-radius: 999px;
  border: 1px solid #dbe3ee;
  background: #fff;
  color: rgba(15, 23, 42, 0.85);
  font-size: 13px;
  font-weight: 700;
  padding: 0 14px;
  cursor: pointer;
}

.legal-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 24px 22px;
}

.legal-card h1 {
  margin: 0;
  color: rgba(15, 23, 42, 0.95);
  font-size: 28px;
  font-weight: 900;
  line-height: 1.2;
}

.legal-card__intro {
  margin: 10px 0 0;
  color: rgba(15, 23, 42, 0.78);
  font-size: 14px;
  line-height: 1.7;
}

.legal-card__section {
  margin-top: 16px;
}

.legal-card__section h2 {
  margin: 0 0 6px;
  color: rgba(15, 23, 42, 0.92);
  font-size: 16px;
  font-weight: 800;
  line-height: 1.4;
}

.legal-card__section p {
  margin: 0;
  color: rgba(15, 23, 42, 0.78);
  font-size: 14px;
  line-height: 1.75;
}

.legal-card__section p + p {
  margin-top: 6px;
}

.legal-card__section ul {
  margin: 0;
  padding-left: 18px;
}

.legal-card__section li {
  color: rgba(15, 23, 42, 0.78);
  font-size: 14px;
  line-height: 1.75;
}

@media (max-width: 768px) {
  .legal-page {
    padding: 18px 12px 38px;
  }

  .legal-card {
    border-radius: 14px;
    padding: 18px 14px;
  }

  .legal-card h1 {
    font-size: 22px;
  }
}
</style>
