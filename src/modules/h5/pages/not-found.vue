<template>
  <div class="not-found">
    <van-empty image="error" description="页面走丢了">
      <van-button type="primary" round @click="$router.replace('/')">返回首页</van-button>
    </van-empty>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
