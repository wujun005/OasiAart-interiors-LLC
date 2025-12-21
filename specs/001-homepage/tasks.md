# Tasks: OasiAart 官网首页功能

**Input**: Design documents from `/specs/001-homepage/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/modules/client/` for client-side code
- Components: `src/modules/client/components/`
- Pages: `src/modules/client/pages/`
- Data: `src/modules/client/data/`
- Types: `src/modules/client/types/`
- Locales: `src/modules/client/locales/`
- Styles: `src/modules/client/style/`
- Assets: `src/assets/images/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create directory structure for homepage components in `src/modules/client/components/`
- [ ] T002 [P] Create types file `src/modules/client/types/homepage.ts` with TypeScript interfaces (ServiceCategory, Service, ServiceAdvantage, ServiceProcess)
- [ ] T003 [P] Create data file `src/modules/client/data/homepage.ts` with static data definitions
- [ ] T004 [P] Extend i18n translation files `src/modules/client/locales/zh.json` and `src/modules/client/locales/en.json` with homepage translation keys

**Checkpoint**: Foundation ready - data structure and i18n keys defined

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create base styles directory structure and common SCSS variables/mixins if needed
- [ ] T006 Verify homepage route configuration in `src/modules/client/router/index.ts` points to correct page component

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 浏览首页核心内容 (Priority: P1) 🎯 MVP

**Goal**: 用户访问网站首页，能够看到公司品牌展示、核心服务介绍和基本导航功能

**Independent Test**: 访问首页 URL，验证所有核心内容区块（Header、Hero、服务、关于我们）都能正确显示，导航功能正常工作。

### Implementation for User Story 1

- [ ] T007 [US1] Create HomeHeader component `src/modules/client/components/HomeHeader/index.vue` with basic structure (Logo, navigation links, search icon, language switcher, user icon, phone number)
- [ ] T008 [US1] Implement fixed positioning (position: fixed) for HomeHeader with z-index and top/left/right positioning
- [ ] T009 [US1] Add scroll event listener to HomeHeader component to track scroll position
- [ ] T010 [US1] Implement background color transition logic in HomeHeader (transparent → white when scrolled > 100px)
- [ ] T011 [US1] Add CSS styles for HomeHeader with transition effects and initial transparent background
- [ ] T012 [US1] Create HomeHero component `src/modules/client/components/HomeHero/index.vue` with background image, main title, subtitle, and "Learn More" button
- [ ] T013 [US1] Add i18n translation keys for Hero section (main title, subtitle, button text)
- [ ] T014 [US1] Create HomeServices component `src/modules/client/components/HomeServices/index.vue` with title, category tabs (保洁/维修), and service cards grid
- [ ] T015 [US1] Create ServiceCard component `src/modules/client/components/HomeServices/ServiceCard.vue` for displaying individual service items
- [ ] T016 [US1] Add i18n translation keys for Services section (title, category names, service names)
- [ ] T017 [US1] Create HomeFooter component `src/modules/client/components/HomeFooter/index.vue` with Logo, navigation links, working hours, contact info, and social media icons
- [ ] T018 [US1] Add i18n translation keys for Footer section
- [ ] T019 [US1] Update main homepage component `src/modules/client/pages/index.vue` to integrate all components (Header, Hero, Services, Footer)
- [ ] T020 [US1] Add padding-top to page content to prevent Header from covering content (due to fixed positioning)
- [ ] T021 [US1] Ensure all navigation links in Header use Vue Router correctly (首页, 服务, 关于我们, 历史订单)

**Checkpoint**: At this point, User Story 1 should be fully functional - homepage displays all core sections, Header is fixed and changes background color on scroll

---

## Phase 4: User Story 2 - 浏览服务详情 (Priority: P2)

**Goal**: 用户在服务区域可以通过切换分类标签查看不同类别的服务，并能够点击"了解更多"按钮查看服务详情

**Independent Test**: 在服务区域切换"保洁"和"维修"标签，验证服务卡片能够正确切换显示，点击"了解更多"按钮能够跳转到服务详情页面。

### Implementation for User Story 2

- [ ] T022 [US2] Implement category switching logic in HomeServices component (保洁/维修 tabs)
- [ ] T023 [US2] Add reactive state management for active category in HomeServices component
- [ ] T024 [US2] Filter and display services based on selected category using computed property
- [ ] T025 [US2] Add active state styling for category tabs (underline, color change)
- [ ] T026 [US2] Add hover effects for ServiceCard component (shadow, scale, or other visual feedback)
- [ ] T027 [US2] Implement "Learn More" button functionality in HomeServices component (route to service detail page or expand section)
- [ ] T028 [US2] Add transition animations for service cards when switching categories

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - category switching and service card interactions functional

---

## Phase 5: User Story 3 - 了解公司信息 (Priority: P2)

**Goal**: 用户能够查看关于我们区域，了解公司的服务理念、团队照片和核心优势

**Independent Test**: 滚动到关于我们区域，验证公司介绍文字、团队照片和三个优势点（专业团队、品质保障、高效响应）都能正确显示。

### Implementation for User Story 3

- [ ] T029 [US3] Create HomeAbout component `src/modules/client/components/HomeAbout/index.vue` with title, description text, team photo, and three advantage sections
- [ ] T030 [US3] Add i18n translation keys for About section (title, description, three advantage titles and descriptions)
- [ ] T031 [US3] Implement layout for About section (left: text, center: team photo, right: advantages)
- [ ] T032 [US3] Add "Learn More" button in HomeAbout component with routing functionality
- [ ] T033 [US3] Integrate HomeAbout component into main homepage component

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - 查看服务流程 (Priority: P2)

**Goal**: 用户能够查看服务流程部分，了解从下单到售后保障的完整服务过程

**Independent Test**: 滚动到服务流程区域，验证三个步骤（01 线上下单、02 专业执行、03 售后保障）和对应的描述文字都能正确显示。

### Implementation for User Story 4

- [ ] T034 [US4] Create HomeProcess component `src/modules/client/components/HomeProcess/index.vue` with title and three process steps
- [ ] T035 [US4] Add i18n translation keys for Process section (title, step numbers, step titles, step descriptions)
- [ ] T036 [US4] Implement layout for Process steps with visual separators (lines between steps)
- [ ] T037 [US4] Style process steps with step numbers (01, 02, 03) prominently displayed
- [ ] T038 [US4] Integrate HomeProcess component into main homepage component

**Checkpoint**: At this point, User Stories 1-4 should all work independently

---

## Phase 7: User Story 5 - 联系客服和查看页脚信息 (Priority: P3)

**Goal**: 用户能够看到客服联系区域和页脚信息，包括联系方式、工作时间和社交媒体链接

**Independent Test**: 滚动到页脚和客服区域，验证联系方式、工作时间、社交媒体图标和"联系我们"按钮都能正确显示和点击。

### Implementation for User Story 5

- [ ] T039 [US5] Create HomeContact component `src/modules/client/components/HomeContact/index.vue` with background image, "客服24小时 为您安排" text, and "联系我们" button
- [ ] T040 [US5] Add i18n translation keys for Contact section
- [ ] T041 [US5] Implement "联系我们" button functionality (route or trigger contact form/modal)
- [ ] T042 [US5] Add working hours display in HomeFooter component (周一至周五 9:00AM - 5:00PM, 周六 10:00AM - 6:00PM, 周日 休息)
- [ ] T043 [US5] Add contact email (Contact@gmail.com) and phone (+1 800 123 123 123) to Footer
- [ ] T044 [US5] Add social media icons/links in Footer (Facebook, LinkedIn, WhatsApp, Instagram)
- [ ] T045 [US5] Integrate HomeContact component into main homepage component

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T046 [P] Add image lazy loading to all image elements (using `loading="lazy"` attribute or vue-lazyload library)
- [ ] T047 [P] Optimize all images in `src/assets/images/homepage/` (compress, appropriate formats)
- [ ] T048 [P] Add error handling for image loading failures (display placeholder images)
- [ ] T049 Add smooth scroll behavior for anchor links
- [ ] T050 Verify all i18n keys are properly used (no hardcoded Chinese text)
- [ ] T051 Add CSS transitions/animations for interactive elements (buttons, cards, etc.)
- [ ] T052 Ensure all components use TypeScript properly (no `any` types, proper prop/emit types)
- [ ] T053 Verify Header scroll behavior works smoothly (no janky transitions, proper threshold)
- [ ] T054 Test all navigation links and buttons for correct routing/functionality
- [ ] T055 Code cleanup and refactoring (remove unused code, optimize imports)
- [ ] T056 PC端浏览器兼容性测试 (Chrome, Firefox, Safari, Edge)
- [ ] T057 Performance optimization (check bundle size, optimize component imports)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2 → P3)
  - Or in parallel if different developers are working on different stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 (uses HomeServices component created in US1)
- **User Story 3 (P2)**: Can start after Foundational - Independent of US1/US2
- **User Story 4 (P2)**: Can start after Foundational - Independent of other stories
- **User Story 5 (P3)**: Can start after Foundational - May depend on US1 (uses Footer from US1)

### Within Each User Story

- Types and data definitions before components
- Base components before complex features
- i18n keys before component implementation
- Component creation before integration
- Basic functionality before styling polish

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003, T004)
- User Stories 3, 4 can potentially run in parallel with User Story 2 (different components)
- All Polish tasks marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Polish and optimize → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Header, Hero, Services base, Footer)
   - Developer B: User Story 3 (About) - can start in parallel
   - Developer C: User Story 4 (Process) - can start in parallel
3. After User Story 1 complete:
   - Developer A: User Story 2 (Services category switching)
   - Developer B: User Story 5 (Contact, Footer enhancements)
4. All polish tasks can be done in parallel

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify all components use Vue 3 Composition API with `<script setup>` syntax
- All text must use i18n keys - no hardcoded Chinese strings
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- PC端优先 - 移动端响应式适配暂缓，先确保PC端功能完整

