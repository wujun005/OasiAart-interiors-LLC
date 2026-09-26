<template>
  <div class="supplier-demo">
    <header class="page-header">
      <div>
        <div class="eyebrow">
          <span class="demo-dot"></span>
          HourX Supplier Portal
        </div>
        <h1>{{ meta.title }}</h1>
        <p>{{ meta.description }}</p>
      </div>
      <div class="page-actions">
        <el-button v-if="section === 'orders' || section === 'settlement'" :icon="Download" @click="showToast(section === 'orders' ? '订单清单已生成 Demo 导出任务' : '结算明细已生成 Demo 导出任务')">
          {{ section === 'orders' ? '导出订单' : '导出结算' }}
        </el-button>
        <el-button v-if="section === 'profile'" :loading="saving" @click="saveProfile(0)">Save draft</el-button>
        <el-button v-if="meta.primaryAction" type="primary" :icon="section === 'schedule' || section === 'pricing' ? Plus : section === 'profile' ? Check : undefined" @click="handlePrimaryAction">
          {{ meta.primaryAction }}
        </el-button>
      </div>
    </header>

    <section class="supplier-strip">
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
            <div><span>并发订单容量</span><strong>8 / 12</strong><el-progress :percentage="67" :show-text="false" color="#6c63d9" /></div>
            <div><span>月订单容量</span><strong>284 / 380</strong><el-progress :percentage="75" :show-text="false" color="#d18b35" /></div>
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
          <nav>
            <a href="#profile-company"><span>01</span>Company</a>
            <a href="#profile-contact"><span>02</span>Contact</a>
            <a href="#profile-capacity"><span>03</span>Capacity</a>
            <a href="#profile-insurance"><span>04</span>Insurance</a>
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
              <label v-for="item in capacityToggles" :key="item.en"><span>{{ item.en }}</span><el-switch v-model="item.enabled" /></label>
              <label><span>Own transportation</span><el-switch v-model="ownTransportation" /></label>
              <label><span>Own equipment</span><el-switch v-model="complianceItems[3].enabled" /></label>
              <label><span>Tax invoice available</span><el-switch v-model="complianceItems[2].enabled" /></label>
            </div>
          </section>

          <section id="profile-insurance">
            <header><span>04</span><div><h2>Insurance</h2><p>A copy is required when the answer is yes.</p></div></header>
            <div class="policy-row" v-for="item in complianceItems.filter((entry) => entry.fileKey)" :key="item.key">
              <div>
                <strong>{{ item.key === 'public' ? 'Public liability insurance' : 'Employee insurance' }}</strong>
                <small>{{ item.file || 'No policy file yet' }}</small>
              </div>
              <el-switch v-model="item.enabled" />
              <el-upload :show-file-list="false" :http-request="(options) => uploadInsurance(item.fileKey, options)">
                <el-button>Upload copy</el-button>
              </el-upload>
            </div>
          </section>
        </div>
      </div>

      <el-card class="surface-card onboarding-card" shadow="never">
        <el-tabs v-model="profileTab" class="section-tabs">
          <el-tab-pane label="公司与地址" name="company">
            <div class="section-heading">
              <div><h2>公司与地址</h2><p>Company information & registered address</p></div>
              <el-tag type="success" effect="plain">Verified</el-tag>
            </div>
            <el-form label-position="top" class="form-grid">
              <el-form-item label="公司名称 / Company Name" class="span-2">
                <el-input v-model="companyForm.companyName" />
              </el-form-item>
              <el-form-item label="营业执照号 / Trade License No.">
                <el-input v-model="companyForm.licenseNo" />
              </el-form-item>
              <el-form-item label="执照到期日 / License Expiry">
                <el-date-picker v-model="companyForm.licenseExpiry" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
              <el-form-item label="VAT / TRN">
                <el-input v-model="companyForm.trn" />
              </el-form-item>
              <el-form-item label="经营年限 / Years in Business">
                <el-input-number v-model="companyForm.years" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
              <el-form-item label="公司地址 / Office Address" class="span-2">
                <el-input v-model="companyForm.address" />
              </el-form-item>
              <el-form-item label="联系人 / Contact Person">
                <el-input v-model="companyForm.contact" />
              </el-form-item>
              <el-form-item label="邮箱 / Email">
                <el-input v-model="companyForm.email" />
              </el-form-item>
              <el-form-item label="电话 / Mobile">
                <el-input v-model="companyForm.mobile" />
              </el-form-item>
              <el-form-item label="WhatsApp">
                <el-input v-model="companyForm.whatsapp" />
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="能力与派单" name="capacity">
            <div class="section-heading">
              <div><h2>服务能力与派单条件</h2><p>Capacity, availability & dispatch constraints</p></div>
              <el-tag effect="plain">来源：02_Capacity_Zones</el-tag>
            </div>
            <el-form label-position="top" class="form-grid form-grid--three">
              <el-form-item label="可派员工数 / Total Workers"><el-input-number v-model="capacityForm.workers" :min="1" /></el-form-item>
              <el-form-item label="最大同时订单 / Concurrent Orders"><el-input-number v-model="capacityForm.concurrent" :min="1" /></el-form-item>
              <el-form-item label="月订单容量 / Monthly Capacity"><el-input-number v-model="capacityForm.monthly" :min="1" /></el-form-item>
              <el-form-item label="最短提前时间 / Minimum Lead Time"><el-input-number v-model="capacityForm.leadTime" :min="0" /><span class="field-suffix">小时</span></el-form-item>
              <el-form-item label="工作开始时间"><el-time-select v-model="capacityForm.start" start="06:00" step="00:30" end="12:00" /></el-form-item>
              <el-form-item label="工作结束时间"><el-time-select v-model="capacityForm.end" start="14:00" step="00:30" end="23:30" /></el-form-item>
            </el-form>
            <div class="toggle-grid">
              <label v-for="item in capacityToggles" :key="item.label" class="toggle-item">
                <span><strong>{{ item.label }}</strong><small>{{ item.en }}</small></span>
                <el-switch v-model="item.enabled" />
              </label>
            </div>
            <div class="gender-capacity">
              <div><span>女员工 / Female staff</span><strong>18</strong><small>可接美容、清洁服务</small></div>
              <div><span>男员工 / Male staff</span><strong>24</strong><small>可接技术、安装服务</small></div>
              <div><span>自有车辆 / Own transportation</span><strong>11</strong><small>9 辆当日可调度</small></div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="银行账户" name="bank">
            <div class="review-banner"><span><Warning /></span><div><strong>银行账户变更需要平台审核</strong><p>提交后当前收款账户仍然有效，审核通过后才会切换。</p></div><el-tag type="warning">Pending Review</el-tag></div>
            <div class="section-heading"><div><h2>收款账户</h2><p>Settlement bank details</p></div><el-tag type="success" effect="plain">Verified</el-tag></div>
            <el-form label-position="top" class="form-grid">
              <el-form-item label="账户名称 / Account Name"><el-input v-model="bankForm.accountName" /></el-form-item>
              <el-form-item label="银行名称 / Bank Name"><el-input v-model="bankForm.bankName" /></el-form-item>
              <el-form-item label="IBAN" class="span-2"><el-input v-model="bankForm.iban" /></el-form-item>
              <el-form-item label="SWIFT / BIC"><el-input v-model="bankForm.swift" /></el-form-item>
              <el-form-item label="结算币种 / Currency"><el-select v-model="bankForm.currency"><el-option label="AED" value="AED" /></el-select></el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="保险与合规" name="compliance">
            <div class="section-heading"><div><h2>保险与合规声明</h2><p>Insurance & compliance declarations</p></div><el-tag type="warning" effect="plain">1 即将到期</el-tag></div>
            <div class="compliance-grid">
              <label v-for="item in complianceItems" :key="item.label" class="compliance-item"><el-switch v-model="item.enabled" /><span><strong>{{ item.label }}</strong><small>{{ item.hint }}</small></span></label>
            </div>
          </el-tab-pane>

          <el-tab-pane label="文件管理" name="documents">
            <div class="section-heading"><div><h2>资质文件</h2><p>Documents, verification status & expiry</p></div><el-button :icon="Upload" @click="showToast('已打开文件上传入口')">上传文件</el-button></div>
            <el-table :data="documents" class="data-table" row-key="name">
              <el-table-column label="文件" min-width="240"><template #default="{ row }"><div class="document-cell"><Document /><span><strong>{{ row.name }}</strong><small>{{ row.file }}</small></span></div></template></el-table-column>
              <el-table-column label="文件编号" prop="number" min-width="150" />
              <el-table-column label="到期日" prop="expiry" width="118" />
              <el-table-column label="审核状态" width="108"><template #default="{ row }"><el-tag :type="row.status === 'Verified' ? 'success' : row.status === 'Expiring' ? 'warning' : 'info'" effect="light">{{ row.status }}</el-tag></template></el-table-column>
              <el-table-column label="操作" width="100"><template #default="{ row }"><el-button link type="primary" @click="showToast(`查看 ${row.name}`)">查看</el-button></template></el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>

    <template v-else-if="section === 'service-area'">
      <div class="metric-grid">
        <article class="metric-card"><span class="metric-icon metric-icon--blue"><Location /></span><div><small>已勾选区域</small><strong>{{ selectedAreaIds.length }}</strong><p>供应商只勾选区域</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--green"><CircleCheck /></span><div><small>平台启用区域</small><strong>{{ platformAreas.length }}</strong><p>status = 1</p></div></article>
      </div>
      <section class="review-banner area-banner linked-banner"><span><Location /></span><div><strong>服务区域来自平台主数据</strong><p>勾选可服务区域后保存。社区由平台维护，供应商不单独编辑社区。</p></div></section>
      <el-card class="surface-card" shadow="never" v-loading="areaLoading">
        <div class="table-toolbar">
          <div class="table-search"><el-input v-model="areaKeyword" :prefix-icon="Search" placeholder="搜索区域名称" clearable /></div>
          <el-button type="primary" :loading="saving" @click="saveAreas">保存服务区域</el-button>
        </div>
        <el-table :data="filteredAreas" class="data-table" row-key="areaId">
          <el-table-column label="社区 / Community" min-width="230"><template #default="{ row }"><div class="muted-stack"><strong>{{ row.community }}</strong><small>{{ row.areaId }}</small><small v-if="row.pendingAction === 'update' && row.pendingData" class="pending-copy">待审核：{{ row.pendingData.community }} · {{ row.pendingData.areaId }}</small></div></template></el-table-column>
          <el-table-column label="Zone" min-width="200"><template #default="{ row }"><div class="muted-stack"><span>{{ row.zone }}</span><small>{{ row.zoneName }}</small></div></template></el-table-column>
          <el-table-column label="覆盖类型" width="100"><template #default="{ row }"><span class="coverage-type" :class="`coverage-type--${row.type.toLowerCase()}`">{{ row.type }}</span></template></el-table-column>
          <el-table-column label="适用服务" min-width="200"><template #default="{ row }"><div class="tag-list"><el-tag v-for="service in row.services" :key="service" size="small" effect="plain">{{ service }}</el-tag></div></template></el-table-column>
          <el-table-column label="服务状态" width="118"><template #default="{ row }"><div class="area-service-status"><el-switch :model-value="row.active" :disabled="!row.effective || row.pendingAction === 'enable' || row.pendingAction === 'delete' || (!row.active && row.pendingAction === 'update')" inline-prompt active-text="启" inactive-text="停" @change="toggleAreaStatus(row, Boolean($event))" /><small v-if="!row.effective">审核通过后启用</small></div></template></el-table-column>
          <el-table-column label="审核状态" width="108"><template #default="{ row }"><div class="area-review-status"><el-tag :type="areaReviewTagType(row.reviewStatus)" effect="light">{{ areaReviewLabel(row.reviewStatus) }}</el-tag><small v-if="row.pendingAction">{{ areaActionLabel(row.pendingAction) }}</small><small v-else-if="row.reviewNote" class="rejected-copy">{{ row.reviewNote }}</small></div></template></el-table-column>
          <el-table-column label="操作" width="150" fixed="right"><template #default="{ row }"><el-button link type="primary" :disabled="row.pendingAction === 'enable' || row.pendingAction === 'delete'" @click="openAreaDialog(row)">编辑</el-button><el-button link type="danger" :disabled="row.pendingAction === 'delete'" @click="deleteArea(row)">{{ row.pendingAction === 'create' ? '撤回' : '删除' }}</el-button></template></el-table-column>
        </el-table>
      </el-card>
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
            <el-input v-model="orderKeyword" :prefix-icon="Search" placeholder="订单号" clearable @keyup.enter="loadOrders" @clear="loadOrders" />
            <el-button @click="loadOrders">查询</el-button>
          </div>
          <div class="result-count">{{ orderTotal }} 个订单</div>
        </div>
        <el-table :data="filteredOrders" class="data-table" row-key="orderNo">
          <el-table-column label="Web Order / Job ID" min-width="190"><template #default="{ row }"><div class="order-id"><strong>{{ row.orderNo }}</strong><small>{{ row.jobId }} · {{ row.created }}</small></div></template></el-table-column>
          <el-table-column label="服务" min-width="220"><template #default="{ row }"><div class="service-cell"><span class="service-icon">{{ row.serviceIcon }}</span><span><strong>{{ row.service }}</strong><small>{{ row.variant }}</small></span></div></template></el-table-column>
          <el-table-column label="服务地址" min-width="230"><template #default="{ row }"><div class="muted-stack"><span>{{ row.area }}</span><small>{{ row.zone }} · {{ row.areaId }}</small></div></template></el-table-column>
          <el-table-column label="服务时间" min-width="170"><template #default="{ row }"><div class="muted-stack"><span>{{ row.date }}</span><small>{{ row.time }}</small></div></template></el-table-column>
          <el-table-column label="执行人员" min-width="150"><template #default="{ row }">{{ row.staff }}</template></el-table-column>
          <el-table-column label="收益快照" min-width="130" align="right"><template #default="{ row }"><strong class="money-value">AED {{ row.cost }}</strong></template></el-table-column>
          <el-table-column label="状态" width="96"><template #default="{ row }"><span class="order-status" :class="`order-status--${row.status}`">{{ orderStatusLabel(row.status) }}</span></template></el-table-column>
          <el-table-column label="" width="80" align="right"><template #default="{ row }"><el-button link type="primary" @click="openOrder(row)">详情</el-button></template></el-table-column>
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
        <div><span class="health-icon pending"><Clock /></span><div><strong>{{ pendingQuoteCount }} 个服务报价正在审核</strong><p>先勾选可履约服务，再按 SKU 填写报价。待审核期间不能改价，已通过后再改会生成新版本。</p></div></div>
        <el-button type="primary" :loading="saving" @click="saveSelectedServices">保存可履约服务</el-button>
      </section>
      <el-card class="surface-card pricing-card" shadow="never">
        <div class="pricing-toolbar">
          <div class="pricing-filter"><span>服务分类</span><el-select v-model="quoteCategory"><el-option label="全部服务" value="all" /><el-option v-for="category in quoteCategories" :key="category.value" :label="category.label" :value="category.value" /></el-select><small>共 {{ filteredQuotes.length }} 条服务报价</small></div>
          <div class="pricing-actions"><el-button :icon="Upload" @click="showToast('已打开 Excel 服务报价导入入口')">批量导入</el-button><el-button type="primary" :icon="Plus" @click="openCreateQuote()">新增服务报价</el-button></div>
        </div>
        <el-table :data="filteredQuotes" class="data-table pricing-table" row-key="id">
          <el-table-column label="服务 / Service" min-width="250"><template #default="{ row }"><div class="quote-service"><span>{{ row.code }}</span><div><strong>{{ row.service }}</strong><small>{{ row.scope }}</small></div></div></template></el-table-column>
          <el-table-column label="计价单位 / Unit" min-width="150" prop="unit" />
          <el-table-column label="当前生效价" min-width="135"><template #default="{ row }"><strong v-if="!row.isNew" class="price-value">AED {{ row.price }}</strong><span v-else class="muted-text">—</span></template></el-table-column>
          <el-table-column label="申请价格" min-width="135"><template #default="{ row }"><strong v-if="row.requested" class="requested-price">AED {{ row.requested }}</strong><span v-else class="muted-text">—</span></template></el-table-column>
          <el-table-column label="最低订单" min-width="130"><template #default="{ row }">{{ row.minimum }}</template></el-table-column>
          <el-table-column label="VAT" width="88"><template #default="{ row }"><el-tag size="small" :type="row.vat === 'Included' ? 'success' : 'info'" effect="plain">{{ row.vat }}</el-tag></template></el-table-column>
          <el-table-column label="适用区域" min-width="165"><template #default="{ row }"><div class="zone-list"><span v-for="zone in row.zones" :key="zone">{{ zone }}</span><em v-if="row.moreZones">+{{ row.moreZones }}</em></div></template></el-table-column>
          <el-table-column label="审核状态" width="108"><template #default="{ row }"><el-tag :type="row.review === 'Pending Review' ? 'warning' : 'success'" effect="light">{{ quoteReviewLabel(row.review) }}</el-tag></template></el-table-column>
          <el-table-column label="生效日" width="110" prop="effective" />
          <el-table-column label="操作" width="110" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openPriceRequest(row)">{{ row.review === 'Pending Review' ? '详情' : '改价' }}</el-button></template></el-table-column>
        </el-table>
      </el-card>
      <div class="pricing-bottom-grid">
        <el-card class="surface-card" shadow="never">
          <div class="section-heading compact"><div><h2>区域价格规则</h2><p>Zone pricing & dispatch economics</p></div><el-button link type="primary" @click="showToast('已打开区域规则编辑')">编辑规则</el-button></div>
          <div class="rule-list">
            <div v-for="rule in priceRules" :key="rule.name"><span class="rule-badge" :class="`rule-badge--${rule.type}`">{{ rule.code }}</span><span><strong>{{ rule.name }}</strong><small>{{ rule.zones }}</small></span><span class="rule-values"><b>{{ rule.min }}h</b><em>{{ rule.fee }}</em></span></div>
          </div>
        </div>
      </el-card>
      <el-card class="surface-card pricing-card" shadow="never" v-loading="quoteLoading">
        <div class="section-heading compact"><div><h2>SKU 报价</h2><p>quotePrice 为当前版本，approvedPrice 为生效价</p></div></div>
        <div v-for="quote in quotes" :key="quote.spuId" class="rule-list">
          <div>
            <span><strong>{{ quote.spuName }}</strong><small>版本 {{ quote.versionNo || '-' }} · {{ quoteStatusLabel(quote.status) }}</small></span>
            <span class="pricing-actions">
              <el-button size="small" :disabled="quote.status === 1" :loading="saving" @click="saveQuote(quote)">保存草稿</el-button>
              <el-button size="small" type="primary" :disabled="quote.status === 1" :loading="saving" @click="submitQuoteRow(quote)">提交审核</el-button>
            </span>
          </div>
          <el-table :data="quote.skus" size="small" row-key="skuId">
            <el-table-column label="SKU" prop="skuCode" min-width="140" />
            <el-table-column label="平台价" min-width="120"><template #default="{ row }">{{ row.platformPrice ?? '-' }}</template></el-table-column>
            <el-table-column label="生效报价" min-width="120"><template #default="{ row }">{{ row.approvedPrice ?? '-' }}</template></el-table-column>
            <el-table-column label="本次报价" min-width="160">
              <template #default="{ row }">
                <el-input-number v-model="row.quotePrice" :min="0" :precision="2" :disabled="quote.status === 1 || row.available === false" />
              </template>
            </el-table-column>
          </el-table>
          <p v-if="quote.rejectReason" class="rejected-copy">拒绝原因：{{ quote.rejectReason }}</p>
        </div>
      </el-card>
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

    <el-dialog v-model="areaDialogVisible" :title="areaDialogMode === 'create' ? '新增服务区域' : '编辑服务区域'" width="min(640px, 92vw)" :close-on-click-modal="false">
      <div class="dialog-tip area-link-tip"><Location /><span>Zone 与 Community 来自 Dubai Area Master；社区选项会随 Zone 联动更新。</span></div>
      <div class="dialog-tip"><Clock /><span>保存后将提交平台审核，审核期间继续使用当前已生效内容；无需填写期望生效日或变更类型。</span></div>
      <el-form label-position="top" class="form-grid">
        <el-form-item label="Zone"><el-select v-model="areaRequest.zone" @change="handleAreaZoneChange"><el-option v-for="zone in zones" :key="zone.code" :label="`${zone.code} · ${zone.name}`" :value="zone.code" /></el-select></el-form-item>
        <el-form-item label="社区 / Community"><el-select v-model="areaRequest.communityId" :disabled="!areaRequest.zone" filterable @change="handleCommunityChange"><el-option v-for="community in availableCommunities" :key="community.areaId" :label="community.name" :value="community.areaId"><span>{{ community.name }}</span><small class="option-id">{{ community.areaId }}</small></el-option></el-select></el-form-item>
        <el-form-item label="Area ID"><el-input :model-value="areaRequest.communityId" disabled /></el-form-item>
        <el-form-item label="覆盖类型 / Coverage Type"><el-input :model-value="selectedAreaType" disabled /></el-form-item>
        <el-form-item label="适用服务" class="span-2"><el-select v-model="areaRequest.services" multiple collapse-tags><el-option v-for="service in areaServiceOptions" :key="service" :label="service" :value="service" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="areaDialogVisible = false">取消</el-button><el-button type="primary" @click="saveArea">保存并提交审核</el-button></template>
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

    <el-dialog v-model="quoteCreateDialogVisible" title="新增服务报价" width="680px" :close-on-click-modal="false">
      <div class="dialog-tip"><Clock /><span>新增服务报价提交后进入平台审核；审核通过前不会出现在客户可购买的服务中。</span></div>
      <el-form label-position="top" class="form-grid">
        <el-form-item label="服务分类"><el-select v-model="newQuote.category"><el-option v-for="category in quoteCategories" :key="category.value" :label="category.label" :value="category.value" /></el-select></el-form-item>
        <el-form-item label="服务编码"><el-input v-model="newQuote.code" placeholder="例如 CL-018" /></el-form-item>
        <el-form-item label="服务名称" class="span-2"><el-input v-model="newQuote.service" placeholder="例如 Curtain Cleaning" /></el-form-item>
        <el-form-item label="服务说明" class="span-2"><el-input v-model="newQuote.scope" placeholder="简要说明服务范围或规格" /></el-form-item>
        <el-form-item label="计价单位"><el-input v-model="newQuote.unit" placeholder="例如 Job / Unit / Hour" /></el-form-item>
        <el-form-item label="初始报价"><el-input-number v-model="newQuote.price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="最低订单"><el-input v-model="newQuote.minimum" placeholder="例如 1 job" /></el-form-item>
        <el-form-item label="VAT"><el-select v-model="newQuote.vat"><el-option label="Included" value="Included" /><el-option label="Excluded" value="Excluded" /></el-select></el-form-item>
        <el-form-item label="适用 Zone" class="span-2"><el-select v-model="newQuote.zones" multiple collapse-tags filterable><el-option v-for="zone in zones" :key="zone.code" :label="`${zone.code} · ${zone.name}`" :value="zone.code" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="quoteCreateDialogVisible = false">取消</el-button><el-button type="primary" @click="submitNewQuote">新增并提交审核</el-button></template>
    </el-dialog>

    <el-dialog v-model="priceDialogVisible" :title="priceDialogMode === 'detail' ? '报价详情' : '修改单条报价'" width="600px" :close-on-click-modal="false">
      <div class="dialog-tip"><Clock /><span>新报价仅在平台审核通过后生效，历史订单的价格快照不会改变。</span></div>
      <el-form label-position="top" class="form-grid">
        <el-form-item label="服务项目" class="span-2"><el-input :model-value="selectedQuote ? `${selectedQuote.code} · ${selectedQuote.service}` : ''" disabled /></el-form-item>
        <el-form-item label="当前价格"><el-input :model-value="selectedQuote?.isNew ? '尚未生效' : `AED ${selectedQuote?.price || 0}`" disabled /></el-form-item>
        <el-form-item label="申请价格"><el-input-number v-model="priceRequest.price" :min="0" :disabled="priceDialogMode === 'detail'" /></el-form-item>
        <el-form-item label="期望生效日"><el-input v-if="priceDialogMode === 'detail'" :model-value="selectedQuote?.effective" disabled /><el-date-picker v-else v-model="priceRequest.effective" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item v-if="!selectedQuote?.isNew" label="变更原因"><el-select v-model="priceRequest.reason" :disabled="priceDialogMode === 'detail'"><el-option label="人工成本变化" value="labour" /><el-option label="耗材成本变化" value="material" /><el-option label="服务范围调整" value="scope" /></el-select></el-form-item>
        <el-form-item label="审核状态"><el-input :model-value="quoteReviewLabel(selectedQuote?.review || 'Approved')" disabled /></el-form-item>
      </el-form>
      <template #footer><el-button @click="priceDialogVisible = false">{{ priceDialogMode === 'detail' ? '关闭' : '取消' }}</el-button><el-button v-if="priceDialogMode === 'edit'" type="primary" @click="submitPriceRequest">提交改价审核</el-button></template>
    </el-dialog>

    <el-drawer v-model="orderDrawerVisible" title="供应商订单详情" size="560px">
      <template v-if="selectedOrder">
        <div class="drawer-order-head"><div><span>{{ selectedOrder.orderNo }} · {{ selectedOrder.jobId }}</span><h2>{{ selectedOrder.service }}</h2><p>{{ selectedOrder.variant }}</p></div><span class="order-status" :class="`order-status--${selectedOrder.status}`">{{ orderStatusLabel(selectedOrder.status) }}</span></div>
        <div class="drawer-section"><h3>履约信息 / Fulfilment</h3><dl class="detail-list"><div><dt>服务时间</dt><dd>{{ selectedOrder.date }} {{ selectedOrder.time }}</dd></div><div><dt>执行人员</dt><dd>{{ selectedOrder.staff }}</dd></div><div><dt>供应商收益快照</dt><dd>AED {{ selectedOrder.cost }}</dd></div><div><dt>派单层级</dt><dd>AREA · same_area=true</dd></div></dl></div>
        <div class="drawer-section"><h3>地址快照 / Address Snapshot</h3><div class="address-panel"><Location /><div><strong>{{ selectedOrder.area }}</strong><p>{{ selectedOrder.address }}</p><span>{{ selectedOrder.areaId }} · {{ selectedOrder.zone }}</span></div></div></div>
        <div class="privacy-note">为保护客户隐私，供应商端不展示客户私人手机号；如需联系，请使用订单内平台通话。</div>
        <div class="drawer-section"><h3>订单进度 / Timeline</h3><el-timeline><el-timeline-item timestamp="09:02" type="success">订单已创建，锁定供应商成本</el-timeline-item><el-timeline-item timestamp="09:08" type="success">供应商已确认</el-timeline-item><el-timeline-item :timestamp="selectedOrder.time" type="primary">{{ selectedOrder.status === 'completed' ? '服务完成并上传凭证' : '等待服务人员到场' }}</el-timeline-item></el-timeline></div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { DUBAI_AREA_MASTER, DUBAI_ZONE_MASTER } from './dubaiAreaMaster'
import {
  onboardingDetail,
  onboardingPage,
  onboardingSave,
  quoteList,
  saveQuoteDraft,
  saveServices,
  serviceAreaList,
  serviceCommunityPage,
  serviceCatalog,
  submitQuote,
  supplierOrderPage,
  uploadFile,
} from '@/modules/admin/api/supplierWorkbench'
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
  Upload,
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
  'service-area': { title: '服务区域', description: '勾选平台已启用的服务区域。社区由平台维护。', primaryAction: '保存服务区域' },
  staff: { title: '人员管理', description: '维护人员角色、技能、默认工作时间、证件与可派状态。', primaryAction: '新增人员' },
  schedule: { title: '日程管理', description: '按日或周管理工作班次、休假、Block 与订单占用。', primaryAction: '添加班次 / Block' },
  orders: { title: '订单管理', description: '通过 Web Order No. 与 Job ID 跟踪履约、收益和地址快照。', primaryAction: '' },
  pricing: { title: '服务与报价', description: '勾选可履约服务，并按 SKU 保存或提交报价。', primaryAction: '保存可履约服务' },
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
const profileTab = ref('company')

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
  { key: 'public', fileKey: 'publicLiabilityInsuranceFile', label: '公众责任保险 / Public Liability', hint: '选择是时必须上传保单', enabled: false, file: '' },
  { key: 'employee', fileKey: 'employeeInsuranceFile', label: '员工保险 / Employee Insurance', hint: '选择是时必须上传保单', enabled: false, file: '' },
  { key: 'tax', label: '可开具税务发票 / Tax Invoice', hint: 'VAT / TRN', enabled: false, file: '' },
  { key: 'equipment', label: '自有设备 / Own Equipment', hint: '是否自有设备', enabled: false, file: '' },
])

const bankForm = reactive({
  accountName: 'PrimeCare Home Services LLC',
  bankName: 'Emirates NBD',
  iban: 'AE07 0260 0010 1234 5678 901',
  swift: 'EBILAEAD',
  currency: 'AED',
})
const documents = [
  { name: 'Trade License', file: 'primecare_trade_license.pdf', number: 'CN-4587219', expiry: '18 Feb 2027', status: 'Verified' },
  { name: 'VAT Certificate', file: 'vat_certificate.pdf', number: '100589237400003', expiry: '—', status: 'Verified' },
  { name: 'Public Liability Insurance', file: 'public_liability_2026.pdf', number: 'PLI-883104', expiry: '31 Jan 2027', status: 'Verified' },
  { name: 'Employee Insurance', file: 'employee_insurance.pdf', number: 'EI-221908', expiry: '18 Oct 2026', status: 'Expiring' },
  { name: 'Bank Confirmation Letter', file: 'bank_letter_sep_2026.pdf', number: 'BNK-19024', expiry: '—', status: 'Pending Review' },
]

const capacityForm = reactive({ workers: 0, concurrent: 0, monthly: 0, leadTime: 0, start: '08:00', end: '18:00' })
const capacityToggles = reactive([
  { label: '周末服务', en: 'Weekend service', enabled: false },
  { label: '公共假期服务', en: 'Public holiday service', enabled: false },
  { label: '当日预约', en: 'Same-day booking', enabled: false },
  { label: '紧急服务', en: 'Emergency service', enabled: false },
])

const zones = DUBAI_ZONE_MASTER.map((zone) => ({
  code: zone.zoneCode,
  name: zone.name,
  type: zone.coverageType,
  areas: zone.areaCount,
  min: zone.minBooking,
  fee: zone.travelFee,
}))
const selectedZones = ref(['Z01', 'Z02', 'Z03', 'Z04', 'Z05', 'Z08', 'Z09', 'E01'])
const coverageTotal = computed(() => zones.filter((zone) => selectedZones.value.includes(zone.code)).reduce((total, zone) => total + zone.areas, 0))
const travelFeeTotal = computed(() => Math.max(0, ...zones.filter((zone) => selectedZones.value.includes(zone.code)).map((zone) => zone.fee)))

const toggleZone = (code: string) => {
  selectedZones.value = selectedZones.value.includes(code)
    ? selectedZones.value.filter((item) => item !== code)
    : [...selectedZones.value, code]
}

type CommunityOption = { areaId: string; name: string }
type AreaReviewStatus = 'approved' | 'pending' | 'rejected'
type AreaPendingAction = 'create' | 'update' | 'enable' | 'delete'
type AreaData = { areaId: string; community: string; zone: string; zoneName: string; type: string; services: string[] }
type AreaRow = AreaData & {
  active: boolean
  effective: boolean
  reviewStatus: AreaReviewStatus
  pendingAction?: AreaPendingAction
  pendingData?: AreaData
  reviewNote?: string
}
const communityOptionsByZone = DUBAI_AREA_MASTER.reduce<Record<string, CommunityOption[]>>((result, item) => {
  if (!result[item.zoneCode]) result[item.zoneCode] = []
  result[item.zoneCode].push({ areaId: item.areaId, name: item.name })
  return result
}, {})
const areas = ref<AreaRow[]>([
  { areaId: 'DXB-0001', community: 'Downtown Dubai', zone: 'Z01', zoneName: 'Central Dubai', type: 'Standard', services: ['Cleaning', 'AC'], active: true, effective: true, reviewStatus: 'approved' },
  { areaId: 'DXB-0002', community: 'Business Bay', zone: 'Z01', zoneName: 'Central Dubai', type: 'Standard', services: ['All services'], active: true, effective: true, reviewStatus: 'pending', pendingAction: 'update', pendingData: { areaId: 'DXB-0002', community: 'Business Bay', zone: 'Z01', zoneName: 'Central Dubai', type: 'Standard', services: ['All services', 'AC'] } },
  { areaId: 'DXB-0003', community: 'DIFC', zone: 'Z01', zoneName: 'Central Dubai', type: 'Standard', services: ['Cleaning', 'Handyman'], active: true, effective: true, reviewStatus: 'approved' },
  { areaId: 'DXB-0016', community: 'Jumeirah 1', zone: 'Z02', zoneName: 'Jumeirah & Al Wasl', type: 'Standard', services: ['All services'], active: true, effective: true, reviewStatus: 'approved' },
  { areaId: 'DXB-0034', community: 'Dubai Marina', zone: 'Z03', zoneName: 'Marina, Palm & Tecom', type: 'Standard', services: ['Cleaning', 'AC'], active: true, effective: true, reviewStatus: 'approved' },
  { areaId: 'DXB-0038', community: 'Palm Jumeirah', zone: 'Z03', zoneName: 'Marina, Palm & Tecom', type: 'Standard', services: ['Cleaning', 'Wellness'], active: true, effective: true, reviewStatus: 'approved' },
  { areaId: 'DXB-0081', community: 'Dubai Hills Estate', zone: 'Z06', zoneName: 'Hills, Ranches & South-West Villas', type: 'Standard', services: ['Handyman', 'Painting'], active: true, effective: true, reviewStatus: 'approved' },
  { areaId: 'DXB-0180', community: 'Dubai South', zone: 'E01', zoneName: 'Dubai South & Expo', type: 'Extended', services: ['Cleaning', 'AC'], active: true, effective: true, reviewStatus: 'approved' },
  { areaId: 'DXB-0221', community: 'Al Awir 1', zone: 'E04', zoneName: 'North-East Villas & Al Awir', type: 'Extended', services: ['Handyman'], active: false, effective: true, reviewStatus: 'rejected', reviewNote: '重新启用申请已驳回' },
  { areaId: 'DXB-0227', community: 'Hatta', zone: 'E05', zoneName: 'Remote Dubai / Hatta', type: 'Restricted', services: ['Emergency only'], active: false, effective: true, reviewStatus: 'approved' },
])
const areaKeyword = ref('')
const areaZone = ref('')
const areaStatus = ref('')
const filteredAreas = computed(() => areas.value.filter((area) => {
  const keyword = areaKeyword.value.trim().toLowerCase()
  return (!keyword || `${area.community} ${area.areaId}`.toLowerCase().includes(keyword))
    && (!areaZone.value || area.zone === areaZone.value)
    && (!areaStatus.value
      || (areaStatus.value === 'active' && area.active)
      || (areaStatus.value === 'inactive' && !area.active)
      || area.reviewStatus === areaStatus.value)
}))
const activeAreaCount = computed(() => areas.value.filter((area) => area.effective && area.active).length)
const standardAreaCount = computed(() => areas.value.filter((area) => area.effective && area.type === 'Standard').length)
const extendedAreaCount = computed(() => areas.value.filter((area) => area.effective && area.type !== 'Standard').length)
const coveredZoneCount = computed(() => new Set(areas.value.filter((area) => area.effective).map((area) => area.zone)).size)
const pendingAreaCount = computed(() => areas.value.filter((area) => area.reviewStatus === 'pending').length)
const areaReviewLabel = (status: AreaReviewStatus) => ({ approved: '已生效', pending: '审核中', rejected: '已驳回' })[status]
const areaReviewTagType = (status: AreaReviewStatus) => ({ approved: 'success', pending: 'warning', rejected: 'danger' } as const)[status]
const areaActionLabel = (action: AreaPendingAction) => ({ create: '新增待审核', update: '修改待审核', enable: '启用待审核', delete: '删除待审核' })[action]
const areaServiceOptions = ['All services', 'Cleaning', 'AC', 'Handyman', 'Painting', 'Wellness', 'Emergency only']
const areaDialogVisible = ref(false)
const areaDialogMode = ref<'create' | 'edit'>('create')
const editingAreaId = ref('')
const areaRequest = reactive({ zone: 'Z01', communityId: '', services: [] as string[] })
const availableCommunities = computed(() => communityOptionsByZone[areaRequest.zone] || [])
const selectedAreaType = computed(() => zones.find((zone) => zone.code === areaRequest.zone)?.type || '—')
const handleAreaZoneChange = () => { areaRequest.communityId = '' }
const handleCommunityChange = () => {
  if (!availableCommunities.value.some((community) => community.areaId === areaRequest.communityId)) areaRequest.communityId = ''
}
const openAreaDialog = (row?: AreaRow) => {
  const source = row?.pendingAction === 'update' && row.pendingData ? row.pendingData : row
  areaDialogMode.value = row ? 'edit' : 'create'
  editingAreaId.value = row?.areaId || ''
  areaRequest.zone = source?.zone || 'Z01'
  areaRequest.communityId = source?.areaId || ''
  areaRequest.services = source ? [...source.services] : []
  areaDialogVisible.value = true
}
const saveArea = () => {
  const community = availableCommunities.value.find((item) => item.areaId === areaRequest.communityId)
  const zone = zones.find((item) => item.code === areaRequest.zone)
  if (!community || !zone) return ElMessage.warning('请选择 Zone 和对应的社区')
  const target = areas.value.find((item) => item.areaId === editingAreaId.value)
  const duplicate = areas.value.some((item) => item !== target && (item.areaId === community.areaId || item.pendingData?.areaId === community.areaId))
  if (duplicate) return ElMessage.warning('该社区已存在于服务区域中')
  const requestedData: AreaData = { areaId: community.areaId, community: community.name, zone: zone.code, zoneName: zone.name, type: zone.type, services: [...areaRequest.services] }
  if (areaDialogMode.value === 'edit' && target) {
    if (target.pendingAction === 'create') {
      Object.assign(target, requestedData, { active: false, effective: false, reviewStatus: 'pending' as const, pendingAction: 'create' as const, pendingData: undefined, reviewNote: undefined })
    } else {
      target.pendingData = requestedData
      target.reviewStatus = 'pending'
      target.pendingAction = 'update'
      target.reviewNote = undefined
    }
  } else {
    areas.value.unshift({ ...requestedData, active: false, effective: false, reviewStatus: 'pending', pendingAction: 'create' })
  }
  areaDialogVisible.value = false
  ElMessage.success(areaDialogMode.value === 'create' ? '新增申请已提交平台审核' : '修改申请已提交平台审核')
}
const toggleAreaStatus = (row: AreaRow, nextActive: boolean) => {
  if (nextActive === row.active) return
  if (!nextActive) {
    row.active = false
    ElMessage.success(`${row.community} 已立即停用`)
    return
  }
  row.reviewStatus = 'pending'
  row.pendingAction = 'enable'
  row.reviewNote = undefined
  ElMessage.success(`${row.community} 的重新启用申请已提交平台审核`)
}
const deleteArea = async (row: AreaRow) => {
  try {
    if (!row.effective || row.pendingAction === 'create') {
      await ElMessageBox.confirm(`确认撤回「${row.community}」的新增申请吗？`, '撤回申请', { type: 'warning', confirmButtonText: '撤回', cancelButtonText: '取消' })
      areas.value = areas.value.filter((item) => item !== row)
      ElMessage.success('新增申请已撤回')
      return
    }
    await ElMessageBox.confirm(`删除「${row.community}」需要平台审核，审核期间该区域仍保持当前状态。确认提交吗？`, '提交删除审核', { type: 'warning', confirmButtonText: '提交审核', cancelButtonText: '取消' })
    row.reviewStatus = 'pending'
    row.pendingAction = 'delete'
    row.pendingData = undefined
    row.reviewNote = undefined
    ElMessage.success('删除申请已提交平台审核')
  } catch { /* cancelled */ }
}

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

type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed'
type OrderRow = { orderNo: string; jobId: string; created: string; service: string; variant: string; serviceIcon: string; area: string; zone: string; areaId: string; address: string; date: string; time: string; staff: string; cost: number; status: OrderStatus }
const orders: OrderRow[] = [
  { orderNo: 'HX-260924-0186', jobId: 'JOB-88421', created: '24 Sep · 09:02', service: 'Regular Cleaning', variant: '2 cleaners × 4 hours', serviceIcon: 'CL', area: 'Downtown Dubai', zone: 'Z01', areaId: 'DXB-0001', address: 'Burj Vista Tower 1, Downtown Dubai', date: '24 Sep 2026', time: '14:00–18:00', staff: 'Amina + Lina', cost: 224, status: 'confirmed' },
  { orderNo: 'HX-260924-0179', jobId: 'JOB-88408', created: '24 Sep · 08:38', service: 'Split AC Cleaning', variant: '3 indoor units', serviceIcon: 'AC', area: 'Dubai Marina', zone: 'Z03', areaId: 'DXB-0041', address: 'Marina Gate 2, Dubai Marina', date: '24 Sep 2026', time: '11:30–14:00', staff: 'Ravi Kumar', cost: 360, status: 'in_progress' },
  { orderNo: 'HX-260924-0164', jobId: 'JOB-88397', created: '24 Sep · 07:55', service: 'Deep Cleaning – 2BR', variant: 'Includes supplies', serviceIcon: 'DC', area: 'Business Bay', zone: 'Z01', areaId: 'DXB-0002', address: 'Executive Bay Tower B, Business Bay', date: '24 Sep 2026', time: '16:00–21:00', staff: '待安排', cost: 420, status: 'pending' },
  { orderNo: 'HX-260923-0151', jobId: 'JOB-88382', created: '23 Sep · 17:26', service: 'Handyman', variant: 'Call-out + first hour', serviceIcon: 'HM', area: 'Dubai Hills Estate', zone: 'Z06', areaId: 'DXB-0108', address: 'Sidra 2, Dubai Hills Estate', date: '24 Sep 2026', time: '10:00–12:00', staff: 'Ahmed Nasser', cost: 180, status: 'confirmed' },
  { orderNo: 'HX-260923-0138', jobId: 'JOB-88366', created: '23 Sep · 14:12', service: 'Sofa Cleaning', variant: '5 seats', serviceIcon: 'SC', area: 'Jumeirah 1', zone: 'Z02', areaId: 'DXB-0017', address: 'Villa 18, Jumeirah 1', date: '23 Sep 2026', time: '17:00–19:00', staff: 'Fatima Zahra', cost: 250, status: 'completed' },
]
const orderKeyword = ref('')
const orderStatus = ref('')
const filteredOrders = computed(() => orders.filter((order) => {
  const keyword = orderKeyword.value.trim().toLowerCase()
  return (!keyword || `${order.orderNo} ${order.jobId} ${order.service} ${order.area}`.toLowerCase().includes(keyword)) && (!orderStatus.value || order.status === orderStatus.value)
}))
const orderStatusLabel = (status: OrderStatus) => ({ pending: '待确认', confirmed: '已确认', in_progress: '服务中', completed: '已完成' })[status]
const orderDrawerVisible = ref(false)
const selectedOrder = ref<OrderRow | null>(null)
const openOrder = (row: OrderRow) => { selectedOrder.value = row; orderDrawerVisible.value = true }

const quoteCategory = ref('all')
const quoteCategories = [
  { label: '清洁', value: 'cleaning', count: 17 }, { label: '空调', value: 'ac', count: 10 }, { label: '维修', value: 'maintenance', count: 8 }, { label: '安装', value: 'installation', count: 15 }, { label: '油漆', value: 'painting', count: 10 }, { label: '房检', value: 'snagging', count: 5 }, { label: '虫控', value: 'pest', count: 9 }, { label: '美容康养', value: 'wellness', count: 27 },
]
const liveQuotes = ref<any[]>([])
const demoQuotes = ref([
  { id: 1, category: 'cleaning', code: 'CL-001', service: 'Regular Cleaning', scope: '常规清洁 / Cleaner hour', unit: 'Cleaner / Hour', price: 28, minimum: '2 hours', vat: 'Excluded', zones: ['Z01', 'Z02', 'Z03'], moreZones: 5, active: true },
  { id: 2, category: 'cleaning', code: 'CL-002', service: 'Cleaning Supplies', scope: '基础清洁用品', unit: 'Visit', price: 35, minimum: '—', vat: 'Included', zones: ['All selected'], moreZones: 0, active: true },
  { id: 3, category: 'cleaning', code: 'CL-003', service: 'Deep Cleaning – Studio', scope: '深度清洁 · Studio', unit: 'Job', price: 260, minimum: '1 job', vat: 'Excluded', zones: ['Z01', 'Z02', 'Z04'], moreZones: 4, active: true },
  { id: 4, category: 'cleaning', code: 'CL-004', service: 'Deep Cleaning – 1BR', scope: '深度清洁 · 1 bedroom', unit: 'Job', price: 340, minimum: '1 job', vat: 'Excluded', zones: ['Z01', 'Z02', 'Z04'], moreZones: 4, active: true },
  { id: 5, category: 'cleaning', code: 'CL-005', service: 'Deep Cleaning – 2BR', scope: '深度清洁 · 2 bedroom', unit: 'Job', price: 420, minimum: '1 job', vat: 'Excluded', zones: ['Z01', 'Z02', 'Z04'], moreZones: 4, active: true },
  { id: 6, category: 'cleaning', code: 'CL-013', service: 'Sofa Cleaning', scope: '沙发清洁', unit: 'Seat', price: 50, minimum: '4 seats', vat: 'Included', zones: ['All selected'], moreZones: 0, active: true },
  { id: 7, category: 'ac', code: 'AC-001', service: 'Split AC Cleaning', scope: '分体空调清洗', unit: 'Unit', price: 120, minimum: '2 units', vat: 'Excluded', zones: ['Z01', 'Z03', 'Z04'], moreZones: 5, active: true },
  { id: 8, category: 'ac', code: 'AC-002', service: 'AC Filter Cleaning', scope: '空调滤网清洗', unit: 'Unit', price: 55, minimum: '3 units', vat: 'Excluded', zones: ['All selected'], moreZones: 0, active: true },
  { id: 9, category: 'maintenance', code: 'MT-001', service: 'Handyman', scope: '上门及首小时', unit: 'First hour', price: 180, minimum: '1 hour', vat: 'Excluded', zones: ['Z01', 'Z02', 'Z08'], moreZones: 5, active: true },
  { id: 10, category: 'installation', code: 'IN-001', service: 'TV Wall Mounting', scope: '电视壁挂安装', unit: 'Unit', price: 180, minimum: '1 unit', vat: 'Included', zones: ['All selected'], moreZones: 0, active: true },
  { id: 11, category: 'painting', code: 'PT-001', service: 'Studio Painting', scope: '人工 + 标准油漆', unit: 'Job', price: 950, minimum: '1 job', vat: 'Excluded', zones: ['Z01', 'Z02', 'Z04'], moreZones: 4, active: true },
  { id: 12, category: 'snagging', code: 'SG-001', service: 'Snagging Inspection', scope: 'Studio inspection + PDF', unit: 'Job', price: 450, minimum: '1 job', vat: 'Included', zones: ['All selected'], moreZones: 0, active: true },
  { id: 13, category: 'pest', code: 'PC-001', service: 'General Pest Control', scope: 'Studio', unit: 'Job', price: 165, minimum: '1 job', vat: 'Included', zones: ['Z01', 'Z02', 'Z03'], moreZones: 5, active: true },
  { id: 14, category: 'wellness', code: 'BW-001', service: 'Relaxation Massage 60 min', scope: '到家服务', unit: 'Session', price: 190, minimum: '1 session', vat: 'Excluded', zones: ['Z01', 'Z02', 'Z03'], moreZones: 3, active: true },
].map((quote, index) => ({
  ...quote,
  requested: index === 0 ? 31 : index === 2 ? 280 : index === 6 ? 135 : null as number | null,
  review: [0, 2, 6].includes(index) ? 'Pending Review' : 'Approved',
  effective: [0, 2, 6].includes(index) ? '01 Oct 2026' : '01 Sep 2026',
  isNew: false,
})))
const filteredQuotes = computed(() => quoteCategory.value === 'all' ? quotes.value : quotes.value.filter((quote) => quote.category === quoteCategory.value))
const pendingQuoteCount = computed(() => liveQuotes.value.filter((quote) => quote.status === 1).length)
const quotes = liveQuotes
const quoteReviewLabel = (review: string) => review === 'Pending Review' ? '审核中' : '已生效'

type QuoteRow = (typeof quotes.value)[number]
const quoteCreateDialogVisible = ref(false)
const editingNewQuoteId = ref<number | null>(null)
const newQuote = reactive({
  category: 'cleaning',
  code: '',
  service: '',
  scope: '',
  unit: 'Job',
  price: 0,
  minimum: '1 job',
  vat: 'Excluded',
  zones: [] as string[],
})
const resetNewQuote = () => {
  editingNewQuoteId.value = null
  Object.assign(newQuote, { category: quoteCategory.value === 'all' ? 'cleaning' : quoteCategory.value, code: '', service: '', scope: '', unit: 'Job', price: 0, minimum: '1 job', vat: 'Excluded', zones: [] })
}
const openCreateQuote = (row?: QuoteRow) => {
  resetNewQuote()
  if (row?.isNew) {
    editingNewQuoteId.value = row.id
    Object.assign(newQuote, { category: row.category, code: row.code, service: row.service, scope: row.scope, unit: row.unit, price: row.requested || 0, minimum: row.minimum, vat: row.vat, zones: [...row.zones] })
  }
  quoteCreateDialogVisible.value = true
}
const submitNewQuote = () => {
  if (!newQuote.code.trim() || !newQuote.service.trim() || !newQuote.unit.trim() || newQuote.price <= 0) return ElMessage.warning('请填写服务编码、名称、计价单位和初始报价')
  if (!newQuote.zones.length) return ElMessage.warning('请选择至少一个适用 Zone')
  const duplicate = quotes.value.some((quote) => quote.id !== editingNewQuoteId.value && quote.code.toLowerCase() === newQuote.code.trim().toLowerCase())
  if (duplicate) return ElMessage.warning('服务编码已存在')
  const payload: Omit<QuoteRow, 'id'> = {
    category: newQuote.category,
    code: newQuote.code.trim(),
    service: newQuote.service.trim(),
    scope: newQuote.scope.trim() || '—',
    unit: newQuote.unit.trim(),
    price: 0,
    minimum: newQuote.minimum.trim() || '—',
    vat: newQuote.vat,
    zones: [...newQuote.zones],
    moreZones: 0,
    active: false,
    requested: Number(newQuote.price),
    review: 'Pending Review',
    effective: '审核通过后',
    isNew: true,
  }
  if (editingNewQuoteId.value !== null) {
    const target = quotes.value.find((quote) => quote.id === editingNewQuoteId.value)
    if (target) Object.assign(target, payload)
  } else {
    const id = Math.max(0, ...quotes.value.map((quote) => quote.id)) + 1
    quotes.value.unshift({ id, ...payload })
  }
  quoteCategory.value = 'all'
  quoteCreateDialogVisible.value = false
  ElMessage.success(editingNewQuoteId.value === null ? '新增服务报价已提交平台审核' : '新增服务申请已更新')
}

const priceDialogVisible = ref(false)
const priceDialogMode = ref<'detail' | 'edit'>('edit')
const priceRequest = reactive({ id: 1, price: 31, effective: '2026-10-01', reason: 'labour' })
const selectedQuote = computed(() => quotes.value.find((quote) => quote.id === priceRequest.id))
const openPriceRequest = (row: QuoteRow) => {
  priceDialogMode.value = row.review === 'Pending Review' ? 'detail' : 'edit'
  priceRequest.id = row.id
  priceRequest.price = row.requested || row.price
  priceDialogVisible.value = true
}
const submitPriceRequest = () => {
  if (!selectedQuote.value || priceRequest.price <= 0) return ElMessage.warning('请输入有效的申请价格')
  selectedQuote.value.requested = Number(priceRequest.price)
  selectedQuote.value.review = 'Pending Review'
  selectedQuote.value.effective = priceRequest.effective || '审核通过后'
  priceDialogVisible.value = false
  ElMessage.success('该服务的改价申请已提交平台审核')
}
const priceRules = [
  { code: 'Z01–Z10', name: '标准区域', zones: '183 communities · Auto-dispatch', min: 2, fee: '免交通费', type: 'standard' },
  { code: 'E01–E04', name: '扩展区域', zones: '47 communities · ETA / margin check', min: 3, fee: 'AED 15–25', type: 'extended' },
  { code: 'E05', name: '受限区域', zones: '5 communities · Manual dispatch', min: 4, fee: 'AED 35', type: 'restricted' },
]
const commercialTerms = [
  { label: '最低订单金额', value: 'AED 120' }, { label: 'Call-out fee', value: 'AED 80' }, { label: '当日预约附加费', value: '+15%' }, { label: '紧急服务附加费', value: '+25%' }, { label: '付款账期', value: '30 days' }, { label: '保修期', value: '30 days' }, { label: '免费返工期', value: '7 days' }, { label: '报价有效期', value: '6 months' },
]

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

const platformAreas = ref<any[]>([])
const areaCommunities = ref<Record<number, string[]>>({})
const selectedAreaIds = ref<number[]>([])
const areaLoading = ref(false)
const serviceCatalogGroups = ref<any[]>([])
const catalogLoading = ref(false)
const selectedSpuIds = ref<number[]>([])
const quoteLoading = ref(false)
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
const filteredPlatformAreas = computed(() => {
  const keyword = areaKeyword.value.trim().toLowerCase()
  if (!keyword) return platformAreas.value
  return platformAreas.value.filter((area) => String(area.name || '').toLowerCase().includes(keyword))
})

const unwrap = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res)
const bit = (enabled: boolean) => (enabled ? 1 : 0)
const quoteStatusLabel = (status?: number) => ['草稿', '待审核', '已通过', '已拒绝'][status ?? -1] || '未报价'

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
  publicLiabilityInsuranceFile: complianceItems[0].file,
  employeeInsurance: bit(complianceItems[1].enabled),
  employeeInsuranceFile: complianceItems[1].file,
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
  complianceItems[0].file = detail?.publicLiabilityInsuranceFile || ''
  complianceItems[1].enabled = detail?.employeeInsurance === 1
  complianceItems[1].file = detail?.employeeInsuranceFile || ''
  complianceItems[2].enabled = detail?.taxInvoiceAvailable === 1
  complianceItems[3].enabled = detail?.ownEquipment === 1
  ownTransportation.value = detail?.ownTransportation === 1
  femaleStaffCount.value = detail?.femaleStaffCount || 0
  maleStaffCount.value = detail?.maleStaffCount || 0
  selectedAreaIds.value = (detail?.serviceAreas || []).map((area: any) => Number(area.areaId)).filter(Boolean)
}

const loadSupplierDetail = async (id: number) => {
  const detail = unwrap(await onboardingDetail(id))
  applyProfile(detail)
  await Promise.all([loadCatalog(), loadQuotes(), loadOrders()])
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

const uploadInsurance = async (fileKey: string, options: any) => {
  try {
    const url = unwrap(await uploadFile(options.file as File))
    const target = complianceItems.find((item) => item.fileKey === fileKey)
    if (target) target.file = typeof url === 'string' ? url : url?.url || ''
    options.onSuccess?.(url)
    ElMessage.success('保单已上传')
  } catch (error: any) {
    options.onError?.(error)
    ElMessage.error(error?.message || '上传失败')
  }
}

const loadAreas = async () => {
  areaLoading.value = true
  try {
    platformAreas.value = unwrap(await serviceAreaList({ status: 1 })) || []
    const communityEntries = await Promise.all(
      platformAreas.value.map(async (area) => {
        try {
          const page = unwrap(await serviceCommunityPage({ areaId: area.id, pageNum: 1, pageSize: 200, status: 1 }))
          return [area.id, (page?.list || []).map((item: any) => item.name)] as const
        } catch {
          return [area.id, []] as const
        }
      }),
    )
    areaCommunities.value = Object.fromEntries(communityEntries)
  } catch (error: any) {
    ElMessage.error(error?.message || '服务区域加载失败')
  } finally {
    areaLoading.value = false
  }
}

const toggleArea = (id: number, checked: boolean) => {
  selectedAreaIds.value = checked
    ? [...selectedAreaIds.value, id]
    : selectedAreaIds.value.filter((item) => item !== id)
}

const saveAreas = async () => {
  if (!companyForm.companyName) {
    ElMessage.warning('请先填写企业资料里的必填项')
    return
  }
  saving.value = true
  try {
    const id = unwrap(await onboardingSave(buildProfilePayload(onboardingStatus.value ?? 0, selectedAreaIds.value)))
    if (id) supplierRecordId.value = Number(id)
    ElMessage.success('服务区域已保存')
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
    selectedSpuIds.value = serviceCatalogGroups.value.flatMap((group) =>
      (group.services || []).filter((service: any) => service.selected).map((service: any) => service.spuId),
    )
  } finally {
    catalogLoading.value = false
  }
}

const isCategoryChecked = (group: any) => {
  const ids = (group.services || []).map((service: any) => service.spuId)
  return ids.length > 0 && ids.every((id: number) => selectedSpuIds.value.includes(id))
}
const toggleSpu = (spuId: number, checked: boolean) => {
  selectedSpuIds.value = checked
    ? [...selectedSpuIds.value, spuId]
    : selectedSpuIds.value.filter((id) => id !== spuId)
}
const toggleCategory = (group: any, checked: boolean) => {
  const ids = (group.services || []).map((service: any) => service.spuId)
  selectedSpuIds.value = checked
    ? Array.from(new Set([...selectedSpuIds.value, ...ids]))
    : selectedSpuIds.value.filter((id) => !ids.includes(id))
}
const saveSelectedServices = async () => {
  if (!supplierRecordId.value) return
  saving.value = true
  try {
    const services = serviceCatalogGroups.value
      .map((group) => ({
        categoryId: group.categoryId,
        spuIds: (group.services || []).map((service: any) => service.spuId).filter((id: number) => selectedSpuIds.value.includes(id)),
      }))
      .filter((group) => group.spuIds.length)
    await saveServices({ supplierId: supplierRecordId.value, services })
    ElMessage.success('可履约服务已保存')
    await loadQuotes()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存服务失败')
  } finally {
    saving.value = false
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
const saveQuote = async (quote: any) => {
  saving.value = true
  try {
    await saveQuoteDraft({
      supplierId: supplierRecordId.value,
      spuId: quote.spuId,
      items: (quote.skus || []).map((sku: any) => ({ skuId: sku.skuId, quotePrice: sku.quotePrice })),
    })
    ElMessage.success('报价草稿已保存')
    await loadQuotes()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存报价失败')
  } finally {
    saving.value = false
  }
}
const submitQuoteRow = async (quote: any) => {
  saving.value = true
  try {
    await submitQuote({ supplierId: supplierRecordId.value, spuId: quote.spuId })
    ElMessage.success('报价已提交审核')
    await loadQuotes()
  } catch (error: any) {
    ElMessage.error(error?.message || '提交报价失败')
  } finally {
    saving.value = false
  }
}

const loadOrders = async () => {
  if (!supplierRecordId.value) return
  orderLoading.value = true
  try {
    const page = unwrap(await supplierOrderPage({
      supplierId: supplierRecordId.value,
      orderNo: orderKeyword.value || undefined,
      pageNum: orderPage.value,
      pageSize: 10,
    }))
    supplierOrders.value = page?.list || []
    orderTotal.value = Number(page?.total || 0)
  } catch (error: any) {
    ElMessage.error(error?.message || '订单加载失败')
  } finally {
    orderLoading.value = false
  }
}
const changeOrderPage = (page: number) => {
  orderPage.value = page
  loadOrders()
}
const openSupplierOrder = (row: any) => {
  selectedOrder.value = {
    orderNo: row.orderNo,
    jobId: row.orderId,
    created: row.orderTime,
    service: row.productName,
    variant: row.specDesc,
    status: 'confirmed',
    date: row.serviceTimeDisplay || row.serviceDate,
    time: row.serviceTime,
    staff: '-',
    cost: row.amountText,
    area: row.community || row.serviceAddress,
    address: row.serviceAddress,
    areaId: row.building || '',
    zone: row.roomNo || '',
  } as any
  orderDrawerVisible.value = true
}

const handlePrimaryAction = () => {
  if (section.value === 'staff') { staffDialogVisible.value = true; return }
  if (section.value === 'service-area') { saveAreas(); return }
  if (section.value === 'schedule') { shiftDialogVisible.value = true; return }
  if (section.value === 'pricing') { saveSelectedServices(); return }
  if (section.value === 'profile') saveProfile(1)
}

onMounted(() => {
  if (section.value === 'service-area') loadAreas()
  loadSupplierOptions().catch((error: any) => ElMessage.error(error?.message || '供应商资料加载失败'))
})
watch(section, (value) => {
  if (value === 'orders') loadOrders()
  if (value === 'pricing') {
    loadCatalog()
    loadQuotes()
  }
  if (value === 'service-area') loadAreas()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,520;9..144,620&family=Sora:wght@400;500;600&display=swap');
.supplier-demo { --ink: #172033; --muted: #768197; --line: #e8ebf2; --purple: #5b55d6; --purple-soft: #eeedff; width: 100%; min-width: 0; box-sizing: border-box; padding: 20px; color: var(--ink); }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 18px; }
.page-header h1 { margin: 5px 0 6px; font-size: 25px; line-height: 1.25; letter-spacing: -.5px; }
.page-header p { margin: 0; color: var(--muted); font-size: 14px; }
.eyebrow { display: flex; align-items: center; gap: 7px; color: #6f67d9; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.demo-dot { width: 7px; height: 7px; border-radius: 50%; background: #7067e8; box-shadow: 0 0 0 4px #eceaff; }
.page-actions { display: flex; gap: 10px; padding-top: 4px; }
.page-actions :deep(.el-button) { display: inline-flex; align-items: center; gap: 6px; }
.community-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.supplier-strip { display: flex; align-items: center; justify-content: space-between; min-height: 78px; padding: 13px 18px; margin-bottom: 16px; background: linear-gradient(105deg, #fff 0%, #fbfbff 62%, #f2f0ff 100%); border: 1px solid #e3e2f5; border-radius: 14px; box-shadow: 0 5px 18px rgba(40, 46, 84, .04); }
.supplier-identity { display: flex; align-items: center; gap: 12px; }
.supplier-logo { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; color: #fff; background: linear-gradient(135deg, #252a4a, #625bd3); font-weight: 700; }
.supplier-label { margin-bottom: 3px; color: var(--muted); font-size: 11px; }
.supplier-select { width: 290px; }
.supplier-select :deep(.el-select__wrapper) { padding-left: 0; background: transparent; box-shadow: none !important; font-weight: 700; }
.supplier-facts { display: flex; align-items: center; gap: 28px; }
.supplier-facts > div { display: flex; flex-direction: column; gap: 4px; }
.supplier-facts span { color: var(--muted); font-size: 11px; }
.supplier-facts strong { font-size: 13px; }
.supplier-facts .progress-value { color: #5b55d6; }
.compact-progress { display: block !important; width: 100px; height: 6px; border-radius: 99px; background: #e5e3f6; overflow: hidden; }
.compact-progress i { display: block; height: 100%; border-radius: inherit; background: #6a63df; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.metric-card { display: flex; align-items: center; gap: 13px; min-height: 102px; padding: 17px; background: #fff; border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 4px 14px rgba(27, 34, 57, .035); }
.metric-icon { display: grid; place-items: center; flex: 0 0 auto; width: 42px; height: 42px; border-radius: 12px; }
.metric-icon :deep(svg) { width: 20px; }
.metric-icon--blue { color: #3274c8; background: #eaf3ff; }.metric-icon--green { color: #20896e; background: #e6f7f1; }.metric-icon--purple { color: #635bd8; background: #efedff; }.metric-icon--amber { color: #b36a23; background: #fff1de; }
.metric-card div { display: flex; flex-direction: column; }.metric-card small, .mini-metric span { color: var(--muted); font-size: 12px; }.metric-card strong { margin: 3px 0; font-size: 20px; }.metric-card p { margin: 0; color: #949caf; font-size: 11px; }
.surface-card { border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 5px 18px rgba(28, 36, 62, .04); }
.surface-card :deep(.el-card__body) { padding: 0; }
.onboarding-card :deep(.el-card__body) { padding: 0 22px 24px; }
.dossier { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 22px; align-items: start; font-family: "Sora", "Avenir Next", sans-serif; }
.dossier-rail { position: sticky; top: 16px; padding: 22px 18px; color: #f4efe6; background: #241c16 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cpath d='M0 139h140M139 0v140' fill='none' stroke='%23ffffff14'/%3E%3C/svg%3E"); border-radius: 18px; }
.dossier-rail p { margin: 0 0 14px; color: #d7a07a; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; }
.dossier-rail strong { display: block; font-family: Fraunces, Georgia, serif; font-size: 26px; font-weight: 520; line-height: 1.15; }
.dossier-rail em { display: inline-block; margin-top: 12px; padding: 4px 8px; border: 1px solid #ffffff2e; border-radius: 999px; color: #f0d7c4; font-style: normal; font-size: 12px; }
.dossier-rail nav { display: grid; gap: 4px; margin-top: 22px; }
.dossier-rail a { display: flex; gap: 10px; padding: 8px 0; color: #efe7dc; text-decoration: none; font-size: 14px; }
.dossier-rail a span { color: #d7a07a; font-family: Fraunces, Georgia, serif; }
.dossier-rail small { display: block; margin-top: 16px; color: #f0b4a2; line-height: 1.45; }
.dossier-sheet { display: grid; gap: 0; padding: 8px 8px 28px; background: linear-gradient(180deg, #fffdf8 0%, #f7f1e7 100%); border: 1px solid #e6dccb; border-radius: 22px; box-shadow: 0 18px 40px rgba(48, 32, 18, .06); }
.dossier-sheet section { padding: 26px 28px 8px; }
.dossier-sheet section + section { border-top: 1px solid #eadfce; }
.dossier-sheet header { display: flex; gap: 14px; margin-bottom: 18px; }
.dossier-sheet header > span { font-family: Fraunces, Georgia, serif; font-size: 28px; color: #9a4e32; line-height: 1; }
.dossier-sheet h2 { margin: 0; font-family: Fraunces, Georgia, serif; font-size: 28px; font-weight: 520; letter-spacing: -.03em; }
.dossier-sheet header p { margin: 4px 0 0; color: #7d7368; font-size: 13px; }
.dossier-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
.dossier-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.dossier-grid :deep(.el-form-item__label) { color: #5e564c; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.dossier-grid :deep(.el-input__wrapper), .dossier-grid :deep(.el-input-number), .dossier-grid :deep(.el-date-editor) { width: 100%; }
.dossier-toggles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 4px 0 18px; }
.dossier-toggles label, .policy-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 58px; padding: 12px 14px; background: #fff; border: 1px solid #eadfce; border-radius: 14px; }
.dossier-toggles span, .policy-row strong { color: #2b241d; font-size: 14px; }
.policy-row { margin-bottom: 10px; }
.policy-row div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.policy-row small { color: #8a7d70; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 980px) { .dossier, .dossier-grid, .dossier-grid--three, .dossier-toggles { grid-template-columns: 1fr; } .dossier-rail { position: static; } }
.section-tabs :deep(.el-tabs__header) { margin-bottom: 22px; }.section-tabs :deep(.el-tabs__nav-wrap::after) { height: 1px; background: var(--line); }.section-tabs :deep(.el-tabs__item) { height: 54px; padding: 0 22px; font-weight: 600; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin: 2px 0 20px; }.section-heading h2 { margin: 0 0 4px; font-size: 18px; }.section-heading p { margin: 0; color: var(--muted); font-size: 12px; }.section-heading.compact { align-items: center; margin: 0; padding: 18px 20px 14px; border-bottom: 1px solid var(--line); }.section-heading.compact h2 { font-size: 16px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }.form-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }.span-2 { grid-column: span 2; }.form-grid :deep(.el-form-item) { margin-bottom: 17px; }.form-grid :deep(.el-form-item__label) { padding-bottom: 6px; color: #4e596d; font-size: 12px; font-weight: 600; }.form-grid :deep(.el-input-number), .form-grid :deep(.el-select), .form-grid :deep(.el-time-select) { width: 100%; }
.field-suffix { margin-left: 8px; color: var(--muted); font-size: 12px; }
.compliance-grid, .toggle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding-top: 4px; }.compliance-item, .toggle-item { display: flex; align-items: center; gap: 12px; padding: 13px 14px; border: 1px solid var(--line); border-radius: 10px; background: #fbfcfe; }.compliance-item span, .toggle-item span { display: flex; flex-direction: column; gap: 2px; }.compliance-item strong, .toggle-item strong { font-size: 13px; }.compliance-item small, .toggle-item small { color: var(--muted); font-size: 11px; }.toggle-item { justify-content: space-between; }.toggle-item > span { order: 0; }.toggle-item :deep(.el-switch) { order: 1; }
.gender-capacity { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }.gender-capacity > div { display: flex; flex-direction: column; padding: 16px; background: #f7f8fb; border-radius: 11px; }.gender-capacity span { color: var(--muted); font-size: 12px; }.gender-capacity strong { margin: 4px 0; font-size: 24px; }.gender-capacity small { color: #929aae; }
.coverage-heading { align-items: center; }.coverage-legend { display: flex; gap: 13px; }.coverage-legend span { display: flex; align-items: center; gap: 5px; color: var(--muted); font-size: 11px; }.coverage-legend i { width: 8px; height: 8px; border-radius: 50%; }.coverage-legend .standard { background: #4f7bd9; }.coverage-legend .extended { background: #d8892d; }.coverage-legend .restricted { background: #c04f5e; }
.coverage-summary { display: grid; grid-template-columns: repeat(4, 1fr); margin-bottom: 16px; padding: 15px 0; border: 1px solid #e4e5f1; border-radius: 11px; background: #fbfbfe; }.coverage-summary div { display: flex; align-items: baseline; justify-content: center; gap: 7px; border-right: 1px solid #e5e7ef; }.coverage-summary div:last-child { border-right: 0; }.coverage-summary strong { font-size: 20px; }.coverage-summary span { color: var(--muted); font-size: 11px; }
.zone-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }.zone-card { appearance: none; padding: 13px 14px; text-align: left; color: var(--ink); background: #fff; border: 1px solid #e3e6ee; border-radius: 11px; cursor: pointer; transition: .18s ease; }.zone-card:hover { transform: translateY(-1px); border-color: #aaa6e8; box-shadow: 0 5px 14px rgba(50, 53, 94, .06); }.zone-card.selected { border-color: #817be1; background: #f8f7ff; box-shadow: inset 0 0 0 1px #817be1; }.zone-top { display: flex; align-items: center; justify-content: space-between; }.zone-top > span { padding: 3px 7px; color: #4e63a8; background: #edf1fc; border-radius: 6px; font-size: 10px; font-weight: 700; }.zone-card--extended .zone-top > span { color: #a96221; background: #fff0dc; }.zone-card--restricted .zone-top > span { color: #a23d4b; background: #fdecef; }.zone-card > strong { display: block; margin-top: 7px; font-size: 12px; }.zone-card p { margin: 6px 0 3px; color: var(--muted); font-size: 10px; }.zone-card small { color: #9ba3b3; font-size: 10px; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 17px 18px; border-bottom: 1px solid var(--line); }.table-search { display: flex; gap: 10px; }.table-search .el-input { width: 290px; }.table-search .el-select { width: 150px; }.result-count { color: var(--muted); font-size: 12px; }.data-table { --el-table-header-bg-color: #f8f9fc; --el-table-row-hover-bg-color: #fafaff; }.data-table :deep(th.el-table__cell) { height: 42px; color: #6e7789; font-size: 11px; font-weight: 700; }.data-table :deep(td.el-table__cell) { padding: 13px 0; border-bottom-color: #eef0f5; }.person-cell, .service-cell { display: flex; align-items: center; gap: 10px; }.person-cell > span, .service-cell > span:last-child, .muted-stack, .order-id { display: flex; flex-direction: column; gap: 3px; }.person-cell strong, .service-cell strong, .order-id strong { font-size: 12px; }.person-cell small, .service-cell small, .muted-stack small, .order-id small { color: var(--muted); font-size: 10px; }.tag-list, .zone-list { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }.zone-list span, .zone-list em { padding: 3px 6px; color: #586375; background: #f0f2f6; border-radius: 5px; font-size: 10px; font-style: normal; }.status-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; }.status-pill i { width: 7px; height: 7px; border-radius: 50%; }.status-pill--available i { background: #2da77b; box-shadow: 0 0 0 3px #dff5ed; }.status-pill--busy i { background: #5378d3; box-shadow: 0 0 0 3px #e5eafd; }.status-pill--leave i { background: #a5acb9; box-shadow: 0 0 0 3px #eceef2; }
.schedule-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding: 14px 16px; background: #fff; border: 1px solid var(--line); border-radius: 13px; }.week-navigation, .schedule-filters { display: flex; align-items: center; gap: 10px; }.week-navigation > div { display: flex; flex-direction: column; min-width: 210px; text-align: center; }.week-navigation strong { font-size: 13px; }.week-navigation span { margin-top: 2px; color: var(--muted); font-size: 10px; }.schedule-filters .el-select { width: 150px; }
.mini-metric { display: flex; flex-direction: column; padding: 15px 17px; background: #fff; border: 1px solid var(--line); border-radius: 12px; }.mini-metric strong { margin: 5px 0 2px; font-size: 22px; }.mini-metric small { color: var(--muted); font-size: 10px; }.positive { color: #218367 !important; }.warning-text { color: #bb6d20 !important; }
.schedule-card { overflow-x: auto; }.schedule-card :deep(.el-card__body) { min-width: 1180px; }.schedule-grid { display: grid; grid-template-columns: 190px repeat(7, minmax(125px, 1fr)); }.schedule-grid--header { border-bottom: 1px solid var(--line); background: #fafbfc; }.staff-column-title, .day-head { display: flex; flex-direction: column; justify-content: center; min-height: 68px; padding: 10px 13px; border-right: 1px solid var(--line); }.staff-column-title { color: var(--muted); font-size: 11px; font-weight: 700; }.day-head { align-items: center; }.day-head span, .day-head small { color: var(--muted); font-size: 10px; }.day-head strong { margin: 2px 0; font-size: 14px; }.day-head.today { color: #5c55d5; background: #f1efff; }.schedule-row { min-height: 96px; border-bottom: 1px solid var(--line); }.schedule-person { display: flex; align-items: center; gap: 9px; padding: 13px; border-right: 1px solid var(--line); }.schedule-person span { display: flex; flex-direction: column; }.schedule-person strong { font-size: 12px; }.schedule-person small { margin-top: 3px; color: var(--muted); font-size: 10px; }.shift-cell { display: flex; flex-direction: column; justify-content: center; min-width: 0; margin: 7px 5px; padding: 9px; text-align: left; color: #455064; border: 1px solid transparent; border-radius: 8px; cursor: pointer; }.shift-cell strong { margin-bottom: 3px; font-size: 11px; }.shift-cell span, .shift-cell small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9px; }.shift-cell small { margin-top: 3px; opacity: .72; }.shift-cell.standard { color: #285f72; background: #e9f7fa; border-color: #c6e9ed; }.shift-cell.busy { color: #5647a5; background: #f0edff; border-color: #d9d2ff; }.shift-cell.leave { color: #7a6570; background: #f6eff2; border-color: #eadce2; }.shift-cell.open { align-items: center; color: #9ba3b0; background: #fff; border-color: #dfe3e9; border-style: dashed; }.add-shift { font-size: 18px !important; }.schedule-legend { display: flex; gap: 20px; padding: 13px 18px; }.schedule-legend span { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 10px; }.schedule-legend i { width: 11px; height: 11px; border-radius: 3px; }.shift-standard { background: #c6e9ed; }.shift-busy { background: #d9d2ff; }.shift-leave { background: #eadce2; }.shift-open { border: 1px dashed #c8cdd6; }
.service-icon { display: grid; place-items: center; flex: 0 0 auto; width: 32px; height: 32px; color: #5853ba; background: #eeedff; border-radius: 9px; font-size: 10px; font-weight: 800; }.money-value { color: #263348; font-size: 12px; }.order-status { display: inline-flex; padding: 5px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; }.order-status--pending { color: #9d5f20; background: #fff0da; }.order-status--confirmed { color: #425eb5; background: #e9edff; }.order-status--in_progress { color: #176f69; background: #def5f0; }.order-status--completed { color: #4e5a69; background: #edf0f3; }
.pricing-health { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding: 15px 18px; background: #ecf8f4; border: 1px solid #cceade; border-radius: 13px; }.pricing-health > div { display: flex; align-items: center; gap: 12px; }.health-icon { display: grid; place-items: center; width: 38px; height: 38px; color: #218365; background: #d4f0e6; border-radius: 50%; }.pricing-health strong { font-size: 13px; }.pricing-health p { margin: 3px 0 0; color: #5f7b72; font-size: 11px; }
.pricing-card { margin-bottom: 14px; }.pricing-toolbar { display: flex; align-items: flex-start; justify-content: space-between; padding: 0 18px; border-bottom: 1px solid var(--line); }.pricing-actions { display: flex; gap: 8px; padding-top: 13px; }.quote-service { display: flex; align-items: center; gap: 10px; }.quote-service > span { padding: 4px 6px; color: #7169c8; background: #f0efff; border-radius: 5px; font-size: 9px; font-weight: 700; }.quote-service > div { display: flex; flex-direction: column; gap: 3px; }.quote-service strong { font-size: 12px; }.quote-service small { color: var(--muted); font-size: 10px; }.price-value { color: #27334a; font-size: 13px; }.pricing-table :deep(.el-input-number) { width: 128px; }
.pricing-filter { display: flex; align-items: center; gap: 10px; min-height: 58px; }.pricing-filter > span { font-size: 12px; font-weight: 700; }.pricing-filter .el-select { width: 170px; }.pricing-filter small { color: var(--muted); font-size: 10px; }
.pricing-bottom-grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: 14px; }.rule-list > div { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 14px 19px; border-bottom: 1px solid var(--line); }.rule-list > div:last-child { border-bottom: 0; }.rule-badge { display: inline-flex; justify-content: center; padding: 5px 7px; border-radius: 6px; font-size: 9px; font-weight: 700; }.rule-badge--standard { color: #4269b5; background: #edf2fd; }.rule-badge--extended { color: #a86723; background: #fff0dc; }.rule-badge--restricted { color: #a94250; background: #fdecef; }.rule-list > div > span:nth-child(2) { display: flex; flex-direction: column; gap: 3px; }.rule-list strong { font-size: 12px; }.rule-list small { color: var(--muted); font-size: 10px; }.rule-values { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }.rule-values b { font-size: 11px; }.rule-values em { color: var(--muted); font-size: 10px; font-style: normal; }.terms-list { display: grid; grid-template-columns: repeat(2, 1fr); margin: 0; padding: 11px 20px 18px; }.terms-list div { padding: 10px 0; border-bottom: 1px solid #eff1f5; }.terms-list div:nth-last-child(-n + 2) { border-bottom: 0; }.terms-list dt { color: var(--muted); font-size: 10px; }.terms-list dd { margin: 4px 0 0; font-size: 12px; font-weight: 700; }
.drawer-order-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 0 0 19px; border-bottom: 1px solid var(--line); }.drawer-order-head > div > span { color: #6e67c9; font-size: 11px; font-weight: 700; }.drawer-order-head h2 { margin: 6px 0 3px; font-size: 19px; }.drawer-order-head p { margin: 0; color: var(--muted); font-size: 12px; }.drawer-section { padding: 20px 0; border-bottom: 1px solid var(--line); }.drawer-section h3 { margin: 0 0 13px; font-size: 13px; }.detail-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 0; }.detail-list dt { color: var(--muted); font-size: 10px; }.detail-list dd { margin: 4px 0 0; font-size: 12px; font-weight: 600; }.address-panel { display: flex; gap: 11px; padding: 13px; background: #f7f8fb; border-radius: 10px; }.address-panel > svg { flex: 0 0 auto; width: 19px; color: #625bd0; }.address-panel div { display: flex; flex-direction: column; gap: 4px; }.address-panel strong { font-size: 12px; }.address-panel p { margin: 0; color: #677186; font-size: 11px; }.address-panel span { color: #969dac; font-size: 10px; }
.supplier-name { display: block; margin-top: 5px; font-size: 15px; }
.overview-grid { display: grid; grid-template-columns: 1.55fr .85fr; gap: 14px; margin-bottom: 14px; }
.overview-grid--bottom { grid-template-columns: 1.1fr .9fr; }
.earnings-card :deep(.el-select) { width: 118px; }
.earnings-chart { display: flex; align-items: flex-end; justify-content: space-around; height: 270px; padding: 38px 26px 20px; }
.bar-item { display: flex; align-items: center; flex-direction: column; justify-content: flex-end; width: 11%; height: 100%; }
.bar-item i { display: block; width: 100%; max-width: 42px; min-height: 8px; background: linear-gradient(180deg, #756ee8, #5a54c9); border-radius: 8px 8px 3px 3px; box-shadow: 0 7px 16px rgba(91, 85, 214, .15); }
.bar-item small { margin-top: 9px; color: var(--muted); font-size: 10px; }.bar-value { margin-bottom: 5px; color: #4f596d; font-size: 10px; }
.capacity-list { display: flex; flex-direction: column; gap: 20px; padding: 24px 22px; }.capacity-list > div { display: grid; grid-template-columns: 1fr auto; gap: 8px 14px; align-items: center; }.capacity-list span { color: var(--muted); font-size: 11px; }.capacity-list strong { font-size: 12px; }.capacity-list :deep(.el-progress) { grid-column: 1 / -1; }
.transaction-list > div { display: grid; grid-template-columns: 36px 1fr auto; align-items: center; gap: 11px; padding: 13px 19px; border-bottom: 1px solid var(--line); }.transaction-list > div:last-child { border-bottom: 0; }.transaction-icon { display: grid; place-items: center; width: 34px; height: 34px; color: #298267; background: #e7f6f0; border-radius: 9px; }.transaction-icon :deep(svg) { width: 16px; }.transaction-list > div > span:nth-child(2), .transaction-amount { display: flex; flex-direction: column; gap: 3px; }.transaction-list strong { font-size: 12px; }.transaction-list small { color: var(--muted); font-size: 10px; }.transaction-amount { text-align: right; }.transaction-amount strong { color: #263348; }
.action-list button { display: grid; grid-template-columns: 32px 1fr 18px; align-items: center; width: 100%; gap: 11px; padding: 13px 18px; color: var(--ink); text-align: left; background: #fff; border: 0; border-bottom: 1px solid var(--line); cursor: pointer; }.action-list button:last-child { border-bottom: 0; }.action-list button:hover { background: #fafaff; }.action-list button > span:nth-child(2) { display: flex; flex-direction: column; gap: 3px; }.action-list button strong { font-size: 12px; }.action-list button small { color: var(--muted); font-size: 10px; }.action-list button > svg { width: 14px; color: #a0a6b3; }.action-badge { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; font-size: 11px; font-weight: 700; }.action-badge.amber { color: #aa681f; background: #fff0dc; }.action-badge.purple { color: #5c55c7; background: #eeedff; }.action-badge.blue { color: #3971b7; background: #e9f2ff; }
.review-banner { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 14px 16px; background: #fff8eb; border: 1px solid #f1ddb7; border-radius: 11px; }.review-banner > span:first-child { display: grid; place-items: center; width: 34px; height: 34px; color: #a96c25; background: #ffedcf; border-radius: 9px; }.review-banner > span svg { width: 17px; }.review-banner > div { display: flex; flex: 1; flex-direction: column; gap: 3px; }.review-banner strong { font-size: 12px; }.review-banner p { margin: 0; color: #856d50; font-size: 10px; }.area-banner, .schedule-review { margin-bottom: 14px; }.schedule-review { background: #f7f6ff; border-color: #dfdcfb; }.schedule-review > span:first-child { color: #5b55c7; background: #eae8ff; }.schedule-review p { color: #73708d; }
.document-cell { display: flex; align-items: center; gap: 10px; }.document-cell > svg { width: 22px; color: #625bd0; }.document-cell > span { display: flex; flex-direction: column; gap: 3px; }.document-cell strong { font-size: 12px; }.document-cell small { color: var(--muted); font-size: 10px; }
.coverage-type { display: inline-flex; padding: 5px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; }.coverage-type--standard { color: #4269b5; background: #edf2fd; }.coverage-type--extended { color: #a86723; background: #fff0dc; }.coverage-type--restricted { color: #a94250; background: #fdecef; }
.health-icon.pending { color: #ac6a21; background: #ffe9c8; }.pricing-health:has(.health-icon.pending) { background: #fff8eb; border-color: #f0dbb5; }.pricing-health:has(.health-icon.pending) p { color: #806e57; }
.requested-price { color: #a66722; font-size: 13px; }.muted-text { color: #a2a9b7; }.negative { color: #b84f5a; font-weight: 600; }
.privacy-note { margin-top: 14px; padding: 11px 13px; color: #657083; background: #f3f5f8; border-radius: 9px; font-size: 10px; line-height: 1.55; }
.dialog-tip { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; padding: 11px 13px; color: #806a4d; background: #fff7e9; border-radius: 9px; font-size: 11px; }.dialog-tip > svg { width: 17px; flex: 0 0 auto; }.conflict-alert { display: flex; gap: 10px; padding: 12px; color: #a84650; background: #fdeff1; border: 1px solid #f0cfd4; border-radius: 9px; }.conflict-alert > svg { width: 18px; flex: 0 0 auto; }.conflict-alert span { display: flex; flex-direction: column; gap: 3px; }.conflict-alert strong { font-size: 12px; }.conflict-alert small { font-size: 10px; }
.settlement-tabs :deep(.el-tabs__header) { margin: 0; padding: 0 18px; }.settlement-tabs :deep(.el-tabs__content) { overflow: visible; }.settlement-note { display: flex; align-items: center; gap: 10px; margin: 14px 18px; padding: 12px 14px; color: #246e58; background: #eaf7f2; border-radius: 9px; }.settlement-note > svg { width: 20px; }.settlement-note span { display: flex; flex-direction: column; gap: 3px; }.settlement-note strong { font-size: 11px; }.settlement-note small { color: #628176; font-size: 10px; }
.linked-banner { background: #eef6ff; border-color: #d4e5f7; }.linked-banner > span:first-child { color: #3c74b7; background: #dcecff; }.linked-banner p { color: #64788f; }.area-link-tip { color: #526e8c; background: #eef6ff; }.option-id { float: right; margin-left: 18px; color: #9ba3b3; }
.area-service-status, .area-review-status { display: flex; align-items: flex-start; flex-direction: column; gap: 5px; }.area-service-status small, .area-review-status small { color: var(--muted); font-size: 9px; }.pending-copy { color: #a66b24 !important; }.rejected-copy { color: #b84f5a !important; }
@media (max-width: 1200px) { .supplier-facts { gap: 16px; }.metric-grid { grid-template-columns: repeat(2, 1fr); }.zone-grid { grid-template-columns: repeat(2, 1fr); }.form-grid--three { grid-template-columns: repeat(2, 1fr); }.overview-grid { grid-template-columns: 1fr; } }
@media (max-width: 820px) { .supplier-demo { padding: 14px; }.page-header, .supplier-strip, .table-toolbar, .schedule-toolbar, .pricing-toolbar { align-items: flex-start; flex-direction: column; }.page-header { gap: 12px; }.page-actions { flex-wrap: wrap; }.supplier-strip { gap: 14px; }.supplier-facts { flex-wrap: wrap; gap: 12px 20px; }.metric-grid { grid-template-columns: 1fr; }.overview-grid--bottom, .pricing-bottom-grid { grid-template-columns: 1fr; }.table-search { flex-wrap: wrap; }.table-search .el-input, .table-search .el-select { width: 100%; }.form-grid, .form-grid--three { grid-template-columns: 1fr; }.span-2 { grid-column: span 1; }.pricing-actions { padding-bottom: 13px; }.section-tabs :deep(.el-tabs__item) { padding: 0 10px; }.compliance-grid, .toggle-grid, .gender-capacity { grid-template-columns: 1fr; } }
</style>
