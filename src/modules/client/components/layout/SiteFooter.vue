<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__main">
        <div class="site-footer__brand">
          <h3 class="site-footer__title">HourX Dubai</h3>
          <p class="site-footer__text">为您提供专业而可靠的家庭服务体验，覆盖保洁、维修及美护场景。</p>
          <div class="site-footer__social">
            <span class="site-footer__social-item">f</span>
            <span class="site-footer__social-item">in</span>
            <span class="site-footer__social-item">ig</span>
          </div>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__col-title">快速链接</h4>
          <a href="#home">首页</a>
          <a href="#services">服务</a>
          <a href="#about">关于我们</a>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__col-title">办公时间</h4>
          <p>周一至周五：9:00 - 18:00</p>
          <p>周六：10:00 - 17:00</p>
          <p>周日：休息</p>
        </div>

        <div class="site-footer__col">
          <h4 class="site-footer__col-title">联系我们</h4>
          <p>Info@hourxportal.com</p>
          <p>+971 54 993 6391</p>
          <p>迪拜市中心，阿联酋</p>
        </div>
      </div>

      <div class="site-footer__bottom">
        <p>© {{ year }} HourX Dubai. All Rights Reserved.</p>
        <div class="site-footer__links">
          <a href="#">条款与条件</a>
          <a href="#">隐私政策</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<style scoped lang="scss">
.site-footer {
  background: #091329;
  color: rgba(255, 255, 255, 0.72);
}

.site-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 56px 24px 20px;
}

.site-footer__main {
  display: grid;
  grid-template-columns: 1.3fr repeat(3, 1fr);
  gap: 36px;
  margin-bottom: 28px;
}

.site-footer__title {
  margin: 0 0 14px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.site-footer__text {
  margin: 0;
  line-height: 1.6;
  font-size: 14px;
}

.site-footer__social {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}

.site-footer__social-item {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
}

.site-footer__col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.site-footer__col-title {
  margin: 0 0 4px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.site-footer__col a,
.site-footer__col p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
}

.site-footer__bottom {
  border-top: 1px solid #1d293d;
  padding-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.site-footer__bottom p {
  margin: 0;
  font-size: 12px;
}

.site-footer__links {
  display: flex;
  gap: 14px;
}

.site-footer__links a {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
}

@media (max-width: 900px) {
  .site-footer__inner {
    padding: 40px 16px 16px;
  }

  .site-footer__main {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .site-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
