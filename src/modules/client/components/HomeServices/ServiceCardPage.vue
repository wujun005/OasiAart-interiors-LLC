<template>
  <div class="service-card-page">
    <div class="service-image-wrapper">
      <img
        :src="service.imageUrl"
        :alt="$t(service.name)"
        class="service-image"
        loading="lazy"
      />
    </div>
    <div class="service-info">
      <h3 class="service-name">{{ $t(service.name) }}</h3>
      <img
        :src="arrowIcon"
        alt="arrow"
        class="service-arrow"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Service } from '../../types/homepage';
import arrowIcon from '@/assets/images/homepage/arrow.png';

defineProps<{
  service: Service;
}>();

const { t } = useI18n();
</script>

<style scoped lang="scss">
.service-card-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  .service-image-wrapper {
    width: 100%;
    aspect-ratio: 4 / 3; // 保持4:3比例，更符合图片样式
    overflow: hidden;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .service-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: center;
    transition: transform 0.3s ease;
  }

  &:hover .service-image {
    transform: scale(1.05);
  }

  .service-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #d0d0d0;
    margin-top: 0.5rem;
  }

  .service-name {
    color: #333;
    font-size: 1rem;
    font-weight: 400;
    margin: 0;
    flex: 1;
    line-height: 1.5;
    transition: font-weight 0.3s ease;
  }

  &:hover .service-name {
    font-weight: 600;
  }

  .service-arrow {
    width: 24px;
    height: 24px;
    object-fit: contain;
    transition: transform 0.3s ease;
    flex-shrink: 0;
    display: block;
    opacity: 1;
  }

  &:hover .service-arrow {
    transform: translateX(4px);
  }
}
</style>

