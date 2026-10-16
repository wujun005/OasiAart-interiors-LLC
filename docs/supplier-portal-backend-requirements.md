# HourX 供应商后台服务端配合清单

本清单用于落实《HourX供应商后台界面优化需求说明_中英文版.docx》中的业务规则，并作为前后端联调与验收依据。P0 是入驻、覆盖排班和报价流程正确运行的必要条件；P1 是订单页面与运营体验的完善项。

现状仅依据本仓库的前端调用核对，未检查服务端实现或线上行为。下文“已有待验”表示前端已有接口封装，不代表服务端规则已实现；“需扩展”表示现有契约不足以完整表达需求；“新增建议”中的接口、字段及错误码均为建议，须由前后端确认后落地。

## 现有接口基线

接口封装见 `src/modules/admin/api/supplierWorkbench.ts`。

| 前端函数 | 当前接口 | 本次配合范围 | 判断 |
| --- | --- | --- | --- |
| `onboardingMine` / `onboardingDetail` | `GET /api/supplier/onboarding/mine` / `GET /api/supplier/onboarding/detail/{id}` | 身份摘要、资料、审核与编辑权限 | 已有待验，需扩展 |
| `onboardingSave` / `onboardingResubmit` | `POST /api/supplier/onboarding/addOrUpdate` / `POST /api/supplier/onboarding/resubmit` | 保存草稿、提交、重新提交与快照 | 已有待验，需扩展 |
| `onboardingChangeStatus` | `POST /api/supplier/onboarding/changeStatus` | 平台审核与退回 | 已有待验，需扩展 |
| `uploadFile` | `POST /api/file/upload` | 上传文件及可读原名 | 已有待验，需扩展 |
| `serviceAreaList` / `serviceCommunityPage` | `POST /api/platform/serviceArea/list` / `POST /api/platform/serviceArea/community/page` | 区域、社区字典 | 已有待验；不等同于供应商覆盖设置保存接口 |
| `supplierChangeAcceptDispatch` | `POST /api/supplier/changeAcceptDispatch` | 全局接受新订单 | 已有待验 |
| `supplierOperationsMine` / `supplierCoverageSave` / `supplierScheduleSave` | `GET /api/supplier/operations/mine`、`POST /api/supplier/operations/coverage/save`、`POST /api/supplier/operations/schedule/save` | 独立运营配置 | 本次新增前端接口边界，服务端待实现 |
| `supplierEventPage` / `supplierEventSave` | `POST /api/supplier/event/page` / `POST /api/supplier/event/save` | 不可用时间列表与保存 | 已有待验，需确认时段契约 |
| `serviceCatalog` / `saveServices` | `GET /api/supplier/tools/services` / `POST /api/supplier/tools/services/save` | 类别、服务、联系人和接单能力 | 已有待验，需扩展状态能力 |
| `supplierChangeAcceptOrder` | `POST /api/supplier/tools/services/changeAcceptOrder` | 单项服务“提供此服务”开关 | 已有待验 |
| `quoteList` / `saveQuoteDraft` / `submitQuote` | `GET /api/supplier/tools/quotes` / `POST /api/supplier/tools/quotes/draft` / `POST /api/supplier/tools/quotes/submit` | 报价读取、草稿、提交和版本 | 已有待验，需扩展 |
| `platformSupplierQuoteReview` | `POST /api/platform/supplierQuote/review` | 报价审核、行级退回和生效替换 | 已有待验，需扩展 |
| `applyQuotePriceChange` / `reviewQuotePriceChange` | `POST /api/supplier/tools/quotes/priceChange/apply` / `POST /api/platform/supplierQuote/priceChange/review` | 现有改价申请和申请审核 | 已有待验，需与新版本流程对齐 |
| `supplierAssignedOrders` / `supplierOrderPage` | `POST /api/orderHeader/supplier/mine` / `POST /api/orderHeader/supplier/page` | 供应商订单分页、筛选与汇总 | 已有待验，需扩展 |
| `supplierAssignedOrderDetail` | `GET /api/orderHeader/supplier/detail` | 订单详情和允许操作 | 已有待验 |

## P0 必须配合

### P0 01 身份摘要与菜单权限

全页需要稳定返回公司名称 `companyName`、供应商编号 `supplierNo`、入驻审核状态 `status` 或明确命名的 `onboardingStatus`，以及全局接单状态 `acceptDispatch`。当前前端读取的 `enabled` 是供应商启用状态，不能替代入驻审核状态或接单开关。

- 审核状态与接单状态独立存储、独立返回；“审核中”与“可接单”可以同时展示，但真正能否获得新订单仍由审核、启用、报价和可用性等服务端规则判断。
- 若菜单由服务端或权限配置下发，将原 `service-area` 与 `availability` 合并为 `coverage-availability`，名称为“服务区域与可用时间”。统一五个菜单：供应商工作台、公司资料与验证、服务区域与可用时间、订单、服务与报价。旧路径的兼容跳转可由前端处理。
- `editable`、资料审核状态与运营配置编辑权限应分别表达。不能因为资料审核中而将覆盖、默认排班、不可用时间和报价一并禁止保存。

验收：切换五个页面后身份数据一致；关闭接单开关不改变审核状态；资料审核中仍可读取和保存被允许的运营配置。

### P0 02 四步资料与必填校验

使用现有 `onboardingSave` / `onboardingResubmit`，明确“保存草稿”和“提交审核”的服务端语义。前端流程合并为四步，不要求服务端为了页面步骤拆表。

| 步骤 | 当前可见字段映射 | 配合要求 |
| --- | --- | --- |
| 公司信息 | `companyName`、`tradeLicenseNo`、`licenseExpiry`、`vatTrn`、`yearsInBusiness`、`officeAddress`；发证机构当前在 `extra.licenseIssuedBy` / `extra.licenseIssuedByOther` | 确认字段长度、格式、日期及是否必填；发证机构选择“其他”时校验说明 |
| 联系人 | `contactPerson`、`email`、`mobile`、`whatsapp` | 明确国家区号、号码和邮箱的规范化与校验规则 |
| 服务与接单能力 | `expectedServiceCategoryIds`、`servicesProvided`、`totalAvailableWorkers`、`femaleStaffCount`、`maleStaffCount`、`maxSimultaneousOrders`、`monthlyCapacity`、`minLeadTimeHours`、`workingHours`、周末配置及社区准入字段 | 校验人员及容量为合法数值，工作时间有效；制服、Emaar 与其他社区准入保留在该步骤 |
| 收款与验证 | `extra.bank`；营业执照、保险与其他文件当前分别保存于 `extra.tradeLicenseFiles`、保险文件字段、`extra.otherDocuments` | 收款和文件可一起保存草稿；服务端维护必需文件清单并在提交时校验 |

新增建议：返回 `sectionStates`（四步各为 `complete` / `action_required`）、`missingFields` 和 `requiredDocuments`，每个问题至少包含稳定字段路径、所属步骤、错误类型及可展示信息。必填规则须明确区分总是必填、满足条件才必填和选填，不能仅依赖前端按钮禁用。原需求未逐项指定所有字段是否必填，最终规则应由产品与服务端确认，不能把页面展示字段全部默认定为必填。

草稿允许缺失必填值，提交必须重新校验完整资料。建议对人数校验非负整数、女员工与男员工数量之和不超过总数；对并发接单数、每月容量及提前预约时间制定一致的范围规则。

验收：缺少任一必需文件时，直接调用提交接口也被拒绝，并返回该文件；草稿刷新后收款资料和文件仍在；四步完成状态与提交校验一致。

### P0 03 上传文件原名与文件状态

`uploadFile` 当前仅封装上传请求，调用方兼容字符串 URL 或带 `url` 的对象；这不足以保证刷新后仍显示原始文件名。

新增建议：上传返回并持久化 `fileId`、`url`、`originalName`、`displayName`、`mimeType`、`size`。允许旧 URL 数组读取，逐步兼容文件对象。展示名称使用清洗后的原名，内部存储键和系统编号不作为文件名显示。短名称可由前端截断，完整原名应可读取。

文件配置需返回 `required` 等规则，以便前端准确展示“已上传”“未上传”“选填”；这些是上传/必填展示状态，不与文件审核状态混用。提交时校验文件归属、存在性及格式限制，错误定位到文件项。

验收：上传 `Trade Licence.pdf` 后保存、刷新及重新登录，仍显示该可读名称；必需与选填状态一致；不能通过替换他人文件标识完成提交。

### P0 04 入驻快照与运营配置独立保存

原覆盖和默认工作时间复用 `onboardingSave(buildProfilePayload(...))`，不能安全表达“只修改覆盖或排班”。本次前端已拆分：仅首次入驻的可编辑草稿、且没有独立运营配置时保留旧保存方式；资料提交后所有覆盖/排班写入都走下列独立接口，不再改写或重新提交入驻快照。服务端未上线独立接口前，提交后的覆盖/排班保存仍无法完成。

本次前端预留契约，待服务端实现并联调：

- `GET /api/supplier/operations/mine` 返回 `{ coverage: { areaIds, communityIds, areas: [{ areaId, areaName }] }, schedule: { workingDays, startTime, endTime, maxConcurrentJobs, timezone } }`。
- `POST /api/supplier/operations/coverage/save` 接收 `{ supplierId, areaIds, communityIds }`，保存后建议返回上述运营配置。
- `POST /api/supplier/operations/schedule/save` 接收 `{ supplierId, workingDays, startTime, endTime, maxConcurrentJobs, timezone: "Asia/Dubai" }`。`workingDays` 使用 ISO 星期编号 `1=周一` 至 `7=周日`。保存后建议返回上述运营配置。

这些路径是本次新约定，并非已验证存在的服务端接口。当前页面默认周一至周五工作，可单独启用周六/周日；若业务需要任意工作日或每天不同时间，需同时扩展前端编辑控件。

- 覆盖契约：供应商身份、`areaIds`、`communityIds`、区域覆盖状态及区域内已选/总社区数。明确“整区域覆盖”与“部分社区覆盖”的存储语义和统计方式。
- 排班契约：`workingDays`、每天的开始/结束时间、`maxConcurrentJobs` 和业务时区。建议使用结构化时间段，兼容当前 `workingHours` 字符串及周末字段。
- 提交资料后保留不可变的审核快照及 `snapshotVersion`；覆盖、排班保存仅更新运营配置，不改变该快照、资料审核状态、提交时间或审核记录。
- 审核通过时不得用旧快照覆盖已单独更新的运营配置。若资料能力字段与运营排班字段重叠，须明确各自权威来源和同步规则。

验收：资料处于审核中时，修改覆盖社区与排班均保存成功；前后入驻快照内容和版本一致；随后审核通过仍保留最新运营配置。

### P0 05 全局接单开关真正控制派单

复用 `supplierChangeAcceptDispatch({ id, acceptDispatch: 0 | 1 })`。服务端须在自动派单、人工分配和重试分配等入口检查该状态，在最终分配提交时再次校验，避免并发或缓存导致关闭后仍新增分配。

`acceptDispatch=0` 只阻止新的分配，不取消、不隐藏、不改变已有订单，也不阻止已有订单按合法流程接受、出发、到达和完成。与 `supplierChangeAcceptOrder({ supplierId, spuId, acceptOrder })` 分工：前者控制供应商全局，后者控制单项服务是否接受新单。再次开启全局开关不应自动开启原本关闭的服务。

验收：关闭开关后分别尝试自动和人工新分配均失败；此前已分配订单仍可查看和履约；重新开启后按其他资格规则恢复分配。

### P0 06 不可用时间独立时段

对现有 `supplierEventPage` / `supplierEventSave` 确认并补齐 `id`、`startDate`、`endDate`、`fullDay`、`startTime`、`endTime`、`weekdays`、服务范围 `spuIds`、可选区域范围 `areaIds`、`reason`。当前页面已有这些事件字段的消费或提交逻辑，服务端支持程度仍需验收。

- 明确日期是否包含首尾、时区、跨日处理、每周重复规则，以及空服务列表代表“全部服务”还是“未选择”。建议统一按业务时区计算，时间段使用开始包含、结束不包含的规则。
- 不可用时间只叠加于指定日期、时间和服务范围，不修改默认排班，不自动取消已有订单。
- 校验有效起止顺序与事件归属；说明重叠事件采用合并计算还是拒绝保存。派单和可预约计算使用同一套有效时段规则。
- 如果允许编辑或解除不可用时间，补充更新/停用契约；具体接口为新增建议，不能把现有 `save` 自动视为支持删除。

验收：为某服务添加周二 14:00 至 16:00 不可用时段，只有相应范围不可新增预约；其他时段及其他服务按既定范围规则处理；默认排班读取结果不变。

### P0 07 服务状态与报价五状态

对 `serviceCatalog` / `saveServices` / `quoteList` 明确服务类别、`categoryId`、`spuId`、启用状态和报价状态，保证按单项服务处理。类别搜索或筛选不能以缺少其他类别记录为由覆盖或删除其他服务。

当前前端约定报价数值 `0=草稿`、`1=审核中`、`2=已通过`、`3=需要处理`，没有报价记录时显示“未报价”。这是前端现有映射，服务端须确认；建议增加稳定语义状态字段，避免将没有报价的服务过滤丢失。

| 报价状态 | 唯一主要操作 | 服务端规则 |
| --- | --- | --- |
| 未报价 Not Quoted | 设置并报价 Set Up & Quote | 尚无报价，可创建该服务草稿 |
| 草稿 Draft | 继续报价 Continue Quote | 可保存未完成内容并返回缺失字段 |
| 审核中 Under Review | 查看已提交报价 View Submitted Quote | 已正式提交，当前提交版本只读 |
| 已通过 Approved | 管理价格 Manage Pricing | 当前生效版继续使用，修改进入新草稿 |
| 需要处理 Action Required | 修改并重新提交 Update & Resubmit | 显示退回原因，仅开放允许修改的字段或选项行 |

新增建议：返回 `allowedActions`、`editableFields`、`missingFields` 及生效版/草稿版标识。服务关闭使用 `acceptOrder=0`，保留服务与报价数据；关闭不应被实现为删除服务或清空历史报价。

验收：五状态各返回一致的权限和唯一主要操作；修改 A 服务不影响 B；关闭再开启某服务后原报价、历史及审批状态仍可追溯。

### P0 08 两种计价与 5% VAT 契约

当前前端约定 `quoteMode=2` 为按小时、`quoteMode=1` 为一口价，使用 `unitPrice`、选项行 `staffCount`、`serviceHours`、`quotePrice`。请确认服务端采用相同枚举。

- 按小时：整项服务只填写一个每人每小时单价 `unitPrice`；启用选项的客户价格由服务端按 `unitPrice × staffCount × serviceHours` 重新计算，禁止信任客户端传入的计算结果。人数为正整数，时长及单价为合法正数。
- 一口价：每个启用选项独立填写 `quotePrice`；人数与时长用于安排人员与排班，不参与一口价金额计算。启用且缺少价格的选项必须列入 `missingFields`，不得提交。
- 未提供或不可用的选项不要求人数、时长或价格，不参与提交完整度与金额计算。明确 `enabled` 与 `available` 的区别，平台不可用的选项不能由供应商重新启用。
- 按原需求，所有对供应商/客户展示的价格均包含 5% VAT。建议返回 `currency=AED`、`vatRate=0.05`、`taxInclusive=true`，明确 `unitPrice`、`quotePrice` 和附加项是否都是含税金额。此项是需求约定，不是税法判断。
- 建议含税每人每小时单价直接按公式计算含税总价，不再额外乘 1.05。若需拆分净额和税额，由服务端统一计算并说明舍入规则。金额使用十进制计算，约定最终显示两位小数和附加项税费口径。

验收：含税单价 AED 50、2 人、3 小时，客户价格为 AED 300.00；修改人数只影响按小时价格；一口价 AED 260 修改人数和时长后仍为 AED 260.00；篡改小时计算结果或缺少启用选项价格的提交被拒绝。

### P0 09 检查提交与审核锁定

`saveQuoteDraft` 仅保存草稿；打开第三步“检查并提交”不改变审核状态。`submitQuote` 成功后才变为审核中。

前端本次已在 `submitQuote` 请求增加 `confirmation: { pricesIncludeVat: true, informationAccurate: true }`。服务端须消费并持久化这两个确认值，记录确认操作者、确认时间、文案版本与报价版本；建议再扩展 `quoteId` / `draftVersion` 做并发校验。任何未确认项、缺失字段或过期草稿版本均应拒绝提交。当前接口封装接受通用对象，不能据此认定服务端已经保存确认记录。

提交响应及 `quoteList` 至少补充 `submitTime`、审核阶段 `reviewProgress`、提交版本标识和预计审核时长。页面显示“1 至 2 个工作日”；如返回预计日期，服务端需定义工作日历、节假日和时区，前端不能简单加 48 小时。`platformReviewNotice` 类型中已有 `submitTime`，不代表供应商报价读取接口已经返回。

审核中锁定必须由 `saveQuoteDraft`、`submitQuote` 及其他写入口共同强制执行，不能只靠前端禁用。重复提交应幂等，避免生成多条待审记录。

验收：未勾选两项确认直接提交失败；进入检查页仍为草稿；成功提交后显示服务端时间和审核进度；直接调用草稿接口修改审核中版本失败；刷新后仍只读。

### P0 10 已通过版本与修改草稿

对 `saveQuoteDraft`、`submitQuote`、`quoteList`、`platformSupplierQuoteReview` 补齐生效版与修订版契约，建议使用 `approvedVersionId`、`draftVersionId`、`submittedVersionId`、`baseVersion`、`effectiveAt` 等明确区分。字段名为新增建议。

- 已通过价格继续生效；“管理价格”产生独立修订草稿，不直接覆写当前生效价格。保存、提交或驳回新草稿均不改变旧价格。
- 审核通过后，在同一事务中完成新版本批准和生效版切换。订单创建与派单读取同一生效版本，订单价格快照不追随之后的报价修改。
- 审核必须绑定明确的提交版本，使用版本校验防止审核旧请求覆盖新稿；重复审核保持幂等。
- 现有 `priceChange/apply` 与 `priceChange/review` 表达的是“先申请允许改价”。原需求要求修改后生成待审草稿，需要明确调整现有预审批的兼容方式。允许改价不等于新价格已通过，不得在申请批准时让未审新价格生效。

验收：生效价 100，新稿改为 120 后保存、提交和退回期间仍按 100；新稿审核通过后新订单使用 120；已生成订单保留原金额；并发审核不能覆盖更高版本。

### P0 11 字段行级退回与锁定

当前页面使用报价头 `rejectReason`、选项行 `reviewStatus` / `rejectReason`，以及 `priceEditable`、`canApplyPriceChange` 等权限提示。服务端应统一这些字段的语义，不能仅返回整单原因而无法定位。

新增建议：入驻退回返回字段路径；报价退回返回 `skuId`、字段路径、原因、是否允许修改，并明确整单退回与部分选项退回的状态汇总规则。报价头显示“需要处理”时，已通过行和其他不可编辑字段仍须服务端锁定，重新提交只覆盖允许修改范围。

验收：仅退回某 SKU 的价格时，前端可以准确定位；接口拒绝修改已锁定行；重新提交不重置其他已通过行及生效价格；审核记录保留原版本和退回原因。

## P1 订单与运营完善

### P1 01 全量订单汇总与服务端状态筛选

扩展 `supplierAssignedOrders`（供应商自用）及适用的 `supplierOrderPage`，统一 New Requests / Upcoming / In Progress / Completed 四种业务分组。当前前端根据 `orderStatus` / `serviceStatus` 推导状态的规则需要服务端确认，不能凭数值自行认定派单、接单、出发、到达和完成之间的业务关系。

前端本次已预留分页请求 `orderStage`，值为 `newRequests`、`upcoming`、`inProgress`、`completed`、`cancelled`；不传表示全部订单。响应需返回 `summary.newRequests`、`summary.upcoming`、`summary.inProgress`、`summary.completed`，以及 `list`、`total`。只有响应 `supportedFilters`（或 `capabilities.supportedFilters`）数组明确包含 `orderStage`，前端才启用状态筛选；旧接口继续查询全部订单。汇总必须对全部授权订单计算，不能用当前页十条数据计数。说明取消、退款及异常订单如何归类，避免重复计数。

建议四项汇总应用搜索、服务类别和日期条件，但不应用当前状态标签，以便四个标签数量同时可见；如产品采用其他范围，必须在接口契约写明。状态筛选必须在分页前执行，切换标签后 `total` 与页数一致。保留已有订单编号、服务名称、类别和预约日期筛选。

验收：准备跨三页且每状态均有订单的数据；四项数量与全量数据一致；状态筛选后的每页记录全部匹配且总数准确；取消订单不混入完成数量。

### P1 02 订单七列字段和审核期间空状态

订单列表统一支持以下字段，不要求 API 直接返回页面“操作”文案。

| 页面列 | 现有或建议字段 | 配合要求 |
| --- | --- | --- |
| 订单编号 | 当前使用的 `orderId` / `orderNo` | 稳定标识与展示编号分开 |
| 服务 | `spuName` / `spuNameI18n`，必要时 `lines` | 明确多服务订单的汇总规则 |
| 预约时间 | `serviceDate` / `serviceTime`，建议补充结构化起止时间与时区 | 可排序、可过滤，不依赖展示字符串解析 |
| 客户区域 | 新增建议 `customerArea`，可同时返回区域/社区名称及多语言字段 | 使用业务区域和社区；不得从完整地址切割猜测 |
| 金额 | 现有订单金额字段需确认；建议明确 `amount` / `currency` / `taxInclusive` | 说明总额与供应商结算额的区别，列表与详情一致 |
| 状态 | 原始 `orderStatus` / `serviceStatus`，建议补充 `orderStage` | 与汇总、筛选同一口径 |
| 操作 | 新增建议 `allowedActions` | 现有 accept/depart/arrive/complete 等接口同步执行权限校验 |

资料审核中返回空订单时，建议响应提供 `emptyReason=PROFILE_UNDER_REVIEW` 等稳定原因，或通过可靠的入驻状态判定。不要把读取失败、无权限和确实没有订单混成同一种空状态；资料审核状态不应隐藏此前已有且仍需履约的订单。

验收：七列数据含义清晰；客户区域有独立来源；审核中无订单时能解释原因，有历史订单时仍可读取；订单操作以服务端返回权限和实时校验为准。

## 联调交付与错误契约

服务端交付时请提供接口样例、状态枚举、必填规则、金额舍入规则、时区/工作日历和版本切换说明。建议统一返回结构化校验错误：`code`、`fieldErrors`（字段路径、`skuId`、原因）、最新 `version` 和允许操作。可采用 `PROFILE_LOCKED`、`QUOTE_UNDER_REVIEW`、`VERSION_CONFLICT` 等稳定错误码；这些名称为建议。

所有供应商写入与查询由服务端校验当前用户归属，不信任请求中的 `supplierId`；平台审核接口单独校验审核权限。重点联调场景为：审核中保存覆盖/排班、关闭接单时并发派单、含税金额重算、部分行退回、已通过价格修订期间继续生效及订单全量汇总。完成联调后，再将对应条目标记为已实现与已验收。
