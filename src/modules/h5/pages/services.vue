<template>
  <div class="services-page">
    <van-nav-bar
      title="服务项目"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      @click-left="goBack"
    />

    <div class="page-section">
      <div class="section-title">精选方案</div>
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
      <div class="section-title">预约与咨询</div>
      <van-field
        v-model="contact.name"
        label="称呼"
        placeholder="请输入称呼"
        clearable
        border
      />
      <van-field
        v-model="contact.phone"
        type="tel"
        label="手机"
        placeholder="便于联系确认时间"
        clearable
        border
      />
      <van-field
        v-model="contact.note"
        type="textarea"
        label="需求"
        rows="2"
        maxlength="120"
        show-word-limit
        placeholder="如：深度保洁+冰箱清洗，周末上门"
      />
      <van-button block type="primary" round class="submit-btn" @click="submit">
        提交预约
      </van-button>
      <van-divider dashed>或</van-divider>
      <van-button block plain type="primary" round @click="toLogin">
        登录查看我的订单
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref('cleaning')

const tabs = [
  {
    name: 'cleaning',
    title: '家庭保洁',
    plans: [
      { title: '日常保洁 · 标准', desc: '客厅/卧室基础清洁 + 桌面收纳', price: '￥129 起', duration: '1.5 小时', icon: 'brush-o' },
      { title: '深度保洁 · 厨卫', desc: '重油区深度去渍 + 杀菌除螨', price: '￥199 起', duration: '3 小时', icon: 'fire' },
    ],
  },
  {
    name: 'appliance',
    title: '家电清洗',
    plans: [
      { title: '空调蒸汽洗', desc: '外机+内机杀菌清洗，保持风量', price: '￥159 起', duration: '90 分钟', icon: 'underway-o' },
      { title: '冰箱除味洗', desc: '拆洗密封胶圈，深层除菌除味', price: '￥129 起', duration: '60 分钟', icon: 'smile' },
    ],
  },
  {
    name: 'commercial',
    title: '商户保洁',
    plans: [
      { title: '店面开荒', desc: '硬化地面/橱窗清洁，开业前一次性焕新', price: '￥699 起', duration: '半天', icon: 'shop-o' },
      { title: '月度保洁', desc: '固定频次上门，保持环境稳定整洁', price: '￥1299 起', duration: '包月', icon: 'balance-list-o' },
    ],
  },
] as const

const contact = reactive({
  name: '',
  phone: '',
  note: '',
})

const goBack = () => router.back()
const toLogin = () => router.push('/login')
const submit = () => {
  if (!contact.phone) {
    showToast('请先填写联系方式')
    return
  }
  showToast('已提交，顾问会尽快联系您')
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
