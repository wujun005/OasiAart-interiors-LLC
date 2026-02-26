<template>
  <div class="join-page">
    <section class="join-hero">
      <div class="join-container join-hero__inner">
        <div class="join-hero__content">
          <h1>
            {{ pageCopy.heroTitleLine1 }}<br />
            {{ pageCopy.heroTitleLine2 }}
          </h1>
          <p>{{ pageCopy.heroDesc }}</p>
        </div>
        <div class="join-hero__art">
          <img :src="heroArtUrl" alt="" />
        </div>
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

const cityImageUrl = 'https://www.figma.com/api/mcp/asset/8c23ea27-c49c-4a55-9ad4-3ce082640fa3';
const heroArtUrl = 'https://www.figma.com/api/mcp/asset/6cff5a0e-ef38-4843-a941-f2fd5181e121';
const valueIconShieldUrl = 'https://www.figma.com/api/mcp/asset/3a8ade16-c4bc-43fe-b74b-8c661ab2f39a';
const valueIconClockUrl = 'https://www.figma.com/api/mcp/asset/2b928379-6ecc-473c-a3e5-0180536fcdef';
const valueIconPinUrl = 'https://www.figma.com/api/mcp/asset/6263fb18-6da2-4f67-a2c3-1e96aace388c';
const joinEmailIconUrl = 'https://www.figma.com/api/mcp/asset/22eef040-cbd3-42b3-a107-809100e02a4d';

const joinEmail = 'careers@hourxportal.com';
const isZh = computed(() => locale.value.startsWith('zh'));

const pageCopy = computed(() =>
  isZh.value
    ? {
      badge: '关于我们',
      heroTitleLine1: '致力于打造',
      heroTitleLine2: '更美好的居住生活',
      heroDesc:
        'HourX 是迪拜领先的按需家居服务平台。我们连接专业服务人员与家庭，为您提供从清洁、维修到美容护理的一站式解决方案。',
      introTitle: 'HOURX 公司介绍',
      introDesc:
        'HOURX 是一家立足迪拜的本地按需上门服务平台，通过一个平台、一键预约，将专业服务送到家门口，让生活更高效、更省心。',
      valuesTitle: '我们的核心价值',
      valuesDesc: '我们坚持最高标准的服务质量，为您带来无忧的生活体验。',
      joinTitleLine1: '加入 HOURX',
      joinTitleLine2: '招募本地维修合作伙伴',
      joinDesc:
        'HOURX 正在寻找在迪拜本地从事维修服务、拥有自有团队、具备实际经营经验与执行能力的合作伙伴，共同拓展城市按需服务网络。',
      joinContactLabel: '合作咨询 / 资料投送请联系：',
    }
    : {
      badge: 'About Us',
      heroTitleLine1: 'Building Better',
      heroTitleLine2: 'Living Experiences',
      heroDesc:
        'HourX is a leading on-demand home service platform in Dubai. We connect verified professionals with families for cleaning, maintenance and beauty services in one place.',
      introTitle: 'About HOURX',
      introDesc:
        'HOURX is a Dubai-based local on-demand service platform. With one platform and one-click booking, we deliver trusted professional services directly to your home.',
      valuesTitle: 'Our Core Values',
      valuesDesc: 'We keep the highest service standards so every booking feels reliable and effortless.',
      joinTitleLine1: 'Join HOURX',
      joinTitleLine2: 'Hiring Local Service Partners',
      joinDesc:
        'HOURX is looking for local operators in Dubai with real service experience, active teams and strong execution to grow our citywide on-demand network together.',
      joinContactLabel: 'For partnership details and profile submissions:',
    },
);

const valueItems = computed<JoinValue[]>(() =>
  isZh.value
    ? [
      {
        title: '严格甄选',
        desc: '我们严格甄选并认证每位服务人员，确保您享受真正可靠的专业服务。',
        icon: valueIconShieldUrl,
      },
      {
        title: '高效响应',
        desc: '以高效响应和灵活安排，为您提供快速、及时的家居服务体验。',
        icon: valueIconClockUrl,
      },
      {
        title: '深受信赖',
        desc: '深受迪拜信赖，我们为全城提供专业、高效的家居服务。',
        icon: valueIconPinUrl,
      },
    ]
    : [
      {
        title: 'Strict Selection',
        desc: 'Every professional is carefully screened and verified to ensure dependable, high-quality service.',
        icon: valueIconShieldUrl,
      },
      {
        title: 'Fast Response',
        desc: 'With flexible scheduling and fast response, we deliver timely support when you need it most.',
        icon: valueIconClockUrl,
      },
      {
        title: 'Trusted Locally',
        desc: 'Trusted across Dubai, we provide consistent and professional services citywide.',
        icon: valueIconPinUrl,
      },
    ],
);
</script>

<style scoped lang="scss">
.join-page {
  background: #ffffff;
}

.join-container {
  width: min(1280px, calc(100% - 48px));
  margin: 0 auto;
}

.join-hero {
  position: relative;
  overflow: hidden;
  background: #3972f5;
}

.join-hero::before,
.join-hero::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  filter: blur(50px);
  pointer-events: none;
}

.join-hero::before {
  width: 280px;
  height: 280px;
  top: -110px;
  right: 8%;
}

.join-hero::after {
  width: 220px;
  height: 220px;
  left: -60px;
  bottom: 40px;
  opacity: 0.32;
}

.join-hero__inner {
  min-height: 550px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
  padding: 96px 0;
}

.join-hero__content {
  width: min(584px, 100%);
}

.join-hero__content h1 {
  margin: 0;
  color: #fff;
  font-size: 60px;
  line-height: 1;
  font-weight: 900;
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
  color: #3972f5;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
}

.join-about__left h2 {
  margin: 24px 0 0;
  color: rgba(15, 23, 42, 0.9);
  font-size: 30px;
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
  width: 24px;
  height: 24px;
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
  font-size: 42px;
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
  color: #3972f5;
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
    padding: 72px 0;
    min-height: auto;
    flex-direction: column;
    align-items: flex-start;
  }

  .join-hero__content h1 {
    font-size: 48px;
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
