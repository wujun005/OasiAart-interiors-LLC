<template>
  <div class="service-card">
    <div class="service-image-wrapper">
      <img
        :src="service.imageUrl"
        :alt="$t(service.name)"
        class="service-image"
        loading="lazy"
      />
    </div>
    <div class="service-overlay">
      <h3 class="service-name">{{ $t(service.name) }}</h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Service } from '../../types/homepage';

defineProps<{
  service: Service;
}>();
</script>

<style scoped lang="scss">
.service-card {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  .service-image-wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .service-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover .service-image {
    transform: scale(1.05);
  }

  .service-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
    padding: 1.5rem;
  }

  .service-name {
    color: #ffffff;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}
</style>

