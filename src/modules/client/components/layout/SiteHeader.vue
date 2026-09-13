<template>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="site-header__brand" href="/">
        <img class="site-header__logo" :src="logoUrl" alt="HourX Logo" />
        <!-- <span class="site-header__brand-text">HourX</span> -->
      </a>

      <nav class="site-header__nav">
        <RouterLink
          class="site-header__link"
          :to="{ path: '/', hash: '#home' }"
          >{{ t("client.header.nav.home") }}</RouterLink
        >
        <RouterLink
          class="site-header__link"
          :to="{ path: '/', hash: '#services' }"
          >{{ t("client.header.nav.services") }}</RouterLink
        >
        <RouterLink class="site-header__link" :to="{ name: 'order-list' }">{{
          t("client.header.nav.orders")
        }}</RouterLink>
        <RouterLink class="site-header__link" :to="{ name: 'join-us' }">{{
          t("client.header.nav.joinUs")
        }}</RouterLink>
      </nav>

      <form
        class="site-header__search"
        role="search"
        @submit.prevent="submitServiceSearch"
      >
        <input
          v-model="serviceSearch"
          type="search"
          :placeholder="t('client.home.sections.searchPlaceholder')"
          :aria-label="t('client.home.sections.searchPlaceholder')"
        />
        <button
          type="submit"
          :aria-label="t('client.home.sections.searchPlaceholder')"
        >
          <el-icon><Search /></el-icon>
        </button>
      </form>

      <div class="site-header__actions">
        <RouterLink
          class="site-header__cart-btn"
          :to="{ name: 'cart' }"
          :aria-label="t('client.header.nav.cart')"
        >
          <el-icon><ShoppingCart /></el-icon>
          <span class="site-header__cart-label">{{ t("client.header.nav.cart") }}</span>
          <span v-if="cartCount" class="site-header__cart-count">{{ cartCount > 99 ? '99+' : cartCount }}</span>
        </RouterLink>

        <el-dropdown trigger="click" @command="handleLocaleCommand">
          <button class="site-header__locale-btn" type="button">
            <img src="@/assets/images/client/language-Icon.png" alt="" />
            <span>{{ localeLabel }}</span>
            <img src="@/assets/images/client/arrow.png" alt="" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="en">{{
                t("client.header.languageEn")
              }}</el-dropdown-item>
              <el-dropdown-item command="zh">{{
                t("client.header.languageZh")
              }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown
          v-if="isLoggedIn"
          trigger="click"
          @command="handleUserCommand"
        >
          <button class="site-header__user-btn" type="button">
            <span class="site-header__user-icon-wrap">
              <img
                class="site-header__user-icon-wrap"
                src="@/assets/images/client/icon14.png"
                alt=""
              />
            </span>
            <!-- <img
              class="site-header__user-icon-wrap"
              src="@/assets/images/client/header.png"
              alt=""
            /> -->
            <span class="site-header__user-name">{{ userLabel }}</span>
            <img src="@/assets/images/client/arrow.png" alt="" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">{{
                t("client.header.profile")
              }}</el-dropdown-item>
              <el-dropdown-item command="logout">{{
                t("client.header.logout")
              }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <RouterLink v-else class="site-header__login-btn" to="/login">
          {{ t("client.header.auth") }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { ElMessageBox } from "element-plus"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { Search, ShoppingCart } from "@element-plus/icons-vue"
import { setClientLocale, type ClientLocale } from "@/modules/client/locales"
import { useCart } from "@/modules/client/composables/useCart"
import { clearStoredAuthState, getStoredAuthSnapshot } from "@/utils/auth-state"
const langIconUrl =
  "https://www.figma.com/api/mcp/asset/d385ba89-56b8-4fb2-98a8-85f7659b0f53"
const { t, locale } = useI18n({ useScope: "global" })
const route = useRoute()
const router = useRouter()
const hasToken = ref(false)
const userName = ref("")
const serviceSearch = ref("")
const logoUrl = "/assets/images/client/hourx-mark.svg"
const { cartCount } = useCart()

const currentLocale = computed<ClientLocale>({
  get: () => (locale.value === "zh" ? "zh" : "en"),
  set: (value) => {
    locale.value = setClientLocale(value)
  },
})

const localeLabel = computed(() =>
  currentLocale.value === "zh"
    ? t("client.header.languageZh")
    : t("client.header.languageEn"),
)

const isLoggedIn = computed(() => hasToken.value)

const userLabel = computed(() => {
  const trimmed = userName.value.trim()
  return trimmed || t("client.header.user")
})

const syncAuthState = () => {
  if (typeof window === "undefined") return
  const snapshot = getStoredAuthSnapshot()
  if (snapshot.isExpired) {
    clearStoredAuthState()
    hasToken.value = false
    userName.value = ""
    return
  }
  hasToken.value = snapshot.isLoggedIn
  userName.value = snapshot.userInfo.username || ""
}

const handleLocaleCommand = (value: string | number | object) => {
  const target = value === "zh" ? "zh" : "en"
  currentLocale.value = target
}

const submitServiceSearch = () => {
  const keyword = serviceSearch.value.trim()
  if (!keyword) return
  router.push({ name: "service-search", query: { keyword } })
}

watch(
  () => [route.name, route.query.keyword],
  () => {
    const rawKeyword = route.name === "service-search" ? route.query.keyword : ""
    const keyword = Array.isArray(rawKeyword) ? rawKeyword[0] : rawKeyword
    serviceSearch.value = typeof keyword === "string" ? keyword : ""
  },
  { immediate: true },
)

const handleUserCommand = async (command: string | number | object) => {
  if (command === "profile") {
    router.push({ name: "profile" })
    return
  }
  if (command === "logout") {
    try {
      await ElMessageBox.confirm(
        t("client.header.logoutConfirmMessage"),
        t("client.header.logoutConfirmTitle"),
        {
          confirmButtonText: t("client.header.logout"),
          cancelButtonText: t("client.header.logoutCancel"),
          type: "warning",
        },
      )
    } catch {
      return
    }
    clearStoredAuthState()
    syncAuthState()
    router.push("/")
  }
}

onMounted(() => {
  syncAuthState()
  window.addEventListener("storage", syncAuthState)
})

onBeforeUnmount(() => {
  window.removeEventListener("storage", syncAuthState)
})
</script>

<style scoped lang="scss">
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid rgba(243, 244, 246, 0.9);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.08);
}

.site-header__inner {
  max-width: 1280px;
  height: 96px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.site-header__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.site-header__logo {
  width: 94px;
  height: 90px;
  object-fit: contain;
}

.site-header__brand-text {
  color: rgba(15, 23, 42, 0.9);
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
}

.site-header__nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.site-header__search {
  height: 42px;
  min-width: 180px;
  max-width: 300px;
  flex: 1 1 260px;
  padding-left: 14px;
  border: 1px solid #d7e2ee;
  border-radius: 13px;
  background: #fff;
  display: flex;
  align-items: center;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.site-header__search:focus-within {
  border-color: #1769c2;
  box-shadow: 0 0 0 3px rgba(23, 105, 194, 0.1);
}

.site-header__search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0f172a;
  font: inherit;
  font-size: 13px;
}

.site-header__search input::-webkit-search-cancel-button {
  display: none;
}

.site-header__search button {
  align-self: stretch;
  width: 42px;
  flex: 0 0 42px;
  border: 0;
  border-left: 1px solid #e5edf6;
  background: #f4f7fa;
  color: #526176;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.site-header__search button:hover {
  background: #e8f1fb;
  color: #1769c2;
}

.site-header__search button .el-icon {
  font-size: 19px;
}

.site-header__link {
  height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(15, 23, 42, 0.9);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.site-header__link:hover {
  color: var(--hourx-brand);
  background: rgba(5, 21, 43, 0.08);
}

.site-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  border-left: 1px solid #e5e7eb;
  padding-left: 12px;
}

.site-header__locale-btn,
.site-header__user-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  color: rgba(15, 23, 42, 0.9);
  font-size: 14px;
  font-weight: 700;
}

.site-header__cart-btn {
  position: relative;
  display: inline-flex;
  height: 40px;
  align-items: center;
  gap: 7px;
  padding: 0 11px;
  border-radius: 999px;
  color: #05152b;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.site-header__cart-btn:hover,
.site-header__cart-btn.router-link-active {
  background: rgba(5, 21, 43, 0.08);
  color: #1769c2;
}

.site-header__cart-btn .el-icon {
  font-size: 20px;
}

.site-header__cart-count {
  display: inline-flex;
  min-width: 19px;
  height: 19px;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 999px;
  background: #1769c2;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
}

.site-header__locale-btn:hover,
.site-header__user-btn:hover {
  background: rgba(5, 21, 43, 0.08);
}

.site-header__locale-btn img:first-child {
  width: 18px;
  height: 18px;
}

.site-header__locale-btn img:last-child,
.site-header__user-btn img:last-child {
  width: 14px;
  height: 14px;
}

.site-header__user-btn {
  height: 52px;
  padding: 0 20px;
}

.site-header__user-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #E5EAF1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.site-header__user-icon-wrap img {
  width: 18px;
  height: 18px;
}

.site-header__login-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  background: var(--hourx-brand);
  color: #fff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
}

@media (max-width: 1180px) {
  .site-header__inner {
    gap: 14px;
    padding: 0 20px;
  }

  .site-header__link {
    padding: 0 10px;
  }

  .site-header__search {
    max-width: 230px;
  }

  .site-header__actions {
    gap: 6px;
  }

  .site-header__cart-label,
  .site-header__locale-btn span,
  .site-header__user-name {
    display: none;
  }

  .site-header__user-btn {
    padding: 0 10px;
  }
}

@media (max-width: 900px) {
  .site-header__inner {
    height: 74px;
    padding: 0 16px;
  }

  .site-header__logo {
    width: 88px;
    height: 60px;
  }

  .site-header__brand-text {
    font-size: 22px;
  }

  .site-header__nav {
    display: none;
  }

  .site-header__search {
    max-width: none;
  }

  .site-header__actions {
    border-left: 0;
    padding-left: 0;
    gap: 6px;
  }

  .site-header__user-btn {
    height: 40px;
    padding: 0 10px;
  }

  .site-header__user-name {
    display: none;
  }

  .site-header__locale-btn span {
    display: none;
  }

  .site-header__cart-label {
    display: none;
  }
}
</style>
