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
        <el-button type="primary" size="large" class="hero-button">
          {{ $t('homepage.hero.learnMore') }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Hero 组件，显示主横幅区域
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
    padding: 0 2rem;
    // padding-top 已由 homepage-content 统一处理
  }

  .hero-text {
    max-width: 600px;
    color: #ffffff;
    padding-left: 2rem;
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

    &:hover {
      background-color: #ffffff;
      color: #333;
    }
  }
}
</style>

