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
      { question: "在哪里查看我的预约？", answer: [text("进入账户中的“订单”页面，即可查看全部预约及其状态。") ] },
      { question: "预约后可以修改地址吗？", answer: [text("请立即联系支持团队。团队分配完成后，可能无法再修改地址。") ] },
    ],
  },
  {
    title: "改期",
    items: [
      {
        question: "可以为预约改期吗？",
        answer: [
          text("可以。距离服务开始超过 3 小时改期免费；距离服务不足 3 小时则无法改期，预约后 10 分钟宽限期除外。完整规则请参阅"),
          terms("《条款与条件》"),
          text("第 6 节“取消、改期与退款”。"),
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
          text("可以，在“订单”页面操作。是否退款取决于取消政策，请参阅"),
          terms("《条款与条件》"),
          text("第 6 节“取消、改期与退款”。"),
        ],
      },
      {
        question: "预约被取消后可以退款吗？",
        answer: [
          text("取决于取消时间：预约后 10 分钟内可全额退款，但会扣除一笔不可退还的小额银行卡手续费，也可免费改期；距离服务开始超过 6 小时，可退款但会扣除同样的银行卡手续费；距离服务开始不足 6 小时则不退款。具体手续费请查看"),
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
      { question: "Where can I check my booking?", answer: [text('Go to "Orders" in your account to see all your bookings and their status.')] },
      { question: "Can I change my address after booking?", answer: [text("Contact support right away. Once a team is assigned, it may be too late to change.")] },
    ],
  },
  {
    title: "Rescheduling",
    items: [
      {
        question: "Can I reschedule a booking?",
        answer: [
          text("Yes, and it's free if done more than 3 hours before your service. Within 3 hours of your service, rescheduling isn't available (except during the 10-minute grace period right after booking). See our "),
          terms(),
          text(" (Section 6: Cancellation, Rescheduling & Refunds) for full details."),
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
          text("Yes, from the Orders page. Whether you get a refund depends on our cancellation policy - see our "),
          terms(),
          text(" (Section 6: Cancellation, Rescheduling & Refunds)."),
        ],
      },
      {
        question: "Do I get a refund if my booking is cancelled?",
        answer: [
          text("It depends on when you cancel: Within 10 minutes of booking - full refund, minus a small non-refundable card fee (or you can reschedule for free). More than 6 hours before your service - refund minus the same small card fee. Less than 6 hours before your service - no refund. (See our "),
          terms(),
          text(" for the exact fee amounts.)"),
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
