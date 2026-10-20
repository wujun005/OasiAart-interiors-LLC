<template>
  <main class="no-access">
    <section class="no-access__card">
      <p class="no-access__eyebrow">HourX</p>
      <h1>{{ t('admin.noAccess.title') }}</h1>
      <p>{{ t('admin.noAccess.lead') }}</p>
      <p class="no-access__hint">{{ t('admin.noAccess.hint') }}</p>
      <button type="button" @click="logout">{{ t('admin.common.logout') }}</button>
    </section>
  </main>
</template>

<script setup lang="ts">
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { clearAdminAuthState } from '@/utils/auth-state';
import { resetAdminMenuPermissions } from '@/modules/admin/utils/menuPermission';
import { useAdminSessionStore } from '@/modules/admin/stores/session';

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();

const logout = async () => {
  clearAdminAuthState();
  delete axios.defaults.headers.common.Authorization;
  useAdminSessionStore().reset();
  resetAdminMenuPermissions();
  ElMessage.success(t('admin.common.logoutSuccess'));
  await router.replace('/admin/login');
};
</script>

<style scoped>
.no-access {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background: #f4efe6;
  color: #1c1915;
}
.no-access__card {
  width: min(520px, 100%);
  padding: 36px 32px;
  background: #fffdf8;
  border: 1px solid #e4d8c4;
}
.no-access__eyebrow {
  margin: 0 0 12px;
  color: #8a5a12;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h1 {
  margin: 0 0 12px;
  font-size: 32px;
  line-height: 1.2;
}
p {
  margin: 0;
  color: #5c5348;
  line-height: 1.6;
}
.no-access__hint {
  margin-top: 8px;
}
button {
  margin-top: 24px;
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  background: #1c1915;
  color: #fffdf8;
  cursor: pointer;
}
</style>
