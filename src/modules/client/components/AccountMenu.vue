<template>
  <nav class="account-menu" :aria-label="t('client.profile.title')">
    <div v-for="group in groups" :key="group.label" class="account-menu__group">
      <span>{{ group.label }}</span>
      <RouterLink
        v-for="item in group.items"
        :key="item.key"
        :to="item.to"
        :class="{ 'is-current': current === item.key }"
        :aria-current="current === item.key ? 'page' : undefined"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        {{ item.label }}
      </RouterLink>
    </div>
    <button v-if="isLoggedIn" class="account-menu__logout" type="button" @click="logout">
      <el-icon><SwitchButton /></el-icon>
      {{ t('client.profile.logOut') }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Bell, Box, Calendar, CreditCard, Location, Operation, Service, SwitchButton, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuth } from '../composables/useAuth'

defineProps<{ current: string }>()

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const { isLoggedIn, clearAuth } = useAuth()

const section = (key: string, label: string, icon: typeof User) => ({
  key,
  label,
  icon,
  to: { name: 'profile', query: { ...route.query, section: key } },
})

const groups = computed(() => [
  {
    label: locale.value === 'zh' ? '预订' : 'Bookings',
    items: [
      { key: 'booking', label: t('client.profile.menu.bookings'), icon: Calendar, to: { name: 'order-list', query: { kind: 'booking' } } },
      { key: 'package', label: t('client.profile.menu.packages'), icon: Box, to: { name: 'order-list', query: { kind: 'package' } } },
    ],
  },
  {
    label: locale.value === 'zh' ? '账户' : 'Account',
    items: [
      section('addresses', t('client.profile.menu.addresses'), Location),
      section('payments', t('client.profile.menu.payments'), CreditCard),
    ],
  },
  {
    label: locale.value === 'zh' ? '设置' : 'Settings',
    items: [
      section('personal', t('client.profile.menu.personal'), User),
      section('notifications', t('client.profile.menu.notifications'), Bell),
      section('language', t('client.profile.menu.language'), Operation),
      section('support', t('client.profile.menu.support'), Service),
    ],
  },
])

const logout = async () => {
  try {
    await ElMessageBox.confirm(t('client.profile.logoutConfirm.message'), t('client.profile.logoutConfirm.title'), {
      confirmButtonText: t('client.profile.logoutConfirm.confirm'),
      cancelButtonText: t('client.profile.logoutConfirm.cancel'),
      confirmButtonClass: 'hourx-confirm-button',
    })
  } catch {
    return
  }
  clearAuth()
  ElMessage.success(t('client.profile.logoutSuccess'))
  await router.replace('/')
}
</script>

<style scoped>
.account-menu {
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--hourx-client-border);
  border-radius: 16px;
  background: #fff;
}

.account-menu__group > span {
  display: block;
  padding: 12px 12px 6px;
  color: var(--hourx-client-muted);
  font: 600 0.6875rem/1 var(--hourx-client-font-family);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.account-menu a,
.account-menu__logout {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 46px;
  gap: 10px;
  padding: 6px 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--hourx-client-text);
  font: 600 var(--hourx-client-size-action)/1 var(--hourx-client-font-family);
  text-decoration: none;
  text-align: start;
  cursor: pointer;
}

.account-menu a:hover,
.account-menu .is-current,
.account-menu__logout:hover {
  background: #f1eee8;
}

.account-menu a :deep(.el-icon),
.account-menu__logout :deep(.el-icon) {
  flex: none;
  font-size: 18px;
}

.account-menu__logout {
  margin-top: 6px;
  color: #b42318;
}

@media (max-width: 900px) {
  .account-menu__group {
    display: flex;
    flex-wrap: wrap;
  }

  .account-menu__group > span {
    width: 100%;
  }

  .account-menu a {
    width: auto;
  }
}
</style>
