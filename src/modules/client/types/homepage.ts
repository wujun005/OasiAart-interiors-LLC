/**
 * 首页相关的 TypeScript 类型定义
 */

/**
 * 服务分类
 */
export interface ServiceCategory {
  id: string;
  name: string; // i18n key
  displayOrder: number;
  isActive: boolean;
}

/**
 * 服务项
 */
export interface Service {
  id: string;
  name: string; // i18n key
  categoryId: string;
  imageUrl: string;
  description?: string; // i18n key
  displayOrder: number;
}

/**
 * 服务优势
 */
export interface ServiceAdvantage {
  id: string;
  title: string; // i18n key
  description: string; // i18n key
  icon?: string;
}

/**
 * 服务流程步骤
 */
export interface ServiceProcess {
  id: string;
  stepNumber: string; // "01", "02", "03"
  title: string; // i18n key
  description: string; // i18n key
  displayOrder: number;
}

/**
 * 工作时间
 */
export interface WorkingHours {
  weekday: string; // i18n key
  saturday: string; // i18n key
  sunday: string; // i18n key
}

/**
 * 联系方式
 */
export interface ContactInfo {
  email: string;
  phone: string;
}

