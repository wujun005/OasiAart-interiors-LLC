<template>
  <section class="home-contact">
    <div class="contact-container">
      <div class="contact-content">
        <h2 class="contact-title">{{ $t('homepage.contact.title') }}</h2>
        <el-button type="primary" size="large" class="contact-button" @click="handleContact">
          {{ $t('homepage.contact.contactUs') }}
        </el-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const handleContact = () => {
  // TODO: 可以跳转到联系页面或打开联系表单
  // 暂时可以滚动到页脚的联系信息
  const footer = document.querySelector('.app-footer');
  if (footer) {
    footer.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>

<style scoped lang="scss">
.home-contact {
  padding: 4rem 0;
  background-color: #f5f5f5;
}

.contact-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 200px;
}

.contact-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  text-align: center;
}

.contact-title {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
}

.contact-button {
  padding: 1rem 3rem;
  font-size: 1.125rem;
  border-radius: 4px;
  background-color: #2d8f7f;
  border: none;
  color: #ffffff;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #247a6b;
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .contact-container {
    padding: 0 100px;
  }
}

@media (max-width: 768px) {
  .contact-container {
    padding: 0 50px;
  }

  .contact-title {
    font-size: 1.5rem;
  }

  .contact-button {
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }
}
</style>

