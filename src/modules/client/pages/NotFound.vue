<template>
  <div class="not-found-page">
    <AppHeader />

    <main class="not-found-content">
      <!-- 404 Section -->
      <section class="not-found-section">
        <div class="not-found-container">
          <div class="not-found-main">
            <h1 class="error-code">404</h1>
            <h2 class="error-title">{{ $t('notFound.title') }}</h2>
            <p class="error-description">{{ $t('notFound.description') }}</p>
            <div class="error-actions">
              <el-button type="primary" size="large" class="home-button" @click="handleGoHome">
                {{ $t('notFound.goHome') }}
              </el-button>
              <el-button size="large" class="back-button" @click="handleGoBack">
                {{ $t('notFound.goBack') }}
              </el-button>
            </div>
          </div>
        </div>
      </section>

      <AppFooter />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppHeader from '../components/Header/index.vue';
import AppFooter from '../components/Footer/index.vue';

const router = useRouter();

const handleGoHome = () => {
  router.push('/');
};

const handleGoBack = () => {
  router.go(-1);
};
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.not-found-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 80px; // 为固定 header 留出空间
}

.not-found-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  min-height: calc(100vh - 80px - 342px); // 减去 header 和 footer 的高度
}

.not-found-container {
  max-width: 800px;
  width: 100%;
  text-align: center;
}

.not-found-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.error-code {
  font-size: 8rem;
  font-weight: bold;
  color: #2d8f7f;
  line-height: 1;
  margin: 0;
}

.error-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.2;
}

.error-description {
  font-size: 1.125rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
  max-width: 600px;
}

.error-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.home-button {
  padding: 0.875rem 2.5rem;
  font-size: 1rem;
  font-weight: 500;
}

.back-button {
  padding: 0.875rem 2.5rem;
  font-size: 1rem;
  font-weight: 500;
  border: 1px solid #dcdfe6;
  background-color: #ffffff;
  color: #333;

  &:hover {
    border-color: #2d8f7f;
    color: #2d8f7f;
    background-color: #ffffff;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .not-found-section {
    padding: 3rem 1.5rem;
    min-height: calc(100vh - 80px - 342px);
  }

  .error-code {
    font-size: 6rem;
  }

  .error-title {
    font-size: 2rem;
  }

  .error-description {
    font-size: 1rem;
  }

  .error-actions {
    flex-direction: column;
    width: 100%;
    
    .home-button,
    .back-button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .error-code {
    font-size: 5rem;
  }

  .error-title {
    font-size: 1.75rem;
  }
}
</style>
