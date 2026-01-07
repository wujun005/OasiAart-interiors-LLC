<template>
  <div class="service-list">
    <div
      class="service-item"
      :class="{ active: serviceType === 1 }"
      @click="handleClick(1)"
    >
      保洁
    </div>
    <div
      class="service-item"
      :class="{ active: serviceType === 2 }"
      @click="handleClick(2)"
    >
      维修
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
const serviceType = ref(1);
const emit = defineEmits<{
  (e: 'switch'): void;
}>(); 
const handleClick = (type: number) => {
  serviceType.value = type;
  emit('switch', type);
};
</script>
<style lang="scss" scoped>
.service-list {
  width: 120px;
  display: flex;
  margin: 40px auto;
  justify-content: space-between;
  .service-item {
    // width: 50%;
    font-weight: 400;
    font-size: 14px;
    color: #000000e6;
    letter-spacing: 0;
    text-align: center;
    line-height: 30px;
    &.active {
      border-bottom: 2px solid #000000;
    }
  }
}
</style>
