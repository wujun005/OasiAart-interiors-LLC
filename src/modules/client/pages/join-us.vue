<template>
  <div class="join-page">
    <section class="join-hero">
      <div class="join-container join-hero__inner">
        <div class="join-hero__content">
          <h1>
            {{ pageCopy.heroTitleLine1 }}
            {{ pageCopy.heroTitleLine2 }}
          </h1>
          <p>{{ pageCopy.heroDesc }}</p>
        </div>
        <!-- <div class="join-hero__art">
          <img :src="heroArtUrl" alt="" />
        </div>  -->
      </div>
    </section>

    <section class="join-main">
      <div class="join-container join-main__inner">
        <section class="join-about">
          <div class="join-about__left">
            <span class="join-about__badge">{{ pageCopy.badge }}</span>
            <h2>{{ pageCopy.introTitle }}</h2>
            <p class="join-about__desc">{{ pageCopy.introDesc }}</p>

            <div class="join-values">
              <header class="join-values__head">
                <h3>{{ pageCopy.valuesTitle }}</h3>
                <p>{{ pageCopy.valuesDesc }}</p>
              </header>

              <article v-for="item in valueItems" :key="item.title" class="join-value">
                <div class="join-value__icon">
                  <img :src="item.icon" alt="" />
                </div>
                <div class="join-value__body">
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.desc }}</p>
                </div>
              </article>
            </div>
          </div>

          <div class="join-about__right">
            <img :src="cityImageUrl" :alt="pageCopy.badge" />
          </div>
        </section>

        <section class="join-partner">
          <h2>
            {{ pageCopy.joinTitleLine1 }}<br />
            {{ pageCopy.joinTitleLine2 }}
          </h2>
          <p>{{ pageCopy.joinDesc }}</p>
          <div class="join-partner__contact">
            <strong>{{ pageCopy.joinContactLabel }}</strong>
            <a :href="`mailto:${joinEmail}`">
              <img :src="joinEmailIconUrl" alt="" />
              {{ joinEmail }}
            </a>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

type JoinValue = {
  title: string;
  desc: string;
  icon: string;
};

const { locale } = useI18n({ useScope: 'global' });

// const cityImageUrl = 'https://www.figma.com/api/mcp/asset/8c23ea27-c49c-4a55-9ad4-3ce082640fa3';
const cityImageUrl = new URL('@/assets/images/client/Container.png', import.meta.url).href;
const valueIconShieldUrl = new URL('@/assets/images/client/icon2.png', import.meta.url).href;;
const valueIconClockUrl = new URL('@/assets/images/client/icon3.png', import.meta.url).href;
const valueIconPinUrl = new URL('@/assets/images/client/icon4.png', import.meta.url).href;
const joinEmailIconUrl = new URL('@/assets/images/client/email.png', import.meta.url).href;

const joinEmail = 'careers@hourxportal.com';
const isZh = computed(() => locale.value.startsWith('zh'));

const pageCopy = computed(() =>
  isZh.value
    ? {
      badge: '关于我们',
      heroTitleLine1: '加入HourX成为服务合作伙伴',
      heroTitleLine2: '',
      heroDesc:
        '通过值得信赖的上门服务平台，连接迪拜各地客户,拓展您的业务并实现增长。成为合作伙伴',
      introTitle: '为什么选择我们关于HourX',
      introDesc:
        'HourX是一家专注迪拜市场的本地化上门服务平台。通过统一平台预约与专业团队管理，为您提供高效、可靠的居家服务。',
      valuesTitle: '关于HourX',
      valuesDesc: '所有服务人员均经过严格筛选与认证，确保每一次上门服务都专业、安心、值得信赖。',
      joinTitleLine1: '加入 HourX',
      joinTitleLine2: '服务合作伙伴和专业人员',
      joinDesc:
        'HourX正在寻找位于迪拜的服务合作伙伴和专业技师，加入我们不断发展的按需上门服务网络。如果您拥有经验丰富的团队，并具备良好的服务意识，我们欢迎您与HourX一起发展业务，共同成长。',
      joinContactLabel: '申请加入HourX',
    }
    : {
      badge: 'About HourX',
      heroTitleLine1: 'Join HourX as a',
      heroTitleLine2: 'Service Partner',
      heroDesc:
        'Connect with customers across Dubai and grow your business through a trusted home service platform.',
      introTitle: 'Why Choose HourX',
      introDesc:
        'HourX is a Dubai-based on-demand home service platform. With a unified booking system and professionally managed service network, we deliver efficient and reliable home services to your doorstep.',
      valuesTitle: 'About HourX',
      valuesDesc:
        'All professionals are carefully vetted and verified to ensure every service is safe, professional, and trustworthy.',
      joinTitleLine1: 'Join HourX',
      joinTitleLine2: 'Service Partners & Professionals',
      joinDesc:
        'HourX is looking for Dubai-based service partners and skilled professionals to join our growing on-demand home service network. If you have an experienced team and a strong service mindset, we welcome you to grow your business with HourX.',
      joinContactLabel: 'Apply to Join HourX:',
    },
);

const valueItems = computed<JoinValue[]>(() =>
  isZh.value
    ? [
      {
        title: '专业',
        desc: '严选认证',
        icon: valueIconShieldUrl,
      },
      {
        title: '快速',
        desc: '高效响应',
        icon: valueIconClockUrl,
      },
      {
        title: '可靠',
        desc: '值得信赖',
        icon: valueIconPinUrl,
      },
    ]
    : [
      {
        title: 'Professional',
        desc: 'Vetted professionals',
        icon: valueIconShieldUrl,
      },
      {
        title: 'Fast',
        desc: 'Quick response',
        icon: valueIconClockUrl,
      },
      {
        title: 'Reliable',
        desc: 'Trusted service',
        icon: valueIconPinUrl,
      },
    ],
);
</script>

<style scoped lang="scss">
.join-page {
  --join-hero-aspect-ratio: 2858 / 1200;
  background: #ffffff;
}

.join-container {
  width: min(1280px, calc(100% - 48px));
  margin: 0 auto;
}

.join-hero {
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: var(--join-hero-aspect-ratio);
  background: #12B0FF url('../../../assets/images/client/kv_joinus@2x.png') no-repeat center / 100% 100%;
}

.join-hero__inner {
  min-height: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
  // padding: 96px 0;
}

.join-hero__content {
  // width: min(584px, 100%);
}

.join-hero__content h1 {
  margin: 0;
  color: #fff;
  font-size: 40px;
  line-height: 1;
  font-weight: 900;
  white-space: nowrap;
}

.join-hero__content p {
  margin: 24px 0 0;
  color: #dbeafe;
  font-size: 20px;
  line-height: 1.6;
  font-weight: 500;
  max-width: 540px;
}

.join-hero__art {
  width: min(448px, 42vw);
  min-width: 320px;
}

.join-hero__art img {
  width: 100%;
  height: auto;
  display: block;
}

.join-main {
  background: #f8fafc;
  padding: 80px 0 120px;
}

.join-about {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 64px;
  align-items: start;
}

.join-about__badge {
  height: 32px;
  padding: 0 16px;
  border-radius: 999px;
  background: #eff6ff;
  color: #12B0FF;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
}

.join-about__left h2 {
  margin: 24px 0 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 26px;
  line-height: 1.2;
  font-weight: 900;
}

.join-about__desc {
  margin: 24px 0 0;
  color: rgba(15, 23, 42, 0.55);
  font-size: 18px;
  line-height: 1.6;
  font-weight: 500;
}

.join-values {
  margin-top: 48px;
}

.join-values__head h3 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 24px;
  line-height: 1.2;
  font-weight: 900;
}

.join-values__head p {
  margin: 12px 0 0;
  color: rgba(15, 23, 42, 0.5);
  font-size: 16px;
  line-height: 1.5;
  font-weight: 500;
}

.join-value {
  margin-top: 24px;
  display: flex;
  gap: 16px;
}

.join-value__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #eff6ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.join-value__icon img {
  width: 48px;
  height: 48px;
}

.join-value__body h4 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 18px;
  line-height: 1.4;
  font-weight: 800;
}

.join-value__body p {
  margin: 4px 0 0;
  color: rgba(15, 23, 42, 0.5);
  font-size: 14px;
  line-height: 1.6;
}

.join-about__right {
  min-height: 432px;
  border-radius: 24px;
  overflow: hidden;
}

.join-about__right img {
  width: 100%;
  height: 432px;
  object-fit: cover;
  display: block;
}

.join-partner {
  margin-top: 96px;
  border-radius: 24px;
  background: #eff6ff;
  padding: 56px 64px;
}

.join-partner h2 {
  margin: 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 30px;
  line-height: 1.15;
  font-weight: 900;
}

.join-partner p {
  margin: 20px 0 0;
  color: rgba(15, 23, 42, 0.56);
  font-size: 18px;
  line-height: 1.6;
  max-width: 860px;
}

.join-partner__contact {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.join-partner__contact strong {
  color: rgba(15, 23, 42, 0.9);
  font-size: 16px;
  line-height: 1.5;
  font-weight: 700;
}

.join-partner__contact a {
  height: 40px;
  border-radius: 10px;
  background: #fff;
  color: #12B0FF;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 700;
}

.join-partner__contact a img {
  width: 16px;
  height: 16px;
}

@media (max-width: 1024px) {
  .join-hero__inner {
    padding: 0;
    min-height: 100%;
    height: 100%;
    flex-direction: row;
    align-items: center;
  }

  .join-hero__content h1 {
    font-size: 38px;
    white-space: normal;
  }

  .join-hero__art {
    width: min(420px, 100%);
    min-width: 0;
    margin-left: auto;
  }

  .join-about {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .join-about__right {
    min-height: 320px;
  }

  .join-about__right img {
    height: 320px;
  }

  .join-partner {
    margin-top: 64px;
    padding: 40px 32px;
  }

  .join-partner h2 {
    font-size: 34px;
  }
}

@media (max-width: 768px) {
  .join-container {
    width: min(1280px, calc(100% - 32px));
  }

  .join-hero__content h1 {
    font-size: 38px;
    line-height: 1.1;
  }

  .join-hero__content p {
    font-size: 17px;
  }

  .join-main {
    padding: 56px 0 72px;
  }

  .join-about__left h2 {
    font-size: 26px;
  }

  .join-about__desc {
    font-size: 16px;
  }

  .join-partner h2 {
    font-size: 28px;
  }

  .join-partner p {
    font-size: 16px;
  }

  .join-partner__contact a {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
