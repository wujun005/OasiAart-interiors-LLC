<template>
  <section class="legal-page">
    <div class="legal-page__container">
      <div class="legal-page__toolbar">
        <button type="button" class="legal-page__home-btn" @click="goHome">
          {{ t('client.login.register.backHome') }}
        </button>
      </div>

      <nav class="legal-page__accounts" :aria-label="chinese ? '选择应用' : 'Choose an app'">
        <RouterLink :to="{ path: route.path }" :aria-current="supplier ? undefined : 'page'">HourX Home</RouterLink>
        <RouterLink :to="{ path: route.path, hash: '#supplier' }" :aria-current="supplier ? 'page' : undefined">HourX Supplier</RouterLink>
        <select v-if="supplier" :value="chinese ? 'zh' : 'en'" :aria-label="chinese ? '语言' : 'Language'" @change="changeLanguage">
          <option value="en">English</option><option value="zh">中文</option>
        </select>
      </nav>

      <SupplierAccountDeletionFlow v-if="supplier && !trackedDocument" :chinese="chinese" />
      <AccountDeletionFlow v-if="!supplier" />
      <article v-if="!supplier" class="legal-card">
        <h1>{{ doc.title }}</h1>
        <p class="legal-card__updated">
          {{ t('client.login.legal.lastUpdated') }}
          <time :datetime="doc.lastUpdated">{{ doc.lastUpdated }}</time>
        </p>
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
          <div v-if="section.links?.length" class="legal-card__links">
            <template v-for="link in section.links" :key="link.href">
              <RouterLink v-if="link.href === '/data-deletion#supplier'" :to="{ path: route.path, hash: '#supplier' }">{{ link.label }}</RouterLink>
              <a v-else :href="link.href">{{ link.label }}</a>
            </template>
          </div>
        </section>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AccountDeletionFlow from '@/modules/client/components/AccountDeletionFlow.vue';
import SupplierAccountDeletionFlow from '@/modules/client/components/SupplierAccountDeletionFlow.vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { LEGAL_DOCS, resolveLegalLocale } from '@/modules/client/constants/legal';
import { setClientLocale } from '@/modules/client/locales';

const router = useRouter();
const route = useRoute();
const { locale, t } = useI18n({ useScope: 'global' });
const supplier = computed(() => route.hash === '#supplier');
const chinese = computed(() => resolveLegalLocale(String(locale.value)) === 'zh');
const trackedDocument = ref(typeof window !== 'undefined' &&
  typeof (window as Window & { fbq?: unknown }).fbq === 'function');

// A consumer SPA may already have loaded the advertising script. Never render
// Supplier credentials in that document: reload on the dedicated legal URL.
watch(supplier, (selected) => {
  if (selected && trackedDocument.value) window.location.reload();
}, { immediate: true });

function changeLanguage(event: Event) {
  locale.value = setClientLocale((event.target as HTMLSelectElement).value);
  if (route.name === 'h5-account-deletion') localStorage.setItem('h5-locale', locale.value);
}

const doc = computed(
  () => LEGAL_DOCS[resolveLegalLocale(String(locale.value))].deletion,
);

const goHome = () => {
  router.push('/');
};
</script>

<style scoped lang="scss">
.legal-page {
  min-height: calc(100vh - 168px);
  background: #f7f6f3;
  padding: 28px 20px 56px;
}

.legal-page__container {
  max-width: 980px;
  margin: 0 auto;
}

.legal-page__toolbar {
  margin-bottom: 14px;
}

.legal-page__accounts {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 12px;
}

.legal-page__accounts a, .legal-page__accounts select {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  padding: 6px 14px;
  border: 1px solid #dbe3ee;
  border-radius: 9px;
  background: white;
  color: #06182f;
  font: inherit;
  font-size: 14px;
}

.legal-page__accounts a[aria-current="page"] {
  background: #06182f;
  border-color: #06182f;
  color: white;
  font-weight: 700;
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
  margin-top: 24px;
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

.legal-card__updated {
  margin: 8px 0 0;
  color: #475569;
  font-size: 13px;
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

.legal-card__links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 8px;
}

.legal-card__links a {
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.75;
  text-decoration: underline;
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
