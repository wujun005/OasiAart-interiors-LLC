<template>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="site-header__brand" href="/">
        <img class="site-header__logo" :src="logoUrl" alt="HourX Logo" />
        <span class="site-header__brand-text">HourX</span>
      </a>

      <nav class="site-header__nav">
        <a class="site-header__link" href="#home">{{ t('client.header.nav.home') }}</a>
        <a class="site-header__link" href="#services">{{ t('client.header.nav.services') }}</a>
        <a class="site-header__link" href="#about">{{ t('client.header.nav.about') }}</a>
      </nav>

      <div class="site-header__actions">
        <el-select v-model="currentLocale" size="small" class="site-header__locale">
          <el-option value="en" :label="t('client.header.languageEn')" />
          <el-option value="zh" :label="t('client.header.languageZh')" />
        </el-select>
        <RouterLink class="site-header__action" to="/login">{{ t('client.header.auth') }}</RouterLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { setClientLocale, type ClientLocale } from '@/modules/client/locales';

const logoUrl = 'https://www.figma.com/api/mcp/asset/162a0088-e6aa-4cf2-bcb9-80e67d1d572a';
const { t, locale } = useI18n({ useScope: 'global' });

const currentLocale = computed<ClientLocale>({
  get: () => (locale.value === 'zh' ? 'zh' : 'en'),
  set: (value) => {
    locale.value = setClientLocale(value);
  },
});
</script>

<style scoped lang="scss">
.site-header {
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid #e5e7eb;
}

.site-header__inner {
  max-width: 1200px;
  height: 88px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.site-header__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.site-header__logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.site-header__brand-text {
  color: #111827;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
}

.site-header__nav {
  display: flex;
  align-items: center;
  gap: 28px;
}

.site-header__link {
  color: #45556c;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s ease;
}

.site-header__link:hover {
  color: #3972f5;
}

.site-header__action {
  min-width: 104px;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-decoration: none;
  background: #3972f5;
  font-size: 14px;
  font-weight: 700;
}

.site-header__actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.site-header__locale {
  width: 108px;
}

@media (max-width: 900px) {
  .site-header__inner {
    height: 76px;
    padding: 0 16px;
  }

  .site-header__nav {
    display: none;
  }

  .site-header__locale {
    width: 92px;
  }
}
</style>
