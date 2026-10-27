export type FaqAnswerPart = {
  text: string
  to?: string
  href?: string
}

export type FaqGroup = {
  title: string
  items: Array<{
    question: string
    answer: FaqAnswerPart[]
  }>
}

const text = (value: string): FaqAnswerPart => ({ text: value })
const terms = (label = "Terms & Conditions"): FaqAnswerPart => ({
  text: label,
  to: "/terms",
})
const whatsapp = (label = "WhatsApp"): FaqAnswerPart => ({
  text: label,
  href: "https://wa.me/971502100284/?text=Hi%2C+I%E2%80%99m+interested+in+HourX+services.+Could+you+please+help+me%3F",
})
const dataDeletion = (label = "Data Deletion Request"): FaqAnswerPart => ({
  text: label,
  to: "/data-deletion",
})

const chineseFaqGroups: FaqGroup[] = [
  {
    title: "预约与下单",
    items: [
      { question: "如何预约服务？", answer: [text("选择服务、日期、时间和地址，然后确认并付款。")] },
      { question: "可以一次预约多项服务吗？", answer: [text("可以。将需要的服务全部加入购物车，然后一起付款。") ] },
      { question: "可以为家人等其他人预约吗？", answer: [text("可以。结账时填写对方的地址和联系方式即可。") ] },
      { question: "可以提前多久预约？", answer: [text("最早可以选择下一个开放时段，也可以选择页面上显示为可用的任意日期。") ] },
    ],
  },
  {
    title: "管理预约",
    items: [
      { question: "在哪里查看我的预约？", answer: [text("进入“我的账户”中的“我的预约”，即可查看全部预约及其状态。") ] },
      { question: "预约后可以修改地址吗？", answer: [text("请立即联系支持团队。团队分配完成后，可能无法再修改地址。") ] },
    ],
  },
  {
    title: "改期",
    items: [
      {
        question: "可以为预约改期吗？",
        answer: [
          text("可以。下单后、服务开始前 3 小时时段内可免费改期；服务开始前 2 小时内只能申请免费改期，新时间须经 HourX 确认后才生效；服务开始后不可改期。2 小时与 3 小时时段重叠时，以 2 小时规则为准。免费改期取决于可预约时段和人员安排。完整规则请参阅"),
          terms("《条款与条件》"),
          text("第 8 节“取消、改期与退款”。"),
        ],
      },
    ],
  },
  {
    title: "取消与退款",
    items: [
      {
        question: "可以取消预约吗？",
        answer: [
          text("可以，在“我的预约”里操作。是否退款取决于取消政策，请参阅"),
          terms("《条款与条件》"),
          text("第 8 节“取消、改期与退款”。"),
        ],
      },
      {
        question: "预约被取消后可以退款吗？",
        answer: [
          text("取决于申请时间：下单后、服务开始前 3 小时时段内取消，不收平台取消费，退还实付金额并扣除 3.9% + AED 1 的支付处理费；服务开始前 2 小时内不支持取消退款；服务开始后不可取消、不退款。若因服务商或 HourX 无法提供服务而取消，全额退还实付金额，处理费由 HourX 承担。2 小时与 3 小时时段重叠时，以 2 小时规则为准。确认取消前会展示处理费和预计退款金额。详见"),
          terms("《条款与条件》"),
          text("。"),
        ],
      },
      { question: "退款需要多长时间？", answer: [text("批准后的退款将原路退回，通常会在 5-10 个工作日内到账。") ] },
    ],
  },
  {
    title: "价格与支付",
    items: [
      { question: "支持哪些付款方式？", answer: [text("支持通过 Stripe 使用银行卡、Apple Pay 和 Google Pay。我们不会保存您的银行卡信息，Stripe 会安全处理付款。") ] },
      { question: "价格包含增值税吗？", answer: [text("包含。增值税会在付款前清楚列出。") ] },
    ],
  },
  {
    title: "服务",
    items: [
      { question: "你们提供哪些服务？", answer: [text("我们提供清洁、空调维修、家居维护和上门健康护理服务。") ] },
      { question: "我需要准备用品或工具吗？", answer: [text("不需要。我们的专业人员会携带所需的一切用品和工具。") ] },
      { question: "服务人员是否经过审核？", answer: [text("是的，所有专业人员在加入平台前都会经过验证。") ] },
      { question: "可以再次指定同一位服务人员吗？", answer: [text("视对方档期而定，有时可以。您可以联系支持团队咨询。") ] },
    ],
  },
  {
    title: "服务区域与时间",
    items: [
      { question: "你们在哪里提供服务？", answer: [text("阿联酋迪拜。") ] },
      { question: "支持团队的工作时间是什么？", answer: [text("周一至周五 9:00-18:00，周六 10:00-17:00，周日休息。") ] },
    ],
  },
  {
    title: "账户与支持",
    items: [
      { question: "预约服务需要账户吗？", answer: [text("需要，这样您可以跟踪预约并保存个人资料。") ] },
      {
        question: "如何联系支持团队？",
        answer: [text("发送邮件至 support@hourxportal.com，或通过 "), whatsapp(), text(" 联系我们。")],
      },
      {
        question: "如何删除账户或个人数据？",
        answer: [text("请使用网站底部的“"), dataDeletion("数据删除申请"), text("”。")],
      },
    ],
  },
]

const englishFaqGroups: FaqGroup[] = [
  {
    title: "Booking & Ordering",
    items: [
      { question: "How do I book a service?", answer: [text("Pick a service, choose your date, time, and address, then confirm and pay.")] },
      { question: "Can I book more than one service at a time?", answer: [text("Yes. Add all the services you need to your cart and pay for them together.")] },
      { question: "Can I book for someone else, like a family member?", answer: [text("Yes. Just enter their address and contact details when booking.")] },
      { question: "How far in advance can I book?", answer: [text("As soon as the next open time slot, or any date shown as available.")] },
    ],
  },
  {
    title: "Managing Your Booking",
    items: [
      { question: "Where can I check my booking?", answer: [text('Go to My Bookings in My Account to see all your bookings and their status.')] },
      { question: "Can I change my address after booking?", answer: [text("Contact support right away. Once a team is assigned, it may be too late to change.")] },
    ],
  },
  {
    title: "Rescheduling",
    items: [
      {
        question: "Can I reschedule a booking?",
        answer: [
          text("Yes. It is free after booking and within the three-hour window before your service starts. Within two hours of the start time, you may only request a free reschedule, and the new time applies only after HourX confirms it. Once the service has started, it cannot be rescheduled. If the two-hour and three-hour windows overlap, the two-hour rule applies. Free rescheduling depends on open time slots and staffing. See our "),
          terms(),
          text(" (Section 8: Cancellation, Rescheduling & Refunds) for full details."),
        ],
      },
    ],
  },
  {
    title: "Cancellations & Refunds",
    items: [
      {
        question: "Can I cancel a booking?",
        answer: [
          text("Yes, from My Bookings. Whether you get a refund depends on our cancellation policy - see our "),
          terms(),
          text(" (Section 8: Cancellation, Rescheduling & Refunds)."),
        ],
      },
      {
        question: "Do I get a refund if my booking is cancelled?",
        answer: [
          text("It depends on when HourX receives your request. After booking and within the three-hour window before the service starts, there is no platform cancellation fee: you receive the amount actually paid, minus the 3.9% + AED 1 processing fee. Within two hours of the start time, cancellation refunds are unavailable. After the service has started, it cannot be cancelled or refunded. If HourX or the provider cannot deliver the service and you cancel, you receive a full refund and HourX bears the processing fee. Where the windows overlap, the two-hour rule applies. The fee and estimated refund are shown before you confirm. See our "),
          terms(),
          text(" for the full calculation."),
        ],
      },
      { question: "How long do refunds take?", answer: [text("Approved refunds go back to your original payment method and usually arrive within 5-10 business days.")] },
    ],
  },
  {
    title: "Pricing & Payment",
    items: [
      { question: "What payment methods do you accept?", answer: [text("Cards, Apple Pay, and Google Pay, through Stripe. We never store your card details - Stripe handles that securely.")] },
      { question: "Is VAT included?", answer: [text("Yes. VAT is added and shown clearly before you pay.")] },
    ],
  },
  {
    title: "Services",
    items: [
      { question: "What services do you offer?", answer: [text("Cleaning, AC repair, home maintenance, and at-home wellness services.")] },
      { question: "Do I need to provide supplies or tools?", answer: [text("No. Our professional brings everything needed.")] },
      { question: "Are your service providers checked/verified?", answer: [text("Yes, all professionals are verified before joining.")] },
      { question: "Can I request the same professional again?", answer: [text("Sometimes, depending on their availability. Ask support to try.")] },
    ],
  },
  {
    title: "Service Area & Hours",
    items: [
      { question: "Where do you operate?", answer: [text("Dubai, UAE.")] },
      { question: "What are your support hours?", answer: [text("Mon-Fri 9am-6pm, Sat 10am-5pm. Closed Sundays.")] },
    ],
  },
  {
    title: "Account & Support",
    items: [
      { question: "Do I need an account to book?", answer: [text("Yes, so you can track bookings and save your details.")] },
      {
        question: "How do I contact support?",
        answer: [text("Email support@hourxportal.com or message us on "), whatsapp(), text(".")],
      },
      {
        question: "How do I delete my account or data?",
        answer: [text('Use "'), dataDeletion(), text('" at the bottom of the website.')],
      },
    ],
  },
]

export const getFaqGroups = (locale: string): FaqGroup[] =>
  locale.startsWith("zh") ? chineseFaqGroups : englishFaqGroups
