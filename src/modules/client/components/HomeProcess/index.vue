<template>
  <section class="home-process">
    <div class="process-container">
      <h2 class="process-title">{{ $t('homepage.process.title') }}</h2>

      <!-- Process Steps -->
      <div class="process-steps">
        <div
          v-for="(process, index) in serviceProcesses"
          :key="process.id"
          :class="['process-step', `step-${index + 1}`]"
        >
          <div class="step-number">{{ process.stepNumber }}</div>
          <div class="step-content">
            <h3 class="step-title">{{ $t(process.title) }}</h3>
            <p class="step-description">{{ $t(process.description) }}</p>
            <div class="step-divider"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { serviceProcesses } from '../../data/homepage';
</script>

<style scoped lang="scss">
.home-process {
  padding: 4rem 0;
  background-color: #f5f5f5; // 浅灰色背景
}

.process-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 200px;
}

.process-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0 0 3rem 0;
  color: #333;
}

.process-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4rem;
  align-items: start;
  position: relative;
}

.process-step {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

// 阶梯状布局：每个步骤向上偏移，形成阶梯效果
.step-1 {
  margin-top: 6rem;
}

.step-2 {
  margin-top: 3rem;
}

.step-3 {
  margin-top: 0;
}

.step-number {
  font-size: 3rem;
  font-weight: bold;
  color: #333;
  line-height: 1;
  margin: 0;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.step-description {
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
  margin: 0;
}

.step-divider {
  width: 100%;
  height: 1px;
  background-color: #e0e0e0;
  margin-top: 1.5rem;
}

// 响应式设计
@media (max-width: 1024px) {
  .process-steps {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .process-container {
    padding: 0 100px;
  }
}

@media (max-width: 768px) {
  .process-container {
    padding: 0 50px;
  }

  .process-title {
    font-size: 2rem;
  }

  .step-number {
    font-size: 2.5rem;
  }

  .step-title {
    font-size: 1.25rem;
  }
}
</style>

