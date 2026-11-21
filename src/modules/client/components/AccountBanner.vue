<template>
  <section class="account-banner">
    <span class="account-banner__avatar" aria-hidden="true">{{ initials }}</span>
    <div class="account-banner__identity">
      <strong>{{ name }}</strong>
      <div class="account-banner__meta"><slot /></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'

const props = defineProps<{ name?: string }>()
const { t } = useI18n()
const { userInfo } = useAuth()
const name = computed(() => {
  if (props.name) return props.name
  const username = userInfo.value.username?.trim()
  return username && !username.includes('@') && !/^\+?[\d\s-]+$/.test(username)
    ? username
    : t('client.profile.defaultName')
})
const initials = computed(() => name.value.trim().split(/\s+/).slice(0, 2)
  .map((part) => Array.from(part)[0]).join('').toUpperCase())
</script>

<style scoped>
.account-banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 28px;
  border-radius: 20px;
  background-color: var(--hourx-client-text);
  background-image: linear-gradient(rgb(184 154 114 / 6%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(184 154 114 / 6%) 1px, transparent 1px);
  background-size: 48px 48px;
  color: #fff;
}

.account-banner__avatar {
  display: grid;
  flex: 0 0 56px;
  height: 56px;
  place-items: center;
  border-radius: 50%;
  background: var(--hourx-client-canvas);
  color: var(--hourx-client-text);
  font: 700 var(--hourx-client-size-card)/1 var(--hourx-client-heading-font);
}

.account-banner__identity {
  min-width: 0;
  overflow-wrap: anywhere;
}

.account-banner__identity > strong {
  font: 700 1.375rem/1.2 var(--hourx-client-heading-font);
}

.account-banner__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 16px;
  margin-top: 2px;
  color: var(--hourx-client-on-dark);
  font: 400 var(--hourx-client-size-action)/1.55 var(--hourx-client-font-family);
}

@media (max-width: 640px) {
  .account-banner {
    gap: 14px;
    padding: 16px;
    border-radius: 16px;
  }
}
</style>
