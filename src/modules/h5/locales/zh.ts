const zh = {
  common: {
    back: '返回',
    submit: '提交',
    login: '登录',
    reserve: '预约',
    keepPxTip: '保持 px',
  },
  home: {
    navTitle: 'OasiAart 移动端',
    login: '登录',
    notice: '家庭保洁、商户维护、深度清洁与家电保养均可在线预约，今日下单最快当日上门。',
    shortcutsTitle: '快捷入口',
    popularTitle: '热门服务',
    reviewsTitle: '用户口碑',
    bannerCta: '立即预约',
    tabbar: {
      home: '首页',
      services: '服务',
      profile: '我的',
    },
    banners: [
      { title: '日常保洁', desc: '基础保洁 + 收纳整理，一键预约今日可上门', image: 'daily-cleaning.png' },
      { title: '深度焕新', desc: '厨房油污重度清理，除螨杀菌更安心', image: 'deep-cleaning.png' },
      { title: '家电养护', desc: '冰箱/空调/洗衣机专项清洗，延长设备寿命', image: 'appliance-cleaning.png' },
    ],
    shortcuts: [
      { text: '预约服务', icon: 'calendar-o', to: '/services' },
      { text: '价格估算', icon: 'diamond', to: '/services' },
      { text: '联系客服', icon: 'service-o', to: '/login' },
      { text: '我的订单', icon: 'orders-o', to: '/login' },
    ],
    services: [
      {
        title: '家庭深度保洁',
        desc: '厨卫除垢 · 床品除螨 · 全屋消杀',
        duration: '2-3 小时 · 2人团队',
        price: '￥199 起',
        tags: ['深度清洁', '除螨消杀'],
        thumb: 'deep-cleaning.png',
      },
      {
        title: '日常维护保洁',
        desc: '客厅卧室日常清洁 · 收纳整理',
        duration: '1.5-2 小时 · 1人上门',
        price: '￥129 起',
        tags: ['高频维护', '及时到店'],
        thumb: 'daily-cleaning.png',
      },
      {
        title: '家电专项清洗',
        desc: '冰箱、洗衣机、空调深层清洗杀菌',
        duration: '90 分钟 · 专项技师',
        price: '￥159 起',
        tags: ['专人专机', '环保耗材'],
        thumb: 'appliance-cleaning.png',
      },
    ],
    reviews: [
      { user: '陈女士 · 宝龙城', comment: '两小时搞定全屋，收纳很整齐，下次还会约。', score: 4.5 },
      { user: '李先生 · 滨江', comment: '油烟机清洗得很干净，师傅很准时。', score: 5 },
      { user: '赵女士 · 江南', comment: '空调清洗完风很清新，工具齐全。', score: 4.5 },
    ],
  },
  services: {
    navTitle: '服务项目',
    back: '返回',
    schemes: '精选方案',
    tabs: [
      {
        name: 'cleaning',
        title: '家庭保洁',
        plans: [
          { title: '日常保洁 · 标准', desc: '客厅/卧室基础清洁 + 桌面收纳', price: '￥129 起', duration: '1.5 小时', icon: 'brush-o' },
          { title: '深度保洁 · 厨卫', desc: '重油区深度去渍 + 杀菌除螨', price: '￥199 起', duration: '3 小时', icon: 'fire' },
        ],
      },
      {
        name: 'appliance',
        title: '家电清洗',
        plans: [
          { title: '空调蒸汽洗', desc: '外机+内机杀菌清洗，保持风量', price: '￥159 起', duration: '90 分钟', icon: 'underway-o' },
          { title: '冰箱除味洗', desc: '拆洗密封胶圈，深层除菌除味', price: '￥129 起', duration: '60 分钟', icon: 'smile' },
        ],
      },
      {
        name: 'commercial',
        title: '商户保洁',
        plans: [
          { title: '店面开荒', desc: '硬化地面/橱窗清洁，开业前一次性焕新', price: '￥699 起', duration: '半天', icon: 'shop-o' },
          { title: '月度保洁', desc: '固定频次上门，保持环境稳定整洁', price: '￥1299 起', duration: '包月', icon: 'balance-list-o' },
        ],
      },
    ],
    contact: {
      title: '预约与咨询',
      name: '称呼',
      phone: '手机',
      note: '需求',
      namePlaceholder: '请输入称呼',
      phonePlaceholder: '便于联系确认时间',
      notePlaceholder: '如：深度保洁+冰箱清洗，周末上门',
      submit: '提交预约',
      or: '或',
      login: '登录查看我的订单',
    },
    toast: {
      needPhone: '请先填写联系方式',
      submitted: '已提交，顾问会尽快联系您',
    },
  },
  auth: {
    navTitle: '账户登录',
    back: '返回',
    welcome: '欢迎回来',
    desc: '预约记录、会员权益均可在移动端查看',
    mobile: '手机',
    code: '验证码',
    mobilePlaceholder: '请输入手机号',
    codePlaceholder: '请输入验证码',
    sendCode: '获取验证码',
    submit: '登录 / 注册',
    other: '其他登录方式',
    coming: '即将上线',
    toast: {
      needMobile: '请先填写手机号',
      needAll: '请填写完整信息',
      success: '登录成功',
      sent: '验证码已发送',
    },
  },
}

export default zh
