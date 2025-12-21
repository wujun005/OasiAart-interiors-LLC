# Implementation Plan: OasiAart 官网首页功能

**Branch**: `001-homepage` | **Date**: 2024-12-19 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-homepage/spec.md`

## Summary

实现 OasiAart Interiors LLC 官网首页的完整功能，包括 Header 导航栏、Hero 横幅区域、服务展示（支持分类切换）、关于我们、服务流程、客服联系和页脚等核心模块。页面采用静态数据展示，支持响应式设计和国际化（中英文），完全基于提供的设计图片进行视觉还原。

技术方案：使用 Vue 3 Composition API + TypeScript，基于 Element Plus 组件库和自定义 SCSS 样式实现，遵循项目宪章的所有规范要求。

## Technical Context

**Language/Version**: TypeScript 5.9.3, Vue 3.5.24  
**Primary Dependencies**: Vue 3, Vue Router 4.6.3, Pinia 3.0.4, Vue i18n 11.2.2, Element Plus 2.12.0, Sass 1.94.0  
**Storage**: 静态数据（TypeScript 常量对象），无需后端存储  
**Testing**: 手动测试（功能测试、响应式测试、浏览器兼容性测试）  
**Target Platform**: Web 浏览器（桌面端、平板、移动端）  
**Project Type**: Web application (前端单页应用)  
**Performance Goals**: 
- 页面首次加载时间 < 3 秒
- 服务分类切换响应时间 < 200ms
- 滚动性能保持 60fps

**Constraints**: 
- **优先实现 PC 端**（1920x1080, 1366x768 等桌面分辨率），移动端响应式适配暂缓
- 所有文本必须支持国际化（中英文）
- 图片必须使用懒加载优化
- 代码必须符合项目宪章规范（TypeScript、Vue 3 Composition API、模块化架构）
- Header 导航栏需要支持滚动时背景色变化（初始透明/半透明，向下滚动后变为白色）

**Scale/Scope**: 
- 单个首页组件及其子组件
- 约 8-10 个 Vue 组件
- 约 50-80 个 i18n 翻译 key
- 静态数据结构定义（4 个主要实体类型）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ 原则 1: 类型安全优先
- 所有组件使用 TypeScript，定义完整的 props 和 emits 类型
- 静态数据结构使用 TypeScript 接口/类型定义
- 禁用 `any` 类型

### ✅ 原则 2: 模块化架构
- 代码放置在 `src/modules/client` 目录下
- 组件按功能模块组织（Header、Hero、Services、About、Process、Footer）
- 共享组件放置在 `src/components` 或 `src/modules/client/components`

### ✅ 原则 3: 组件化开发
- 使用 Vue 3 Composition API 和 `<script setup>` 语法
- 每个功能区域拆分为独立组件
- 组件单一职责，保持小而专注

### ✅ 原则 4: 国际化支持
- 所有用户可见文本使用 i18n，不硬编码中文
- 翻译 key 遵循命名规范：`homepage.section.key`
- 语言文件按模块组织在 `src/modules/client/locales/`

### ✅ 原则 5: 路由管理规范
- 首页路由已配置（`/index` 或 `/`）
- 路由使用懒加载（如需要）
- 导航链接配置正确的路由 path

### ✅ 原则 6: 状态管理规范
- 服务分类切换状态使用 Pinia store（如需要）或组件内状态
- 使用 TypeScript 定义状态类型

### ✅ 原则 7: API 请求规范
- 静态数据，无需 API 请求
- 如后续需要，使用封装的 request 工具

### ✅ 原则 8: 代码风格一致性
- 遵循 Vue 3 官方风格指南
- 组件文件名使用 PascalCase
- 代码注释使用中文

### ✅ 原则 9: 性能优化
- 图片使用懒加载（`<img loading="lazy">` 或 vue-lazyload）
- 路由使用懒加载（如适用）
- 避免不必要的重新渲染（合理使用 computed）

### ✅ 原则 10: 安全性
- 静态页面，无用户输入，安全性风险低
- 链接跳转使用 router-link 或安全的 href

**结论**: 所有宪章原则均符合，无需额外说明或违反。

## Project Structure

### Documentation (this feature)

```text
specs/001-homepage/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Task list (to be created)
```

### Source Code (repository root)

```text
src/modules/client/
├── pages/
│   └── index.vue                    # 首页主组件（布局容器）
├── components/
│   ├── HomeHeader/                  # Header 导航栏组件
│   │   ├── index.vue
│   │   └── types.ts                 # TypeScript 类型定义
│   ├── HomeHero/                    # Hero 横幅区域组件
│   │   ├── index.vue
│   │   └── types.ts
│   ├── HomeServices/                # 服务展示区域组件
│   │   ├── index.vue
│   │   ├── ServiceCard.vue          # 服务卡片子组件
│   │   └── types.ts
│   ├── HomeAbout/                   # 关于我们区域组件
│   │   ├── index.vue
│   │   └── types.ts
│   ├── HomeProcess/                 # 服务流程区域组件
│   │   ├── index.vue
│   │   └── types.ts
│   ├── HomeContact/                 # 客服联系区域组件
│   │   ├── index.vue
│   │   └── types.ts
│   └── HomeFooter/                  # 页脚组件
│       ├── index.vue
│       └── types.ts
├── data/
│   └── homepage.ts                  # 首页静态数据定义
├── types/
│   └── homepage.ts                  # 首页相关的 TypeScript 类型定义
└── locales/
    ├── zh.json                      # 中文翻译（扩展）
    └── en.json                      # 英文翻译（扩展）

src/assets/
└── images/
    └── homepage/                    # 首页图片资源
        ├── hero-bg.jpg              # Hero 背景图
        ├── services/                # 服务相关图片
        │   ├── daily-cleaning.jpg
        │   ├── deep-cleaning.jpg
        │   ├── commercial-cleaning.jpg
        │   └── appliance-cleaning.jpg
        ├── team.jpg                 # 团队照片
        └── ...                      # 其他图片资源
```

**Structure Decision**: 

采用模块化的组件结构，每个功能区域独立为组件，便于维护和复用。静态数据集中管理在 `data/homepage.ts`，类型定义集中在 `types/homepage.ts`，符合项目宪章的模块化架构原则。

## Complexity Tracking

> **无宪章违反情况，本功能完全符合所有原则**

## Data Model

### Static Data Structure

```typescript
// src/modules/client/types/homepage.ts

// 服务分类
interface ServiceCategory {
  id: string;
  name: string; // i18n key
  displayOrder: number;
  isActive: boolean;
}

// 服务项
interface Service {
  id: string;
  name: string; // i18n key
  categoryId: string;
  imageUrl: string;
  description?: string; // i18n key
  displayOrder: number;
}

// 服务优势
interface ServiceAdvantage {
  id: string;
  title: string; // i18n key
  description: string; // i18n key
  icon?: string;
}

// 服务流程步骤
interface ServiceProcess {
  id: string;
  stepNumber: string; // "01", "02", "03"
  title: string; // i18n key
  description: string; // i18n key
  displayOrder: number;
}
```

### Static Data Content (src/modules/client/data/homepage.ts)

数据内容基于 spec.md 和设计图片中的信息，包括：
- 2 个服务分类（保洁、维修）
- 4+ 个保洁服务项（日常清洁、深度清洁、商业清洁、家电清洁）
- 维修服务项（待补充具体内容）
- 3 个服务优势点（专业团队、品质保障、高效响应）
- 3 个服务流程步骤（01 线上下单、02 专业执行、03 售后保障）

## Implementation Approach

### Phase 1: 基础结构和数据定义
1. 创建类型定义文件
2. 创建静态数据文件
3. 扩展 i18n 翻译文件

### Phase 2: 组件开发（按优先级）
1. **P1 - MVP 核心组件**:
   - HomeHeader 组件（包含滚动时背景色变化功能）
   - HomeHero 组件
   - HomeServices 组件（基础展示）
   - HomeFooter 组件
   - 首页主组件集成

2. **P2 - 增强功能**:
   - HomeAbout 组件
   - HomeProcess 组件
   - HomeContact 组件
   - HomeServices 组件（分类切换功能）

3. **P3 - 优化和细节**:
   - 图片懒加载
   - 交互效果优化
   - 浏览器兼容性测试
   - **移动端响应式适配**（暂缓，PC 端优先）

### Phase 3: 样式实现
基于设计图片进行样式还原（PC 端优先）：
- Header: 使用固定定位（position: fixed）永远置顶，初始半透明背景，向下滚动时背景色变为白色，包含滚动监听逻辑
- Hero: 全屏背景图，文字叠加，按钮样式
- Services: 卡片布局，标签切换效果
- About: 左右布局，图片和文字
- Process: 步骤列表，分隔线样式
- Contact: 背景图片，按钮样式
- Footer: 三列布局，深色背景

### Phase 4: 测试和优化
- 功能测试（所有验收场景）
- PC 端浏览器兼容性测试（Chrome、Firefox、Safari、Edge）
- 性能优化检查
- Header 滚动背景色变化功能测试
- **移动端响应式测试**（暂缓，后续阶段进行）

## Key Design Decisions

1. **组件拆分粒度**: 每个功能区域独立组件，便于维护和复用
2. **数据管理**: 使用静态 TypeScript 对象，后续可轻松迁移到 API
3. **样式方案**: Element Plus + 自定义 SCSS，基于设计图片还原
4. **国际化策略**: 所有文本使用 i18n key，支持中英文切换
5. **响应式方案**: 优先实现 PC 端，移动端适配后续进行
6. **图片处理**: 使用懒加载，优化初始加载性能
7. **Header 滚动效果**: 
   - Header 使用 `position: fixed` 固定定位，`top: 0`，`left: 0`，`right: 0`，`z-index` 设置足够高的值确保始终在最上层
   - 由于 Header 固定定位，需要为页面内容添加相应的 `padding-top` 或 `margin-top`，避免内容被 Header 遮挡
   - 使用 Vue 3 Composition API 的 `onMounted` 和 `onUnmounted` 监听滚动事件
   - 使用 `ref` 或 `computed` 跟踪滚动位置
   - 当滚动距离超过阈值（建议 50-100px）时，动态添加/移除 CSS 类名（如 `scrolled`）
   - 使用 CSS transition 实现背景色平滑过渡效果
   - 初始状态：`background-color: transparent` 或 `rgba(255, 255, 255, 0)`
   - 滚动后：`background-color: #ffffff` 或 `rgba(255, 255, 255, 1)`

## Risks and Mitigation

1. **图片资源缺失**: 
   - 风险：设计图片中的图片资源可能未提供
   - 缓解：使用占位图片或从图片中提取，后续替换

2. **响应式适配复杂**:
   - 风险：不同屏幕尺寸的布局调整可能复杂
   - 缓解：使用成熟的响应式方案，分阶段测试不同设备

3. **样式还原度**:
   - 风险：基于图片实现的样式可能与设计有细微差异
   - 缓解：关键区域重点还原，非关键区域可适当调整

## Dependencies

- Element Plus: 基础 UI 组件（按钮、布局等）
- Vue Router: 导航链接
- Vue i18n: 国际化支持
- Sass: 样式预处理
- 图片资源: 需要提供或提取图片资源

## Next Steps

1. 创建 tasks.md 任务清单
2. 开始 Phase 1 实施：类型定义和数据准备
3. 逐步实现各个组件
4. 集成测试和优化

