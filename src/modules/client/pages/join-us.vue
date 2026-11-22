<template>
  <div class="join-page">
    <section class="join-hero" aria-labelledby="join-heading">
      <div class="join-container join-hero__inner">
        <div class="join-hero__copy">
          <p class="join-hero__label">{{ copy.label }}</p>
          <h1 id="join-heading">{{ copy.title }} <em>{{ copy.titleSecondLine }}</em></h1>
          <p class="join-hero__description">{{ copy.description }}</p>
          <div class="join-hero__actions">
            <RouterLink :to="{ name: 'supplier-onboarding' }" class="join-button join-button--accent">
              {{ copy.apply }}
              <span aria-hidden="true">↗</span>
            </RouterLink>
            <a class="join-button join-button--outline" href="#join-process" @click.prevent="showProcess">
              {{ copy.processLink }}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <aside class="join-eligibility" aria-labelledby="join-eligibility-heading">
          <h2 id="join-eligibility-heading">{{ copy.eligibilityTitle }}</h2>
          <ul>
            <li v-for="requirement in copy.eligibility" :key="requirement">
              <span aria-hidden="true">✓</span>{{ requirement }}
            </li>
          </ul>
        </aside>
      </div>
    </section>

    <section
      id="join-process"
      ref="process"
      class="join-process join-container"
      aria-labelledby="join-process-title"
      tabindex="-1"
    >
      <header class="join-process__header">
        <div>
          <p class="join-process__label">{{ copy.processLink }}</p>
          <h2 id="join-process-title">{{ copy.processTitle }}</h2>
        </div>
        <a :href="emailLink" class="join-contact">
          {{ copy.contact }}
          <span aria-hidden="true">↗</span>
        </a>
      </header>
      <ol class="join-steps">
        <li v-for="(step, index) in copy.steps" :key="step.title">
          <span class="join-step__number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </li>
      </ol>
      <div class="join-review">
        <h3>{{ copy.reviewTitle }}</h3>
        <p>{{ copy.reviewDescription }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const partnerEmail = 'partners@hourxportal.com';
const emailLink = `mailto:${partnerEmail}`;
const { locale } = useI18n({ useScope: 'global' });
const process = ref<HTMLElement | null>(null);

function showProcess() {
  process.value?.focus({ preventScroll: true });
  process.value?.scrollIntoView({ block: 'start' });
}

const copy = computed(() => locale.value.startsWith('zh')
  ? {
    label: '企业入驻',
    title: '成为 HourX',
    titleSecondLine: '服务合作伙伴',
    description: '在迪拜提供上门服务的企业，可申请加入 HourX，让本地客户找到您的服务。',
    apply: '立即申请',
    processLink: '入驻流程',
    eligibilityTitle: '企业申请条件',
    eligibility: ['在迪拜提供上门服务', '拥有自己的专业服务团队', '持有有效营业执照'],
    processTitle: '如何开展商家合作',
    steps: [
      { title: '填写企业资料', description: '提供营业执照信息、联系方式，选择可提供的服务。' },
      { title: '提交申请', description: 'HourX 团队审核您提交的资料。' },
      { title: '接收入驻邮件', description: '审核通过后，查收后台登录信息。' },
    ],
    contact: '合作咨询',
    reviewTitle: '准备好加入 HourX 了吗？',
    reviewDescription: 'HourX 团队会先审核您的申请，审核通过后即可访问合作伙伴工作台。',
  }
  : {
    label: 'Company Partnerships',
    title: 'Become an HourX',
    titleSecondLine: 'Service Partner',
    description: 'Connect your home services business with customers across Dubai.',
    apply: 'Apply Now',
    processLink: 'How It Works',
    eligibilityTitle: 'Who Can Apply',
    eligibility: ['Dubai-based service companies', 'With your own professional team', 'A valid trade license'],
    processTitle: 'How to Become a Partner',
    steps: [
      { title: 'Enter Your Company Details', description: 'Provide your company information, trade license details, and the services you offer.' },
      { title: 'Submit Your Application', description: 'Our team will review your application and contact you if additional information is needed.' },
      { title: 'Get Your Approval & Access', description: 'Once approved, you’ll receive an email with instructions to access your partner workspace.' },
    ],
    contact: 'Partnership Inquiries',
    reviewTitle: 'Ready to Grow with HourX?',
    reviewDescription: 'Applications are reviewed by the HourX team before access is granted.',
  });
</script>

<style scoped>
.join-page {
  min-height: 100vh;
  background: var(--hourx-client-canvas);
  color: var(--hourx-client-text);
}

.join-container {
  box-sizing: border-box;
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 24px;
}

.join-hero {
  background-color: var(--hourx-client-text);
  background-image:
    linear-gradient(rgb(184 154 114 / 6%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(184 154 114 / 6%) 1px, transparent 1px);
  background-size: 48px 48px;
  color: #fff;
}

.join-hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);
  min-height: 520px;
  align-items: center;
  gap: 56px;
  padding-block: 64px;
}

.join-hero__copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 22px;
}

.join-hero__label,
.join-process__label {
  margin: 0;
  font-size: var(--hourx-client-size-label);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.join-hero__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border: 1px solid rgb(184 154 114 / 35%);
  border-radius: 999px;
  color: var(--hourx-client-accent);
}

.join-hero__label::before {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  content: '';
}

.join-hero h1 {
  margin: 0;
  font: 700 var(--hourx-client-size-hero)/1.12 var(--hourx-client-heading-font);
  letter-spacing: -.02em;
}

.join-hero h1 em {
  color: var(--hourx-client-accent);
  font-style: normal;
}

.join-hero__description {
  max-width: 460px;
  margin: 0;
  color: var(--hourx-client-on-dark);
  font-size: var(--hourx-client-size-body);
  line-height: 1.6;
}

.join-hero__actions,
.join-process__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.join-button,
.join-contact {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--hourx-client-size-action);
  font-weight: 600;
  text-decoration: none;
}

.join-button {
  box-sizing: border-box;
  min-height: 52px;
  justify-content: center;
  padding: 8px 24px;
  border: 1px solid transparent;
  border-radius: 12px;
}

.join-button--accent {
  background: var(--hourx-client-accent);
  color: var(--hourx-client-text);
}

.join-button--accent:hover {
  background: #efebe4;
  color: var(--hourx-client-text);
}

.join-button--outline {
  color: #fff;
  border-color: rgb(255 255 255 / 24%);
}

.join-button--outline:hover {
  color: var(--hourx-client-accent);
  border-color: currentColor;
}

.join-eligibility {
  display: grid;
  gap: 18px;
  padding: 28px;
  border-radius: 20px;
  background: #fff;
  color: var(--hourx-client-text);
  box-shadow: 0 24px 60px rgb(0 0 0 / 28%);
}

.join-eligibility h2 {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.3;
}

.join-eligibility ul {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.join-eligibility li {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: var(--hourx-client-size-action);
}

.join-contact {
  color: var(--hourx-client-text);
}

.join-contact:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.join-process {
  padding-block: var(--hourx-client-section-space);
  scroll-margin-top: 80px;
}

.join-process__header {
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
}

.join-process__label {
  margin-bottom: 10px;
}

.join-process h2 {
  margin: 0;
  font: 700 var(--hourx-client-size-section)/1.25 var(--hourx-client-heading-font);
  letter-spacing: -.015em;
}

.join-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.join-steps li,
.join-review {
  border: 1px solid var(--hourx-client-border);
  border-radius: 16px;
  background: #fff;
}

.join-steps li {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
  padding: 24px;
}

.join-step__number {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  background: var(--hourx-client-text);
  color: var(--hourx-client-accent);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.join-process h3 {
  margin: 0;
  font-size: var(--hourx-client-size-card);
  font-weight: 600;
  line-height: 1.3;
}

.join-steps p,
.join-review p {
  margin: 0;
  color: var(--hourx-client-muted);
  font-size: var(--hourx-client-size-body);
  line-height: 1.55;
}

.join-review {
  margin-top: 24px;
  padding: 28px 32px;
}

.join-review p {
  margin-top: 6px;
}

@media (max-width: 1024px) {
  .join-hero__inner {
    grid-template-columns: 1fr;
    min-height: 0;
  }
}

@media (max-width: 640px) {
  .join-container {
    padding-inline: 16px;
  }

  .join-hero__inner {
    gap: 28px;
    padding-block: 40px;
  }

  .join-eligibility, .join-review {
    padding: 20px;
  }

  .join-process__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .join-steps {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .join-steps li {
    min-height: 0;
  }
}
</style>
