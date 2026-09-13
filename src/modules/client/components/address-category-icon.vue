<template>
  <svg
    class="address-category-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g v-if="category === 'home'">
      <path d="M3.75 10.25 12 3.75l8.25 6.5" />
      <path d="M5.5 9.15v10.6h13V9.15" />
      <path d="M9.35 19.75v-5.8h5.3v5.8" />
    </g>
    <g v-else-if="category === 'office'">
      <rect x="3.5" y="7.25" width="17" height="12.5" rx="2" />
      <path d="M8.5 7.25V5.8c0-.86.7-1.55 1.55-1.55h3.9c.86 0 1.55.7 1.55 1.55v1.45" />
      <path d="M3.5 11.25h17" />
      <path d="M10 11.25v1.55h4v-1.55" />
    </g>
    <g v-else>
      <path d="M19.25 10.15c0 5.3-7.25 10.1-7.25 10.1s-7.25-4.8-7.25-10.1a7.25 7.25 0 1 1 14.5 0Z" />
      <circle cx="12" cy="10.15" r="2.35" />
    </g>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  category: "home" | "office" | "others"
}>()
</script>

<style scoped>
.address-category-icon {
  width: 1em;
  height: 1em;
  display: block;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
