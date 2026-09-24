<template>
  <div class="supplier-demo">
    <header class="page-header">
      <div>
        <div class="eyebrow">
          <span class="demo-dot"></span>
          Demo · Excel mapped
        </div>
        <h1>{{ meta.title }}</h1>
        <p>{{ meta.description }}</p>
      </div>
      <div class="page-actions">
        <el-button v-if="section === 'orders'" :icon="Download" @click="showToast('订单清单已生成 Demo 导出任务')">
          导出订单
        </el-button>
        <el-button v-if="section === 'profile'" @click="showToast('已保存为草稿')">保存草稿</el-button>
        <el-button type="primary" :icon="section === 'staff' ? Plus : Check" @click="handlePrimaryAction">
          {{ meta.primaryAction }}
        </el-button>
      </div>
    </header>

    <section class="supplier-strip">
      <div class="supplier-identity">
        <div class="supplier-logo">PC</div>
        <div>
          <div class="supplier-label">当前供应商 / Current supplier</div>
          <el-select v-model="supplierId" class="supplier-select">
            <el-option label="PrimeCare Home Services LLC" value="SUP-0001" />
            <el-option label="BluePalm Technical Services" value="SUP-0002" />
            <el-option label="Oasis Wellness at Home" value="SUP-0003" />
          </el-select>
        </div>
      </div>
      <div class="supplier-facts">
        <div><span>Supplier ID</span><strong>{{ supplierId }}</strong></div>
        <div><span>入驻状态</span><el-tag type="warning" effect="light">资料复核中</el-tag></div>
        <div><span>资料完整度</span><strong class="progress-value">82%</strong></div>
        <div class="compact-progress"><i style="width: 82%"></i></div>
      </div>
    </section>

    <template v-if="section === 'profile'">
      <div class="metric-grid metric-grid--profile">
        <article class="metric-card">
          <span class="metric-icon metric-icon--blue"><OfficeBuilding /></span>
          <div><small>已完成字段</small><strong>31 / 38</strong><p>Company & capacity</p></div>
        </article>
        <article class="metric-card">
          <span class="metric-icon metric-icon--green"><CircleCheck /></span>
          <div><small>证件状态</small><strong>3 已验证</strong><p>1 item expires soon</p></div>
        </article>
        <article class="metric-card">
          <span class="metric-icon metric-icon--purple"><Location /></span>
          <div><small>已选服务区域</small><strong>{{ coverageTotal }} 社区</strong><p>{{ selectedZones.length }} of 15 zones</p></div>
        </article>
        <article class="metric-card">
          <span class="metric-icon metric-icon--amber"><Tickets /></span>
          <div><small>服务与报价</small><strong>8 类服务</strong><p>101 price items</p></div>
        </article>
      </div>

      <el-card class="surface-card onboarding-card" shadow="never">
        <el-tabs v-model="profileTab" class="section-tabs">
          <el-tab-pane label="公司与资质" name="company">
            <div class="section-heading">
              <div><h2>公司与资质</h2><p>Company information & compliance documents</p></div>
              <el-tag type="success" effect="plain">10 / 12 完成</el-tag>
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
            <div class="compliance-grid">
              <label v-for="item in complianceItems" :key="item.label" class="compliance-item">
                <el-switch v-model="item.enabled" />
                <span><strong>{{ item.label }}</strong><small>{{ item.hint }}</small></span>
              </label>
            </div>
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

          <el-tab-pane label="服务区域" name="coverage">
            <div class="section-heading coverage-heading">
              <div><h2>Dubai 服务区域</h2><p>先选 Zone，再按社区排除；系统保存 Area ID，不保存自由文本名称。</p></div>
              <div class="coverage-legend"><span><i class="standard"></i>Standard</span><span><i class="extended"></i>Extended</span><span><i class="restricted"></i>Restricted</span></div>
            </div>
            <div class="coverage-summary">
              <div><strong>{{ coverageTotal }}</strong><span>已选社区</span></div>
              <div><strong>{{ selectedZones.length }}</strong><span>已选分区</span></div>
              <div><strong>AED {{ travelFeeTotal }}</strong><span>最高附加交通费</span></div>
              <div><strong>2–4h</strong><span>最低预订时长</span></div>
            </div>
            <div class="zone-grid">
              <button
                v-for="zone in zones"
                :key="zone.code"
                type="button"
                class="zone-card"
                :class="[`zone-card--${zone.type.toLowerCase()}`, { selected: selectedZones.includes(zone.code) }]"
                @click="toggleZone(zone.code)"
              >
                <div class="zone-top"><span>{{ zone.code }}</span><el-checkbox :model-value="selectedZones.includes(zone.code)" @click.stop @change="toggleZone(zone.code)" /></div>
                <strong>{{ zone.name }}</strong>
                <p>{{ zone.areas }} communities · min {{ zone.min }}h</p>
                <small>{{ zone.fee ? `+ AED ${zone.fee} travel` : 'No travel fee' }}</small>
              </button>
            </div>
          </el-tab-pane>
        </el-tabs>
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
          <el-table-column label="技能 / Services" min-width="240">
            <template #default="{ row }"><div class="tag-list"><el-tag v-for="skill in row.skills" :key="skill" size="small" effect="plain">{{ skill }}</el-tag></div></template>
          </el-table-column>
          <el-table-column label="联系方式" min-width="160"><template #default="{ row }"><div class="muted-stack"><span>{{ row.mobile }}</span><small>{{ row.language }}</small></div></template></el-table-column>
          <el-table-column label="覆盖区域" min-width="150"><template #default="{ row }"><div class="zone-list"><span v-for="zone in row.zones" :key="zone">{{ zone }}</span></div></template></el-table-column>
          <el-table-column label="证件" width="120"><template #default="{ row }"><el-tag :type="row.docs === 'Verified' ? 'success' : 'warning'" effect="light">{{ row.docs === 'Verified' ? '已验证' : '即将到期' }}</el-tag></template></el-table-column>
          <el-table-column label="今日状态" width="120"><template #default="{ row }"><span class="status-pill" :class="`status-pill--${row.status}`"><i></i>{{ staffStatusLabel(row.status) }}</span></template></el-table-column>
          <el-table-column label="操作" width="96" align="right"><template #default="{ row }"><el-button link type="primary" @click="showToast(`打开 ${row.name} 的人员档案`)">查看</el-button></template></el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else-if="section === 'schedule'">
      <div class="schedule-toolbar">
        <div class="week-navigation">
          <el-button circle :icon="ArrowLeft" @click="showToast('已切换到上一周')" />
          <div><strong>2026年9月21日 – 9月27日</strong><span>Asia/Dubai · GST</span></div>
          <el-button circle :icon="ArrowRight" @click="showToast('已切换到下一周')" />
          <el-button @click="showToast('已返回本周')">本周</el-button>
        </div>
        <div class="schedule-filters"><el-select v-model="scheduleSkill"><el-option label="全部服务" value="all" /><el-option label="Cleaning" value="Cleaning" /><el-option label="AC Service" value="AC Service" /></el-select><el-button :icon="Upload" @click="showToast('排班模板导入入口已打开')">导入排班</el-button></div>
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
          <button v-for="day in weekDays" :key="day.key" type="button" class="shift-cell" :class="shiftFor(person.id, day.key).type" @click="showToast(`${person.name} · ${day.date} 排班详情`)">
            <template v-if="shiftFor(person.id, day.key).label"><strong>{{ shiftFor(person.id, day.key).label }}</strong><span>{{ shiftFor(person.id, day.key).time }}</span><small>{{ shiftFor(person.id, day.key).orders }}</small></template>
            <template v-else><span class="add-shift">+</span><small>添加班次</small></template>
          </button>
        </div>
        <div class="schedule-legend"><span><i class="shift-standard"></i>正常班次</span><span><i class="shift-busy"></i>订单较满</span><span><i class="shift-leave"></i>休假 / 不可用</span><span><i class="shift-open"></i>未排班</span></div>
      </el-card>
    </template>

    <template v-else-if="section === 'orders'">
      <div class="metric-grid">
        <article class="metric-card"><span class="metric-icon metric-icon--blue"><Document /></span><div><small>进行中订单</small><strong>18</strong><p>6 due today</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--green"><CircleCheck /></span><div><small>本月完成</small><strong>126</strong><p>96.8% on time</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--amber"><Clock /></span><div><small>待供应商确认</small><strong>4</strong><p>Oldest: 18 min</p></div></article>
        <article class="metric-card"><span class="metric-icon metric-icon--purple"><Money /></span><div><small>本月供应商成本</small><strong>AED 38.4k</strong><p>Locked cost snapshots</p></div></article>
      </div>
      <el-card class="surface-card" shadow="never">
        <div class="table-toolbar">
          <div class="table-search"><el-input v-model="orderKeyword" :prefix-icon="Search" placeholder="订单号、服务或客户区域" clearable /><el-select v-model="orderStatus" placeholder="全部状态" clearable><el-option label="待确认" value="pending" /><el-option label="已确认" value="confirmed" /><el-option label="服务中" value="in_progress" /><el-option label="已完成" value="completed" /></el-select></div>
          <div class="result-count">{{ filteredOrders.length }} 个订单</div>
        </div>
        <el-table :data="filteredOrders" class="data-table" row-key="orderNo">
          <el-table-column label="订单" min-width="160"><template #default="{ row }"><div class="order-id"><strong>{{ row.orderNo }}</strong><small>{{ row.created }}</small></div></template></el-table-column>
          <el-table-column label="服务" min-width="220"><template #default="{ row }"><div class="service-cell"><span class="service-icon">{{ row.serviceIcon }}</span><span><strong>{{ row.service }}</strong><small>{{ row.variant }}</small></span></div></template></el-table-column>
          <el-table-column label="服务地址" min-width="230"><template #default="{ row }"><div class="muted-stack"><span>{{ row.area }}</span><small>{{ row.zone }} · {{ row.areaId }}</small></div></template></el-table-column>
          <el-table-column label="服务时间" min-width="170"><template #default="{ row }"><div class="muted-stack"><span>{{ row.date }}</span><small>{{ row.time }}</small></div></template></el-table-column>
          <el-table-column label="执行人员" min-width="150"><template #default="{ row }">{{ row.staff }}</template></el-table-column>
          <el-table-column label="成本快照" min-width="130" align="right"><template #default="{ row }"><strong class="money-value">AED {{ row.cost }}</strong></template></el-table-column>
          <el-table-column label="状态" width="120"><template #default="{ row }"><span class="order-status" :class="`order-status--${row.status}`">{{ orderStatusLabel(row.status) }}</span></template></el-table-column>
          <el-table-column label="" width="80" align="right"><template #default="{ row }"><el-button link type="primary" @click="openOrder(row)">详情</el-button></template></el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else>
      <section class="pricing-health">
        <div><span class="health-icon"><CircleCheck /></span><div><strong>报价目录状态良好</strong><p>101 个报价项中 96 个完整，3 个缺少最低订单，2 个将在 30 天内到期。</p></div></div>
        <el-button type="success" plain @click="showToast('已打开报价完整性检查')">查看检查结果</el-button>
      </section>
      <el-card class="surface-card pricing-card" shadow="never">
        <div class="pricing-toolbar">
          <el-tabs v-model="quoteCategory" class="pricing-tabs">
            <el-tab-pane v-for="category in quoteCategories" :key="category.value" :name="category.value"><template #label><span>{{ category.label }}<b>{{ category.count }}</b></span></template></el-tab-pane>
          </el-tabs>
          <div class="pricing-actions"><el-button :icon="Upload" @click="showToast('已打开 Excel 报价导入入口')">导入报价</el-button><el-button :type="editingPrices ? 'success' : 'primary'" :icon="EditPen" @click="togglePriceEdit">{{ editingPrices ? '完成编辑' : '批量编辑' }}</el-button></div>
        </div>
        <el-table :data="filteredQuotes" class="data-table pricing-table" row-key="id">
          <el-table-column label="服务 / Service" min-width="250"><template #default="{ row }"><div class="quote-service"><span>{{ row.code }}</span><div><strong>{{ row.service }}</strong><small>{{ row.scope }}</small></div></div></template></el-table-column>
          <el-table-column label="计价单位 / Unit" min-width="150" prop="unit" />
          <el-table-column label="供应商 NET B2B 价" min-width="170"><template #default="{ row }"><el-input-number v-if="editingPrices" v-model="row.price" :min="0" :precision="0" controls-position="right" /><strong v-else class="price-value">AED {{ row.price }}</strong></template></el-table-column>
          <el-table-column label="最低订单" min-width="130"><template #default="{ row }">{{ row.minimum }}</template></el-table-column>
          <el-table-column label="VAT" width="100"><template #default="{ row }"><el-tag size="small" :type="row.vat === 'Included' ? 'success' : 'info'" effect="plain">{{ row.vat }}</el-tag></template></el-table-column>
          <el-table-column label="适用区域" min-width="180"><template #default="{ row }"><div class="zone-list"><span v-for="zone in row.zones" :key="zone">{{ zone }}</span><em v-if="row.moreZones">+{{ row.moreZones }}</em></div></template></el-table-column>
          <el-table-column label="状态" width="105"><template #default="{ row }"><el-switch v-model="row.active" inline-prompt active-text="启" inactive-text="停" /></template></el-table-column>
        </el-table>
      </el-card>
      <div class="pricing-bottom-grid">
        <el-card class="surface-card" shadow="never">
          <div class="section-heading compact"><div><h2>区域价格规则</h2><p>Zone pricing & dispatch economics</p></div><el-button link type="primary" @click="showToast('已打开区域规则编辑')">编辑规则</el-button></div>
          <div class="rule-list">
            <div v-for="rule in priceRules" :key="rule.name"><span class="rule-badge" :class="`rule-badge--${rule.type}`">{{ rule.code }}</span><span><strong>{{ rule.name }}</strong><small>{{ rule.zones }}</small></span><span class="rule-values"><b>{{ rule.min }}h</b><em>{{ rule.fee }}</em></span></div>
          </div>
        </el-card>
        <el-card class="surface-card" shadow="never">
          <div class="section-heading compact"><div><h2>商务条款</h2><p>Commercial terms from onboarding form</p></div><el-button link type="primary" @click="showToast('已打开商务条款编辑')">编辑条款</el-button></div>
          <dl class="terms-list"><div v-for="term in commercialTerms" :key="term.label"><dt>{{ term.label }}</dt><dd>{{ term.value }}</dd></div></dl>
        </el-card>
      </div>
    </template>

    <el-dialog v-model="staffDialogVisible" title="新增供应商人员 / Add Staff" width="620px" :close-on-click-modal="false">
      <el-form label-position="top" class="form-grid">
        <el-form-item label="姓名 / Full Name"><el-input v-model="newStaff.name" placeholder="例如：Amina Noor" /></el-form-item>
        <el-form-item label="员工编号 / Staff ID"><el-input v-model="newStaff.id" /></el-form-item>
        <el-form-item label="手机号 / Mobile"><el-input v-model="newStaff.mobile" placeholder="+971" /></el-form-item>
        <el-form-item label="性别 / Gender"><el-select v-model="newStaff.gender" style="width: 100%"><el-option label="Female" value="Female" /><el-option label="Male" value="Male" /></el-select></el-form-item>
        <el-form-item label="主要技能 / Primary Skill" class="span-2"><el-select v-model="newStaff.skill" style="width: 100%"><el-option v-for="skill in staffSkills" :key="skill" :label="skill" :value="skill" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="staffDialogVisible = false">取消</el-button><el-button type="primary" @click="addStaff">保存人员</el-button></template>
    </el-dialog>

    <el-drawer v-model="orderDrawerVisible" title="供应商订单详情" size="560px">
      <template v-if="selectedOrder">
        <div class="drawer-order-head"><div><span>{{ selectedOrder.orderNo }}</span><h2>{{ selectedOrder.service }}</h2><p>{{ selectedOrder.variant }}</p></div><span class="order-status" :class="`order-status--${selectedOrder.status}`">{{ orderStatusLabel(selectedOrder.status) }}</span></div>
        <div class="drawer-section"><h3>履约信息 / Fulfilment</h3><dl class="detail-list"><div><dt>服务时间</dt><dd>{{ selectedOrder.date }} {{ selectedOrder.time }}</dd></div><div><dt>执行人员</dt><dd>{{ selectedOrder.staff }}</dd></div><div><dt>供应商成本快照</dt><dd>AED {{ selectedOrder.cost }}</dd></div><div><dt>派单层级</dt><dd>AREA · same_area=true</dd></div></dl></div>
        <div class="drawer-section"><h3>地址快照 / Address Snapshot</h3><div class="address-panel"><Location /><div><strong>{{ selectedOrder.area }}</strong><p>{{ selectedOrder.address }}</p><span>{{ selectedOrder.areaId }} · {{ selectedOrder.zone }}</span></div></div></div>
        <div class="drawer-section"><h3>订单进度 / Timeline</h3><el-timeline><el-timeline-item timestamp="09:02" type="success">订单已创建，锁定供应商成本</el-timeline-item><el-timeline-item timestamp="09:08" type="success">供应商已确认</el-timeline-item><el-timeline-item :timestamp="selectedOrder.time" type="primary">{{ selectedOrder.status === 'completed' ? '服务完成并上传凭证' : '等待服务人员到场' }}</el-timeline-item></el-timeline></div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CircleCheck,
  Clock,
  Document,
  Download,
  EditPen,
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

type Section = 'profile' | 'staff' | 'schedule' | 'orders' | 'pricing'

const props = withDefaults(defineProps<{ section?: Section }>(), { section: 'profile' })
const section = computed(() => props.section)

const pageMeta = {
  profile: { title: '供应商信息录入', description: '集中维护公司资质、服务能力、Dubai 覆盖区域与入驻确认。', primaryAction: '提交复核' },
  staff: { title: '供应商人员管理', description: '维护供应商员工、技能、证件、可派状态与服务区域。', primaryAction: '新增人员' },
  schedule: { title: '供应商日程管理', description: '按周管理班次、休假、可用工时与订单占用情况。', primaryAction: '发布排班' },
  orders: { title: '供应商订单详情', description: '查看供应商履约订单、地址快照、派单原因与成本快照。', primaryAction: '同步订单' },
  pricing: { title: '供应商服务和报价', description: '按服务目录维护 NET B2B 报价、区域规则和商务条款。', primaryAction: '发布新版本' },
} as const

const meta = computed(() => pageMeta[section.value])
const supplierId = ref('SUP-0001')
const profileTab = ref('company')

const companyForm = reactive({
  companyName: 'PrimeCare Home Services LLC',
  licenseNo: 'CN-4587219',
  licenseExpiry: '2027-02-18',
  trn: '100589237400003',
  years: 6,
  address: 'Office 304, Al Quoz Commercial Building, Dubai',
  contact: 'Omar Khalid',
  email: 'operations@primecare.ae',
  mobile: '+971 50 218 4471',
  whatsapp: '+971 50 218 4471',
})

const complianceItems = reactive([
  { label: '公众责任保险 / Public Liability', hint: '有效期至 2027-01-31', enabled: true },
  { label: '员工保险 / Employee Insurance', hint: '保单已上传', enabled: true },
  { label: '可开具税务发票 / Tax Invoice', hint: 'TRN 已验证', enabled: true },
  { label: '自有设备 / Own Equipment', hint: '设备清单待复核', enabled: true },
])

const capacityForm = reactive({ workers: 42, concurrent: 12, monthly: 380, leadTime: 3, start: '07:00', end: '22:00' })
const capacityToggles = reactive([
  { label: '周末服务', en: 'Weekend service', enabled: true },
  { label: '公共假期服务', en: 'Public holiday service', enabled: true },
  { label: '当日预约', en: 'Same-day booking', enabled: true },
  { label: '紧急服务', en: 'Emergency service', enabled: false },
])

const zones = [
  { code: 'Z01', name: 'Central Dubai', type: 'Standard', areas: 16, min: 2, fee: 0 },
  { code: 'Z02', name: 'Jumeirah & Al Wasl', type: 'Standard', areas: 19, min: 2, fee: 0 },
  { code: 'Z03', name: 'Marina, Palm & Tecom', type: 'Standard', areas: 12, min: 2, fee: 0 },
  { code: 'Z04', name: 'Barsha & Emirates Living', type: 'Standard', areas: 18, min: 2, fee: 0 },
  { code: 'Z05', name: 'JVC, Sports City & Furjan', type: 'Standard', areas: 18, min: 2, fee: 0 },
  { code: 'Z06', name: 'Hills, Ranches & SW Villas', type: 'Standard', areas: 14, min: 2, fee: 0 },
  { code: 'Z07', name: 'Dubailand Central', type: 'Standard', areas: 16, min: 2, fee: 0 },
  { code: 'Z08', name: 'Meydan, Nad Al Sheba & Silicon', type: 'Standard', areas: 14, min: 2, fee: 0 },
  { code: 'Z09', name: 'Creek, Mirdif & East Dubai', type: 'Standard', areas: 19, min: 2, fee: 0 },
  { code: 'Z10', name: 'Old Dubai & North', type: 'Standard', areas: 37, min: 2, fee: 0 },
  { code: 'E01', name: 'Dubai South & Expo', type: 'Extended', areas: 6, min: 3, fee: 20 },
  { code: 'E02', name: 'Jebel Ali & DIP', type: 'Extended', areas: 12, min: 3, fee: 15 },
  { code: 'E03', name: 'Outer Dubailand', type: 'Extended', areas: 18, min: 3, fee: 25 },
  { code: 'E04', name: 'NE Villas & Al Awir', type: 'Extended', areas: 11, min: 3, fee: 20 },
  { code: 'E05', name: 'Remote Dubai / Hatta', type: 'Restricted', areas: 5, min: 4, fee: 35 },
]
const selectedZones = ref(['Z01', 'Z02', 'Z03', 'Z04', 'Z05', 'Z08', 'Z09', 'E01'])
const coverageTotal = computed(() => zones.filter((zone) => selectedZones.value.includes(zone.code)).reduce((total, zone) => total + zone.areas, 0))
const travelFeeTotal = computed(() => Math.max(0, ...zones.filter((zone) => selectedZones.value.includes(zone.code)).map((zone) => zone.fee)))

const toggleZone = (code: string) => {
  selectedZones.value = selectedZones.value.includes(code)
    ? selectedZones.value.filter((item) => item !== code)
    : [...selectedZones.value, code]
}

type StaffStatus = 'available' | 'busy' | 'leave'
type StaffRow = { id: string; name: string; gender: string; mobile: string; language: string; skills: string[]; zones: string[]; docs: string; status: StaffStatus; color: string }

const staffSkills = ['Cleaning', 'Deep Cleaning', 'AC Service', 'Handyman', 'Painting', 'Beauty & Wellness']
const staff = ref<StaffRow[]>([
  { id: 'STF-0042', name: 'Amina Noor', gender: 'Female', mobile: '+971 52 874 2210', language: 'English · Arabic', skills: ['Cleaning', 'Deep Cleaning'], zones: ['Z01', 'Z02', 'Z08'], docs: 'Verified', status: 'available', color: '#6c63d9' },
  { id: 'STF-0038', name: 'Ravi Kumar', gender: 'Male', mobile: '+971 55 390 1184', language: 'English · Hindi', skills: ['AC Service', 'Handyman'], zones: ['Z03', 'Z04', 'Z05'], docs: 'Verified', status: 'busy', color: '#2c8b7b' },
  { id: 'STF-0034', name: 'Fatima Zahra', gender: 'Female', mobile: '+971 50 612 4473', language: 'English · Urdu', skills: ['Cleaning', 'Beauty & Wellness'], zones: ['Z01', 'Z09'], docs: 'Expiring', status: 'available', color: '#d17a45' },
  { id: 'STF-0029', name: 'Arjun Singh', gender: 'Male', mobile: '+971 56 338 9017', language: 'English · Hindi', skills: ['Painting', 'Handyman'], zones: ['Z05', 'Z06', 'Z07'], docs: 'Verified', status: 'leave', color: '#3976b8' },
  { id: 'STF-0024', name: 'Lina Santos', gender: 'Female', mobile: '+971 54 480 2216', language: 'English · Tagalog', skills: ['Deep Cleaning'], zones: ['Z02', 'Z03', 'Z04'], docs: 'Verified', status: 'busy', color: '#9b5e9d' },
  { id: 'STF-0018', name: 'Ahmed Nasser', gender: 'Male', mobile: '+971 50 991 7625', language: 'Arabic · English', skills: ['AC Service', 'Handyman'], zones: ['Z08', 'Z09', 'Z10'], docs: 'Expiring', status: 'available', color: '#3d8e55' },
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
const newStaff = reactive({ name: '', id: 'STF-0043', mobile: '', gender: 'Female', skill: 'Cleaning' })

const addStaff = () => {
  if (!newStaff.name.trim()) return ElMessage.warning('请输入人员姓名')
  staff.value.unshift({ id: newStaff.id, name: newStaff.name, gender: newStaff.gender, mobile: newStaff.mobile || '+971 —', language: 'English', skills: [newStaff.skill], zones: ['Z01'], docs: 'Expiring', status: 'available', color: '#5966b1' })
  staffDialogVisible.value = false
  ElMessage.success('Demo 人员已添加')
}

const staffStatusLabel = (status: StaffStatus) => ({ available: '可派', busy: '服务中', leave: '休假' })[status]
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

const scheduleSkill = ref('all')
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

type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed'
type OrderRow = { orderNo: string; created: string; service: string; variant: string; serviceIcon: string; area: string; zone: string; areaId: string; address: string; date: string; time: string; staff: string; cost: number; status: OrderStatus }
const orders: OrderRow[] = [
  { orderNo: 'HX-260924-0186', created: '24 Sep · 09:02', service: 'Regular Cleaning', variant: '2 cleaners × 4 hours', serviceIcon: 'CL', area: 'Downtown Dubai', zone: 'Z01', areaId: 'DXB-0001', address: 'Burj Vista Tower 1, Downtown Dubai', date: '24 Sep 2026', time: '14:00–18:00', staff: 'Amina + Lina', cost: 224, status: 'confirmed' },
  { orderNo: 'HX-260924-0179', created: '24 Sep · 08:38', service: 'Split AC Cleaning', variant: '3 indoor units', serviceIcon: 'AC', area: 'Dubai Marina', zone: 'Z03', areaId: 'DXB-0041', address: 'Marina Gate 2, Dubai Marina', date: '24 Sep 2026', time: '11:30–14:00', staff: 'Ravi Kumar', cost: 360, status: 'in_progress' },
  { orderNo: 'HX-260924-0164', created: '24 Sep · 07:55', service: 'Deep Cleaning – 2BR', variant: 'Includes supplies', serviceIcon: 'DC', area: 'Business Bay', zone: 'Z01', areaId: 'DXB-0002', address: 'Executive Bay Tower B, Business Bay', date: '24 Sep 2026', time: '16:00–21:00', staff: '待安排', cost: 420, status: 'pending' },
  { orderNo: 'HX-260923-0151', created: '23 Sep · 17:26', service: 'Handyman', variant: 'Call-out + first hour', serviceIcon: 'HM', area: 'Dubai Hills Estate', zone: 'Z06', areaId: 'DXB-0108', address: 'Sidra 2, Dubai Hills Estate', date: '24 Sep 2026', time: '10:00–12:00', staff: 'Ahmed Nasser', cost: 180, status: 'confirmed' },
  { orderNo: 'HX-260923-0138', created: '23 Sep · 14:12', service: 'Sofa Cleaning', variant: '5 seats', serviceIcon: 'SC', area: 'Jumeirah 1', zone: 'Z02', areaId: 'DXB-0017', address: 'Villa 18, Jumeirah 1', date: '23 Sep 2026', time: '17:00–19:00', staff: 'Fatima Zahra', cost: 250, status: 'completed' },
]
const orderKeyword = ref('')
const orderStatus = ref('')
const filteredOrders = computed(() => orders.filter((order) => {
  const keyword = orderKeyword.value.trim().toLowerCase()
  return (!keyword || `${order.orderNo} ${order.service} ${order.area}`.toLowerCase().includes(keyword)) && (!orderStatus.value || order.status === orderStatus.value)
}))
const orderStatusLabel = (status: OrderStatus) => ({ pending: '待确认', confirmed: '已确认', in_progress: '服务中', completed: '已完成' })[status]
const orderDrawerVisible = ref(false)
const selectedOrder = ref<OrderRow | null>(null)
const openOrder = (row: OrderRow) => { selectedOrder.value = row; orderDrawerVisible.value = true }

const quoteCategory = ref('cleaning')
const quoteCategories = [
  { label: '清洁', value: 'cleaning', count: 17 }, { label: '空调', value: 'ac', count: 10 }, { label: '维修', value: 'maintenance', count: 8 }, { label: '安装', value: 'installation', count: 15 }, { label: '油漆', value: 'painting', count: 10 }, { label: '房检', value: 'snagging', count: 5 }, { label: '虫控', value: 'pest', count: 9 }, { label: '美容康养', value: 'wellness', count: 27 },
]
const quotes = ref([
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
])
const filteredQuotes = computed(() => quotes.value.filter((quote) => quote.category === quoteCategory.value))
const editingPrices = ref(false)
const togglePriceEdit = () => { editingPrices.value = !editingPrices.value; if (!editingPrices.value) ElMessage.success('Demo 报价已保存') }
const priceRules = [
  { code: 'Z01–Z10', name: '标准区域', zones: '183 communities · Auto-dispatch', min: 2, fee: '免交通费', type: 'standard' },
  { code: 'E01–E04', name: '扩展区域', zones: '47 communities · ETA / margin check', min: 3, fee: 'AED 15–25', type: 'extended' },
  { code: 'E05', name: '受限区域', zones: '5 communities · Manual dispatch', min: 4, fee: 'AED 35', type: 'restricted' },
]
const commercialTerms = [
  { label: '最低订单金额', value: 'AED 120' }, { label: 'Call-out fee', value: 'AED 80' }, { label: '当日预约附加费', value: '+15%' }, { label: '紧急服务附加费', value: '+25%' }, { label: '付款账期', value: '30 days' }, { label: '保修期', value: '30 days' }, { label: '免费返工期', value: '7 days' }, { label: '报价有效期', value: '6 months' },
]

const showToast = (message: string) => ElMessage.success(message)
const handlePrimaryAction = () => {
  if (section.value === 'staff') { staffDialogVisible.value = true; return }
  showToast({ profile: '供应商资料已提交复核', schedule: '本周排班已发布', orders: '订单已同步', pricing: '报价版本 V3 已发布', staff: '' }[section.value])
}
</script>

<style scoped>
.supplier-demo { --ink: #172033; --muted: #768197; --line: #e8ebf2; --purple: #5b55d6; --purple-soft: #eeedff; min-width: 980px; padding: 20px; color: var(--ink); }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 18px; }
.page-header h1 { margin: 5px 0 6px; font-size: 25px; line-height: 1.25; letter-spacing: -.5px; }
.page-header p { margin: 0; color: var(--muted); font-size: 14px; }
.eyebrow { display: flex; align-items: center; gap: 7px; color: #6f67d9; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.demo-dot { width: 7px; height: 7px; border-radius: 50%; background: #7067e8; box-shadow: 0 0 0 4px #eceaff; }
.page-actions { display: flex; gap: 10px; padding-top: 4px; }
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
.section-tabs :deep(.el-tabs__header) { margin-bottom: 22px; }.section-tabs :deep(.el-tabs__nav-wrap::after), .pricing-tabs :deep(.el-tabs__nav-wrap::after) { height: 1px; background: var(--line); }.section-tabs :deep(.el-tabs__item) { height: 54px; padding: 0 22px; font-weight: 600; }
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
.pricing-card { margin-bottom: 14px; }.pricing-toolbar { display: flex; align-items: flex-start; justify-content: space-between; padding: 0 18px; border-bottom: 1px solid var(--line); }.pricing-tabs { min-width: 0; max-width: calc(100% - 230px); }.pricing-tabs :deep(.el-tabs__header) { margin: 0; }.pricing-tabs :deep(.el-tabs__content) { display: none; }.pricing-tabs :deep(.el-tabs__item) { height: 58px; padding: 0 13px; }.pricing-tabs span { display: flex; align-items: center; gap: 5px; font-size: 12px; }.pricing-tabs b { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; color: #838ba0; background: #eff1f5; border-radius: 9px; font-size: 9px; }.pricing-actions { display: flex; gap: 8px; padding-top: 13px; }.quote-service { display: flex; align-items: center; gap: 10px; }.quote-service > span { padding: 4px 6px; color: #7169c8; background: #f0efff; border-radius: 5px; font-size: 9px; font-weight: 700; }.quote-service > div { display: flex; flex-direction: column; gap: 3px; }.quote-service strong { font-size: 12px; }.quote-service small { color: var(--muted); font-size: 10px; }.price-value { color: #27334a; font-size: 13px; }.pricing-table :deep(.el-input-number) { width: 128px; }
.pricing-bottom-grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: 14px; }.rule-list > div { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 14px 19px; border-bottom: 1px solid var(--line); }.rule-list > div:last-child { border-bottom: 0; }.rule-badge { display: inline-flex; justify-content: center; padding: 5px 7px; border-radius: 6px; font-size: 9px; font-weight: 700; }.rule-badge--standard { color: #4269b5; background: #edf2fd; }.rule-badge--extended { color: #a86723; background: #fff0dc; }.rule-badge--restricted { color: #a94250; background: #fdecef; }.rule-list > div > span:nth-child(2) { display: flex; flex-direction: column; gap: 3px; }.rule-list strong { font-size: 12px; }.rule-list small { color: var(--muted); font-size: 10px; }.rule-values { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }.rule-values b { font-size: 11px; }.rule-values em { color: var(--muted); font-size: 10px; font-style: normal; }.terms-list { display: grid; grid-template-columns: repeat(2, 1fr); margin: 0; padding: 11px 20px 18px; }.terms-list div { padding: 10px 0; border-bottom: 1px solid #eff1f5; }.terms-list div:nth-last-child(-n + 2) { border-bottom: 0; }.terms-list dt { color: var(--muted); font-size: 10px; }.terms-list dd { margin: 4px 0 0; font-size: 12px; font-weight: 700; }
.drawer-order-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 0 0 19px; border-bottom: 1px solid var(--line); }.drawer-order-head > div > span { color: #6e67c9; font-size: 11px; font-weight: 700; }.drawer-order-head h2 { margin: 6px 0 3px; font-size: 19px; }.drawer-order-head p { margin: 0; color: var(--muted); font-size: 12px; }.drawer-section { padding: 20px 0; border-bottom: 1px solid var(--line); }.drawer-section h3 { margin: 0 0 13px; font-size: 13px; }.detail-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 0; }.detail-list dt { color: var(--muted); font-size: 10px; }.detail-list dd { margin: 4px 0 0; font-size: 12px; font-weight: 600; }.address-panel { display: flex; gap: 11px; padding: 13px; background: #f7f8fb; border-radius: 10px; }.address-panel > svg { flex: 0 0 auto; width: 19px; color: #625bd0; }.address-panel div { display: flex; flex-direction: column; gap: 4px; }.address-panel strong { font-size: 12px; }.address-panel p { margin: 0; color: #677186; font-size: 11px; }.address-panel span { color: #969dac; font-size: 10px; }
@media (max-width: 1200px) { .supplier-facts { gap: 16px; }.metric-grid { grid-template-columns: repeat(2, 1fr); }.zone-grid { grid-template-columns: repeat(2, 1fr); }.form-grid--three { grid-template-columns: repeat(2, 1fr); } }
</style>
