<template>
  <footer
    class="site-footer"
    :class="{ 'site-footer--support-space': reserveSupportSpace }"
  >
    <div class="site-footer__inner">
      <div class="site-footer__main">
        <div class="site-footer__brand">
          <h3 class="site-footer__title">
            <a
              class="site-footer__brand-link"
              href="/"
              aria-label="Back to homepage"
            >
              <img class="site-footer__logo" :src="logoUrl" alt="HourX Logo" />
              <span>HourX Home Service</span>
            </a>
          </h3>
          <p class="site-footer__text">{{ t("client.footer.tagline") }}</p>
          <div class="site-footer__social">
            <a
              class="site-footer__social-item"
              href="https://www.facebook.com/profile.php?id=61583039242229"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <img :src="facebookIconUrl" alt="" />
            </a>
            <a
              class="site-footer__social-item"
              href="https://www.linkedin.com/company/hourx-home/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <img :src="linkedinIconUrl" alt="" />
            </a>
            <a
              class="site-footer__social-item"
              href="https://www.instagram.com/hourxhomeservice.ae?igsi=Mnp2OWtrZDVja2lx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <img :src="instagramIconUrl" alt="" />
            </a>
            <a
              class="site-footer__social-item"
              href="https://wa.me/971502100284/?text=Hi%2C+I%E2%80%99m+interested+in+HourX+services.+Could+you+please+help+me%3F"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <img :src="whatsappIconUrl" alt="" />
            </a>
          </div>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__col-title">
            {{ t("client.footer.quickLinks") }}
          </h4>
          <RouterLink :to="{ path: '/', hash: '#home' }">{{
            t("client.header.nav.home")
          }}</RouterLink>
          <RouterLink :to="{ path: '/', hash: '#services' }">{{
            t("client.footer.services")
          }}</RouterLink>
          <RouterLink :to="{ name: 'order-list' }">{{
            t("client.header.nav.orders")
          }}</RouterLink>
          <RouterLink :to="{ name: 'join-us' }">{{
            t("client.footer.about")
          }}</RouterLink>
          <RouterLink :to="{ name: 'faq' }">{{
            t("client.footer.faq")
          }}</RouterLink>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__col-title">
            {{ t("client.footer.businessHours") }}
          </h4>
          <p>{{ t("client.footer.weekday") }}</p>
          <p>{{ t("client.footer.saturday") }}</p>
          <p>{{ t("client.footer.sunday") }}</p>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__col-title">
            {{ t("client.footer.contactUs") }}
          </h4>
          <div class="site-footer__email-action">
            <a
              class="site-footer__contact-row"
              :href="`mailto:${supportEmail}`"
            >
              <img :src="emailIconUrl" alt="" />
              <span>{{ supportEmail }}</span>
            </a>
            <!-- <button type="button" @click="copySupportEmail">
              {{ t("client.contact.copyEmail") }}
            </button> -->
          </div>
          <a
            class="site-footer__contact-row"
            href="https://wa.me/971502100284/?text=Hi%2C+I%E2%80%99m+interested+in+HourX+services.+Could+you+please+help+me%3F"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img :src="whatsappIconUrl" alt="" />
            <span>{{ t("client.footer.whatsapp") }}</span>
          </a>
          <p class="site-footer__contact-row">
            <img :src="locationIconUrl" alt="" />
            <span>{{ t("client.footer.contactLocation") }}</span>
          </p>
        </div>
      </div>

      <div class="site-footer__bottom">
        <p>{{ t("client.footer.copyright", { year }) }}</p>
        <div class="site-footer__links">
          <RouterLink :to="{ name: 'legal-terms' }">{{
            t("client.footer.terms")
          }}</RouterLink>
          <RouterLink :to="{ name: 'legal-privacy' }">{{
            t("client.footer.privacy")
          }}</RouterLink>
          <RouterLink :to="{ name: 'legal-data-deletion' }">{{
            t("client.footer.dataDeletion")
          }}</RouterLink>
        </div>
        <div
          class="site-footer__payments"
          role="group"
          :aria-label="t('client.footer.paymentsLabel')"
        >
          <img :src="visaIconUrl" alt="Visa" />
          <img :src="mastercardIconUrl" alt="Mastercard" />
          <img :src="applePayIconUrl" alt="Apple Pay" />
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus"
import { useI18n } from "vue-i18n"
import { copyText } from "@/modules/client/utils/clipboard"

withDefaults(defineProps<{ reserveSupportSpace?: boolean }>(), {
  reserveSupportSpace: false,
})

const year = new Date().getFullYear()
const supportEmail = "support@hourxportal.com"
const logoUrl = "/assets/images/client/hourx-mark.svg"
const facebookIconUrl = new URL(
  "@/assets/images/client/icon_facebook.svg",
  import.meta.url,
).href
const linkedinIconUrl = new URL(
  "@/assets/images/client/icon_linkedin.svg",
  import.meta.url,
).href
const instagramIconUrl = new URL(
  "@/assets/images/client/icon_instagram.svg",
  import.meta.url,
).href
const whatsappIconUrl = new URL(
  "@/assets/images/client/icon_whatsapp.svg",
  import.meta.url,
).href
const emailIconUrl = new URL(
  "@/assets/images/client/icon_email.svg",
  import.meta.url,
).href
const locationIconUrl = new URL(
  "@/assets/images/client/icon_location.svg",
  import.meta.url,
).href
const visaIconUrl = new URL(
  "@/assets/images/client/payment_visa.svg",
  import.meta.url,
).href
const mastercardIconUrl = new URL(
  "@/assets/images/client/payment_mastercard.svg",
  import.meta.url,
).href
const applePayIconUrl = new URL(
  "@/assets/images/client/payment_apple_pay.svg",
  import.meta.url,
).href
const { t } = useI18n({ useScope: "global" })

const copySupportEmail = async () => {
  const copied = await copyText(supportEmail)
  ElMessage[copied ? "success" : "error"](
    t(
      copied
        ? "client.contact.copyEmailSuccess"
        : "client.contact.copyEmailFailed",
    ),
  )
}
</script>

<style scoped lang="scss">
.site-footer {
  background: var(--hourx-brand);
  color: rgba(255, 255, 255, 0.72);
}

.site-footer__inner {
  max-width: 1680px;
  margin: 0 auto;
  padding: 56px clamp(24px, 3vw, 48px) 20px;
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
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
}

.site-footer__brand-link {
  color: inherit;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.site-footer__logo {
  width: 34px;
  height: 34px;
  padding: 3px;
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
  flex-shrink: 0;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease;
}

.site-footer__social-item:hover {
  transform: translateY(-2px);
}

.site-footer__social-item img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
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

.site-footer__col a:hover,
.site-footer__bottom a:hover {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.site-footer__contact-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.site-footer__email-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.site-footer__email-action button {
  min-height: 26px;
  padding: 3px 9px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.site-footer__email-action button:hover {
  background: rgba(255, 255, 255, 0.18);
}

.site-footer__contact-row img {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
}

.site-footer__bottom {
  border-top: 1px solid #1d293d;
  padding-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
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

.site-footer__payments {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.site-footer__payments img {
  width: 48px;
  height: 27px;
  display: block;
}

.site-footer--support-space .site-footer__inner {
  padding-right: 200px;
  padding-bottom: 28px;
}

@media (min-width: 1440px) {
  .site-footer__inner {
    padding-top: 64px;
    padding-bottom: 24px;
  }

  .site-footer__main {
    gap: clamp(40px, 4vw, 72px);
  }

  .site-footer__title {
    font-size: 20px;
  }

  .site-footer__text,
  .site-footer__col a,
  .site-footer__col p {
    font-size: 15px;
  }
}

@media (max-width: 1100px) {
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

  .site-footer__payments {
    margin-left: 0;
  }

  .site-footer--support-space .site-footer__inner {
    padding-right: 164px;
    padding-bottom: 20px;
  }
}

@media (max-width: 640px) {
  .site-footer--support-space .site-footer__inner {
    padding-right: 16px;
  }
}
</style>
