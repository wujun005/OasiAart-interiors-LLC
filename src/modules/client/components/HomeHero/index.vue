<template>
  <section class="home-hero">
    <div class="hero-background">
      <!-- 背景图片将通过 CSS 设置 -->
    </div>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="hero-text">
        <h1 class="hero-main-title">
          {{ $t('homepage.hero.mainTitle') }}
          <span class="hero-sub-title">{{ $t('homepage.hero.subTitle') }}</span>
        </h1>
        <p class="hero-description">{{ $t('homepage.hero.description') }}</p>
        <el-button type="primary" size="large" class="hero-button" @click="handleLearnMore">
          {{ $t('homepage.hero.learnMore') }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const handleLearnMore = () => {
  router.push('/services');
};
</script>

<style scoped lang="scss">
.home-hero {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  margin-top: -72px; // 负边距，让 Hero 覆盖到顶部，抵消 Header 的高度

  .hero-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #808080; // 占位背景色（灰色）
    background-image: url('@/assets/images/homepage/image_1.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 1;
  }

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7); // #000000 70% 透明度
    z-index: 2;
  }

  .hero-content {
    position: relative;
    z-index: 3;
    width: 100%;
    max-width: 1920px;
    margin: 0 auto;
    padding: 0;
    height: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    padding-left: 200px; // 左边缘距离内容区域左边缘 200px
    padding-top: 274px; // 顶部距离 Hero 区域顶部 274px
    padding-bottom: 366px; // 内容区域底部距离 Hero 区域底部 366px
    box-sizing: border-box;
  }

  .hero-text {
    max-width: 704px; // 904px - 200px = 704px（文字块宽度）
    color: #ffffff;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-between;
  }

  .hero-main-title {
    font-size: 3.5rem;
    font-weight: bold;
    line-height: 1.3;
    margin: 0 0 1.5rem 0;
    color: #ffffff;

    .hero-sub-title {
      display: block;
      margin-top: 0.5rem;
    }
  }

  .hero-description {
    font-size: 1.25rem;
    line-height: 1.6;
    margin: 0 0 2rem 0;
    color: #ffffff;
    opacity: 0.95;
  }

  .hero-button {
    padding: 1rem 2.5rem;
    font-size: 1.125rem;
    border-radius: 4px;
    border: 2px solid #ffffff;
    background-color: transparent;
    color: #ffffff;
    transition: all 0.3s ease;
    align-self: flex-start;
    margin-top: auto; // 使用 flex 布局将按钮推到底部

    &:hover {
      background-color: #ffffff;
      color: #333;
    }
  }
}
</style>

