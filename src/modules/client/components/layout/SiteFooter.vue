<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__main">
        <div class="site-footer__brand">
          <h3 class="site-footer__title">HourX Portal Co LLC</h3>
          <p class="site-footer__text">{{ t('client.footer.tagline') }}</p>
          <div class="site-footer__social">
            <a
              class="site-footer__social-item"
              href="https://www.facebook.com/profile.php?id=61583039242229"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              f
            </a>
            <span class="site-footer__social-item" aria-label="Telegram">tg</span>
            <span class="site-footer__social-item" aria-label="LinkedIn">in</span>
          </div>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__col-title">{{ t('client.footer.quickLinks') }}</h4>
          <RouterLink :to="{ path: '/', hash: '#home' }">{{ t('client.header.nav.home') }}</RouterLink>
          <RouterLink :to="{ path: '/', hash: '#services' }">{{ t('client.footer.services') }}</RouterLink>
          <RouterLink :to="{ name: 'order-list' }">{{ t('client.header.nav.orders') }}</RouterLink>
          <RouterLink :to="{ name: 'join-us' }">{{ t('client.footer.about') }}</RouterLink>
          <RouterLink :to="{ name: 'legal-terms' }">{{ t('client.footer.terms') }}</RouterLink>
          <RouterLink :to="{ name: 'legal-privacy' }">{{ t('client.footer.privacy') }}</RouterLink>
          <RouterLink :to="{ name: 'legal-data-deletion' }">{{
            t('client.footer.dataDeletion')
          }}</RouterLink>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__col-title">{{ t('client.footer.businessHours') }}</h4>
          <p>{{ t('client.footer.weekday') }}</p>
          <p>{{ t('client.footer.saturday') }}</p>
          <p>{{ t('client.footer.sunday') }}</p>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__col-title">{{ t('client.footer.contactUs') }}</h4>
          <p>{{ t('client.footer.contactEmail') }}</p>
          <p>{{ t('client.footer.contactWhatsapp') }}</p>
          <p>{{ t('client.footer.contactLocation') }}</p>
        </div>
      </div>

      <div class="site-footer__bottom">
        <p>{{ t('client.footer.copyright', { year }) }}</p>
        <div class="site-footer__links">
          <RouterLink :to="{ name: 'legal-terms' }">{{
            t('client.footer.terms')
          }}</RouterLink>
          <RouterLink :to="{ name: 'legal-privacy' }">{{
            t('client.footer.privacy')
          }}</RouterLink>
          <RouterLink :to="{ name: 'legal-data-deletion' }">{{
            t('client.footer.dataDeletion')
          }}</RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const year = new Date().getFullYear();
const { t } = useI18n({ useScope: 'global' });
</script>

<style scoped lang="scss">
.site-footer {
  background: #091329;
  color: rgba(255, 255, 255, 0.72);
}

.site-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 56px 24px 20px;
}

.site-footer__main {
  display: grid;
  grid-template-columns: 1.3fr repeat(3, 1fr);
  gap: 36px;
  margin-bottom: 28px;
}

.site-footer__title {
  margin: 0 0 14px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.site-footer__text {
  margin: 0;
  line-height: 1.6;
  font-size: 14px;
}

.site-footer__social {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}

.site-footer__social-item {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  text-decoration: none;
}

.site-footer__col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.site-footer__col-title {
  margin: 0 0 4px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.site-footer__col a,
.site-footer__col p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
}

.site-footer__bottom {
  border-top: 1px solid #1d293d;
  padding-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.site-footer__bottom p {
  margin: 0;
  font-size: 12px;
}

.site-footer__links {
  display: flex;
  gap: 14px;
}

.site-footer__links a {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
}

@media (max-width: 900px) {
  .site-footer__inner {
    padding: 40px 16px 16px;
  }

  .site-footer__main {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .site-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
