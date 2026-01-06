<template>
  <div class="footer">
    <img class="logo" src="@/assets/images/h5/logo1.png" alt="" />
    <div class="desc">
      致力于为家庭与企业提供全方位保洁与维修服务的专业公司。
    </div>
    <img class="line" src="@/assets/images/h5/line1.png" alt="" />

    <div style="font-weight: 600; font-size: 16px; color: #ffffffe6">
      OASIS ART
    </div>
    <div>首页</div>
    <div>服务</div>
    <div>关于我们</div>
    <div>历史订单</div>

    <div style="margin-top: 30px">工作时间</div>
    <div>周一至周五 9:00AM - 5:00PM</div>
    <div>周六 10:00AM - 6:00PM</div>
    <div>周日 休息</div>
    <div style="margin-top: 30px">联系我们</div>
    <div>Contact@gmail.com</div>
    <div>+1 800 123 123 123</div>
    <img class="line" src="@/assets/images/h5/line1.png" alt="" />
    <div>公网安备3101040200825号 @2025 Oasis Art Co.,Ltd.</div>
  </div>
</template>
<script setup lang="ts"></script>
<style lang="scss" scoped>
.footer {
  background: #000000f2;
  width: 100vw;
  color: #ffffffe6;
  padding: 20px;
  box-sizing: border-box;
  margin-top: auto;
  div{
    margin: 10px 0;
  }
  .logo {
    width: 159px;
    height: 21px;
  }
  .desc {
    font-family: PingFangSC-Regular;
    font-weight: 400;
    font-size: 14px;
    color: #ffffffe6;
    width: 266px;
    letter-spacing: 0;
  }
  .line {
    width: 100%;
  }
}
</style>
