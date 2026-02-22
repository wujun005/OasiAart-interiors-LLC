<template>
  <div class="login-page">{{ t('client.login.title') }}</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });
</script>
