/**
 * 首页静态数据定义
 */
import type {
  ServiceCategory,
  Service,
  ServiceAdvantage,
  ServiceProcess,
  WorkingHours,
  ContactInfo,
} from '../types/homepage';

/**
 * 服务分类数据
 */
export const serviceCategories: ServiceCategory[] = [
  {
    id: 'cleaning',
    name: 'homepage.services.category.cleaning',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'maintenance',
    name: 'homepage.services.category.maintenance',
    displayOrder: 2,
    isActive: true,
  },
];

/**
 * 服务项数据
 */
export const services: Service[] = [
  // 保洁服务
  {
    id: 'daily-cleaning',
    name: 'homepage.services.dailyCleaning',
    categoryId: 'cleaning',
    imageUrl: '/src/assets/images/homepage/services/daily-cleaning.jpg',
    description: 'homepage.services.dailyCleaningDesc',
    displayOrder: 1,
  },
  {
    id: 'deep-cleaning',
    name: 'homepage.services.deepCleaning',
    categoryId: 'cleaning',
    imageUrl: '/src/assets/images/homepage/services/deep-cleaning.jpg',
    description: 'homepage.services.deepCleaningDesc',
    displayOrder: 2,
  },
  {
    id: 'commercial-cleaning',
    name: 'homepage.services.commercialCleaning',
    categoryId: 'cleaning',
    imageUrl: '/src/assets/images/homepage/services/commercial-cleaning.jpg',
    description: 'homepage.services.commercialCleaningDesc',
    displayOrder: 3,
  },
  {
    id: 'appliance-cleaning',
    name: 'homepage.services.applianceCleaning',
    categoryId: 'cleaning',
    imageUrl: '/src/assets/images/homepage/services/appliance-cleaning.jpg',
    description: 'homepage.services.applianceCleaningDesc',
    displayOrder: 4,
  },
  // 维修服务（可以根据实际情况补充）
  {
    id: 'home-repair',
    name: 'homepage.services.homeRepair',
    categoryId: 'maintenance',
    imageUrl: '/src/assets/images/homepage/services/home-repair.jpg',
    description: 'homepage.services.homeRepairDesc',
    displayOrder: 1,
  },
];

/**
 * 服务优势数据
 */
export const serviceAdvantages: ServiceAdvantage[] = [
  {
    id: 'professional-team',
    title: 'homepage.about.advantage.professionalTeam.title',
    description: 'homepage.about.advantage.professionalTeam.description',
  },
  {
    id: 'quality-assurance',
    title: 'homepage.about.advantage.qualityAssurance.title',
    description: 'homepage.about.advantage.qualityAssurance.description',
  },
  {
    id: 'efficient-response',
    title: 'homepage.about.advantage.efficientResponse.title',
    description: 'homepage.about.advantage.efficientResponse.description',
  },
];

/**
 * 服务流程数据
 */
export const serviceProcesses: ServiceProcess[] = [
  {
    id: 'online-order',
    stepNumber: '01',
    title: 'homepage.process.step1.title',
    description: 'homepage.process.step1.description',
    displayOrder: 1,
  },
  {
    id: 'professional-execution',
    stepNumber: '02',
    title: 'homepage.process.step2.title',
    description: 'homepage.process.step2.description',
    displayOrder: 2,
  },
  {
    id: 'after-sales',
    stepNumber: '03',
    title: 'homepage.process.step3.title',
    description: 'homepage.process.step3.description',
    displayOrder: 3,
  },
];

/**
 * 工作时间数据
 */
export const workingHours: WorkingHours = {
  weekday: 'homepage.footer.workingHours.weekday',
  saturday: 'homepage.footer.workingHours.saturday',
  sunday: 'homepage.footer.workingHours.sunday',
};

/**
 * 联系方式数据
 */
export const contactInfo: ContactInfo = {
  email: 'Contact@gmail.com',
  phone: '+1 800 123 123 123',
};

