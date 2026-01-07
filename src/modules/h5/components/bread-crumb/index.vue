<template>
  <div class="bread-crumb">
    <span
      v-for="(item, index) in brandList"
      :key="item.name"
      @click="handleClick(item)"
    >
      <span :class="{ active: index === brandList.length - 1 }">{{
        item.name
      }}</span>
      <img
        v-if="index < brandList.length - 1"
        src="@/assets/images/h5/arrow2.png"
      />
    </span>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';
type Crumb = {
  name: string;
  path: string;
};

defineProps<{
  brandList: Crumb[];
}>();
const router = useRouter();
const handleClick = (item: Crumb) => {
  router.push(item.path);
};
</script>
<style lang="scss" scoped>
.bread-crumb {
  display: flex;
  align-items: center;
  height: 40px;
  line-height: 40px;
  font-family: PingFangSC-Regular;
  font-weight: 400;
  font-size: 14px;
  color: #000000e6;
  padding: 0 20px;
  img {
    width: 12px;
    height: 12px;
    margin: 0 6px;
  }
  .active {
    color: #000000e6;
    font-weight: 600;
  }
}
</style>
