<template>
  <div class="supplier-demo" :class="{ 'supplier-demo--profile': section === 'profile' }">
    <header class="page-header">
      <div>
        <p class="page-kicker">{{ meta.description }}</p>
        <h1>{{ meta.title }}</h1>
      </div>
      <div class="page-actions">
        <el-button v-if="section === 'orders' || section === 'settlement'" :icon="Download" @click="showToast(section === 'orders' ? '订单清单已生成 Demo 导出任务' : '结算明细已生成 Demo 导出任务')">
          {{ section === 'orders' ? '导出订单' : '导出结算' }}
        </el-button>
        <el-button v-if="section === 'profile'" :loading="saving" @click="saveProfile(0)">Save draft</el-button>
        <el-button v-if="meta.primaryAction" type="primary" :icon="section === 'schedule' ? Plus : section === 'profile' ? Check : undefined" @click="handlePrimaryAction">
          {{ meta.primaryAction }}
        </el-button>
      </div>
    </header>

    <section v-if="section !== 'profile'" class="supplier-strip">
      <div class="supplier-identity">
        <div class="supplier-logo">PC</div>
        <div>
          <div class="supplier-label">已登录供应商 / Signed-in supplier</div>
          <strong class="supplier-name">{{ companyForm.companyName || '未填写公司名称' }}</strong>
          <el-select
            v-if="supplierOptions.length"
            class="supplier-select"
            :model-value="supplierRecordId || undefined"
            filterable
            placeholder="切换供应商"
            @change="switchSupplier"
          >
            <el-option
              v-for="item in supplierOptions"
              :key="item.id"
              :label="item.companyName || `供应商 ${item.id}`"
              :value="item.id"
            />
          </el-select>
        </div>
      </div>
      <div class="supplier-facts">
        <div><span>Supplier ID</span><strong>{{ supplierRecordId || '新建' }}</strong></div>
        <div><span>入驻状态</span><el-tag :type="onboardingTagType" effect="light">{{ onboardingStatusLabel }}</el-tag></div>
        <div><span>资料完整度</span><strong class="progress-value">82%</strong></div>
        <div class="compact-progress"><i style="width: 82%"></i></div>
      </div>
    </section>

    <template v-if="section === 'overview'">
      <div class="metric-grid metric-grid--overview">
        <article class="metric-card"><span class="metric-icon metric-icon--blue"><Tickets /></span><div><small>本月完成订单</small><strong>126</strong><p class="positive">+12.5% vs last month</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--green"><Money /></span><div><small>本月收益</small><strong>AED 38,420</strong><p class="positive">+8.2% vs last month</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--amber"><Clock /></span><div><small>待结算</small><strong>AED 12,680</strong><p>预计 30 Sep 到账</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--purple"><CircleCheck /></span><div><small>服务评分</small><strong>4.86 / 5</strong><p>来自 118 条评价</p></div></article>
      </div>
      <div class="overview-grid">
        <el-card class="surface-card earnings-card" shadow="never">
          <div class="section-heading compact"><div><h2>收益趋势</h2><p>Earnings overview · AED</p></div><el-select v-model="earningRange" size="small"><el-option label="近 6 个月" value="6m" /><el-option label="今年" value="year" /></el-select></div>
          <div class="earnings-chart">
            <div v-for="bar in earningBars" :key="bar.month" class="bar-item"><span class="bar-value">{{ bar.value }}k</span><i :style="{ height: `${bar.height}%` }"></i><small>{{ bar.month }}</small></div>
          </div>
        </el-card>
        <el-card class="surface-card" shadow="never">
          <div class="section-heading compact"><div><h2>运营概况</h2><p>Capacity & fulfilment</p></div></div>
          <div class="capacity-list">
            <div><span>可派员工</span><strong>36 / 42</strong><el-progress :percentage="86" :show-text="false" /></div>
            <div><span>并发订单容量</span><strong>8 / 12</strong><el-progress :percentage="67" :show-text="false" color="#8d5a32" /></div>
            <div><span>月订单容量</span><strong>284 / 380</strong><el-progress :percentage="75" :show-text="false" color="#c4a36a" /></div>
            <div><span>准时完成率</span><strong>96.8%</strong><el-progress :percentage="97" :show-text="false" color="#2f9c78" /></div>
          </div>
        </el-card>
      </div>
      <div class="overview-grid overview-grid--bottom">
        <el-card class="surface-card" shadow="never">
          <div class="section-heading compact"><div><h2>最近交易</h2><p>Recent transactions</p></div><el-button link type="primary" @click="goTo('settlement')">查看全部</el-button></div>
          <div class="transaction-list"><div v-for="item in recentTransactions" :key="item.jobId"><span class="transaction-icon"><Money /></span><span><strong>{{ item.service }}</strong><small>{{ item.webOrder }} · {{ item.jobId }}</small></span><span class="transaction-amount"><strong>AED {{ item.amount }}</strong><small>{{ item.date }}</small></span></div></div>
        </el-card>
        <el-card class="surface-card" shadow="never">
          <div class="section-heading compact"><div><h2>待处理事项</h2><p>Actions required</p></div></div>
          <div class="action-list">
            <button @click="goTo('orders')"><span class="action-badge amber">4</span><span><strong>待确认订单</strong><small>最早已等待 18 分钟</small></span><ArrowRight /></button>
            <button @click="goTo('pricing')"><span class="action-badge purple">3</span><span><strong>报价变更审核中</strong><small>审核期间继续使用当前价格</small></span><ArrowRight /></button>
            <button @click="goTo('profile')"><span class="action-badge blue">1</span><span><strong>保险文件即将到期</strong><small>2026-10-18 到期</small></span><ArrowRight /></button>
          </div>
        </el-card>
      </div>
    </template>

    <template v-else-if="section === 'profile'">
      <div class="dossier">
        <aside class="dossier-rail">
          <p>Onboarding file</p>
          <strong>{{ companyForm.companyName || 'Untitled company' }}</strong>
          <em>{{ ['Draft', 'Submitted', 'Approved', 'Rejected'][onboardingStatus ?? -1] || 'Not created' }}</em>
          <el-select
            v-if="supplierOptions.length"
            class="dossier-switch"
            :model-value="supplierRecordId || undefined"
            filterable
            placeholder="Switch supplier"
            @change="switchSupplier"
          >
            <el-option
              v-for="item in supplierOptions"
              :key="item.id"
              :label="item.companyName || `供应商 ${item.id}`"
              :value="item.id"
            />
          </el-select>
          <nav>
            <button type="button" :class="{ 'is-active': profileAnchor === 'company' }" @click="goProfile('company')"><span>01</span>Company</button>
            <button type="button" :class="{ 'is-active': profileAnchor === 'contact' }" @click="goProfile('contact')"><span>02</span>Contact</button>
            <button type="button" :class="{ 'is-active': profileAnchor === 'capacity' }" @click="goProfile('capacity')"><span>03</span>Capacity</button>
            <button type="button" :class="{ 'is-active': profileAnchor === 'bank' }" @click="goProfile('bank')"><span>04</span>Bank</button>
            <button type="button" :class="{ 'is-active': profileAnchor === 'insurance' }" @click="goProfile('insurance')"><span>05</span>Insurance</button>
            <button type="button" :class="{ 'is-active': profileAnchor === 'documents' }" @click="goProfile('documents')"><span>06</span>Documents</button>
          </nav>
          <small v-if="rejectReason">Rejected: {{ rejectReason }}</small>
        </aside>

        <div class="dossier-sheet">
          <section id="profile-company">
            <header><span>01</span><div><h2>Company</h2><p>Legal name, trade license, and registered office.</p></div></header>
            <el-form label-position="top" class="dossier-grid">
              <el-form-item label="Company Name" class="span-2" required><el-input v-model="companyForm.companyName" placeholder="Registered company name" /></el-form-item>
              <el-form-item label="Trade License No." required><el-input v-model="companyForm.licenseNo" placeholder="CN-0000000" /></el-form-item>
              <el-form-item label="License Expiry" required><el-date-picker v-model="companyForm.licenseExpiry" type="date" value-format="YYYY-MM-DD" placeholder="YYYY-MM-DD" /></el-form-item>
              <el-form-item label="VAT / TRN"><el-input v-model="companyForm.trn" placeholder="If applicable" /></el-form-item>
              <el-form-item label="Years in Business"><el-input-number v-model="companyForm.years" :min="0" controls-position="right" /></el-form-item>
              <el-form-item label="Office Address" class="span-2" required><el-input v-model="companyForm.address" placeholder="Building, area, Dubai" /></el-form-item>
            </el-form>
          </section>

          <section id="profile-contact">
            <header><span>02</span><div><h2>Contact</h2><p>The person HourX will reach for dispatch.</p></div></header>
            <el-form label-position="top" class="dossier-grid">
              <el-form-item label="Contact Person" required><el-input v-model="companyForm.contact" /></el-form-item>
              <el-form-item label="Email" required><el-input v-model="companyForm.email" /></el-form-item>
              <el-form-item label="Mobile" required><el-input v-model="companyForm.mobile" placeholder="+971" /></el-form-item>
              <el-form-item label="WhatsApp" required><el-input v-model="companyForm.whatsapp" placeholder="+971" /></el-form-item>
            </el-form>
          </section>

          <section id="profile-capacity">
            <header><span>03</span><div><h2>Capacity</h2><p>How many jobs the company can take, and when.</p></div></header>
            <el-form label-position="top" class="dossier-grid dossier-grid--three">
              <el-form-item label="Total Available Workers"><el-input-number v-model="capacityForm.workers" :min="0" /></el-form-item>
              <el-form-item label="Max Simultaneous Orders"><el-input-number v-model="capacityForm.concurrent" :min="0" /></el-form-item>
              <el-form-item label="Monthly Capacity"><el-input-number v-model="capacityForm.monthly" :min="0" /></el-form-item>
              <el-form-item label="Minimum Lead Time (hours)"><el-input-number v-model="capacityForm.leadTime" :min="0" /></el-form-item>
              <el-form-item label="Working Hours Start"><el-time-select v-model="capacityForm.start" start="06:00" step="00:30" end="12:00" /></el-form-item>
              <el-form-item label="Working Hours End"><el-time-select v-model="capacityForm.end" start="14:00" step="00:30" end="23:30" /></el-form-item>
              <el-form-item label="Female Staff"><el-input-number v-model="femaleStaffCount" :min="0" /></el-form-item>
              <el-form-item label="Male Staff"><el-input-number v-model="maleStaffCount" :min="0" /></el-form-item>
            </el-form>
            <div class="dossier-toggles">
              <label v-for="item in capacityToggles" :key="item.en"><span><strong>{{ item.label }}</strong><small>{{ item.en }}</small></span><el-switch v-model="item.enabled" /></label>
              <label><span><strong>自有车辆</strong><small>Own transportation</small></span><el-switch v-model="ownTransportation" /></label>
              <label><span><strong>自有设备</strong><small>Own equipment</small></span><el-switch v-model="complianceItems[3].enabled" /></label>
              <label><span><strong>可开税务发票</strong><small>Tax invoice available</small></span><el-switch v-model="complianceItems[2].enabled" /></label>
            </div>
          </section>

          <section id="profile-bank">
            <header><span>04</span><div><h2>Bank</h2><p>Changes stay pending until HourX approves them.</p></div></header>
            <el-form label-position="top" class="dossier-grid">
              <el-form-item label="Account Name"><el-input v-model="bankForm.accountName" /></el-form-item>
              <el-form-item label="Bank Name"><el-input v-model="bankForm.bankName" /></el-form-item>
              <el-form-item label="IBAN" class="span-2"><el-input v-model="bankForm.iban" /></el-form-item>
              <el-form-item label="SWIFT / BIC"><el-input v-model="bankForm.swift" /></el-form-item>
              <el-form-item label="Currency"><el-select v-model="bankForm.currency"><el-option label="AED" value="AED" /></el-select></el-form-item>
            </el-form>
          </section>

          <section id="profile-insurance">
            <header><span>05</span><div><h2>Insurance</h2><p>A copy is required when the answer is yes.</p></div></header>
            <div class="policy-row" v-for="item in complianceItems.filter((entry) => entry.fileKey)" :key="item.key">
              <div>
                <strong>{{ item.label }}</strong>
                <small v-if="!item.files.length">{{ item.hint }}</small>
                <ul v-else class="policy-files">
                  <li v-for="(url, index) in item.files" :key="`${url}-${index}`">
                    <button v-if="fileKind(url) === 'image'" type="button" class="policy-thumb" @click="openFilePreview(url)">
                      <img :src="url" :alt="fileNameFromUrl(url)" />
                    </button>
                    <button type="button" class="policy-name" @click="openFilePreview(url)">{{ fileNameFromUrl(url) }}</button>
                    <button type="button" class="is-remove" @click="removeInsuranceFile(item.fileKey, index)">Remove</button>
                  </li>
                </ul>
              </div>
              <el-switch v-model="item.enabled" />
              <el-upload multiple :show-file-list="false" :http-request="(options) => uploadInsurance(item.fileKey, options)">
                <el-button>Upload copy</el-button>
              </el-upload>
            </div>
          </section>

          <section id="profile-documents">
            <header>
              <span>06</span>
              <div><h2>Documents</h2><p>Preview each uploaded policy copy.</p></div>
            </header>
            <p v-if="!policyDocuments.length" class="policy-empty">No policy files uploaded yet.</p>
            <div v-else class="doc-list">
              <article v-for="row in policyDocuments" :key="row.key">
                <button type="button" class="doc-thumb" @click="openFilePreview(row.url)">
                  <img v-if="row.kind === 'image'" :src="row.url" :alt="row.name" />
                  <Document v-else />
                </button>
                <div>
                  <strong>{{ row.label }}</strong>
                  <small>{{ row.name }}</small>
                </div>
                <button type="button" class="doc-view" @click="openFilePreview(row.url)">View</button>
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>

    <template v-else-if="section === 'service-area'">
      <section class="review-banner area-banner linked-banner"><span><Location /></span><div><strong>入驻问卷里的服务区域</strong><p>只回显问卷中已保存的区域，并列出每个区域下的小区。需要调整时，从平台已启用的区域里重新勾选。</p></div></section>
      <el-card class="surface-card" shadow="never">
        <div class="table-toolbar">
          <div class="result-count">{{ supplierAreas.length }} 个区域 · {{ communityTotal }} 个小区</div>
        </div>
        <el-table :data="supplierAreas" class="data-table" row-key="areaId" empty-text="问卷里还没有服务区域">
          <el-table-column label="区域" min-width="180" prop="areaName" />
          <el-table-column label="小区" min-width="360">
            <template #default="{ row }">
              <div v-if="communityNames(row.areaId).length" class="zone-list">
                <span v-for="name in communityNames(row.areaId)" :key="name">{{ name }}</span>
              </div>
              <span v-else-if="communitiesByArea[row.areaId]" class="muted-text">暂无小区</span>
              <span v-else class="muted-text">加载中</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      <el-dialog v-model="areaEditorVisible" title="管理服务区域" width="min(760px, 92vw)" :close-on-click-modal="false">
        <el-input v-model="areaKeyword" :prefix-icon="Search" placeholder="搜索区域或小区" clearable />
        <div v-loading="editorLoading" class="area-choice-list">
          <el-checkbox
            v-for="area in editorAreas"
            :key="area.id"
            :model-value="draftAreaIds.includes(area.id)"
            @change="toggleDraftArea(area.id, Boolean($event))"
          >
            <span class="area-choice">
              <strong>{{ area.name }}</strong>
              <small>{{ communityText(area.id) }}</small>
            </span>
          </el-checkbox>
        </div>
        <p v-if="!editorLoading && !editorAreas.length" class="policy-empty">没有可选择的区域</p>
        <template #footer>
          <el-button @click="areaEditorVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveAreas">保存</el-button>
        </template>
      </el-dialog>
    </template>

    <template v-else-if="section === 'staff'">
      <div class="metric-grid">
        <article class="metric-card"><span class="metric-icon metric-icon--blue"><UserFilled /></span><div><small>员工总数</small><strong>42</strong><p>36 active today</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--green"><CircleCheck /></span><div><small>资料已验证</small><strong>35</strong><p>83% verified</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--amber"><Warning /></span><div><small>证件即将到期</small><strong>5</strong><p>Within 30 days</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--purple"><Calendar /></span><div><small>今日可派</small><strong>28</strong><p>6 already assigned</p></div></article>
      </div>
      <el-card class="surface-card" shadow="never">
        <div class="table-toolbar">
          <div class="table-search">
            <el-input v-model="staffKeyword" :prefix-icon="Search" placeholder="搜索姓名、手机号或员工编号" clearable />
            <el-select v-model="staffSkill" placeholder="全部技能" clearable><el-option v-for="skill in staffSkills" :key="skill" :label="skill" :value="skill" /></el-select>
            <el-select v-model="staffStatus" placeholder="全部状态" clearable><el-option label="可派" value="available" /><el-option label="服务中" value="busy" /><el-option label="休假" value="leave" /></el-select>
          </div>
          <div class="result-count">{{ filteredStaff.length }} 位员工</div>
        </div>
        <el-table :data="filteredStaff" class="data-table" row-key="id">
          <el-table-column label="员工" min-width="210">
            <template #default="{ row }"><div class="person-cell"><el-avatar :size="38" :style="{ background: row.color }">{{ initials(row.name) }}</el-avatar><span><strong>{{ row.name }}</strong><small>{{ row.id }} · {{ row.gender }}</small></span></div></template>
          </el-table-column>
          <el-table-column label="角色" min-width="135"><template #default="{ row }"><div class="muted-stack"><strong>{{ row.role }}</strong><small>{{ row.employment }}</small></div></template></el-table-column>
          <el-table-column label="技能 / Services" min-width="240">
            <template #default="{ row }"><div class="tag-list"><el-tag v-for="skill in row.skills" :key="skill" size="small" effect="plain">{{ skill }}</el-tag></div></template>
          </el-table-column>
          <el-table-column label="联系方式" min-width="160"><template #default="{ row }"><div class="muted-stack"><span>{{ row.mobile }}</span><small>{{ row.language }}</small></div></template></el-table-column>
          <el-table-column label="默认工作时间" min-width="175"><template #default="{ row }"><div class="muted-stack"><span>{{ row.workingDays }}</span><small>{{ row.workingHours }}</small></div></template></el-table-column>
          <el-table-column label="覆盖区域" min-width="150"><template #default="{ row }"><div class="zone-list"><span v-for="zone in row.zones" :key="zone">{{ zone }}</span></div></template></el-table-column>
          <el-table-column label="证件" width="96"><template #default="{ row }"><el-tag :type="row.docs === 'Verified' ? 'success' : 'warning'" effect="light">{{ row.docs === 'Verified' ? '已验证' : '即将到期' }}</el-tag></template></el-table-column>
          <el-table-column label="今日状态" width="96"><template #default="{ row }"><span class="status-pill" :class="`status-pill--${row.status}`"><i></i>{{ staffStatusLabel(row.status) }}</span></template></el-table-column>
          <el-table-column label="操作" width="96" align="right"><template #default="{ row }"><el-button link type="primary" @click="showToast(`打开 ${row.name} 的人员档案`)">查看</el-button></template></el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else-if="section === 'schedule'">
      <section class="review-banner schedule-review"><span><Clock /></span><div><strong>2 个排班动作待处理</strong><p>1 个休假申请和 1 个时间冲突需要确认。</p></div><el-button size="small" @click="showToast('已打开待处理排班动作')">查看</el-button></section>
      <div class="schedule-toolbar">
        <div class="week-navigation">
          <el-button circle :icon="ArrowLeft" @click="showToast('已切换到上一周')" />
          <div><strong>2026年9月21日 – 9月27日</strong><span>Asia/Dubai · GST</span></div>
          <el-button circle :icon="ArrowRight" @click="showToast('已切换到下一周')" />
          <el-button @click="showToast('已返回本周')">本周</el-button>
        </div>
        <div class="schedule-filters"><el-radio-group v-model="scheduleView" size="small"><el-radio-button value="day">日</el-radio-button><el-radio-button value="week">周</el-radio-button></el-radio-group><el-select v-model="scheduleSkill"><el-option label="全部服务" value="all" /><el-option label="Cleaning" value="Cleaning" /><el-option label="AC Service" value="AC Service" /></el-select><el-button :icon="Plus" type="primary" @click="shiftDialogVisible = true">添加班次 / Block</el-button></div>
      </div>
      <div class="metric-grid metric-grid--schedule">
        <article class="mini-metric"><span>本周可用工时</span><strong>1,284h</strong><small class="positive">+8.2% vs last week</small></article>
        <article class="mini-metric"><span>已分配工时</span><strong>936h</strong><small>72.9% utilization</small></article>
        <article class="mini-metric"><span>未覆盖班次</span><strong>7</strong><small class="warning-text">需要安排人员</small></article>
        <article class="mini-metric"><span>休假申请</span><strong>4</strong><small>2 pending approval</small></article>
      </div>
      <el-card class="surface-card schedule-card" shadow="never">
        <div class="schedule-grid schedule-grid--header">
          <div class="staff-column-title">人员 / Staff</div>
          <div v-for="day in weekDays" :key="day.key" class="day-head" :class="{ today: day.today }"><span>{{ day.weekday }}</span><strong>{{ day.date }}</strong><small>{{ day.orders }} orders</small></div>
        </div>
        <div v-for="person in schedulePeople" :key="person.id" class="schedule-grid schedule-row">
          <div class="schedule-person"><el-avatar :size="34" :style="{ background: person.color }">{{ initials(person.name) }}</el-avatar><span><strong>{{ person.name }}</strong><small>{{ person.skill }}</small></span></div>
          <button v-for="day in weekDays" :key="day.key" type="button" class="shift-cell" :class="shiftFor(person.id, day.key).type" @click="openShift(person, day)">
            <template v-if="shiftFor(person.id, day.key).label"><strong>{{ shiftFor(person.id, day.key).label }}</strong><span>{{ shiftFor(person.id, day.key).time }}</span><small>{{ shiftFor(person.id, day.key).orders }}</small></template>
            <template v-else><span class="add-shift">+</span><small>添加班次</small></template>
          </button>
        </div>
        <div class="schedule-legend"><span><i class="shift-standard"></i>正常班次</span><span><i class="shift-busy"></i>订单较满</span><span><i class="shift-leave"></i>休假 / 不可用</span><span><i class="shift-open"></i>未排班</span></div>
      </el-card>
    </template>

    <template v-else-if="section === 'orders'">
      <el-card class="surface-card" shadow="never" v-loading="orderLoading">
        <div class="table-toolbar">
          <div class="table-search">
            <el-input v-model.trim="orderKeyword" :prefix-icon="Search" placeholder="订单号" clearable @keyup.enter="searchOrders" @clear="searchOrders" />
            <el-date-picker
              v-model="orderDateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              start-placeholder="服务开始"
              end-placeholder="服务结束"
              clearable
              @change="searchOrders"
            />
            <el-button @click="searchOrders">查询</el-button>
          </div>
          <div class="result-count">{{ orderTotal }} 个订单</div>
        </div>
        <el-table :data="supplierOrders" class="data-table" row-key="orderId" empty-text="还没有分配给你的订单">
          <el-table-column label="订单号" min-width="160" prop="orderNo" />
          <el-table-column label="服务" min-width="220">
            <template #default="{ row }">
              <div class="muted-stack">
                <strong>{{ orderServiceName(row) }}</strong>
                <small>{{ orderSkuText(row) }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="服务时间" min-width="170">
            <template #default="{ row }">{{ row.serviceTime || '—' }}</template>
          </el-table-column>
          <el-table-column label="服务地点" min-width="220">
            <template #default="{ row }">
              <div class="muted-stack">
                <span>{{ row.serviceAddress || '—' }}</span>
                <small>{{ orderPlaceText(row) }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="用户备注" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">{{ row.remark || '—' }}</template>
          </el-table-column>
          <el-table-column label="生效报价" width="120" align="right">
            <template #default="{ row }"><strong class="money-value">{{ orderMoney(row.quoteAmount) }}</strong></template>
          </el-table-column>
          <el-table-column label="" width="80" align="right">
            <template #default="{ row }"><el-button link type="primary" @click="openAssignedOrder(row)">详情</el-button></template>
          </el-table-column>
        </el-table>
        <div class="table-toolbar">
          <el-pagination
            layout="prev, pager, next"
            :current-page="orderPage"
            :page-size="10"
            :total="orderTotal"
            @current-change="changeOrderPage"
          />
        </div>
      </el-card>
    </template>

    <template v-else-if="section === 'pricing'">
      <section class="pricing-health">
        <div>
          <span class="health-icon pending"><Clock /></span>
          <div>
            <strong>{{ pendingQuoteCount }} 个服务报价正在审核</strong>
            <p>按已勾选的服务报价。点报价填写各规格价格，保存草稿或提交审核。待审核期间不能改价。</p>
          </div>
        </div>
      </section>
      <el-card class="surface-card pricing-card" shadow="never" v-loading="quoteLoading || catalogLoading">
        <div class="pricing-toolbar">
          <div class="pricing-filter">
            <span>服务分类</span>
            <el-select v-model="quoteCategory" filterable>
              <el-option label="全部服务" value="all" />
              <el-option v-for="category in serviceCategories" :key="category" :label="category" :value="category" />
            </el-select>
            <small>共 {{ filteredServiceRows.length }} 项服务</small>
          </div>
        </div>
        <el-table :data="filteredServiceRows" class="data-table" row-key="spuId" empty-text="还没有可报价的服务，请先在入驻问卷里勾选服务">
          <el-table-column label="分类" prop="category" min-width="160" />
          <el-table-column label="服务" prop="name" min-width="240" />
          <el-table-column label="人数" width="90">
            <template #default="{ row }">{{ row.workerCount ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="审核状态" width="120">
            <template #default="{ row }">
              <el-tag :type="quoteTagType(row.status)" effect="light">{{ quoteStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openServiceQuote(row)">报价</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-dialog v-model="quoteDialog.visible" :title="`${quoteDialog.name || '服务'} · 报价`" width="min(960px, calc(100vw - 32px))" :close-on-click-modal="false">
        <p class="quote-dialog__meta">{{ quoteDialog.category }} · {{ quoteStatusLabel(quoteDialog.status) }}</p>
        <p v-if="quoteDialog.rejectReason" class="rejected-copy">拒绝原因：{{ quoteDialog.rejectReason }}</p>
        <p v-if="quoteLocked" class="pending-copy">待审核期间不能改价。</p>
        <el-table v-loading="quoteDialog.loading" :data="quoteDialog.rows" class="data-table quote-spec-table" row-key="skuId" empty-text="这个服务还没有规格">
          <el-table-column v-for="column in quoteDialog.columns" :key="column.key" :label="column.label" min-width="140">
            <template #default="{ row }">{{ row.specs[column.key] || '—' }}</template>
          </el-table-column>
          <el-table-column v-if="!quoteDialog.columns.length" label="SKU" prop="skuCode" min-width="140" />
          <el-table-column label="平台价" width="110">
            <template #default="{ row }">{{ moneyText(row.platformPrice) }}</template>
          </el-table-column>
          <el-table-column label="生效报价" width="110">
            <template #default="{ row }">{{ moneyText(row.approvedPrice) }}</template>
          </el-table-column>
          <el-table-column label="本次报价" width="170">
            <template #default="{ row }">
              <el-input-number
                v-model="row.quotePrice"
                :min="0"
                :precision="2"
                :disabled="quoteLocked || row.available === false"
                controls-position="right"
              />
              <small v-if="row.available === false" class="muted-text">停售</small>
            </template>
          </el-table-column>
        </el-table>
        <template #footer>
          <el-button @click="quoteDialog.visible = false">关闭</el-button>
          <el-button :disabled="quoteLocked" :loading="quoteDialog.saving" @click="saveServiceQuote">保存草稿</el-button>
          <el-button type="primary" :disabled="quoteLocked" :loading="quoteDialog.saving" @click="submitServiceQuote">提交审核</el-button>
        </template>
      </el-dialog>
    </template>

    <template v-else-if="section === 'settlement'">
      <div class="metric-grid">
        <article class="metric-card"><span class="metric-icon metric-icon--green"><Money /></span><div><small>累计收益</small><strong>AED 286.4k</strong><p>Since Jan 2026</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--blue"><CircleCheck /></span><div><small>已结算</small><strong>AED 243.1k</strong><p>18 payout batches</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--amber"><Clock /></span><div><small>待结算</small><strong>AED 12,680</strong><p>Next payout · 30 Sep</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--purple"><Document /></span><div><small>本期调整</small><strong>- AED 180</strong><p>1 append-only adjustment</p></div></article>
      </div>
      <el-card class="surface-card" shadow="never">
        <el-tabs v-model="settlementTab" class="settlement-tabs">
          <el-tab-pane label="交易明细" name="transactions">
            <section class="settlement-note"><CircleCheck /><span><strong>每笔收益均来自订单完成时锁定的快照</strong><small>金额调整不会覆盖原记录，而是新增一条调整流水。</small></span></section>
            <el-table :data="settlementRows" class="data-table" row-key="jobId">
              <el-table-column label="Web Order / Job ID" min-width="205"><template #default="{ row }"><div class="order-id"><strong>{{ row.webOrder }}</strong><small>{{ row.jobId }} · {{ row.date }}</small></div></template></el-table-column>
              <el-table-column label="服务" min-width="190" prop="service" />
              <el-table-column label="执行人员" min-width="150" prop="staff" />
              <el-table-column label="订单收益" min-width="125" align="right"><template #default="{ row }">AED {{ row.base }}</template></el-table-column>
              <el-table-column label="调整" min-width="110" align="right"><template #default="{ row }"><span :class="row.adjustment < 0 ? 'negative' : 'muted-text'">{{ row.adjustment ? `- AED ${Math.abs(row.adjustment)}` : '—' }}</span></template></el-table-column>
              <el-table-column label="最终应付" min-width="130" align="right"><template #default="{ row }"><strong class="money-value">AED {{ row.payable }}</strong></template></el-table-column>
              <el-table-column label="结算状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'Paid' ? 'success' : 'warning'" effect="light">{{ row.status }}</el-tag></template></el-table-column>
              <el-table-column label="批次" min-width="130" prop="batch" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="付款批次" name="payouts">
            <el-table :data="payoutBatches" class="data-table" row-key="batch">
              <el-table-column label="批次" prop="batch" width="120" /><el-table-column label="账期" prop="period" min-width="160" /><el-table-column label="订单数" prop="orders" width="88" /><el-table-column label="应付金额" width="120"><template #default="{ row }"><strong>AED {{ row.amount }}</strong></template></el-table-column><el-table-column label="付款日" prop="paidAt" width="118" /><el-table-column label="状态" width="88"><template #default="{ row }"><el-tag :type="row.status === 'Paid' ? 'success' : 'warning'">{{ row.status }}</el-tag></template></el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>

    <el-dialog v-model="staffDialogVisible" title="新增供应商人员 / Add Staff" width="620px" :close-on-click-modal="false">
      <el-form label-position="top" class="form-grid">
        <el-form-item label="姓名 / Full Name"><el-input v-model="newStaff.name" placeholder="例如：Amina Noor" /></el-form-item>
        <el-form-item label="员工编号 / Staff ID"><el-input v-model="newStaff.id" /></el-form-item>
        <el-form-item label="手机号 / Mobile"><el-input v-model="newStaff.mobile" placeholder="+971" /></el-form-item>
        <el-form-item label="性别 / Gender"><el-select v-model="newStaff.gender" style="width: 100%"><el-option label="Female" value="Female" /><el-option label="Male" value="Male" /></el-select></el-form-item>
        <el-form-item label="角色 / Role"><el-select v-model="newStaff.role" style="width: 100%"><el-option label="Technician" value="Technician" /><el-option label="Cleaner" value="Cleaner" /><el-option label="Team Lead" value="Team Lead" /></el-select></el-form-item>
        <el-form-item label="主要技能 / Primary Skill"><el-select v-model="newStaff.skill" style="width: 100%"><el-option v-for="skill in staffSkills" :key="skill" :label="skill" :value="skill" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="staffDialogVisible = false">取消</el-button><el-button type="primary" @click="addStaff">保存人员</el-button></template>
    </el-dialog>


    <el-dialog v-model="shiftDialogVisible" title="添加班次 / Block" width="620px" :close-on-click-modal="false">
      <el-form label-position="top" class="form-grid">
        <el-form-item label="人员"><el-select v-model="shiftForm.staff"><el-option v-for="person in schedulePeople" :key="person.id" :label="person.name" :value="person.id" /></el-select></el-form-item>
        <el-form-item label="动作"><el-select v-model="shiftForm.type"><el-option label="工作班次" value="shift" /><el-option label="不可用 Block" value="block" /><el-option label="休假" value="leave" /></el-select></el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="shiftForm.date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="时间"><el-time-picker v-model="shiftForm.time" is-range range-separator="至" /></el-form-item>
        <el-form-item label="备注" class="span-2"><el-input v-model="shiftForm.note" type="textarea" /></el-form-item>
      </el-form>
      <section v-if="shiftConflict" class="conflict-alert"><Warning /><span><strong>发现时间冲突</strong><small>该员工 14:00–18:00 已被订单 JOB-88421 占用。</small></span></section>
      <template #footer><el-button @click="shiftDialogVisible = false">取消</el-button><el-button type="primary" @click="validateShift">校验并保存</el-button></template>
    </el-dialog>

    <el-drawer v-model="orderDrawerVisible" :title="selectedOrder?.orderNo || '订单详情'" size="640px">
      <template v-if="selectedOrder">
        <dl class="detail-list">
          <div><dt>服务时间</dt><dd>{{ selectedOrder.serviceTime || '—' }}</dd></div>
          <div><dt>服务地点</dt><dd>{{ selectedOrder.serviceAddress || '—' }}</dd></div>
          <div><dt>小区 / 楼栋 / 房号</dt><dd>{{ orderPlaceText(selectedOrder) }}</dd></div>
          <div><dt>用户备注</dt><dd>{{ selectedOrder.remark || '—' }}</dd></div>
          <div><dt>生效报价合计</dt><dd>{{ orderMoney(selectedOrder.quoteAmount) }}</dd></div>
        </dl>
        <el-table :data="selectedOrder.lines || []" row-key="skuId" empty-text="没有服务明细">
          <el-table-column label="服务" min-width="140" prop="spuName" />
          <el-table-column label="SKU" min-width="120" prop="skuCode" />
          <el-table-column label="数量" width="70" prop="quantity" />
          <el-table-column label="生效单价" width="100">
            <template #default="{ row }">{{ orderMoney(row.quotePrice) }}</template>
          </el-table-column>
          <el-table-column label="小计" width="100">
            <template #default="{ row }">{{ orderMoney(row.quoteAmount) }}</template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>

    <el-dialog
      v-model="filePreview.open"
      class="policy-preview"
      :title="filePreview.name"
      width="min(960px, 92vw)"
      append-to-body
      destroy-on-close
    >
      <div class="policy-preview__stage">
        <img v-if="filePreview.kind === 'image'" :src="filePreview.url" :alt="filePreview.name" />
        <iframe v-else-if="filePreview.kind === 'pdf'" :src="filePreview.url" :title="filePreview.name" />
        <p v-else>This file cannot be previewed.</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  onboardingDetail,
  onboardingPage,
  onboardingSave,
  quoteList,
  saveQuoteDraft,
  serviceAreaList,
  serviceCommunityPage,
  serviceCatalog,
  submitQuote,
  supplierAssignedOrders,
  uploadFile,
} from '@/modules/admin/api/supplierWorkbench'
import { listBySpu } from '@/modules/admin/api/spu'
import { getAdminLocale } from '@/modules/admin/locales'
import { pickI18nText } from '@/modules/admin/utils/i18n'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CircleCheck,
  Clock,
  Document,
  Download,
  Location,
  Money,
  OfficeBuilding,
  Plus,
  Search,
  Tickets,
  UserFilled,
  Warning,
} from '@element-plus/icons-vue'

type Section = 'overview' | 'profile' | 'service-area' | 'staff' | 'schedule' | 'orders' | 'pricing' | 'settlement'

const props = withDefaults(defineProps<{ section?: Section }>(), { section: 'overview' })
const section = computed(() => props.section)
const router = useRouter()

const pageMeta = {
  overview: { title: '数据与收益', description: '查看经营表现、收益趋势、服务容量与待处理事项。', primaryAction: '' },
  profile: { title: 'Company Profile', description: 'One page for company details, contact, capacity, and insurance.', primaryAction: 'Submit for review' },
  'service-area': { title: '服务区域', description: '回显入驻问卷里勾选的服务区域和小区，并可以再调整。', primaryAction: '管理服务区域' },
  staff: { title: '人员管理', description: '维护人员角色、技能、默认工作时间、证件与可派状态。', primaryAction: '新增人员' },
  schedule: { title: '日程管理', description: '按日或周管理工作班次、休假、Block 与订单占用。', primaryAction: '添加班次 / Block' },
  orders: { title: '订单管理', description: '查看分配给当前供应商的订单、服务地点和生效报价。', primaryAction: '' },
  pricing: { title: '服务与报价', description: '按服务填写各规格报价，保存草稿或提交审核。', primaryAction: '' },
  settlement: { title: '收益与结算', description: '核对订单收益、调整流水和付款批次。', primaryAction: '' },
} as const

const meta = computed(() => pageMeta[section.value])
const supplierRecordId = ref<number | null>(null)
const supplierOptions = ref<Array<{ id: number; companyName: string }>>([])
const onboardingStatus = ref<number | null>(null)
const rejectReason = ref('')
const saving = ref(false)
const femaleStaffCount = ref(0)
const maleStaffCount = ref(0)
const ownTransportation = ref(false)
const profileAnchor = ref('company')
const goProfile = (id: string) => {
  profileAnchor.value = id
  const target = document.getElementById(`profile-${id}`)
  const scroller = document.querySelector('.el-main') as HTMLElement | null
  if (!target || !scroller) return
  const align = () => {
    const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 16
    scroller.scrollTo({ top, behavior: 'auto' })
  }
  align()
  window.setTimeout(align, 0)
}

const earningRange = ref('6m')
const earningBars = [
  { month: 'Apr', value: 24.6, height: 54 }, { month: 'May', value: 27.8, height: 63 }, { month: 'Jun', value: 31.2, height: 72 },
  { month: 'Jul', value: 29.5, height: 67 }, { month: 'Aug', value: 35.5, height: 83 }, { month: 'Sep', value: 38.4, height: 92 },
]
const recentTransactions = [
  { webOrder: 'HX-260924-0186', jobId: 'JOB-88421', service: 'Regular Cleaning', amount: 224, date: '24 Sep' },
  { webOrder: 'HX-260924-0179', jobId: 'JOB-88408', service: 'Split AC Cleaning', amount: 360, date: '24 Sep' },
  { webOrder: 'HX-260923-0138', jobId: 'JOB-88366', service: 'Sofa Cleaning', amount: 250, date: '23 Sep' },
]
const goTo = (target: Section) => router.push({ path: `/admin/supplier-management/${target}`, query: router.currentRoute.value.query })

const companyForm = reactive({
  companyName: '',
  licenseNo: '',
  licenseExpiry: '',
  trn: '',
  years: 0,
  address: '',
  contact: '',
  email: '',
  mobile: '',
  whatsapp: '',
})

const complianceItems = reactive([
  { key: 'public', fileKey: 'publicLiabilityInsuranceFile', label: 'Public Liability Insurance', hint: 'Upload at least one copy when the answer is yes.', enabled: false, files: [] as string[] },
  { key: 'employee', fileKey: 'employeeInsuranceFile', label: 'Employee Insurance', hint: 'Upload at least one copy when the answer is yes.', enabled: false, files: [] as string[] },
  { key: 'tax', label: '可开具税务发票 / Tax Invoice', hint: 'VAT / TRN', enabled: false, files: [] as string[] },
  { key: 'equipment', label: '自有设备 / Own Equipment', hint: '是否自有设备', enabled: false, files: [] as string[] },
])

const bankForm = reactive({
  accountName: 'PrimeCare Home Services LLC',
  bankName: 'Emirates NBD',
  iban: 'AE07 0260 0010 1234 5678 901',
  swift: 'EBILAEAD',
  currency: 'AED',
})
const fileNameFromUrl = (url: string) => {
  const path = decodeURIComponent(url.split('?')[0].split('#')[0])
  return path.split('/').filter(Boolean).pop() || url
}

const fileKind = (url: string) => {
  const name = fileNameFromUrl(url).toLowerCase()
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return 'image'
  if (name.endsWith('.pdf')) return 'pdf'
  return 'other'
}

const filePreview = reactive({
  open: false,
  url: '',
  name: '',
  kind: 'other' as 'image' | 'pdf' | 'other',
})

const openFilePreview = (url: string) => {
  filePreview.url = url
  filePreview.name = fileNameFromUrl(url)
  filePreview.kind = fileKind(url)
  filePreview.open = true
}

const asFileList = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value !== 'string' || !value.trim()) return []
  const text = value.trim()
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean)
    } catch {
      return [text]
    }
  }
  return [text]
}

const policyDocuments = computed(() => complianceItems
  .filter((item) => item.fileKey)
  .flatMap((item) => item.files.map((url, index) => ({
    key: `${item.key}-${index}-${url}`,
    label: item.label,
    name: fileNameFromUrl(url),
    url,
    kind: fileKind(url),
  }))))

const capacityForm = reactive({ workers: 0, concurrent: 0, monthly: 0, leadTime: 0, start: '08:00', end: '18:00' })
const capacityToggles = reactive([
  { label: '周末服务', en: 'Weekend service', enabled: false },
  { label: '公共假期服务', en: 'Public holiday service', enabled: false },
  { label: '当日预约', en: 'Same-day booking', enabled: false },
  { label: '紧急服务', en: 'Emergency service', enabled: false },
])

type StaffStatus = 'available' | 'busy' | 'leave'
type StaffRow = { id: string; name: string; gender: string; role: string; employment: string; workingDays: string; workingHours: string; mobile: string; language: string; skills: string[]; zones: string[]; docs: string; status: StaffStatus; color: string }

const staffSkills = ['Cleaning', 'Deep Cleaning', 'AC Service', 'Handyman', 'Painting', 'Beauty & Wellness']
const staff = ref<StaffRow[]>([
  { id: 'STF-0042', name: 'Amina Noor', gender: 'Female', role: 'Team Lead', employment: 'Full-time', workingDays: 'Mon–Fri', workingHours: '07:00–16:00', mobile: '+971 52 874 2210', language: 'English · Arabic', skills: ['Cleaning', 'Deep Cleaning'], zones: ['Z01', 'Z02', 'Z08'], docs: 'Verified', status: 'available', color: '#6c63d9' },
  { id: 'STF-0038', name: 'Ravi Kumar', gender: 'Male', role: 'Technician', employment: 'Full-time', workingDays: 'Sun–Thu', workingHours: '10:00–19:00', mobile: '+971 55 390 1184', language: 'English · Hindi', skills: ['AC Service', 'Handyman'], zones: ['Z03', 'Z04', 'Z05'], docs: 'Verified', status: 'busy', color: '#2c8b7b' },
  { id: 'STF-0034', name: 'Fatima Zahra', gender: 'Female', role: 'Specialist', employment: 'Part-time', workingDays: 'Tue–Sun', workingHours: '08:00–17:00', mobile: '+971 50 612 4473', language: 'English · Urdu', skills: ['Cleaning', 'Beauty & Wellness'], zones: ['Z01', 'Z09'], docs: 'Expiring', status: 'available', color: '#d17a45' },
  { id: 'STF-0029', name: 'Arjun Singh', gender: 'Male', role: 'Technician', employment: 'Full-time', workingDays: 'Wed–Sun', workingHours: '10:00–19:00', mobile: '+971 56 338 9017', language: 'English · Hindi', skills: ['Painting', 'Handyman'], zones: ['Z05', 'Z06', 'Z07'], docs: 'Verified', status: 'leave', color: '#3976b8' },
  { id: 'STF-0024', name: 'Lina Santos', gender: 'Female', role: 'Cleaner', employment: 'Full-time', workingDays: 'Mon–Sat', workingHours: '07:00–16:00', mobile: '+971 54 480 2216', language: 'English · Tagalog', skills: ['Deep Cleaning'], zones: ['Z02', 'Z03', 'Z04'], docs: 'Verified', status: 'busy', color: '#9b5e9d' },
  { id: 'STF-0018', name: 'Ahmed Nasser', gender: 'Male', role: 'Technician', employment: 'Full-time', workingDays: 'Sun–Thu', workingHours: '09:00–18:00', mobile: '+971 50 991 7625', language: 'Arabic · English', skills: ['AC Service', 'Handyman'], zones: ['Z08', 'Z09', 'Z10'], docs: 'Expiring', status: 'available', color: '#3d8e55' },
])
const staffKeyword = ref('')
const staffSkill = ref('')
const staffStatus = ref('')
const filteredStaff = computed(() => staff.value.filter((person) => {
  const keyword = staffKeyword.value.trim().toLowerCase()
  const matchesKeyword = !keyword || `${person.name} ${person.id} ${person.mobile}`.toLowerCase().includes(keyword)
  return matchesKeyword && (!staffSkill.value || person.skills.includes(staffSkill.value)) && (!staffStatus.value || person.status === staffStatus.value)
}))
const staffDialogVisible = ref(false)
const newStaff = reactive({ name: '', id: 'STF-0043', mobile: '', gender: 'Female', role: 'Cleaner', skill: 'Cleaning' })

const addStaff = () => {
  if (!newStaff.name.trim()) return ElMessage.warning('请输入人员姓名')
  staff.value.unshift({ id: newStaff.id, name: newStaff.name, gender: newStaff.gender, role: newStaff.role, employment: 'Full-time', workingDays: 'Mon–Fri', workingHours: '08:00–17:00', mobile: newStaff.mobile || '+971 —', language: 'English', skills: [newStaff.skill], zones: ['Z01'], docs: 'Expiring', status: 'available', color: '#5966b1' })
  staffDialogVisible.value = false
  ElMessage.success('Demo 人员已添加')
}

const staffStatusLabel = (status: StaffStatus) => ({ available: '可派', busy: '服务中', leave: '休假' })[status]
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

const scheduleSkill = ref('all')
const scheduleView = ref('week')
const weekDays = [
  { key: 'mon', weekday: '周一', date: '09/21', orders: 18 },
  { key: 'tue', weekday: '周二', date: '09/22', orders: 21 },
  { key: 'wed', weekday: '周三', date: '09/23', orders: 24 },
  { key: 'thu', weekday: '周四', date: '09/24', orders: 26, today: true },
  { key: 'fri', weekday: '周五', date: '09/25', orders: 23 },
  { key: 'sat', weekday: '周六', date: '09/26', orders: 31 },
  { key: 'sun', weekday: '周日', date: '09/27', orders: 28 },
]
const schedulePeople = staff.value.slice(0, 5).map((person) => ({ id: person.id, name: person.name, color: person.color, skill: person.skills[0] }))
type Shift = { type: string; label?: string; time?: string; orders?: string }
const shifts: Record<string, Shift> = {
  'STF-0042-mon': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '3 orders' }, 'STF-0042-tue': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '4 orders' }, 'STF-0042-wed': { type: 'busy', label: '长班', time: '07:00–19:00', orders: '6 orders' }, 'STF-0042-thu': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '4 orders' }, 'STF-0042-fri': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '3 orders' }, 'STF-0042-sat': { type: 'leave', label: '休假', time: 'Approved', orders: '' }, 'STF-0042-sun': { type: 'open' },
  'STF-0038-mon': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '4 orders' }, 'STF-0038-tue': { type: 'busy', label: '中班', time: '10:00–21:00', orders: '6 orders' }, 'STF-0038-wed': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '4 orders' }, 'STF-0038-thu': { type: 'busy', label: '长班', time: '09:00–21:00', orders: '7 orders' }, 'STF-0038-fri': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '4 orders' }, 'STF-0038-sat': { type: 'standard', label: '早班', time: '08:00–17:00', orders: '4 orders' }, 'STF-0038-sun': { type: 'leave', label: '休息', time: 'Day off', orders: '' },
  'STF-0034-mon': { type: 'leave', label: '休息', time: 'Day off', orders: '' }, 'STF-0034-tue': { type: 'standard', label: '早班', time: '08:00–17:00', orders: '3 orders' }, 'STF-0034-wed': { type: 'standard', label: '早班', time: '08:00–17:00', orders: '4 orders' }, 'STF-0034-thu': { type: 'standard', label: '早班', time: '08:00–17:00', orders: '4 orders' }, 'STF-0034-fri': { type: 'open' }, 'STF-0034-sat': { type: 'busy', label: '长班', time: '09:00–21:00', orders: '7 orders' }, 'STF-0034-sun': { type: 'busy', label: '长班', time: '09:00–21:00', orders: '6 orders' },
  'STF-0029-mon': { type: 'leave', label: '年假', time: 'Annual leave', orders: '' }, 'STF-0029-tue': { type: 'leave', label: '年假', time: 'Annual leave', orders: '' }, 'STF-0029-wed': { type: 'leave', label: '年假', time: 'Annual leave', orders: '' }, 'STF-0029-thu': { type: 'open' }, 'STF-0029-fri': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '3 orders' }, 'STF-0029-sat': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '4 orders' }, 'STF-0029-sun': { type: 'standard', label: '中班', time: '10:00–19:00', orders: '3 orders' },
  'STF-0024-mon': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '4 orders' }, 'STF-0024-tue': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '4 orders' }, 'STF-0024-wed': { type: 'open' }, 'STF-0024-thu': { type: 'standard', label: '早班', time: '07:00–16:00', orders: '4 orders' }, 'STF-0024-fri': { type: 'busy', label: '长班', time: '07:00–19:00', orders: '6 orders' }, 'STF-0024-sat': { type: 'busy', label: '长班', time: '07:00–19:00', orders: '7 orders' }, 'STF-0024-sun': { type: 'leave', label: '休息', time: 'Day off', orders: '' },
}
const shiftFor = (personId: string, day: string) => shifts[`${personId}-${day}`] || { type: 'open' }
const shiftDialogVisible = ref(false)
const shiftConflict = ref(false)
const shiftForm = reactive<{ staff: string; type: string; date: string; time: Date[]; note: string }>({ staff: 'STF-0042', type: 'shift', date: '2026-09-24', time: [], note: '' })
const openShift = (person: { id: string }, day: { key: string; date: string }) => {
  shiftForm.staff = person.id
  shiftForm.date = `2026-${day.date.replace('/', '-')}`
  shiftConflict.value = false
  shiftDialogVisible.value = true
}
const validateShift = () => {
  if (!shiftConflict.value && shiftForm.staff === 'STF-0042') { shiftConflict.value = true; return }
  shiftDialogVisible.value = false
  shiftConflict.value = false
  ElMessage.success('排班动作已保存')
}

const orderKeyword = ref('')
const orderDateRange = ref<string[]>([])
const orderDrawerVisible = ref(false)
const selectedOrder = ref<any>(null)
const orderMoney = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '—'
}
const orderServiceName = (row: any) => {
  const names = (row.lines || []).map((line: any) => line.spuName).filter(Boolean)
  return names.length ? names.join('、') : '—'
}
const orderSkuText = (row: any) => {
  const codes = (row.lines || []).map((line: any) => line.skuCode || line.spuCode).filter(Boolean)
  return codes.length ? codes.join(' · ') : '—'
}
const orderPlaceText = (row: any) => [row.community, row.building, row.roomNo].filter(Boolean).join(' · ') || '—'
const openAssignedOrder = (row: any) => {
  selectedOrder.value = row
  orderDrawerVisible.value = true
}

const quoteCategory = ref('all')
const liveQuotes = ref<any[]>([])
const quoteDialog = reactive({
  visible: false,
  loading: false,
  saving: false,
  spuId: 0,
  name: '',
  category: '',
  status: undefined as number | undefined,
  rejectReason: '',
  columns: [] as { key: string; label: string }[],
  rows: [] as any[],
})
const quoteLocked = computed(() => Number(quoteDialog.status) === 1)

const settlementTab = ref('transactions')
const settlementRows = [
  { webOrder: 'HX-260923-0138', jobId: 'JOB-88366', date: '23 Sep', service: 'Sofa Cleaning', staff: 'Fatima Zahra', base: 250, adjustment: 0, payable: 250, status: 'Pending', batch: 'PAY-2609-03' },
  { webOrder: 'HX-260922-0112', jobId: 'JOB-88321', date: '22 Sep', service: 'Deep Cleaning – 2BR', staff: 'Amina + Lina', base: 420, adjustment: -180, payable: 240, status: 'Pending', batch: 'PAY-2609-03' },
  { webOrder: 'HX-260920-0098', jobId: 'JOB-88274', date: '20 Sep', service: 'Split AC Cleaning', staff: 'Ravi Kumar', base: 360, adjustment: 0, payable: 360, status: 'Paid', batch: 'PAY-2609-02' },
  { webOrder: 'HX-260919-0071', jobId: 'JOB-88233', date: '19 Sep', service: 'Regular Cleaning', staff: 'Amina Noor', base: 224, adjustment: 0, payable: 224, status: 'Paid', batch: 'PAY-2609-02' },
]
const payoutBatches = [
  { batch: 'PAY-2609-03', period: '21–30 Sep 2026', orders: 42, amount: '12,680', paidAt: '30 Sep 2026', status: 'Pending' },
  { batch: 'PAY-2609-02', period: '11–20 Sep 2026', orders: 48, amount: '14,920', paidAt: '22 Sep 2026', status: 'Paid' },
  { batch: 'PAY-2609-01', period: '01–10 Sep 2026', orders: 36, amount: '10,820', paidAt: '12 Sep 2026', status: 'Paid' },
]

const showToast = (message: string) => ElMessage.success(message)

type SupplierArea = { areaId: number; areaName: string; status?: number }
const platformAreas = ref<any[]>([])
const supplierAreas = ref<SupplierArea[]>([])
const selectedAreaIds = ref<number[]>([])
const draftAreaIds = ref<number[]>([])
const areaKeyword = ref('')
const areaEditorVisible = ref(false)
const editorLoading = ref(false)
const communitiesByArea = ref<Record<number, string[]>>({})
const servicesProvided = ref('')
const dubaiServiceAreas = ref('')
const serviceCatalogGroups = ref<any[]>([])
const catalogLoading = ref(false)
const quoteLoading = ref(false)
const serviceRows = computed(() => {
  const quoteBySpu = new Map(liveQuotes.value.map((quote) => [Number(quote.spuId), quote]))
  const fromCatalog = serviceCatalogGroups.value.flatMap((group) =>
    (group.services || [])
      .filter((service: any) => service.selected || quoteBySpu.has(Number(service.spuId)))
      .map((service: any) => {
        const quote = quoteBySpu.get(Number(service.spuId))
        return {
          spuId: Number(service.spuId),
          category: group.categoryName || '未分类',
          name: service.spuName || quote?.spuName || `服务 ${service.spuId}`,
          workerCount: service.workerCount,
          status: quote?.status,
          rejectReason: quote?.rejectReason || '',
        }
      }),
  )
  if (fromCatalog.length) return fromCatalog
  return liveQuotes.value.map((quote) => ({
    spuId: Number(quote.spuId),
    category: '未分类',
    name: quote.spuName || `服务 ${quote.spuId}`,
    workerCount: undefined,
    status: quote.status,
    rejectReason: quote.rejectReason || '',
  }))
})
const serviceCategories = computed(() => Array.from(new Set(serviceRows.value.map((row) => row.category).filter(Boolean))))
const filteredServiceRows = computed(() => (
  quoteCategory.value === 'all' ? serviceRows.value : serviceRows.value.filter((row) => row.category === quoteCategory.value)
))
const pendingQuoteCount = computed(() => serviceRows.value.filter((row) => Number(row.status) === 1).length)
const supplierOrders = ref<any[]>([])
const orderLoading = ref(false)
const orderTotal = ref(0)
const orderPage = ref(1)

const onboardingStatusLabel = computed(() => {
  const labels = ['草稿', '已提交', '已通过', '已驳回']
  return onboardingStatus.value == null ? '未创建' : labels[onboardingStatus.value] || '未知'
})
const onboardingTagType = computed(() => {
  if (onboardingStatus.value === 2) return 'success'
  if (onboardingStatus.value === 3) return 'danger'
  if (onboardingStatus.value === 1) return 'warning'
  return 'info'
})
const editorAreas = computed(() => {
  const map = new Map<number, { id: number; name: string }>()
  platformAreas.value.forEach((area) => {
    const id = Number(area.id)
    if (id) map.set(id, { id, name: area.name || `Area ${id}` })
  })
  supplierAreas.value.forEach((area) => {
    if (!map.has(area.areaId)) map.set(area.areaId, { id: area.areaId, name: area.areaName })
  })
  const keyword = areaKeyword.value.trim().toLowerCase()
  return [...map.values()].filter((area) => {
    if (!keyword) return true
    const communities = (communitiesByArea.value[area.id] || []).join(' ')
    return `${area.name} ${communities}`.toLowerCase().includes(keyword)
  })
})
const communityNames = (areaId: number) => communitiesByArea.value[areaId] || []
const communityText = (areaId: number) => {
  const names = communitiesByArea.value[areaId]
  if (!names) return '小区加载中'
  return names.length ? names.join('、') : '暂无小区'
}
const communityTotal = computed(() => supplierAreas.value.reduce((sum, area) => sum + communityNames(area.areaId).length, 0))

const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)
const bit = (enabled: boolean) => (enabled ? 1 : 0)
const quoteStatusLabel = (status?: number) => ['草稿', '待审核', '已通过', '已拒绝'][status ?? -1] || '未报价'
const quoteTagType = (status?: number) => (Number(status) === 1 ? 'warning' : Number(status) === 2 ? 'success' : Number(status) === 3 ? 'danger' : 'info')
const moneyText = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '—'
}
const specText = (value: unknown) => {
  if (value == null || value === '') return '—'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') return pickI18nText(value as Record<string, unknown>, getAdminLocale(), '—') || '—'
  return '—'
}

const buildProfilePayload = (status?: number, areaIds?: number[]) => ({
  id: supplierRecordId.value || undefined,
  companyName: companyForm.companyName,
  tradeLicenseNo: companyForm.licenseNo,
  licenseExpiry: companyForm.licenseExpiry,
  vatTrn: companyForm.trn,
  officeAddress: companyForm.address,
  contactPerson: companyForm.contact,
  mobile: companyForm.mobile,
  whatsapp: companyForm.whatsapp,
  email: companyForm.email,
  yearsInBusiness: companyForm.years,
  publicLiabilityInsurance: bit(complianceItems[0].enabled),
  publicLiabilityInsuranceFile: complianceItems[0].files,
  employeeInsurance: bit(complianceItems[1].enabled),
  employeeInsuranceFile: complianceItems[1].files,
  taxInvoiceAvailable: bit(complianceItems[2].enabled),
  ownEquipment: bit(complianceItems[3].enabled),
  ownTransportation: ownTransportation.value ? 1 : 0,
  totalAvailableWorkers: capacityForm.workers,
  maxSimultaneousOrders: capacityForm.concurrent,
  monthlyCapacity: capacityForm.monthly,
  minLeadTimeHours: capacityForm.leadTime,
  workingHours: capacityForm.start && capacityForm.end ? `${capacityForm.start}-${capacityForm.end}` : '',
  weekendService: bit(capacityToggles[0].enabled),
  publicHolidayService: bit(capacityToggles[1].enabled),
  sameDayBooking: bit(capacityToggles[2].enabled),
  emergencyService: bit(capacityToggles[3].enabled),
  femaleStaffAvailable: femaleStaffCount.value > 0 ? 1 : 0,
  femaleStaffCount: femaleStaffCount.value,
  maleStaffAvailable: maleStaffCount.value > 0 ? 1 : 0,
  maleStaffCount: maleStaffCount.value,
  servicesProvided: servicesProvided.value || null,
  dubaiServiceAreas: dubaiServiceAreas.value || null,
  status,
  areaIds,
})

const applyProfile = (detail: any) => {
  supplierRecordId.value = detail?.id ?? null
  onboardingStatus.value = detail?.status ?? null
  rejectReason.value = detail?.rejectReason || ''
  companyForm.companyName = detail?.companyName || ''
  companyForm.licenseNo = detail?.tradeLicenseNo || ''
  companyForm.licenseExpiry = detail?.licenseExpiry || ''
  companyForm.trn = detail?.vatTrn || ''
  companyForm.years = detail?.yearsInBusiness || 0
  companyForm.address = detail?.officeAddress || ''
  companyForm.contact = detail?.contactPerson || ''
  companyForm.email = detail?.email || ''
  companyForm.mobile = detail?.mobile || ''
  companyForm.whatsapp = detail?.whatsapp || ''
  capacityForm.workers = detail?.totalAvailableWorkers || 0
  capacityForm.concurrent = detail?.maxSimultaneousOrders || 0
  capacityForm.monthly = detail?.monthlyCapacity || 0
  capacityForm.leadTime = detail?.minLeadTimeHours || 0
  const hours = String(detail?.workingHours || '').split('-')
  capacityForm.start = hours[0] || '08:00'
  capacityForm.end = hours[1] || '18:00'
  capacityToggles[0].enabled = detail?.weekendService === 1
  capacityToggles[1].enabled = detail?.publicHolidayService === 1
  capacityToggles[2].enabled = detail?.sameDayBooking === 1
  capacityToggles[3].enabled = detail?.emergencyService === 1
  complianceItems[0].enabled = detail?.publicLiabilityInsurance === 1
  complianceItems[0].files = asFileList(detail?.publicLiabilityInsuranceFile)
  complianceItems[1].enabled = detail?.employeeInsurance === 1
  complianceItems[1].files = asFileList(detail?.employeeInsuranceFile)
  complianceItems[2].enabled = detail?.taxInvoiceAvailable === 1
  complianceItems[3].enabled = detail?.ownEquipment === 1
  ownTransportation.value = detail?.ownTransportation === 1
  femaleStaffCount.value = detail?.femaleStaffCount || 0
  maleStaffCount.value = detail?.maleStaffCount || 0
  servicesProvided.value = detail?.servicesProvided || ''
  dubaiServiceAreas.value = detail?.dubaiServiceAreas || ''
  supplierAreas.value = (detail?.serviceAreas || [])
    .map((area: any) => ({
      areaId: Number(area.areaId),
      areaName: area.areaName || '',
      status: area.status,
    }))
    .filter((area: SupplierArea) => area.areaId)
  selectedAreaIds.value = supplierAreas.value.map((area) => area.areaId)
  loadAreaCommunities(selectedAreaIds.value)
}

const loadSupplierDetail = async (id: number) => {
  const detail = unwrap(await onboardingDetail(id))
  applyProfile(detail)
  await Promise.all([
    loadCatalog(),
    loadQuotes(),
    section.value === 'orders' ? loadOrders() : Promise.resolve(),
  ])
}

const loadSupplierOptions = async () => {
  const page = unwrap(await onboardingPage({ pageNum: 1, pageSize: 50 }))
  const list = page?.list || []
  supplierOptions.value = list.map((item: any) => ({ id: item.id, companyName: item.companyName }))
  const queryId = Number(router.currentRoute.value.query.supplierId || 0)
  const initialId = queryId || supplierOptions.value[0]?.id
  if (initialId) await loadSupplierDetail(initialId)
}

const switchSupplier = (id: number) => loadSupplierDetail(id)

const saveProfile = async (status: number) => {
  saving.value = true
  try {
    const id = unwrap(await onboardingSave(buildProfilePayload(status)))
    if (id) supplierRecordId.value = Number(id)
    onboardingStatus.value = status
    ElMessage.success(status === 1 ? '入驻资料已提交' : '草稿已保存')
    const page = unwrap(await onboardingPage({ pageNum: 1, pageSize: 50 }))
    supplierOptions.value = (page?.list || []).map((item: any) => ({ id: item.id, companyName: item.companyName }))
    if (supplierRecordId.value) await loadSupplierDetail(supplierRecordId.value)
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const removeInsuranceFile = (fileKey: string | undefined, index: number) => {
  const target = complianceItems.find((item) => item.fileKey === fileKey)
  if (target) target.files.splice(index, 1)
}

const uploadInsurance = async (fileKey: string | undefined, options: any) => {
  try {
    const target = complianceItems.find((item) => item.fileKey === fileKey)
    if (target && target.files.length >= 20) {
      throw new Error('每种保险最多 20 份')
    }
    const url = unwrap(await uploadFile(options.file as File))
    const fileUrl = typeof url === 'string' ? url : url?.url || ''
    if (target && fileUrl && !target.files.includes(fileUrl)) target.files.push(fileUrl)
    options.onSuccess?.(url)
    ElMessage.success('保单已上传')
  } catch (error: any) {
    options.onError?.(error)
    ElMessage.error(error?.message || '上传失败')
  }
}

const loadAreaCommunities = async (areaIds: number[]) => {
  const missing = [...new Set(areaIds.filter(Boolean))].filter((id) => communitiesByArea.value[id] == null)
  if (!missing.length) return
  const loaded = await Promise.all(missing.map(async (areaId) => {
    try {
      const names: string[] = []
      let pageNum = 1
      let total = Number.POSITIVE_INFINITY
      while (names.length < total && pageNum <= 5) {
        const page = unwrap(await serviceCommunityPage({ areaId, pageNum, pageSize: 200, status: 1 }))
        const list = page?.list || []
        total = Number(page?.total ?? list.length)
        names.push(...list.map((item: any) => String(item.name || '')).filter(Boolean))
        if (!list.length) break
        pageNum += 1
      }
      return [areaId, names] as const
    } catch {
      return [areaId, []] as const
    }
  }))
  communitiesByArea.value = { ...communitiesByArea.value, ...Object.fromEntries(loaded) }
}

const openAreaEditor = async () => {
  if (!supplierRecordId.value) {
    ElMessage.warning('请先保存企业资料')
    return
  }
  draftAreaIds.value = [...selectedAreaIds.value]
  areaKeyword.value = ''
  areaEditorVisible.value = true
  editorLoading.value = true
  try {
    platformAreas.value = unwrap(await serviceAreaList({ status: 1 })) || []
    await loadAreaCommunities(platformAreas.value.map((area) => Number(area.id)))
  } catch (error: any) {
    ElMessage.error(error?.message || '服务区域加载失败')
  } finally {
    editorLoading.value = false
  }
}

const toggleDraftArea = (id: number, checked: boolean) => {
  draftAreaIds.value = checked
    ? Array.from(new Set([...draftAreaIds.value, id]))
    : draftAreaIds.value.filter((item) => item !== id)
}

const areaNameById = (id: number) => {
  const platform = platformAreas.value.find((area) => Number(area.id) === id)
  if (platform?.name) return String(platform.name)
  return supplierAreas.value.find((area) => area.areaId === id)?.areaName || ''
}

const saveAreas = async () => {
  if (!companyForm.companyName) {
    ElMessage.warning('请先填写企业资料里的必填项')
    return
  }
  dubaiServiceAreas.value = draftAreaIds.value.map(areaNameById).filter(Boolean).join(', ')
  saving.value = true
  try {
    const id = unwrap(await onboardingSave(buildProfilePayload(onboardingStatus.value ?? undefined, draftAreaIds.value)))
    if (id) supplierRecordId.value = Number(id)
    areaEditorVisible.value = false
    ElMessage.success('服务区域已保存')
    if (supplierRecordId.value) await loadSupplierDetail(supplierRecordId.value)
  } catch (error: any) {
    ElMessage.error(error?.message || '保存服务区域失败')
  } finally {
    saving.value = false
  }
}

const loadCatalog = async () => {
  if (!supplierRecordId.value) return
  catalogLoading.value = true
  try {
    serviceCatalogGroups.value = unwrap(await serviceCatalog(supplierRecordId.value)) || []
  } finally {
    catalogLoading.value = false
  }
}

const loadQuotes = async () => {
  if (!supplierRecordId.value) return
  quoteLoading.value = true
  try {
    liveQuotes.value = unwrap(await quoteList(supplierRecordId.value)) || []
  } finally {
    quoteLoading.value = false
  }
}

const quoteItems = () => quoteDialog.rows
  .filter((row) => row.available !== false)
  .map((row) => ({
    skuId: row.skuId,
    quotePrice: row.quotePrice === null || row.quotePrice === undefined || row.quotePrice === '' ? null : Number(row.quotePrice),
  }))

const openServiceQuote = async (row: { spuId: number; name: string; category: string; status?: number; rejectReason?: string }) => {
  quoteDialog.visible = true
  quoteDialog.loading = true
  quoteDialog.spuId = row.spuId
  quoteDialog.name = row.name
  quoteDialog.category = row.category
  quoteDialog.status = row.status
  quoteDialog.rejectReason = row.rejectReason || ''
  quoteDialog.columns = []
  quoteDialog.rows = []
  try {
    const detail = unwrap(await listBySpu(row.spuId)) || {}
    const quote = liveQuotes.value.find((item) => Number(item.spuId) === Number(row.spuId))
    const quoted = new Map((quote?.skus || []).map((sku: any) => [Number(sku.skuId), sku]))
    const specTypes = Array.isArray(detail.specTypes) ? detail.specTypes : []
    quoteDialog.columns = specTypes.map((spec: any) => ({
      key: String(spec.specKey ?? spec.specTypeId),
      label: spec.specTypeName || specText(spec.nameI18n),
    }))
    const skus = Array.isArray(detail.skus) ? detail.skus : []
    quoteDialog.rows = skus.map((sku: any) => {
      const saved = quoted.get(Number(sku.skuId)) || {}
      return {
        skuId: sku.skuId,
        skuCode: sku.skuCode,
        specs: Object.fromEntries(quoteDialog.columns.map((column) => [column.key, specText(sku[column.key])])),
        platformPrice: saved.platformPrice ?? sku.price,
        approvedPrice: saved.approvedPrice ?? null,
        available: saved.available !== false,
        quotePrice: saved.quotePrice == null || saved.quotePrice === '' ? null : Number(saved.quotePrice),
      }
    })
    if (quote) {
      quoteDialog.status = quote.status
      quoteDialog.rejectReason = quote.rejectReason || ''
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '规格加载失败')
    quoteDialog.visible = false
  } finally {
    quoteDialog.loading = false
  }
}

const saveServiceQuote = async () => {
  if (quoteLocked.value || !supplierRecordId.value) return
  const items = quoteItems()
  if (items.some((item) => item.quotePrice !== null && !(item.quotePrice > 0))) {
    ElMessage.warning('报价必须大于 0')
    return
  }
  quoteDialog.saving = true
  try {
    const saved = unwrap(await saveQuoteDraft({
      supplierId: supplierRecordId.value,
      spuId: quoteDialog.spuId,
      items,
    }))
    quoteDialog.status = saved?.status ?? 0
    quoteDialog.rejectReason = ''
    ElMessage.success('报价草稿已保存')
    await loadQuotes()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存报价失败')
  } finally {
    quoteDialog.saving = false
  }
}

const submitServiceQuote = async () => {
  if (quoteLocked.value || !supplierRecordId.value) return
  const items = quoteItems()
  if (!items.length || items.some((item) => !(Number(item.quotePrice) > 0))) {
    ElMessage.warning('每个在售规格都要填写大于 0 的报价')
    return
  }
  quoteDialog.saving = true
  try {
    await saveQuoteDraft({
      supplierId: supplierRecordId.value,
      spuId: quoteDialog.spuId,
      items,
    })
    const submitted = unwrap(await submitQuote({
      supplierId: supplierRecordId.value,
      spuId: quoteDialog.spuId,
    }))
    quoteDialog.status = submitted?.status ?? 1
    ElMessage.success('报价已提交审核')
    quoteDialog.visible = false
    await loadQuotes()
  } catch (error: any) {
    ElMessage.error(error?.message || '提交报价失败')
  } finally {
    quoteDialog.saving = false
  }
}

const loadOrders = async () => {
  orderLoading.value = true
  try {
    const [serviceTimeStart, serviceTimeEnd] = orderDateRange.value || []
    const page = unwrap(await supplierAssignedOrders({
      orderNo: orderKeyword.value || undefined,
      serviceTimeStart: serviceTimeStart || undefined,
      serviceTimeEnd: serviceTimeEnd || undefined,
      pageNum: orderPage.value,
      pageSize: 10,
    }))
    supplierOrders.value = page?.list || []
    orderTotal.value = Number(page?.total || 0)
  } catch (error: any) {
    supplierOrders.value = []
    orderTotal.value = 0
    ElMessage.error(error?.message || '订单加载失败')
  } finally {
    orderLoading.value = false
  }
}
const searchOrders = () => {
  orderPage.value = 1
  loadOrders()
}
const changeOrderPage = (page: number) => {
  orderPage.value = page
  loadOrders()
}

const handlePrimaryAction = () => {
  if (section.value === 'staff') { staffDialogVisible.value = true; return }
  if (section.value === 'service-area') { openAreaEditor(); return }
  if (section.value === 'schedule') { shiftDialogVisible.value = true; return }
  if (section.value === 'profile') saveProfile(1)
}

onMounted(() => {
  loadSupplierOptions().catch((error: any) => ElMessage.error(error?.message || '供应商资料加载失败'))
})
watch(section, (value) => {
  if (value === 'orders') loadOrders()
  if (value === 'pricing') {
    loadCatalog()
    loadQuotes()
  }
})
</script>

<style scoped>
.supplier-demo {
  --ink: #05152b;
  --muted: #74685a;
  --line: #e6dccb;
  --el-color-primary: #05152b;
  --el-color-primary-light-3: #3a4a60;
  --el-color-primary-light-5: #6d7b8d;
  --el-color-primary-light-7: #b7c0cb;
  --el-color-primary-light-8: #d7dde4;
  --el-color-primary-light-9: #eef1f4;
  --el-color-primary-dark-2: #020912;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 28px 32px 40px;
  color: var(--ink);
  font-family: Sora, "PingFang SC", "Segoe UI", sans-serif;
}
.supplier-demo--profile { padding: 0 0 28px; background: transparent; }
.supplier-demo--profile .page-header { align-items: center; margin: 0 0 22px; padding: 28px 32px 22px; color: #f6f1e8; background: #05152b; }
.supplier-demo--profile .page-header p { display: none; }
.supplier-demo--profile .page-header h1 { margin: 0; color: #f7f1e6; font-family: Fraunces, Georgia, serif; font-size: 40px; font-weight: 520; letter-spacing: -.03em; }
.supplier-demo--profile .page-actions { align-items: center; padding-top: 0; }
.supplier-demo--profile .page-actions :deep(.el-button) { height: 40px; padding: 0 16px; border-radius: 10px; font-weight: 650; }
.supplier-demo--profile .page-actions :deep(.el-button:not(.el-button--primary)) { color: #e8c27a; background: transparent; border-color: #c4a36a; }
.supplier-demo--profile .page-actions :deep(.el-button--primary) { color: #05152b; background: #f7f1e6; border-color: #f7f1e6; }
.supplier-demo--profile .dossier { padding: 0 22px; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.page-kicker { margin: 0 0 6px; color: #8d5a32; font-size: 11px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
.page-header h1 { margin: 0; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 40px; font-weight: 520; line-height: 1.05; letter-spacing: -.035em; }
.page-actions { display: flex; gap: 10px; padding-bottom: 4px; }
.page-actions :deep(.el-button) { height: 40px; padding: 0 16px; border-radius: 10px; font-weight: 600; }
.page-actions :deep(.el-button--primary) { color: #f7f1e6; background: #05152b; border-color: #05152b; }
.community-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.supplier-strip { display: flex; align-items: center; justify-content: space-between; min-height: 92px; padding: 18px 22px; margin-bottom: 22px; background: #fffdf8; border: 1px solid #e6dccb; border-radius: 18px; }
.supplier-identity { display: flex; align-items: center; gap: 16px; }
.supplier-logo { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; color: #e8c27a; background: #05152b; font-family: Fraunces, Georgia, serif; font-size: 18px; font-weight: 520; }
.supplier-label { margin-bottom: 4px; color: #8d5a32; font-size: 10px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.supplier-identity:has(.supplier-select) .supplier-name { display: none; }
.supplier-select { width: 290px; }
.supplier-select :deep(.el-select__wrapper) { padding-left: 0; background: transparent; box-shadow: none !important; font-family: Fraunces, Georgia, serif; font-size: 22px; font-weight: 520; }
.supplier-facts { display: flex; align-items: center; gap: 28px; }
.supplier-facts > div { display: flex; flex-direction: column; gap: 4px; }
.supplier-facts span { color: var(--muted); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
.supplier-facts strong { font-family: Fraunces, Georgia, serif; font-size: 18px; font-weight: 520; }
.supplier-facts .progress-value { color: #8d5a32; }
.compact-progress { display: block !important; width: 108px; height: 3px; border-radius: 99px; background: #eadfce; overflow: hidden; }
.compact-progress i { display: block; height: 100%; border-radius: inherit; background: #05152b; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
.metric-card { display: flex; align-items: flex-start; gap: 14px; min-height: 118px; padding: 18px 18px 16px; background: #fffdf8; border: 1px solid #e6dccb; border-radius: 18px; box-shadow: none; }
.metric-icon { display: grid; place-items: center; flex: 0 0 auto; width: 34px; height: 34px; border-radius: 10px; color: #8d5a32; background: #f6efe4; }
.metric-icon :deep(svg) { width: 16px; }
.metric-icon--blue, .metric-icon--green, .metric-icon--purple, .metric-icon--amber { color: #8d5a32; background: #f6efe4; }
.metric-card div { display: flex; flex-direction: column; }.metric-card small, .mini-metric span { color: var(--muted); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; }.metric-card strong { margin: 8px 0 4px; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 28px; font-weight: 520; letter-spacing: -.03em; }.metric-card p { margin: 0; color: #8a7d70; font-size: 12px; }
.surface-card { background: #fffdf8; border: 1px solid #e6dccb; border-radius: 18px; box-shadow: none; }
.surface-card :deep(.el-card__body) { padding: 0; }
.onboarding-card :deep(.el-card__body) { padding: 0 22px 24px; }
.dossier { display: grid; grid-template-columns: 232px minmax(0, 1fr); gap: 22px; align-items: start; }
.dossier-rail { position: sticky; top: 16px; padding: 26px 20px; color: #f6f1e8; background: #05152b url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cpath d='M0 159h160M159 0v160' fill='none' stroke='%23ffffff14'/%3E%3C/svg%3E"); border-radius: 22px; }
.dossier-rail p { margin: 0 0 16px; color: #d7b48a; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; }
.dossier-rail strong { display: block; font-family: Fraunces, Georgia, serif; font-size: 28px; font-weight: 520; line-height: 1.12; }
.dossier-rail em { display: inline-block; margin-top: 14px; padding: 5px 12px; border-radius: 999px; color: #05152b; background: #e8c27a; font-style: normal; font-size: 12px; font-weight: 700; }
.dossier-switch { width: 100%; margin-top: 16px; }
.dossier-switch :deep(.el-select__wrapper) { background: #ffffff12; box-shadow: 0 0 0 1px #ffffff24 inset; }
.dossier-switch :deep(.el-select__placeholder), .dossier-switch :deep(.el-select__selected-item) { color: #f6f1e8; }
.dossier-rail nav { display: grid; gap: 2px; margin-top: 26px; }
.dossier-rail button { position: relative; display: flex; gap: 12px; width: 100%; padding: 9px 0 9px 12px; color: #efe7dc; text-align: left; background: transparent; border: 0; font: inherit; font-size: 14px; cursor: pointer; }
.dossier-rail button.is-active { color: #e8c27a; }
.dossier-rail button.is-active::before { content: ""; position: absolute; left: 0; top: 10px; bottom: 10px; width: 2px; background: #e8c27a; }
.dossier-rail a span, .dossier-rail button span { width: 22px; color: #d7b48a; font-family: Fraunces, Georgia, serif; }
.dossier-rail small { display: block; margin-top: 18px; color: #f0b4a2; line-height: 1.45; }
.dossier-sheet { overflow: hidden; background: #fffdf8; border: 1px solid #e4d8c6; border-radius: 24px; box-shadow: 0 22px 48px rgba(5, 21, 43, .06); }
.dossier-sheet section { padding: 28px 32px 12px; }
.dossier-sheet section + section { border-top: 1px solid #efe4d4; }
.dossier-sheet header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px; }
.dossier-sheet header > span { font-family: Fraunces, Georgia, serif; font-size: 28px; color: #8d5a32; line-height: 1; }
.dossier-sheet h2 { margin: 0; font-family: Fraunces, Georgia, serif; font-size: 30px; font-weight: 520; letter-spacing: -.03em; color: #05152b; }
.dossier-sheet header p { margin: 4px 0 0; color: #7a7166; font-size: 13px; }
.dossier-sheet header .el-button { margin-left: auto; }
.dossier-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
.dossier-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.dossier-grid :deep(.el-form-item__label) { color: #5c564c; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.dossier-grid :deep(.el-input__wrapper), .dossier-grid :deep(.el-input-number), .dossier-grid :deep(.el-date-editor), .dossier-grid :deep(.el-select) { width: 100%; }
.dossier-grid :deep(.el-input__wrapper), .dossier-grid :deep(.el-select__wrapper) { background: #fff; border-radius: 8px; box-shadow: 0 0 0 1px #e6dccb inset; }
.doc-list article > svg { width: 18px; height: 18px; color: #8d5a32; }
.dossier-toggles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 4px 0 20px; }
.dossier-toggles label, .policy-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 64px; padding: 12px 14px; background: #fff; border: 1px solid #eadfce; border-radius: 14px; }
.dossier-toggles span, .policy-row > div { display: grid; min-width: 0; }
.dossier-toggles strong, .policy-row strong { color: #05152b; font-size: 14px; }
.dossier-toggles small, .policy-row small { color: #7a7166; font-size: 12px; }
.policy-row { margin-bottom: 10px; }
.doc-list { display: grid; gap: 8px; margin-bottom: 18px; }
.doc-list article { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 12px 14px; background: #fff; border: 1px solid #eadfce; border-radius: 14px; }
.doc-list strong, .doc-list small { display: block; }
.doc-list small, .doc-list article > span { color: #7a7166; font-size: 12px; }
.policy-row { align-items: flex-start; margin-bottom: 10px; }
.policy-row div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.policy-row small { color: #8a7d70; font-size: 12px; }
.policy-files { margin: 6px 0 0; padding: 0; list-style: none; display: grid; gap: 8px; }
.policy-files li { display: flex; align-items: center; gap: 10px; min-width: 0; }
.policy-files button, .doc-view, .doc-thumb { border: 0; padding: 0; background: transparent; color: #05152b; font: inherit; font-size: 13px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.policy-files button.policy-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
.policy-files button.is-remove { flex: 0 0 auto; color: #8d5a32; font-size: 12px; text-decoration: none; }
.policy-thumb, .doc-thumb { display: grid; flex: 0 0 48px; place-items: center; width: 48px; height: 48px; overflow: hidden; border: 1px solid #eadfce !important; border-radius: 8px; background: #fffdf8 !important; text-decoration: none !important; }
.doc-thumb { width: 56px; height: 44px; }
.policy-thumb img, .doc-thumb img { width: 100%; height: 100%; object-fit: cover; }
.doc-thumb svg { width: 18px; height: 18px; color: #8d5a32; }
.policy-empty { margin: 0; color: #7a7166; font-size: 13px; }
@media (max-width: 980px) { .dossier, .dossier-grid, .dossier-grid--three, .dossier-toggles { grid-template-columns: 1fr; } .dossier-rail { position: static; } }
.section-tabs :deep(.el-tabs__header) { margin-bottom: 22px; }.section-tabs :deep(.el-tabs__nav-wrap::after) { height: 1px; background: var(--line); }.section-tabs :deep(.el-tabs__item) { height: 54px; padding: 0 22px; font-weight: 600; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin: 2px 0 20px; }.section-heading h2 { margin: 0 0 4px; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 26px; font-weight: 520; letter-spacing: -.03em; }.section-heading p { margin: 0; color: var(--muted); font-size: 12px; }.section-heading.compact { align-items: center; margin: 0; padding: 18px 22px 14px; border-bottom: 1px solid var(--line); }.section-heading.compact h2 { font-size: 22px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }.form-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }.span-2 { grid-column: span 2; }.form-grid :deep(.el-form-item) { margin-bottom: 17px; }.form-grid :deep(.el-form-item__label) { padding-bottom: 6px; color: #4e596d; font-size: 12px; font-weight: 600; }.form-grid :deep(.el-input-number), .form-grid :deep(.el-select), .form-grid :deep(.el-time-select) { width: 100%; }
.field-suffix { margin-left: 8px; color: var(--muted); font-size: 12px; }
.compliance-grid, .toggle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding-top: 4px; }.compliance-item, .toggle-item { display: flex; align-items: center; gap: 12px; padding: 13px 14px; border: 1px solid var(--line); border-radius: 10px; background: #fbfcfe; }.compliance-item span, .toggle-item span { display: flex; flex-direction: column; gap: 2px; }.compliance-item strong, .toggle-item strong { font-size: 13px; }.compliance-item small, .toggle-item small { color: var(--muted); font-size: 11px; }.toggle-item { justify-content: space-between; }.toggle-item > span { order: 0; }.toggle-item :deep(.el-switch) { order: 1; }
.gender-capacity { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }.gender-capacity > div { display: flex; flex-direction: column; padding: 16px; background: #f7f8fb; border-radius: 11px; }.gender-capacity span { color: var(--muted); font-size: 12px; }.gender-capacity strong { margin: 4px 0; font-size: 24px; }.gender-capacity small { color: #929aae; }
.coverage-heading { align-items: center; }.coverage-legend { display: flex; gap: 13px; }.coverage-legend span { display: flex; align-items: center; gap: 5px; color: var(--muted); font-size: 11px; }.coverage-legend i { width: 8px; height: 8px; border-radius: 50%; }.coverage-legend .standard { background: #4f7bd9; }.coverage-legend .extended { background: #d8892d; }.coverage-legend .restricted { background: #c04f5e; }
.coverage-summary { display: grid; grid-template-columns: repeat(4, 1fr); margin-bottom: 16px; padding: 15px 0; border: 1px solid #e4e5f1; border-radius: 11px; background: #fbfbfe; }.coverage-summary div { display: flex; align-items: baseline; justify-content: center; gap: 7px; border-right: 1px solid #e5e7ef; }.coverage-summary div:last-child { border-right: 0; }.coverage-summary strong { font-size: 20px; }.coverage-summary span { color: var(--muted); font-size: 11px; }
.zone-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }.zone-card { appearance: none; padding: 13px 14px; text-align: left; color: var(--ink); background: #fff; border: 1px solid #e3e6ee; border-radius: 11px; cursor: pointer; transition: .18s ease; }.zone-card:hover { transform: translateY(-1px); border-color: #c4a36a; box-shadow: 0 5px 14px rgba(5, 21, 43, .06); }.zone-card.selected { border-color: #05152b; background: #f7f3ec; box-shadow: inset 0 0 0 1px #05152b; }.zone-top { display: flex; align-items: center; justify-content: space-between; }.zone-top > span { padding: 3px 7px; color: #4e63a8; background: #edf1fc; border-radius: 6px; font-size: 10px; font-weight: 700; }.zone-card--extended .zone-top > span { color: #a96221; background: #fff0dc; }.zone-card--restricted .zone-top > span { color: #a23d4b; background: #fdecef; }.zone-card > strong { display: block; margin-top: 7px; font-size: 12px; }.zone-card p { margin: 6px 0 3px; color: var(--muted); font-size: 10px; }.zone-card small { color: #9ba3b3; font-size: 10px; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 17px 18px; border-bottom: 1px solid var(--line); }.table-search { display: flex; gap: 10px; }.table-search .el-input { width: 290px; }.table-search .el-select { width: 150px; }.table-search .el-date-editor { width: 260px; }.result-count { color: var(--muted); font-size: 12px; }.data-table { --el-table-header-bg-color: #f7f3ec; --el-table-row-hover-bg-color: #fbf8f3; --el-table-bg-color: #fffdf8; }.data-table :deep(th.el-table__cell) { height: 42px; color: #74685a; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }.data-table :deep(td.el-table__cell) { padding: 13px 0; border-bottom-color: #eef0f5; }.person-cell, .service-cell { display: flex; align-items: center; gap: 10px; }.person-cell > span, .service-cell > span:last-child, .muted-stack, .order-id { display: flex; flex-direction: column; gap: 3px; }.person-cell strong, .service-cell strong, .order-id strong { font-size: 12px; }.person-cell small, .service-cell small, .muted-stack small, .order-id small { color: var(--muted); font-size: 10px; }.tag-list, .zone-list { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }.zone-list span, .zone-list em { padding: 3px 6px; color: #586375; background: #f0f2f6; border-radius: 5px; font-size: 10px; font-style: normal; }.status-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; }.status-pill i { width: 7px; height: 7px; border-radius: 50%; }.status-pill--available i { background: #2da77b; box-shadow: 0 0 0 3px #dff5ed; }.status-pill--busy i { background: #5378d3; box-shadow: 0 0 0 3px #e5eafd; }.status-pill--leave i { background: #a5acb9; box-shadow: 0 0 0 3px #eceef2; }
.schedule-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding: 14px 16px; background: #fffdf8; border: 1px solid var(--line); border-radius: 16px; }.week-navigation, .schedule-filters { display: flex; align-items: center; gap: 10px; }.week-navigation > div { display: flex; flex-direction: column; min-width: 210px; text-align: center; }.week-navigation strong { font-size: 13px; }.week-navigation span { margin-top: 2px; color: var(--muted); font-size: 10px; }.schedule-filters .el-select { width: 150px; }
.mini-metric { display: flex; flex-direction: column; padding: 15px 17px; background: #fffdf8; border: 1px solid var(--line); border-radius: 16px; }.mini-metric strong { margin: 5px 0 2px; color: #05152b; font-family: Fraunces, Georgia, serif; font-size: 26px; font-weight: 520; }.mini-metric small { color: var(--muted); font-size: 10px; }.positive { color: #218367 !important; }.warning-text { color: #bb6d20 !important; }
.schedule-card { overflow-x: auto; }.schedule-card :deep(.el-card__body) { min-width: 1180px; }.schedule-grid { display: grid; grid-template-columns: 190px repeat(7, minmax(125px, 1fr)); }.schedule-grid--header { border-bottom: 1px solid var(--line); background: #fafbfc; }.staff-column-title, .day-head { display: flex; flex-direction: column; justify-content: center; min-height: 68px; padding: 10px 13px; border-right: 1px solid var(--line); }.staff-column-title { color: var(--muted); font-size: 11px; font-weight: 700; }.day-head { align-items: center; }.day-head span, .day-head small { color: var(--muted); font-size: 10px; }.day-head strong { margin: 2px 0; font-size: 14px; }.day-head.today { color: #8d5a32; background: #f6efe4; }.schedule-row { min-height: 96px; border-bottom: 1px solid var(--line); }.schedule-person { display: flex; align-items: center; gap: 9px; padding: 13px; border-right: 1px solid var(--line); }.schedule-person span { display: flex; flex-direction: column; }.schedule-person strong { font-size: 12px; }.schedule-person small { margin-top: 3px; color: var(--muted); font-size: 10px; }.shift-cell { display: flex; flex-direction: column; justify-content: center; min-width: 0; margin: 7px 5px; padding: 9px; text-align: left; color: #455064; border: 1px solid transparent; border-radius: 8px; cursor: pointer; }.shift-cell strong { margin-bottom: 3px; font-size: 11px; }.shift-cell span, .shift-cell small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9px; }.shift-cell small { margin-top: 3px; opacity: .72; }.shift-cell.standard { color: #285f72; background: #e9f7fa; border-color: #c6e9ed; }.shift-cell.busy { color: #6d4524; background: #f6efe4; border-color: #e4d3b8; }.shift-cell.leave { color: #7a6570; background: #f6eff2; border-color: #eadce2; }.shift-cell.open { align-items: center; color: #9ba3b0; background: #fff; border-color: #dfe3e9; border-style: dashed; }.add-shift { font-size: 18px !important; }.schedule-legend { display: flex; gap: 20px; padding: 13px 18px; }.schedule-legend span { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 10px; }.schedule-legend i { width: 11px; height: 11px; border-radius: 3px; }.shift-standard { background: #c6e9ed; }.shift-busy { background: #d9d2ff; }.shift-leave { background: #eadce2; }.shift-open { border: 1px dashed #c8cdd6; }
.service-icon { display: grid; place-items: center; flex: 0 0 auto; width: 32px; height: 32px; color: #8d5a32; background: #f6efe4; border-radius: 9px; font-size: 10px; font-weight: 800; }.money-value { color: #263348; font-size: 12px; }.order-status { display: inline-flex; padding: 5px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; }.order-status--pending { color: #9d5f20; background: #fff0da; }.order-status--confirmed { color: #425eb5; background: #e9edff; }.order-status--in_progress { color: #176f69; background: #def5f0; }.order-status--completed { color: #4e5a69; background: #edf0f3; }
.pricing-health { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding: 15px 18px; background: #ecf8f4; border: 1px solid #cceade; border-radius: 13px; }.pricing-health > div { display: flex; align-items: center; gap: 12px; }.health-icon { display: grid; place-items: center; width: 38px; height: 38px; color: #218365; background: #d4f0e6; border-radius: 50%; }.pricing-health strong { font-size: 13px; }.pricing-health p { margin: 3px 0 0; color: #5f7b72; font-size: 11px; }
.quote-dialog__meta { margin: 0 0 10px; color: var(--muted); font-size: 12px; }
.quote-spec-table :deep(.el-input-number) { width: 140px; }
.quote-spec-table .muted-text { display: block; margin-top: 4px; }
.pricing-card { margin-bottom: 14px; }.pricing-toolbar { display: flex; align-items: flex-start; justify-content: space-between; padding: 0 18px; border-bottom: 1px solid var(--line); }.pricing-actions { display: flex; gap: 8px; padding-top: 13px; }.quote-service { display: flex; align-items: center; gap: 10px; }.quote-service > span { padding: 4px 6px; color: #8d5a32; background: #f6efe4; border-radius: 5px; font-size: 9px; font-weight: 700; }.quote-service > div { display: flex; flex-direction: column; gap: 3px; }.quote-service strong { font-size: 12px; }.quote-service small { color: var(--muted); font-size: 10px; }.price-value { color: #27334a; font-size: 13px; }.pricing-table :deep(.el-input-number) { width: 128px; }
.pricing-filter { display: flex; align-items: center; gap: 10px; min-height: 58px; }.pricing-filter > span { font-size: 12px; font-weight: 700; }.pricing-filter .el-select { width: 170px; }.pricing-filter small { color: var(--muted); font-size: 10px; }
.pricing-bottom-grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: 14px; }.rule-list > div { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 14px 19px; border-bottom: 1px solid var(--line); }.rule-list > div:last-child { border-bottom: 0; }.rule-badge { display: inline-flex; justify-content: center; padding: 5px 7px; border-radius: 6px; font-size: 9px; font-weight: 700; }.rule-badge--standard { color: #4269b5; background: #edf2fd; }.rule-badge--extended { color: #a86723; background: #fff0dc; }.rule-badge--restricted { color: #a94250; background: #fdecef; }.rule-list > div > span:nth-child(2) { display: flex; flex-direction: column; gap: 3px; }.rule-list strong { font-size: 12px; }.rule-list small { color: var(--muted); font-size: 10px; }.rule-values { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }.rule-values b { font-size: 11px; }.rule-values em { color: var(--muted); font-size: 10px; font-style: normal; }.terms-list { display: grid; grid-template-columns: repeat(2, 1fr); margin: 0; padding: 11px 20px 18px; }.terms-list div { padding: 10px 0; border-bottom: 1px solid #eff1f5; }.terms-list div:nth-last-child(-n + 2) { border-bottom: 0; }.terms-list dt { color: var(--muted); font-size: 10px; }.terms-list dd { margin: 4px 0 0; font-size: 12px; font-weight: 700; }
.drawer-order-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 0 0 19px; border-bottom: 1px solid var(--line); }.drawer-order-head > div > span { color: #8d5a32; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }.drawer-order-head h2 { margin: 6px 0 3px; font-size: 19px; }.drawer-order-head p { margin: 0; color: var(--muted); font-size: 12px; }.drawer-section { padding: 20px 0; border-bottom: 1px solid var(--line); }.drawer-section h3 { margin: 0 0 13px; font-size: 13px; }.detail-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 0; }.detail-list dt { color: var(--muted); font-size: 10px; }.detail-list dd { margin: 4px 0 0; font-size: 12px; font-weight: 600; }.address-panel { display: flex; gap: 11px; padding: 13px; background: #f7f8fb; border-radius: 10px; }.address-panel > svg { flex: 0 0 auto; width: 19px; color: #8d5a32; }.address-panel div { display: flex; flex-direction: column; gap: 4px; }.address-panel strong { font-size: 12px; }.address-panel p { margin: 0; color: #677186; font-size: 11px; }.address-panel span { color: #969dac; font-size: 10px; }
.supplier-name { display: block; margin-top: 5px; font-size: 15px; }
.overview-grid { display: grid; grid-template-columns: 1.55fr .85fr; gap: 14px; margin-bottom: 14px; }
.overview-grid--bottom { grid-template-columns: 1.1fr .9fr; }
.earnings-card :deep(.el-select) { width: 118px; }
.earnings-chart { display: flex; align-items: flex-end; justify-content: space-around; height: 270px; padding: 38px 26px 20px; }
.bar-item { display: flex; align-items: center; flex-direction: column; justify-content: flex-end; width: 11%; height: 100%; }
.bar-item i { display: block; width: 100%; max-width: 28px; min-height: 8px; background: linear-gradient(180deg, #e8c27a, #05152b); border-radius: 3px 3px 0 0; box-shadow: none; }
.bar-item small { margin-top: 9px; color: var(--muted); font-size: 10px; }.bar-value { margin-bottom: 5px; color: #4f596d; font-size: 10px; }
.capacity-list { display: flex; flex-direction: column; gap: 20px; padding: 24px 22px; }.capacity-list > div { display: grid; grid-template-columns: 1fr auto; gap: 8px 14px; align-items: center; }.capacity-list span { color: var(--muted); font-size: 11px; }.capacity-list strong { font-size: 12px; }.capacity-list :deep(.el-progress) { grid-column: 1 / -1; }
.transaction-list > div { display: grid; grid-template-columns: 36px 1fr auto; align-items: center; gap: 11px; padding: 13px 19px; border-bottom: 1px solid var(--line); }.transaction-list > div:last-child { border-bottom: 0; }.transaction-icon { display: grid; place-items: center; width: 34px; height: 34px; color: #298267; background: #e7f6f0; border-radius: 9px; }.transaction-icon :deep(svg) { width: 16px; }.transaction-list > div > span:nth-child(2), .transaction-amount { display: flex; flex-direction: column; gap: 3px; }.transaction-list strong { font-size: 12px; }.transaction-list small { color: var(--muted); font-size: 10px; }.transaction-amount { text-align: right; }.transaction-amount strong { color: #263348; }
.action-list button { display: grid; grid-template-columns: 32px 1fr 18px; align-items: center; width: 100%; gap: 11px; padding: 13px 18px; color: var(--ink); text-align: left; background: #fff; border: 0; border-bottom: 1px solid var(--line); cursor: pointer; }.action-list button:last-child { border-bottom: 0; }.action-list button:hover { background: #fbf8f3; }.action-list button > span:nth-child(2) { display: flex; flex-direction: column; gap: 3px; }.action-list button strong { font-size: 12px; }.action-list button small { color: var(--muted); font-size: 10px; }.action-list button > svg { width: 14px; color: #a0a6b3; }.action-badge { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; font-size: 11px; font-weight: 700; }.action-badge.amber, .action-badge.purple, .action-badge.blue { color: #8d5a32; background: #f6efe4; }
.review-banner { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 14px 16px; background: #fff8eb; border: 1px solid #f1ddb7; border-radius: 11px; }.review-banner > span:first-child { display: grid; place-items: center; width: 34px; height: 34px; color: #a96c25; background: #ffedcf; border-radius: 9px; }.review-banner > span svg { width: 17px; }.review-banner > div { display: flex; flex: 1; flex-direction: column; gap: 3px; }.review-banner strong { font-size: 12px; }.review-banner p { margin: 0; color: #856d50; font-size: 10px; }.area-banner, .schedule-review { margin-bottom: 14px; background: #f7f3ec; border-color: #e6dccb; }.schedule-review > span:first-child { color: #8d5a32; background: #f6efe4; }.schedule-review p { color: #74685a; }
.document-cell { display: flex; align-items: center; gap: 10px; }.document-cell > svg { width: 22px; color: #8d5a32; }.document-cell > span { display: flex; flex-direction: column; gap: 3px; }.document-cell strong { font-size: 12px; }.document-cell small { color: var(--muted); font-size: 10px; }
.coverage-type { display: inline-flex; padding: 5px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; }.coverage-type--standard { color: #4269b5; background: #edf2fd; }.coverage-type--extended { color: #a86723; background: #fff0dc; }.coverage-type--restricted { color: #a94250; background: #fdecef; }
.health-icon.pending { color: #ac6a21; background: #ffe9c8; }.pricing-health:has(.health-icon.pending) { background: #fff8eb; border-color: #f0dbb5; }.pricing-health:has(.health-icon.pending) p { color: #806e57; }
.requested-price { color: #a66722; font-size: 13px; }.muted-text { color: #a2a9b7; }.negative { color: #b84f5a; font-weight: 600; }
.privacy-note { margin-top: 14px; padding: 11px 13px; color: #657083; background: #f3f5f8; border-radius: 9px; font-size: 10px; line-height: 1.55; }
.dialog-tip { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; padding: 11px 13px; color: #806a4d; background: #fff7e9; border-radius: 9px; font-size: 11px; }.dialog-tip > svg { width: 17px; flex: 0 0 auto; }.conflict-alert { display: flex; gap: 10px; padding: 12px; color: #a84650; background: #fdeff1; border: 1px solid #f0cfd4; border-radius: 9px; }.conflict-alert > svg { width: 18px; flex: 0 0 auto; }.conflict-alert span { display: flex; flex-direction: column; gap: 3px; }.conflict-alert strong { font-size: 12px; }.conflict-alert small { font-size: 10px; }
.settlement-tabs :deep(.el-tabs__header) { margin: 0; padding: 0 18px; }.settlement-tabs :deep(.el-tabs__content) { overflow: visible; }.settlement-note { display: flex; align-items: center; gap: 10px; margin: 14px 18px; padding: 12px 14px; color: #246e58; background: #eaf7f2; border-radius: 9px; }.settlement-note > svg { width: 20px; }.settlement-note span { display: flex; flex-direction: column; gap: 3px; }.settlement-note strong { font-size: 11px; }.settlement-note small { color: #628176; font-size: 10px; }
.linked-banner { background: #eef6ff; border-color: #d4e5f7; }.linked-banner > span:first-child { color: #3c74b7; background: #dcecff; }.linked-banner p { color: #64788f; }.area-link-tip { color: #526e8c; background: #eef6ff; }.option-id { float: right; margin-left: 18px; color: #9ba3b3; }
.area-service-status, .area-review-status { display: flex; align-items: flex-start; flex-direction: column; gap: 5px; }.area-service-status small, .area-review-status small { color: var(--muted); font-size: 9px; }.pending-copy { color: #a66b24 !important; }.rejected-copy { color: #b84f5a !important; }
.area-choice-list { display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 520px; margin-top: 12px; overflow: auto; }
.area-choice-list :deep(.el-checkbox) { height: auto; margin: 0; padding: 10px 12px; border: 1px solid #e7ebf2; border-radius: 10px; white-space: normal; align-items: flex-start; }
.area-choice-list :deep(.el-checkbox__input) { margin-top: 3px; }
.area-choice-list :deep(.el-checkbox__label) { line-height: 1.4; white-space: normal; }
.area-choice { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
.area-choice strong { color: #1c2433; font-weight: 700; }
.area-choice small { color: #6d7686; font-size: 12px; font-weight: 500; line-height: 1.45; }
@media (max-width: 1200px) { .supplier-facts { gap: 16px; }.metric-grid { grid-template-columns: repeat(2, 1fr); }.zone-grid { grid-template-columns: repeat(2, 1fr); }.form-grid--three { grid-template-columns: repeat(2, 1fr); }.overview-grid { grid-template-columns: 1fr; } }
</style>

<style>
.policy-preview.el-dialog { overflow: hidden; }
.policy-preview .el-dialog__body { padding: 0 0 18px; }
.policy-preview__stage { display: grid; place-items: center; min-height: 240px; max-height: 78vh; overflow: auto; padding: 16px; background: #f3f5f8; }
.policy-preview__stage img { max-width: 100%; max-height: 72vh; object-fit: contain; background: #fff; }
.policy-preview__stage iframe { width: 100%; height: 72vh; border: 0; background: #fff; }
.policy-preview__stage p { margin: 24px; color: #526070; }
</style>

<style scoped>
@media (max-width: 820px) { .supplier-demo { padding: 14px; } .supplier-demo--profile { padding: 0 0 20px; } .supplier-demo--profile .page-header h1 { font-size: 30px; } .supplier-demo--profile .dossier { padding: 0 12px; }.page-header, .supplier-strip, .table-toolbar, .schedule-toolbar, .pricing-toolbar { align-items: flex-start; flex-direction: column; }.page-header { gap: 12px; }.page-actions { flex-wrap: wrap; }.supplier-strip { gap: 14px; }.supplier-facts { flex-wrap: wrap; gap: 12px 20px; }.metric-grid { grid-template-columns: 1fr; }.overview-grid--bottom, .pricing-bottom-grid { grid-template-columns: 1fr; }.table-search { flex-wrap: wrap; }.table-search .el-input, .table-search .el-select { width: 100%; }.form-grid, .form-grid--three { grid-template-columns: 1fr; }.span-2 { grid-column: span 1; }.pricing-actions { padding-bottom: 13px; }.section-tabs :deep(.el-tabs__item) { padding: 0 10px; }.compliance-grid, .toggle-grid, .gender-capacity { grid-template-columns: 1fr; } }
</style>
