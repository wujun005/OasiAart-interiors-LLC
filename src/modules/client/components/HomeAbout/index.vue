<template>
  <section class="home-about">
    <div class="about-container">
      <!-- 标题和内容区域 -->
      <div class="about-main">
        <!-- 标题 -->
        <h2 class="about-title">{{ $t('homepage.about.title') }}</h2>

        <!-- 上半部分：介绍段落和按钮 -->
        <div class="about-top">
          <div class="about-left">
            <p class="about-description">{{ $t('homepage.about.description') }}</p>
          </div>
          <div class="about-top-right">
            <el-button class="learn-more-btn" @click="handleLearnMore">
              {{ $t('homepage.about.learnMore') }}
            </el-button>
          </div>
        </div>

      <!-- 下半部分：团队照片和优势卡片 -->
      <div class="about-bottom">
        <!-- 左侧：团队照片 -->
        <div class="team-image-wrapper">
          <img
            :src="teamImage"
            alt="专业团队"
            class="team-image"
          />
        </div>

        <!-- 右侧：优势卡片 -->
        <div class="about-right">
          <div
            v-for="(advantage, index) in serviceAdvantages"
            :key="advantage.id"
            class="advantage-card"
          >
            <h3 class="advantage-title">{{ $t(advantage.title) }}</h3>
            <p class="advantage-description">{{ $t(advantage.description) }}</p>
            <!-- 前两个卡片在底部显示分隔线，第三个不显示 -->
            <div v-if="index < 2" class="advantage-divider"></div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { serviceAdvantages } from '../../data/homepage';
import teamImage from '@/assets/images/homepage/about-team.png';

const router = useRouter();

const handleLearnMore = () => {
  router.push('/about');
};
</script>

<style scoped lang="scss">
.home-about {
  padding: 4rem 0;
  background-color: #f5f5f5;
}

.about-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 200px;
}

.about-main {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 4rem;
  align-items: start;
}

.about-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0 0 35px 0;
  color: #333;
  grid-column: 1 / -1;
}

.about-top {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 4rem;
  align-items: center;
  margin-bottom: 3rem;
  grid-column: 1 / -1;
}

.about-left {
  max-width: 100%;
}

.about-description {
  font-size: 1rem;
  line-height: 1.8;
  color: #333;
  margin: 0;
}

.about-top-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.learn-more-btn {
  padding: 0.75rem 2rem;
  border: 1px solid #000;
  background-color: #fff;
  color: #000;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background-color: #000;
    color: #fff;
  }
}

.about-bottom {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 4rem;
  align-items: stretch;
  grid-column: 1 / -1;
}

.team-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
}

.team-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.about-right {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.advantage-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  justify-content: center;
  position: relative;
}

.advantage-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
  margin: 0;
  line-height: 1.4;
}

.advantage-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
  margin: 0;
}

.advantage-divider {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: #e0e0e0;
}
</style>

