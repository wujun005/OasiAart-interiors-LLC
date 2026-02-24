import enBase from './en.json';
import zhBase from './zh.json';

export type ClientLocale = 'en' | 'zh';

export const CLIENT_LOCALE_STORAGE_KEY = 'client-locale';
export const CLIENT_DEFAULT_LOCALE: ClientLocale = 'en';

const clientExtraMessages = {
  en: {
    client: {
      header: {
        nav: {
          home: 'Home',
          services: 'Services',
          orders: 'Orders',
          joinUs: 'Join Us',
        },
        auth: 'Login / Sign up',
        user: 'User',
        profile: 'Profile',
        logout: 'Logout',
        language: 'Language',
        languageZh: '中文',
        languageEn: 'English',
      },
      footer: {
        tagline:
          'Reliable home services across cleaning, maintenance, and wellness.',
        quickLinks: 'Quick Links',
        services: 'Services',
        about: 'About Us',
        businessHours: 'Business Hours',
        weekday: 'Mon - Fri: 9:00 - 18:00',
        saturday: 'Sat: 10:00 - 17:00',
        sunday: 'Sun: Closed',
        contactUs: 'Contact Us',
        address: 'Downtown Dubai, UAE',
        copyright: '© {year} HourX Dubai. All Rights Reserved.',
        terms: 'Terms & Conditions',
        privacy: 'Privacy Policy',
      },
      home: {
        alt: {
          hero: 'HourX cleaning team',
          supportAgent: 'Support agent',
          about: 'HourX service team',
        },
        hero: {
          eyebrow: 'HourX · Professionally managed on-demand home services',
          titleLine1: 'One booking,',
          titleLine2: 'everything handled at your door',
          desc: 'Efficient · Reliable · Hassle-free',
          cta: 'Book Now',
          tag1: 'Professional',
          tag2: 'Fast',
          tag3: 'Reliable',
        },
        contactCard: {
          title: 'Contact Us',
          button: 'Support',
        },
        sections: {
          servicesTitle: 'Services',
          servicesSubtitle: 'Choose a service and complete your booking fast',
          serviceCardsTitle: 'Limited Offers',
          serviceCardsDesc:
            'From routine cleaning to deep maintenance, flexible booking without long-term contracts.',
          bookingTitle: 'Simple Booking Process',
          bookingSubtitle: '3 steps to complete booking and assignment',
          aboutTitle: 'Why Choose Us?',
          aboutSubtitle: 'Unified management for your home services',
          aboutDesc:
            'A standardized local service team in Dubai focused on quality, efficiency and transparency.',
        },
        serviceCard: {
          badge: 'Limited Offer',
          button: 'View Offer',
          priceConsult: 'Limited offer · Contact for price',
          priceFrom: 'Limited offer · {price} from / 45 min',
        },
        bookingForm: {
          title: 'Booking Details',
          dateLabel: 'Service Date',
          datePlaceholder: '07 / 31',
          typeLabel: 'Service Type',
          typePlaceholder: 'Please select service',
          contactLabel: 'Contact',
          contactPlaceholder: 'Please enter phone number',
          next: 'Next',
        },
        steps: {
          step1Title: 'Select Service',
          step1Desc: 'Choose the service and schedule',
          step2Title: 'Confirm Order',
          step2Desc: 'The platform assigns suitable professionals',
          step3Title: 'Secure Payment',
          step3Desc: 'Pay safely and settle after service completion',
          step4Title: 'Acceptance',
          step4Desc:
            'Review and confirm results online with feedback and after-sales support.',
        },
        aboutIntro: {
          title: 'About HourX',
          desc: 'HourX connects families with professional service teams for cleaning, maintenance, and home care.',
          bullet1: 'HourX is a Dubai-based on-demand home service platform',
          bullet2: 'Book everything in one place, managed through one workflow',
          bullet3: 'Vetted professionals are arranged by standardized process',
          bullet4: 'Make home services faster, safer, and easier',
        },
        defaults: {
          unnamedService: 'Unnamed Service',
          comingSoon: 'Coming Soon',
          menu1: 'Home Cleaning',
          menu2: 'Deep Cleaning',
          menu3: 'AC Service',
          menu4: 'Painting',
          menu5: 'Salon & Spa',
          card1Title: 'Home Cleaning',
          card1Desc:
            'Flexible coverage for living rooms, bedrooms, and kitchens.',
          card1Price: 'Limited offer · 100 from / 45 min',
          card2Title: 'Deep Cleaning',
          card2Desc:
            'Professional deep cleaning for hard-to-clean areas and stains.',
          card2Price: 'Limited offer · 100 from / 45 min',
          card3Title: 'AC Cleaning & Maintenance',
          card3Desc:
            'Filter cleaning, pipeline checks, and system performance tuning.',
          card3Price: 'Limited offer · 100 from / 45 min',
          card4Title: 'Salon & Spa',
          card4Desc:
            'Certified therapists with reliable at-home wellness services.',
          card4Price: 'Limited offer · 100 from / 45 min',
          reason1Title: 'Certified Team',
          reason1Desc: 'Strictly verified',
          reason2Title: 'Fast',
          reason2Desc: 'Quick response',
          reason3Title: 'Reliable',
          reason3Desc: 'Trustworthy service',
        },
      },
      login: {
        password: {
          title: 'Account Password Login',
          noAccount: "Don't have an account?",
          goRegister: 'Register now',
          accountLabel: 'Account',
          accountPlaceholder: 'Enter email or phone number',
          passwordLabel: 'Password',
          passwordPlaceholder: 'Enter password',
          forgotByCode: 'Forgot password? Use verification code login',
          submit: 'Login',
          submitting: 'Logging in...',
          agreementPrefix: 'By logging in, you agree to our',
          terms: 'Terms of Service',
          agreementAnd: 'and',
          privacy: 'Privacy Policy',
          accountRequired: 'Please enter account',
          passwordRequired: 'Please enter password',
          success: 'Login successful',
          failed: 'Login failed',
          codeSent: 'Verification code sent',
          codeSendFailed: 'Failed to send verification code',
          codeInputTitle: 'Verification Code Login',
          codeInputMessage: 'Please enter the verification code you received',
          codeInputPlaceholder: 'Enter verification code',
          codeLoginConfirm: 'Login',
          codeLoginCancel: 'Cancel',
          codeInvalid: 'Please enter a valid code',
          codeRequired: 'Please enter verification code',
          codeLoginSuccess: 'Code login successful',
          codeLoginFailed: 'Code login failed',
        },
        register: {
          brand: 'HourX Dubai',
          heroLine1: 'One Booking',
          heroLine2: 'Unified Platform Arrangement',
          heroSlogan: 'Efficient · Reliable · Hassle-free',
          featureProfessionalTitle: 'Professional',
          featureProfessionalDesc: 'Verified Experts',
          featureQuickTitle: 'Fast',
          featureQuickDesc: 'Rapid Response',
          featureReliableTitle: 'Reliable',
          featureReliableDesc: 'Trusted Service',
          backHome: 'Back Home',
          title: 'Create New Account',
          hasAccount: 'Already have an account?',
          goLogin: 'Sign in now',
          phoneLabel: 'Phone Number',
          phonePlaceholder: '+971 50 123 4567',
          emailLabel: 'Email',
          emailPlaceholder: 'name@example.com',
          passwordLabel: 'Set Password',
          passwordPlaceholder: 'Create your sign-in password',
          codeLabel: 'Verification Code',
          codePlaceholder: '6-digit code',
          getCode: 'Get Code',
          sendingCode: 'Sending...',
          resendIn: '{seconds}s',
          submit: 'Create Account',
          submitting: 'Submitting...',
          agreementPrefix: 'By creating an account, you agree to our',
          terms: 'Terms of Service',
          agreementAnd: 'and',
          privacy: 'Privacy Policy',
          loginTip: 'This page is registration only for now.',
          phoneRequired: 'Please enter phone number',
          emailRequired: 'Please enter email',
          emailInvalid: 'Please enter a valid email',
          passwordInvalid: 'Password must be at least 6 characters',
          codeInvalid: 'Please enter a valid 6-digit code',
          codeSent: 'Verification code sent',
          codeSendFailed: 'Failed to send verification code',
          success: 'Account created successfully',
          failed: 'Account creation failed',
        },
      },
    },
  },
  zh: {
    client: {
      header: {
        nav: {
          home: '首页',
          services: '服务',
          orders: '订单',
          joinUs: '加入我们',
        },
        auth: '登录 / 注册',
        user: '用户',
        profile: '个人中心',
        logout: '退出登录',
        language: '语言',
        languageZh: '中文',
        languageEn: 'English',
      },
      footer: {
        tagline: '为您提供专业可靠的家庭服务，覆盖保洁、维修及美护场景。',
        quickLinks: '快速链接',
        services: '服务',
        about: '关于我们',
        businessHours: '办公时间',
        weekday: '周一至周五：9:00 - 18:00',
        saturday: '周六：10:00 - 17:00',
        sunday: '周日：休息',
        contactUs: '联系我们',
        address: '迪拜市中心，阿联酋',
        copyright: '© {year} HourX Dubai. All Rights Reserved.',
        terms: '条款与条件',
        privacy: '隐私政策',
      },
      home: {
        alt: {
          hero: 'HourX 清洁团队',
          supportAgent: '客服人员',
          about: 'HourX 服务团队',
        },
        hero: {
          eyebrow: 'HourX · 专业管理的上门服务平台',
          titleLine1: '一次预约',
          titleLine2: '上门搞定一切',
          desc: '高效 · 可靠 · 省心',
          cta: '立即预约',
          tag1: '专业',
          tag2: '快速',
          tag3: '可靠',
        },
        contactCard: {
          title: '联系我们',
          button: '客服支持',
        },
        sections: {
          servicesTitle: '服务',
          servicesSubtitle: '选择服务，快速完成服务预约',
          serviceCardsTitle: '限时优惠',
          serviceCardsDesc:
            '从日常清洁到深度养护，按需预约、无需长期合同，服务灵活透明。',
          bookingTitle: '简单的预约流程',
          bookingSubtitle: '三步完成预约，统一安排与管理',
          aboutTitle: '为什么选择我们？',
          aboutSubtitle: '统一管理你的居家服务',
          aboutDesc:
            '迪拜本地团队打造标准化家庭服务，兼顾效率、品质与透明流程。',
        },
        serviceCard: {
          badge: '限时特价',
          button: '查看优惠',
          priceConsult: '限时优惠 · 价格咨询',
          priceFrom: '限时优惠 · {price} 起 / 45 分钟',
        },
        bookingForm: {
          title: '预约详情',
          dateLabel: '服务日期',
          datePlaceholder: '07 / 31',
          typeLabel: '服务类型',
          typePlaceholder: '请选择服务类别',
          contactLabel: '联系方式',
          contactPlaceholder: '请输入您的手机号',
          next: '下一步',
        },
        steps: {
          step1Title: '选择服务',
          step1Desc: '选择所需服务与时间',
          step2Title: '确认订单',
          step2Desc: '平台统一安排合适的专业人员',
          step3Title: '安全支付与结算',
          step3Desc: '多种安全支付方式，服务完成后按订单结算',
          step4Title: '服务验收',
          step4Desc: '服务完成后在线确认结果，支持反馈与售后跟进。',
        },
        aboutIntro: {
          title: '关于HourX',
          desc: 'HourX 是连接家庭与专业服务团队的数字化平台，提供保洁、维修与家居养护等服务。',
          bullet1: 'HourX 是一家立足迪拜的本地按需居家服务平台',
          bullet2: '通过一个平台、一站式预约，统一管理多种居家服务',
          bullet3: '我们将经过严格甄选的专业服务人员，按标准流程安排到您的家中',
          bullet4: '让居家服务更高效、更可靠，也更省心',
        },
        defaults: {
          unnamedService: '未命名服务',
          comingSoon: '待上架',
          menu1: '房屋清洁',
          menu2: '深度清洁',
          menu3: '空调服务',
          menu4: '粉刷',
          menu5: '美容与按摩',
          card1Title: '日常清洁服务',
          card1Desc: '灵活覆盖客厅、卧室与厨房，适用于日常打扫和搬家前后清洁。',
          card1Price: '限时优惠 · 100 起 / 45 分钟',
          card2Title: '深度清洁服务',
          card2Desc: '针对难清洁区域和顽固污渍，使用专业设备进行深层处理。',
          card2Price: '限时优惠 · 100 起 / 45 分钟',
          card3Title: '空调清洗与维护',
          card3Desc: '包含滤网清洁、管道检查和系统调试，提升送风质量和效率。',
          card3Price: '限时优惠 · 100 起 / 45 分钟',
          card4Title: '居家按摩与美容',
          card4Desc: '甄选认证技师，支持到家美容按摩服务，流程标准且隐私可靠。',
          card4Price: '限时优惠 · 100 起 / 45 分钟',
          reason1Title: '专业',
          reason1Desc: '严选认证',
          reason2Title: '快速',
          reason2Desc: '高效响应',
          reason3Title: '可靠',
          reason3Desc: '诚信可靠',
        },
      },
      login: {
        password: {
          title: '账号密码登录',
          noAccount: '还没有账户？',
          goRegister: '立即注册',
          accountLabel: '账号',
          accountPlaceholder: '请输入电子邮箱/手机号码',
          passwordLabel: '密码',
          passwordPlaceholder: '请输入密码',
          forgotByCode: '忘记密码？使用验证码登录',
          submit: '登录',
          submitting: '登录中...',
          agreementPrefix: '登录即表示您同意我们的',
          terms: '《服务条款》',
          agreementAnd: '与',
          privacy: '《隐私政策》',
          accountRequired: '请输入账号',
          passwordRequired: '请输入密码',
          success: '登录成功',
          failed: '登录失败',
          codeSent: '验证码已发送',
          codeSendFailed: '验证码发送失败',
          codeInputTitle: '验证码登录',
          codeInputMessage: '请输入收到的验证码',
          codeInputPlaceholder: '请输入验证码',
          codeLoginConfirm: '登录',
          codeLoginCancel: '取消',
          codeInvalid: '请输入正确的验证码',
          codeRequired: '请输入验证码',
          codeLoginSuccess: '验证码登录成功',
          codeLoginFailed: '验证码登录失败',
        },
        register: {
          brand: 'HourX Dubai',
          heroLine1: '一次预约',
          heroLine2: '平台统一安排',
          heroSlogan: '高效 · 可靠 · 省心',
          featureProfessionalTitle: '专业',
          featureProfessionalDesc: '严选认证',
          featureQuickTitle: '快速',
          featureQuickDesc: '高效响应',
          featureReliableTitle: '可靠',
          featureReliableDesc: '诚信可靠',
          backHome: '返回首页',
          title: '创建新账户',
          hasAccount: '已有账户？',
          goLogin: '直接登录',
          phoneLabel: '手机号码',
          phonePlaceholder: '+971 50 123 4567',
          emailLabel: '电子邮箱',
          emailPlaceholder: 'name@example.com',
          passwordLabel: '设置密码',
          passwordPlaceholder: '请设置您的登录密码',
          codeLabel: '验证码',
          codePlaceholder: '6位验证码',
          getCode: '获取验证码',
          sendingCode: '发送中...',
          resendIn: '{seconds}s',
          submit: '创建账户',
          submitting: '提交中...',
          agreementPrefix: '创建账户即表示您同意我们的',
          terms: '《服务条款》',
          agreementAnd: '与',
          privacy: '《隐私政策》',
          loginTip: '当前页面为注册页，登录页稍后补充。',
          phoneRequired: '请输入手机号',
          emailRequired: '请输入邮箱',
          emailInvalid: '请输入正确的邮箱',
          passwordInvalid: '密码至少 6 位',
          codeInvalid: '请输入正确的6位验证码',
          codeSent: '验证码已发送',
          codeSendFailed: '验证码发送失败',
          success: '账户创建成功',
          failed: '账户创建失败',
        },
      },
    },
  },
};

const deepMerge = <T extends Record<string, any>>(
  target: T,
  source: Record<string, any>,
): T => {
  const output: Record<string, any> = { ...target };
  Object.keys(source).forEach((key) => {
    const targetValue = output[key];
    const sourceValue = source[key];
    if (
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue) &&
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue)
    ) {
      output[key] = deepMerge(targetValue, sourceValue);
      return;
    }
    output[key] = sourceValue;
  });
  return output as T;
};

const messages = {
  en: deepMerge(enBase, clientExtraMessages.en),
  zh: deepMerge(zhBase, clientExtraMessages.zh),
};

const normalizeClientLocale = (value?: string): ClientLocale =>
  value?.startsWith('zh') ? 'zh' : 'en';

export const getClientLocale = (): ClientLocale => {
  if (typeof window === 'undefined') return CLIENT_DEFAULT_LOCALE;
  const stored = localStorage.getItem(CLIENT_LOCALE_STORAGE_KEY) || '';
  return normalizeClientLocale(stored) || CLIENT_DEFAULT_LOCALE;
};

export const setClientLocale = (value: string): ClientLocale => {
  const locale = normalizeClientLocale(value);
  if (typeof window !== 'undefined') {
    localStorage.setItem(CLIENT_LOCALE_STORAGE_KEY, locale);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }
  return locale;
};

export default messages;
