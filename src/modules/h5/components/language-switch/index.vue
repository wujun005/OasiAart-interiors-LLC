<template>
  <div class="right" @click="toggleLang">
    <img src="@/assets/images/language.png" alt="" />
    <div class="right-text">{{ currentLangLabel }}</div>
    <img src="@/assets/images/arrow.png" alt="" />
    <div v-if="showLang" class="right-dialog">
      <div
        v-for="item in langOptions"
        :key="item.value"
        class="right-dialog-item"
        :class="{ borderBottom: item.value === 'zh' }"
        @click.stop="switchLocale(item.value)"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { locale } = useI18n({ useScope: 'global' });
const showLang = ref(false);
const langOptions = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' },
];
const toggleLang = () => {
  showLang.value = !showLang.value;
};
const switchLocale = (val: string) => {
  locale.value = val;
  localStorage.setItem('h5-locale', val);
  showLang.value = false;
};
const currentLangLabel = computed(
  () => langOptions.find((i) => i.value === locale.value)?.label || '中文'
);
</script>
<style lang="scss" scoped>
.right {
  display: flex;
  align-items: center;
  width: 70px;
  margin-left: auto;
  position: relative;
  img {
    width: 15.22px;
    height: 15.22px;
  }
  .right-text {
    margin-left: 5px;
    font-weight: 500;
    font-size: 14px;
    color: #000000;
  }
  .right-dialog {
    position: absolute;
    width: 192px;
    background: #f5f5f5;
    border: 1px solid #00000026;
    border-radius: 6px;
    padding: 10px;
    top: 25px;
    right: 5px;
    .right-dialog-item {
      font-weight: 500;
      font-size: 14px;
      color: #000000;
      letter-spacing: 0;
      cursor: pointer;
      line-height: 30px;
    }
    .borderBottom {
      border-bottom: 1px solid #0000000f;
    }
    .line {
      width: 160px;
      height: 1px;
      background: #0000000f;
      margin: 10px 0;
    }
  }
}
</style>
