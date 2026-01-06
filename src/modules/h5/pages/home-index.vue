<template>
  <div class="home-index">
    <!-- <div class="home-top"></div> -->
    <img class="home-banner" src="@/assets/images/h5/home-banner.png" alt="" />
    <div class="home-bg">
      <div class="banner-text">一站式服务的 房屋维修</div>
      <div class="banner-desc">服务包括保洁、装修、粉刷</div>
      <div class="banner-btn" @click="goToServiceList">了解更多</div>
    </div>
    <div class="my-service">
      <div class="service-title">我的服务</div>
      <div class="service-list">
        <div
          class="service-item"
          :class="{ active: serviceType === 1 }"
          @click="serviceType = 1"
        >
          保洁
        </div>
        <div
          class="service-item"
          :class="{ active: serviceType === 2 }"
          @click="serviceType = 2"
        >
          维修
        </div>
      </div>
      <div class="service-content">
        <template v-if="serviceType === 1">
          <div
            class="service-content-item"
            v-for="item in displayedServices"
            :key="item.id"
          >
            <img :src="item.image" alt="" />
            <div class="service-content-item-desc">
              <div class="service-content-item-desc-title">
                {{ item.name }}
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="service-empty">暂无数据</div>
        </template>
      </div>
      <div class="service-more" @click="goToServiceList">了解更多</div>
      <div class="service-desc-title">关于我们</div>
      <div class="service-desc-content">
        我们是一家致力于为家庭与企业提供全方位保洁与维修服务的专业公司。秉承“专业、高效、贴心”的服务理念。
      </div>
      <img
        class="service-desc-image"
        src="@/assets/images/h5/image_6.png"
        alt=""
      />
      <div class="service-jieshao-title">专业团队</div>
      <div class="service-jieshao-content">
        我们的服务人员均经过严格培训，技术娴熟，持证上岗。
      </div>
      <img class="line" src="@/assets/images/h5/line2.png" alt="" />
      <div class="service-jieshao-title">品质保障</div>
      <div class="service-jieshao-content">
        使用优质环保材料与工具，严格把控服务质量，并提供服务售后保障。
      </div>
      <img class="line" src="@/assets/images/h5/line2.png" alt="" />
      <div class="service-jieshao-title">高效响应</div>
      <div class="service-jieshao-content">
        快速响应您的需求，灵活安排服务时间，及时解决您的问题。
      </div>
      <img class="line" src="@/assets/images/h5/line2.png" alt="" />
      <div class="service-more" @click="goToAbout">了解更多</div>
      <div class="service-title">服务流程</div>
      <div class="service-sort">01</div>
      <div class="service-jieshao-title">线上下单</div>
      <div class="service-jieshao-content">
        无需反复沟通，轻松在线搞定。线上下单，系统将智能分配订单，您会立即收到确认通知，一切尽在掌握。
      </div>
      <img class="line" src="@/assets/images/h5/line2.png" alt="" />
      <div class="service-sort">02</div>
      <div class="service-jieshao-title">专业执行</div>
      <div class="service-jieshao-content">
        专业团队将准时上门，严格遵循标准化服务流程。我们使用高效的设备与环保的材料。
      </div>
      <img class="line" src="@/assets/images/h5/line2.png" alt="" />
      <div class="service-sort">03</div>
      <div class="service-jieshao-title">售后保障</div>
      <div class="service-jieshao-content">
        期间内如您对服务有任何疑问或不满意，我们将第一时间响应并快速解决，确保您百分百安心无忧。
      </div>
      <img class="line" src="@/assets/images/h5/line2.png" alt="" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getServicesList } from '@/modules/client/api';

const router = useRouter();
const { locale } = useI18n();
const serviceType = ref(1);
const rawRelatedServicesData = ref([]);
const defaultImg = new URL(
  '../../../assets/images/h5/image_3@2x.png',
  import.meta.url
).href;

const fetchRelatedServices = async () => {
  try {
    const response: any = await getServicesList();
    console.log(JSON.stringify(response));
    const servicesData = Array.isArray(response)
      ? response
      : response?.data || (response as any)?.list || [];

    // 保存原始数据
    rawRelatedServicesData.value = servicesData;
  } catch (error: any) {
    console.log('Error fetching related services:', error);
  }
};

const goToServiceList = () => {
  router.push('/products');
};

const goToAbout = () => {
  router.push('/about');
}

// 取前四个服务，并按当前语言选择名称
const displayedServices = computed(() => {
  const langCode = locale.value === 'en' ? 'en-US' : 'zh-CN';
  return (rawRelatedServicesData.value || [])
    .slice(0, 4)
    .map((item: any, idx: number) => {
      const {
        product = {},
        productI18nList = [],
        productImages = [],
      } = item || {};
      const i18n =
        productI18nList.find((i: any) => i?.langCode === langCode) ||
        productI18nList[0] ||
        {};
      return {
        id: product.id ?? idx,
        name: i18n.name || '服务内容',
        image: productImages[0]?.imageUrl || defaultImg,
      };
    });
});

// 组件挂载时获取服务列表
onMounted(() => {
  fetchRelatedServices();
});
</script>

<style scoped lang="scss">
.home-top {
  width: 375px;
  height: 286px;
  background: #00000080;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
}
.home-banner {
  width: 100%;
  height: 286px;
}
.home-bg {
  width: 100%;
  height: 286px;
  background: #00000080;
  position: absolute;
  top: 0;
  padding: 0 20px;
  .banner-text {
    width: 144px;
    height: 66px;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    font-size: 24px;
    color: #ffffff;
    margin-top: 80px;
  }
  .banner-desc {
    width: 168px;
    height: 20px;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    font-size: 14px;
    color: #ffffff;
    letter-spacing: 0;
    margin-top: 10px;
  }
  .banner-btn {
    width: 150px;
    height: 46px;
    background: #2c61f900;
    border: 1px solid #ffffff;
    border-radius: 6px;
    text-align: center;
    line-height: 46px;
    color: #ffffff;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    font-size: 14px;
    margin-top: 30px;
  }
}
.my-service {
  .service-title {
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    font-size: 24px;
    color: #000000;
    letter-spacing: 0;
    text-align: center;
    margin-top: 30px;
  }
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
  .service-content {
    display: flex;
    flex-wrap: wrap;
    padding: 15px;
    justify-content: space-between;
    .service-content-item {
      width: 166px;
      height: 166px;
      background: #00000080;
      position: relative;
      margin-bottom: 10px;
      img {
        width: 100%;
        height: 100%;
      }
      .service-content-item-desc {
        width: 100%;
        height: 100%;
        background: #00000080;
        display: flex;
        position: absolute;
        top: 0;
        left: 0;
        .service-content-item-desc-title {
          font-family: PingFangSC-Semibold;
          font-weight: 600;
          font-size: 18px;
          color: #ffffff;
          letter-spacing: 0;
          margin-top: auto;
          height: 45px;
          line-height: 40px;
          padding-left: 20px;
        }
      }
    }
    .service-empty {
      text-align: center;
      font-size: 20px;
      line-height: 40px;
      width: 100%;
    }
  }
  .service-more {
    width: 150px;
    height: 46px;
    background: #2c61f900;
    border: 1px solid #000000;
    border-radius: 6px;
    text-align: center;
    line-height: 46px;
    margin: 20px auto;
  }
  .service-desc-title {
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    font-size: 24px;
    color: #000000;
    letter-spacing: 0;
    text-align: center;
    height: 40px;
    line-height: 40px;
    text-align: center;
  }
  .service-desc-content {
    font-family: PingFangSC-Regular;
    font-weight: 400;
    font-size: 14px;
    color: #000000e6;
    letter-spacing: 0;
    line-height: 26px;
    text-align: left;
    padding: 15px;
    margin-top: 20px;
  }
  .service-desc-image {
    width: calc(100% - 30px);
    margin-left: 15px;
    height: 253px;
  }
  .service-jieshao-title {
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    font-size: 18px;
    color: #000000e6;
    letter-spacing: 0;
    text-align: left;
    padding: 0 15px;
    margin: 15px 0;
  }
  .service-jieshao-content {
    font-family: PingFangSC-Regular;
    font-weight: 400;
    font-size: 14px;
    color: #000000e6;
    letter-spacing: 0;
    line-height: 26px;
    text-align: left;
    padding: 0 15px;
  }
  .line {
    width: 100%;
  }
  .service-sort {
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    font-size: 42px;
    color: #000000e6;
    letter-spacing: 0;
    text-align: left;
    margin: 10px 15px;
  }
}
</style>
