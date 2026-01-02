<template>
  <div class="home-page">
    <van-nav-bar
      title="OasiAart 移动端"
      right-text="登录"
      fixed
      placeholder
      safe-area-inset-top
      @click-right="goLogin"
    />

    <section class="page-section hero">
      <van-swipe :autoplay="4000" lazy-render>
        <van-swipe-item v-for="banner in banners" :key="banner.title">
          <div class="banner-card" :style="{ backgroundImage: `url(${banner.image})` }">
            <div class="banner-mask">
              <p class="banner-label">{{ banner.title }}</p>
              <p class="banner-desc">{{ banner.desc }}</p>
              <van-button type="primary" size="small" round @click="jump('/services')">
                立即预约
              </van-button>
            </div>
          </div>
        </van-swipe-item>
      </van-swipe>
      <van-notice-bar
        color="#2f6feb"
        background="#eaf4ff"
        wrapable
        text="家庭保洁、商户维护、深度清洁与家电保养均可在线预约，今日下单最快当日上门。"
      />
    </section>

    <section class="page-section">
      <div class="section-title">快捷入口</div>
      <van-grid :column-num="4">
        <van-grid-item
          v-for="item in shortcuts"
          :key="item.text"
          :icon="item.icon"
          :text="item.text"
          @click="jump(item.to)"
        />
      </van-grid>
    </section>

    <section class="page-section">
      <div class="section-title">热门服务</div>
      <van-space direction="vertical" size="12" class="card-space">
        <van-card
          v-for="service in services"
          :key="service.title"
          :title="service.title"
          :desc="service.desc"
          :thumb="service.thumb"
          :price="service.price"
          centered
        >
          <template #tags>
            <van-tag v-for="tag in service.tags" :key="tag" type="primary" plain>{{ tag }}</van-tag>
          </template>
          <template #bottom>
            <div class="card-meta">
              <span>{{ service.duration }}</span>
              <van-button size="small" round type="primary" @click="jump('/services')">预约</van-button>
            </div>
          </template>
        </van-card>
      </van-space>
    </section>

    <section class="page-section">
      <div class="section-title">用户口碑</div>
      <van-cell-group inset>
        <van-cell
          v-for="review in reviews"
          :key="review.user"
          :title="review.user"
          :label="review.comment"
        >
          <template #right-icon>
            <van-rate :model-value="review.score" size="16" color="#fbbd08" readonly allow-half />
          </template>
        </van-cell>
      </van-cell-group>
    </section>

    <van-tabbar route safe-area-inset-bottom fixed>
      <van-tabbar-item replace to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item replace to="/services" icon="apps-o">服务</van-tabbar-item>
      <van-tabbar-item replace to="/login" icon="manager-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const img = (file: string) =>
  new URL(`../../../assets/images/homepage/${file}`, import.meta.url).href

const banners = [
  {
    title: '日常保洁',
    desc: '基础保洁 + 收纳整理，一键预约今日可上门',
    image: img('daily-cleaning.png'),
  },
  {
    title: '深度焕新',
    desc: '厨房油污重度清理，除螨杀菌更安心',
    image: img('deep-cleaning.png'),
  },
  {
    title: '家电养护',
    desc: '冰箱/空调/洗衣机专项清洗，延长设备寿命',
    image: img('appliance-cleaning.png'),
  },
] as const

const shortcuts = [
  { text: '预约服务', icon: 'calendar-o', to: '/services' },
  { text: '价格估算', icon: 'diamond', to: '/services' },
  { text: '联系客服', icon: 'service-o', to: '/login' },
  { text: '我的订单', icon: 'orders-o', to: '/login' },
] as const

const services = [
  {
    title: '家庭深度保洁',
    desc: '厨卫除垢 · 床品除螨 · 全屋消杀',
    duration: '2-3 小时 · 2人团队',
    price: '￥199 起',
    tags: ['深度清洁', '除螨消杀'],
    thumb: img('deep-cleaning.png'),
  },
  {
    title: '日常维护保洁',
    desc: '客厅卧室日常清洁 · 收纳整理',
    duration: '1.5-2 小时 · 1人上门',
    price: '￥129 起',
    tags: ['高频维护', '及时到店'],
    thumb: img('daily-cleaning.png'),
  },
  {
    title: '家电专项清洗',
    desc: '冰箱、洗衣机、空调深层清洗杀菌',
    duration: '90 分钟 · 专项技师',
    price: '￥159 起',
    tags: ['专人专机', '环保耗材'],
    thumb: img('appliance-cleaning.png'),
  },
] as const

const reviews = [
  { user: '陈女士 · 宝龙城', comment: '两小时搞定全屋，收纳很整齐，下次还会约。', score: 4.5 },
  { user: '李先生 · 滨江', comment: '油烟机清洗得很干净，师傅很准时。', score: 5 },
  { user: '赵女士 · 江南', comment: '空调清洗完风很清新，工具齐全。', score: 4.5 },
] as const

const goLogin = () => router.push('/login')
const jump = (to: string) => router.push(to)
</script>

<style scoped lang="scss">
.home-page {
  padding: 12px 12px 72px;
}

.hero {
  padding: 0;
  overflow: hidden;
}

.banner-card {
  height: 200px;
  border-radius: 16px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

.banner-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(21, 25, 40, 0.65), rgba(21, 25, 40, 0.15));
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px;
  gap: 8px;
}

.banner-label {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.banner-desc {
  margin: 0;
  opacity: 0.9;
}

.card-space {
  width: 100%;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}
</style>
