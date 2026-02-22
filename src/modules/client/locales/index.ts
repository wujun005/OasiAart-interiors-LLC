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
          about: 'About Us',
        },
        auth: 'Login / Sign up',
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
          eyebrow: 'HourX Dubai',
          titleLine1: 'One-stop Home',
          titleLine2: 'Maintenance Services',
          desc: 'Cleaning, painting and maintenance with fast response and trusted professionals.',
          cta: 'Book Now',
          tag1: 'Professional Quality',
          tag2: 'Trusted Service',
        },
        contactCard: {
          title: 'Contact Us',
          button: 'Start Chat',
        },
        sections: {
          servicesTitle: 'Our Services',
          serviceCardsTitle: 'How HourX Helps You',
          serviceCardsDesc:
            'From routine cleaning to deep maintenance, flexible booking without long-term contracts.',
          bookingTitle: 'Simple Booking Process',
          bookingSubtitle: 'Book your service in four easy steps',
          aboutTitle: 'Why Choose Us?',
          aboutDesc:
            'A standardized local service team in Dubai focused on quality, efficiency and transparency.',
        },
        serviceCard: {
          badge: 'Limited Offer',
          button: 'Book Now',
          priceConsult: 'Contact for pricing',
          priceFrom: 'AED {price}+',
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
          step1Title: 'Submit Request',
          step1Desc:
            'Choose date, service type, and location to submit your request.',
          step2Title: 'Staff Assignment',
          step2Desc:
            'System matches the right team and confirms the arrival time.',
          step3Title: 'Service Delivery',
          step3Desc:
            'Team arrives on time and completes the service through standard workflow.',
          step4Title: 'Acceptance',
          step4Desc:
            'Review and confirm results online with feedback and after-sales support.',
        },
        aboutIntro: {
          title: 'About HourX',
          desc: 'HourX connects families with professional service teams for cleaning, maintenance, and home care.',
        },
        defaults: {
          unnamedService: 'Unnamed Service',
          menu1: 'Home Cleaning',
          menu2: 'Deep Cleaning',
          menu3: 'AC Service',
          menu4: 'Painting',
          menu5: 'Salon & Spa',
          card1Title: 'Home Cleaning',
          card1Desc:
            'Flexible coverage for living rooms, bedrooms, and kitchens.',
          card1Price: 'AED 100/hour',
          card2Title: 'Deep Cleaning',
          card2Desc:
            'Professional deep cleaning for hard-to-clean areas and stains.',
          card2Price: 'AED 200/hour',
          card3Title: 'AC Cleaning & Maintenance',
          card3Desc:
            'Filter cleaning, pipeline checks, and system performance tuning.',
          card3Price: 'AED 180/hour',
          card4Title: 'Salon & Spa',
          card4Desc:
            'Certified therapists with reliable at-home wellness services.',
          card4Price: 'AED 400/hour',
          reason1Title: 'Certified Team',
          reason1Desc:
            'All staff complete professional training and background checks.',
          reason2Title: 'Standard Workflow',
          reason2Desc:
            'Transparent process from booking to after-sales follow-up.',
          reason3Title: 'Quality Guarantee',
          reason3Desc:
            'Feedback and re-check available to ensure service quality.',
        },
      },
      login: {
        title: 'Login Page',
      },
    },
  },
  zh: {
    client: {
      header: {
        nav: {
          home: '首页',
          services: '服务项目',
          about: '关于我们',
        },
        auth: '登录 / 注册',
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
          eyebrow: 'HourX Dubai',
          titleLine1: '一站式服务的',
          titleLine2: '房屋维护',
          desc: '保洁、粉刷与维修，专业团队快速响应，覆盖家庭与公寓维护场景。',
          cta: '立即开始预约',
          tag1: '专业品质',
          tag2: '信誉保障',
        },
        contactCard: {
          title: '联系我们',
          button: '咨询开始',
        },
        sections: {
          servicesTitle: '我们的服务',
          serviceCardsTitle: 'HourX 能如何帮助您',
          serviceCardsDesc:
            '从日常清洁到深度养护，按需预约、无需长期合同，服务灵活透明。',
          bookingTitle: '简单的预约流程',
          bookingSubtitle: '四个步骤，轻松完成服务预约',
          aboutTitle: '为什么选择我们？',
          aboutDesc:
            '迪拜本地团队打造标准化家庭服务，兼顾效率、品质与透明流程。',
        },
        serviceCard: {
          badge: '限时特价',
          button: '立即预订',
          priceConsult: '价格咨询',
          priceFrom: '迪拉姆{price}起',
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
          step1Title: '提交预约',
          step1Desc: '选择服务时间、服务类型和地址，提交基本信息。',
          step2Title: '完成人员匹配',
          step2Desc: '系统根据需求分配服务人员，并确认上门时间。',
          step3Title: '执行服务',
          step3Desc: '团队准时上门，按标准流程提供服务并记录进度。',
          step4Title: '服务验收',
          step4Desc: '服务完成后在线确认结果，支持反馈与售后跟进。',
        },
        aboutIntro: {
          title: '关于 HourX',
          desc: 'HourX 是连接家庭与专业服务团队的数字化平台，提供保洁、维修与家居养护等服务。',
        },
        defaults: {
          unnamedService: '未命名服务',
          menu1: '房屋清洁',
          menu2: '深度清洁',
          menu3: '空调服务',
          menu4: '粉刷',
          menu5: '沙龙水疗',
          card1Title: '房屋清洁',
          card1Desc: '灵活覆盖客厅、卧室与厨房，适用于日常打扫和搬家前后清洁。',
          card1Price: '迪拉姆100起/小时',
          card2Title: '深度清洁',
          card2Desc: '针对难清洁区域和顽固污渍，使用专业设备进行深层处理。',
          card2Price: '迪拉姆200起/小时',
          card3Title: '空调清洗与维护',
          card3Desc: '包含滤网清洁、管道检查和系统调试，提升送风质量和效率。',
          card3Price: '迪拉姆180起/小时',
          card4Title: '沙龙与水疗',
          card4Desc: '甄选认证技师，支持到家美容按摩服务，流程标准且隐私可靠。',
          card4Price: '迪拉姆400起/小时',
          reason1Title: '专业认证团队',
          reason1Desc: '人员均经过技能培训与背景审核，确保服务稳定可靠。',
          reason2Title: '标准服务流程',
          reason2Desc: '从预约到售后全流程透明，服务节点可追踪。',
          reason3Title: '高质量服务保障',
          reason3Desc: '不满意可反馈复查，持续优化服务细节与效率。',
        },
      },
      login: {
        title: '登录页',
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
