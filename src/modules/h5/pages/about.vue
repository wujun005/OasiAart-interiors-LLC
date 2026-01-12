<template>
  <div class="about">
    <img
      class="about-banner"
      src="@/assets/images/h5/product-banner.png"
      alt=""
    />
    <div class="about-bg">
      <div class="banner-text">关于我们</div>
    </div>
    <div class="introduction-title">公司介绍</div>
    <img
      class="introduction-img"
      src="@/assets/images/h5/about/about-img1.png"
      alt=""
    />
    <div class="introduction-content">
      我们是一家致力于为家庭与企业提供全方位保洁与维修服务的专业公司。秉承“专业、高效、贴心”的服务理念，我们是一家致力于为家庭与企业提供全方位保洁与维修服务的专业公司。秉承“专业、高效、贴心”的服务理念。
    </div>
    <div class="values-title">我们的价值观</div>
    <div class="values" v-for="item in infos" :key="item.subTitle">
      <img class="values-img" :src="item.imgUrl" alt="" />
      <div class="values-sub-title">{{ item.subTitle }}</div>
      <div class="values-content">
        {{ item.content }}
      </div>
      <img class="values-line" src="@/assets/images/h5/line1.png" alt="" />
    </div>
    <div class="company-title">欢迎莅临我们的公司</div>
    <img
      class="company-img"
      src="@/assets/images/h5/about/about-img2.png"
      alt=""
    />
    <div class="address">
      <div class="address-title">迪拜谢赫·穆罕默德本拉希德大道</div>
      <div class="address-content">
        我们是一家致力于为家庭与企业提供全方位保洁与维修服务的专业公司。秉承“专业、高效、贴心”的服务理念，我们是一家致力于为家庭与企业提供全方位保洁与维修服务的专业公司。秉承“专业、高效、贴心”的服务理念。
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import icon1 from '../../../assets/images/h5/about/bout-icon1.png';
import icon2 from '../../../assets/images/h5/about/about-icon2.png';
import icon3 from '../../../assets/images/h5/about/about-icon3.png';
import icon4 from '../../../assets/images/h5/about/about-icon4.png';
import icon5 from '../../../assets/images/h5/about/about-icon5.png';
const infos = [
  {
    // title: '公司介绍',
    subTitle: '质量',
    imgUrl: icon1,
    content: '我们是一家致力于为家庭与企业提供全方位保洁与维修服务的专业公司。',
  },
  {
    // title: '公司介绍',
    subTitle: '承诺',
    imgUrl: icon2,
    content: '我们是一家致力于为家庭与企业提供全方位保洁与维修服务的专业公司。',
  },
  {
    // title: '公司介绍',
    subTitle: '创新',
    imgUrl: icon3,
    content: '我们是一家致力于为家庭与企业提供全方位保洁与维修服务的专业公司。',
  },
  {
    // title: '公司介绍',
    subTitle: '开放性',
    imgUrl: icon4,
    content: '我们是一家致力于为家庭与企业提供全方位保洁与维修服务的专业公司。',
  },
  {
    // title: '公司介绍',
    subTitle: '团队合作',
    imgUrl: icon5,
    content: '我们是一家致力于为家庭与企业提供全方位保洁与维修服务的专业公司。',
  },
];
</script>
<style lang="scss" scoped>
.about-banner {
  width: 100%;
  height: 200px;
}
.about-bg {
  width: 100%;
  height: 200px;
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
.introduction-title {
  text-align: center;
  font-family: PingFangSC-Semibold;
  font-weight: 600;
  font-size: 24px;
  color: #000000;
  letter-spacing: 0;
  line-height: 100px;
}
.introduction-img {
  width: 343px;
  height: 238.31px;
  display: block;
  margin: 0 auto;
}
.introduction-content {
  width: 343px;
  font-family: PingFangSC-Regular;
  font-weight: 400;
  font-size: 14px;
  color: #000000e6;
  letter-spacing: 0;
  line-height: 26px;
  margin: 20px auto;
}
.values-title {
  font-family: PingFangSC-Semibold;
  font-weight: 600;
  font-size: 24px;
  color: #000000;
  letter-spacing: 0;
  text-align: center;
}
.values {
  display: flex;
  flex-direction: column;
  align-items: center;

  .values-img {
    width: 70px;
    height: 70px;
    background: #f6f6f300;
    margin: 30px;
  }
  .values-sub-title {
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    font-size: 18px;
    color: #000000;
    letter-spacing: 0;
    text-align: center;
  }
  .values-content {
    width: 263px;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    font-size: 14px;
    color: #000000e6;
    letter-spacing: 0.61px;
    text-align: center;
    line-height: 26px;
    margin-top: 20px;
  }
  .values-line {
    width: 343px;
  }
}
.company-title {
  font-family: PingFangSC-Semibold;
  font-weight: 600;
  font-size: 24px;
  color: #000000;
  letter-spacing: 0;
  text-align: center;
  margin: 50px 0
}
.company-img {
  width: 343px;
  height: 337.49px;
  margin: 20px auto;
  display: block;
}
.address {
  width: 343px;
  margin: 40px auto;
  .address-title {
    width: 261px;
    height: 25px;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    font-size: 18px;
    color: #000000;
    letter-spacing: 0;
    text-align: left;
  }
  .address-content {
    font-family: PingFangSC-Regular;
    font-weight: 400;
    font-size: 14px;
    color: #000000e6;
    letter-spacing: 0.61px;
    line-height: 26px;
    text-align: left;
  }
}
</style>
