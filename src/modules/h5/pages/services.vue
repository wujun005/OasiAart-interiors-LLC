<template>
  <div class="services-page">
    <van-nav-bar
      :title="text.navTitle"
      :left-text="text.back"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      @click-left="goBack"
    />

    <div class="page-section">
      <div class="section-title">{{ text.schemes }}</div>
      <van-tabs v-model:active="activeTab" shrink>
        <van-tab v-for="tab in tabs" :key="tab.name" :title="tab.title" :name="tab.name">
          <van-cell-group inset>
            <van-cell
              v-for="plan in tab.plans"
              :key="plan.title"
              :title="plan.title"
              :label="plan.desc"
            >
              <template #icon>
                <van-icon :name="plan.icon" size="20" color="#2f6feb" />
              </template>
              <template #right-icon>
                <div class="plan-meta">
                  <span class="plan-price">{{ plan.price }}</span>
                  <van-tag plain type="primary">{{ plan.duration }}</van-tag>
                </div>
              </template>
            </van-cell>
          </van-cell-group>
        </van-tab>
      </van-tabs>
    </div>

    <div class="page-section contact">
      <div class="section-title">{{ text.contact.title }}</div>
      <van-field
        v-model="contact.name"
        :label="text.contact.name"
        :placeholder="text.contact.namePlaceholder"
        clearable
        border
      />
      <van-field
        v-model="contact.phone"
        type="tel"
        :label="text.contact.phone"
        :placeholder="text.contact.phonePlaceholder"
        clearable
        border
      />
      <van-field
        v-model="contact.note"
        type="textarea"
        :label="text.contact.note"
        rows="2"
        maxlength="120"
        show-word-limit
        :placeholder="text.contact.notePlaceholder"
      />
      <van-button block type="primary" round class="submit-btn" @click="submit">
        {{ text.contact.submit }}
      </van-button>
      <van-divider dashed>{{ text.contact.or }}</van-divider>
      <van-button block plain type="primary" round @click="toLogin">
        {{ text.contact.login }}
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const activeTab = ref('cleaning')

const { locale, messages } = useI18n()
const pack = computed(() => (messages.value as any)[locale.value].services)
const text = computed(() => pack.value)
const tabs = computed(() => pack.value.tabs)

const contact = reactive({
  name: '',
  phone: '',
  note: '',
})

const goBack = () => router.back()
const toLogin = () => router.push('/login')
const submit = () => {
  if (!contact.phone) {
    showToast(text.value.toast.needPhone)
    return
  }
  showToast(text.value.toast.submitted)
  contact.note = ''
}
</script>

<style scoped lang="scss">
.services-page {
  padding: 12px 12px 72px;
}

.plan-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.plan-price {
  font-weight: 700;
  color: #2f6feb;
}

.contact {
  margin-top: 12px;
}

.submit-btn {
  margin-top: 12px;
}
</style>
