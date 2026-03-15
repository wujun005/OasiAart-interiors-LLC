export type LegalDocType = 'terms' | 'privacy' | 'deletion';

type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalDoc = {
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
};

type LegalLocale = 'en' | 'zh';

export const LEGAL_DOCS: Record<LegalLocale, Record<LegalDocType, LegalDoc>> = {
  en: {
    terms: {
      title: 'HourX - Terms & Conditions',
      lastUpdated: '____',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          paragraphs: [
            'By accessing or using the HourX platform, you agree to be bound by these Terms & Conditions.',
          ],
        },
        {
          heading: '2. Platform Description',
          paragraphs: [
            'HourX is a professionally managed on-demand home services platform operating in Dubai.',
          ],
        },
        {
          heading: '3. User Obligations',
          paragraphs: ['Users must provide accurate information and comply with applicable laws.'],
        },
        {
          heading: '4. Services & Booking',
          paragraphs: [
            'Services are provided by vetted third-party professionals coordinated through the platform.',
          ],
        },
        {
          heading: '5. Payments & Fees',
          paragraphs: ['All payments are processed via Stripe. HourX does not store card information.'],
        },
        {
          heading: '6. Cancellations & Refunds',
          paragraphs: [
            'Cancellations and refunds are governed by the published Cancellation & Refund Policy.',
          ],
        },
        {
          heading: '7. Limitation of Liability',
          paragraphs: ['HourX is not liable for indirect or consequential losses.'],
        },
        {
          heading: '8. Indemnification',
          paragraphs: ['Users agree to indemnify HourX against claims arising from misuse.'],
        },
        {
          heading: '9. Intellectual Property',
          paragraphs: ['All platform content is owned by HourX.'],
        },
        {
          heading: '10. Governing Law',
          paragraphs: ['These Terms are governed by the laws of the UAE.'],
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: '____',
      intro:
        'HourX ("we", "us", or "our") respects your privacy and is committed to protecting your personal data.',
      sections: [
        {
          heading: '1. Information We Collect',
          bullets: [
            'Full name, phone/WhatsApp number, email address, service address.',
            'Payment-related information is processed by third-party payment providers; we do not store card details.',
            'Device and browser information, IP address, usage records, cookies, and similar technologies.',
          ],
        },
        {
          heading: '2. How We Use Your Information',
          bullets: [
            'Processing and fulfilling bookings.',
            'Assigning and coordinating service providers.',
            'Customer support and communication.',
            'Payment processing, refunds, accounting, platform security, fraud prevention, and compliance.',
            'Improving platform functionality and user experience.',
            'Stripe acts as an independent third-party payment processor; all payment transactions are subject to Stripe terms and privacy policy.',
          ],
        },
        {
          heading: '3. Information Sharing and Disclosure',
          bullets: [
            'We share data only when necessary (service fulfillment, payment, technical operations, legal requirements).',
            'We do not sell, rent, or trade your personal data.',
          ],
        },
        {
          heading: '4. Data Storage and Protection',
          bullets: [
            'Personal data is stored on secure servers.',
            'Reasonable technical and organizational safeguards are implemented.',
            'Access to sensitive information is limited to authorized personnel.',
          ],
        },
        {
          heading: '5. Your Rights',
          bullets: [
            'Access, update, or correct your personal information.',
            'Request account deletion subject to legal requirements.',
            'Withdraw certain processing consents through customer support.',
          ],
        },
        {
          heading: '6. Cookies',
          paragraphs: [
            'We use cookies to enhance user experience. Disabling cookies may affect certain features.',
          ],
        },
        {
          heading: '7. Policy Updates',
          paragraphs: [
            'We may update this policy from time to time. Updates are published on the platform and become effective immediately.',
          ],
        },
        {
          heading: '8. Contact Information',
          paragraphs: ['Email: support@hourxportal.com'],
        },
      ],
    },
    deletion: {
      title: 'User Data Deletion Request',
      lastUpdated: '____',
      intro: 'HourX Portal Co. L.L.C S.O.C',
      sections: [
        {
          heading: 'How to Request Data Deletion',
          paragraphs: [
            'Users can request deletion of their data by sending an email to: support@hourxportal.com',
            'Please include the following information in your request:',
          ],
          bullets: [
            'Your name',
            'Phone number used on our platform',
            'Description of your request',
          ],
        },
        {
          heading: 'Processing Time',
          paragraphs: [
            'We will process your data deletion request within 7 business days after receiving your request.',
          ],
        },
        {
          heading: 'Contact Information',
          paragraphs: [
            'HourX Portal Co. L.L.C S.O.C',
            'Dubai, United Arab Emirates',
            'Email: support@hourxportal.com',
          ],
        },
      ],
    },
  },
  zh: {
    terms: {
      title: 'HourX - 服务条款',
      lastUpdated: '____',
      sections: [
        {
          heading: '1. 条款接受',
          paragraphs: ['访问或使用 HourX 平台，即表示您同意受本服务条款约束。'],
        },
        {
          heading: '2. 平台说明',
          paragraphs: ['HourX 是在迪拜运营的专业化按需家庭服务平台。'],
        },
        {
          heading: '3. 用户义务',
          paragraphs: ['用户需提供真实准确信息，并遵守适用法律法规。'],
        },
        {
          heading: '4. 服务与预约',
          paragraphs: ['平台通过审核的第三方服务人员提供服务，并由平台进行协调安排。'],
        },
        {
          heading: '5. 支付与费用',
          paragraphs: ['所有支付通过 Stripe 处理，HourX 不存储银行卡信息。'],
        },
        {
          heading: '6. 取消与退款',
          paragraphs: ['取消与退款以平台发布的《取消与退款政策》为准。'],
        },
        {
          heading: '7. 责任限制',
          paragraphs: ['HourX 不对间接损失或后果性损失承担责任。'],
        },
        {
          heading: '8. 赔偿义务',
          paragraphs: ['因用户不当使用引发的索赔，用户同意对 HourX 进行赔偿并使其免责。'],
        },
        {
          heading: '9. 知识产权',
          paragraphs: ['平台全部内容及相关权利归 HourX 所有。'],
        },
        {
          heading: '10. 法律适用',
          paragraphs: ['本条款受阿联酋法律管辖。'],
        },
      ],
    },
    privacy: {
      title: '隐私政策',
      lastUpdated: '____',
      intro: 'HourX（以下简称“我们”）高度重视用户的个人信息和隐私保护。',
      sections: [
        {
          heading: '一、信息收集范围',
          bullets: [
            '用户主动提供的信息：姓名、电话/WhatsApp、邮箱、服务地址等。',
            '支付相关信息由第三方支付机构处理，平台不存储银行卡明文。',
            '自动收集的信息：设备与浏览器信息、IP 地址、操作记录、Cookies 等。',
          ],
        },
        {
          heading: '二、信息使用目的',
          bullets: [
            '处理和完成服务订单，安排和协调服务人员。',
            '客户支持与沟通，支付、退款及财务管理。',
            '平台安全、风控与合规，优化平台功能与用户体验。',
            '通过 Stripe 作为指定支付处理方完成支付与退款管理。',
            '所有支付交易同时受 Stripe 自身条款及隐私政策约束。',
          ],
        },
        {
          heading: '三、信息共享与披露',
          bullets: [
            '仅在必要情况下共享（履约、支付、技术服务、依法披露）。',
            '我们不会出售、出租或交易您的个人信息。',
          ],
        },
        {
          heading: '四、数据存储与安全',
          bullets: [
            '数据存储于安全服务器。',
            '采取合理技术与管理措施防止泄露。',
            '仅授权人员可访问敏感信息。',
          ],
        },
        {
          heading: '五、用户权利',
          bullets: [
            '查询、更正、更新个人信息。',
            '在符合法律要求前提下申请删除账户。',
            '撤回部分数据处理授权，可通过客户支持提交请求。',
          ],
        },
        {
          heading: '六、Cookies 使用',
          paragraphs: ['我们使用 Cookies 提升体验，关闭后可能影响部分功能使用。'],
        },
        {
          heading: '七、政策更新',
          paragraphs: ['本隐私政策可能不定期更新，更新后将在平台公布并即时生效。'],
        },
        {
          heading: '八、联系方式',
          paragraphs: ['邮箱：support@hourxportal.com'],
        },
      ],
    },
    deletion: {
      title: '用户数据删除申请',
      lastUpdated: '____',
      intro: 'HourX Portal Co. L.L.C S.O.C',
      sections: [
        {
          heading: '如何申请数据删除',
          paragraphs: [
            '用户可通过发送邮件至 support@hourxportal.com 申请删除其数据。',
            '请在申请中提供以下信息：',
          ],
          bullets: [
            '您的姓名',
            '在平台使用的手机号',
            '删除申请说明',
          ],
        },
        {
          heading: '处理时效',
          paragraphs: [
            '我们将在收到申请后的 7 个工作日内完成数据删除处理。',
          ],
        },
        {
          heading: '联系方式',
          paragraphs: [
            'HourX Portal Co. L.L.C S.O.C',
            '迪拜，阿联酋',
            '邮箱：support@hourxportal.com',
          ],
        },
      ],
    },
  },
};

export const resolveLegalLocale = (locale: string): LegalLocale =>
  locale === 'zh' || locale.startsWith('zh') ? 'zh' : 'en';
