<template>
  <section class="faq-page">
    <div class="faq-page__container">
      <RouterLink class="faq-page__back" to="/">
        {{ t("client.login.register.backHome") }}
      </RouterLink>

      <header class="faq-page__header">
        <p>{{ t("client.faq.eyebrow") }}</p>
        <h1>{{ t("client.faq.title") }}</h1>
        <span>{{ t("client.faq.intro") }}</span>
      </header>

      <div class="faq-page__groups">
        <section
          v-for="(group, groupIndex) in faqGroups"
          :key="group.title"
          class="faq-page__group"
        >
          <h2>{{ group.title }}</h2>
          <div class="faq-page__list">
            <details
              v-for="(item, itemIndex) in group.items"
              :key="item.question"
              :open="groupIndex === 0 && itemIndex === 0"
            >
              <summary>{{ item.question }}</summary>
              <p>
                <template v-for="(part, partIndex) in item.answer" :key="partIndex">
                  <RouterLink v-if="part.to" :to="part.to">{{ part.text }}</RouterLink>
                  <a
                    v-else-if="part.href"
                    :href="part.href"
                    target="_blank"
                    rel="noopener noreferrer"
                  >{{ part.text }}</a>
                  <template v-else>{{ part.text }}</template>
                </template>
              </p>
            </details>
          </div>
        </section>
      </div>

      <aside class="faq-page__contact">
        <div>
          <h2>{{ t("client.faq.contactTitle") }}</h2>
          <p>{{ t("client.faq.contactText") }}</p>
        </div>
        <div class="faq-page__actions">
          <div class="faq-page__email-action">
            <a :href="`mailto:${supportEmail}`">{{ supportEmail }}</a>
            <!-- <button type="button" @click="copySupportEmail">
              {{ t('client.contact.copyEmail') }}
            </button> -->
          </div>
          <a
            href="https://wa.me/971502100284/?text=Hi%2C+I%E2%80%99m+interested+in+HourX+services.+Could+you+please+help+me%3F"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t("client.faq.whatsapp") }}
          </a>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { getFaqGroups } from "@/modules/client/data/faq"

const { t, locale } = useI18n({ useScope: "global" })
const supportEmail = "support@hourxportal.com"
const faqGroups = computed(() => getFaqGroups(locale.value))
</script>

<style scoped lang="scss">
.faq-page {
  min-height: calc(100vh - 168px);
  padding: 48px 20px 72px;
  background: #f7f9fc;
  color: var(--hourx-brand);
}

.faq-page__container {
  width: min(860px, 100%);
  margin: 0 auto;
}

.faq-page__back {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid #d9e0ea;
  border-radius: 999px;
  background: #fff;
  color: var(--hourx-brand);
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
}

.faq-page__header {
  margin-top: 34px;
  text-align: center;
}

.faq-page__header p {
  margin: 0;
  color: #3478c9;
  font-size: 13px;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.faq-page__header h1 {
  margin: 10px 0 0;
  font-size: clamp(32px, 5vw, 48px);
  line-height: 1.15;
}

.faq-page__header span {
  display: block;
  margin-top: 12px;
  color: #667085;
  font-size: 16px;
  line-height: 1.65;
}

.faq-page__groups {
  margin-top: 38px;
  display: grid;
  gap: 30px;
}

.faq-page__group h2 {
  margin: 0;
  color: var(--hourx-brand);
  font-size: 22px;
  line-height: 1.3;
}

.faq-page__list {
  margin-top: 13px;
  display: grid;
  gap: 12px;
}

.faq-page__list details {
  padding: 0 22px;
  border: 1px solid #dfe5ee;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(5, 21, 43, 0.05);
}

.faq-page__list summary {
  padding: 20px 30px 20px 0;
  color: var(--hourx-brand);
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
}

.faq-page__list p {
  margin: -4px 0 20px;
  color: #667085;
  font-size: 15px;
  line-height: 1.7;
}

.faq-page__list p a {
  color: #1769c2;
  font-weight: 750;
  text-underline-offset: 3px;
}

.faq-page__contact {
  margin-top: 28px;
  padding: 26px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: var(--hourx-brand);
  color: #fff;
}

.faq-page__contact h2 {
  margin: 0;
  font-size: 22px;
}

.faq-page__contact p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  line-height: 1.6;
}

.faq-page__actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.faq-page__actions a {
  color: #fff;
  font-size: 14px;
  font-weight: 750;
  text-underline-offset: 3px;
}

.faq-page__email-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.faq-page__email-action button {
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
}

.faq-page__email-action button:hover {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 640px) {
  .faq-page {
    padding: 28px 14px 48px;
  }

  .faq-page__header {
    text-align: left;
  }

  .faq-page__groups {
    margin-top: 28px;
    gap: 24px;
  }

  .faq-page__group h2 {
    font-size: 19px;
  }

  .faq-page__list details {
    padding: 0 16px;
  }

  .faq-page__list summary {
    padding: 17px 24px 17px 0;
    font-size: 15px;
  }

  .faq-page__list p {
    margin-bottom: 17px;
    font-size: 14px;
  }

  .faq-page__contact {
    align-items: flex-start;
    flex-direction: column;
  }

  .faq-page__actions {
    align-items: flex-start;
  }
}
</style>
