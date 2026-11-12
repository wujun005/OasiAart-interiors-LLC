export type LegalDocType = 'terms' | 'privacy' | 'deletion';

type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  links?: { label: string; href: string }[];
};

type LegalDoc = {
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
};

type LegalLocale = 'en' | 'zh';

const privacyRevision = '2026-11-12';
const privacyContact = {
  label: 'support@hourxportal.com',
  href: 'mailto:support@hourxportal.com',
};

export const LEGAL_DOCS: Record<LegalLocale, Record<LegalDocType, LegalDoc>> = {
  en: {
    terms: {
      title: 'HourX Terms & Conditions',
      lastUpdated: '____',
      intro:
        'HourX Portal LLC ("HourX", "we", "us") - Trade License No. 1589415, Dubai, United Arab Emirates. Business address: Diamond Business Center, Dubai, UAE. For legal notices, contact: info@hourxportal.com.',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          paragraphs: [
            'By accessing or using the HourX website and online platform, you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree, you must stop using the platform.',
          ],
        },
        {
          heading: '2. Platform Description',
          paragraphs: [
            'HourX is an on-demand home services platform operating in Dubai, UAE. The platform connects users with independent, qualified third-party service providers offering cleaning, maintenance, repair, and other home-related services. HourX coordinates bookings but does not employ service providers.',
          ],
        },
        {
          heading: '3. Eligibility',
          paragraphs: [
            'You must be at least 18 years old and have the legal capacity to enter into a binding contract under UAE law to create an HourX account or book a service. By using the platform, you confirm that you meet this requirement.',
          ],
        },
        {
          heading: '4. User Obligations',
          paragraphs: ['Users must:'],
          bullets: [
            'Provide accurate and up-to-date information.',
            'Ensure safe and accessible premises.',
            'Comply with UAE laws.',
            'Use the platform only for lawful purposes.',
            'Treat service providers respectfully.',
          ],
        },
        {
          heading: '5. Account Registration',
          paragraphs: [
            'To book or purchase any services, users must create an HourX account on the website.',
            'By creating an account, you agree to provide accurate personal details, maintain the confidentiality of login credentials, accept responsibility for all activity under your account, and notify HourX of any unauthorized access.',
            'HourX may suspend or terminate accounts involved in fraud, misuse, or violations of these Terms.',
            'You may close your HourX account at any time by contacting HourX support. Closing your account does not cancel or refund any existing bookings - those remain subject to the Cancellation, Rescheduling & Refund Policy in Section 8 below.',
          ],
        },
        {
          heading: '6. Services & Booking',
          paragraphs: [
            'Services are performed by independent, qualified professionals.',
            'HourX manages scheduling, coordination, and communication through the website.',
            'Service availability depends on provider schedules and location.',
            'Users must ensure the premises are safe and accessible.',
          ],
        },
        {
          heading: '7. Payments & Fees',
          paragraphs: [
            'All payments are processed securely through Stripe.',
            'HourX does not store or access card information.',
            'Additional charges may apply for extra tasks, extra time, special materials, or access-related costs.',
            'Any such additional charges will be communicated to the customer for approval before being applied.',
            "HourX and its service providers will not charge additional amounts without the customer's prior consent, except where a rate for likely extras (e.g., a per-hour extension rate) has already been disclosed at booking.",
            'Value Added Tax (VAT): prices displayed on the platform are inclusive of UAE VAT at the applicable rate.',
            'Customers may request a tax invoice for a completed booking by contacting HourX support.',
          ],
        },
        {
          heading: '8. Cancellations, Rescheduling & Refunds',
          paragraphs: [
            'This policy applies to all bookings made through HourX within the United Arab Emirates and ensures transparency, fairness, and compliance with UAE consumer protection standards.',
            'All cancellations, rescheduling, and refunds follow the HourX policy below.',
          ],
        },
        {
          heading: '8.1 Stripe Processing Fees (Non-Refundable)',
          paragraphs: [
            'All payments are processed securely through Stripe. When a customer cancellation is eligible for a refund, the non-refundable bank/payment processing fee is deducted from the amount actually paid. HourX does not charge an additional platform cancellation fee.',
            'Processing fee for all cards: 3.9% of the amount actually paid + AED 1. The fee is deducted only from an otherwise refundable customer cancellation; it is not charged as an additional fee for non-refundable cancellations.',
            'Before the customer confirms a cancellation, HourX will display the processing fee and the estimated refund amount. If HourX or the service provider is unable to deliver the service and the customer elects cancellation, HourX bears the processing fee and refunds the full amount actually paid.',
          ],
        },
        {
          heading: '8.2 Cancellation Policy',
          paragraphs: [
            'All time windows are measured against the confirmed scheduled service start time, not the end time or any point within the booking window. The relevant request time is the time HourX receives the customer\'s request. Where the two-hour and three-hour windows overlap, the two-hour rule takes priority.',
            'After booking, within the three-hour pre-service window (subject to the two-hour rule below): free rescheduling. No HourX platform cancellation fee. Refund the amount actually paid, less the bank/payment processing fee.',
            'Within two hours before the service start time: the customer may request free rescheduling, and the new time requires HourX confirmation. Only rescheduling requests are accepted. Cancellation refunds are unavailable. The new time must be confirmed by HourX.',
            'If the service cannot be delivered due to the service provider or HourX: the customer may choose to reschedule. If the customer chooses to cancel, HourX refunds the full amount actually paid and bears the payment processing fee.',
            'If the service has already started: rescheduling is unavailable. Cancellation is unavailable, and no refund is issued.',
            'Refund calculation: Refund = amount actually paid − (3.9% × amount actually paid + AED 1), where a customer cancellation qualifies for a refund. The refund cannot be less than AED 0. The estimated amount is shown before cancellation confirmation.',
          ],
        },
        {
          heading: '8.3 Rescheduling Policy',
          paragraphs: [
            'Free rescheduling is subject to available booking time slots and personnel arrangements. A new service time is effective only after HourX confirms it.',
            'Customers may submit a free rescheduling request in the relevant pre-service period described in Section 8.2. For requests received within two hours of the service start time, only a rescheduling request is accepted; a new time is not guaranteed until confirmed by HourX.',
            'Once the service has started, it cannot be rescheduled.',
            'HourX-initiated rescheduling: HourX may propose rescheduling due to provider unavailability, operational issues, safety concerns, incorrect booking details, or force majeure events. If HourX or the provider cannot deliver the service, the customer may accept a new confirmed time or request a full refund.',
          ],
        },
        {
          heading: '8.4 HourX-Initiated Cancellations',
          paragraphs: [
            'HourX may cancel a booking when the service cannot be delivered safely or correctly. In cases where the service cannot be delivered due to HourX or the service provider, the customer receives a full refund, including the payment processing fee borne by HourX.',
            'Reasons may include provider unavailability, operational or technical issues, safety concerns, incorrect or incomplete booking details, a service not being applicable, or force majeure events.',
            "Refunds are issued to the original payment method and typically take 5-10 business days.",
          ],
        },
        {
          heading: '8.5 Refund Method and Timeline',
          paragraphs: [
            "Refunds are processed back to the original payment method. Processing times depend on the customer's bank and typically take 5-10 business days. Customers receive an email confirmation once the refund is initiated.",
          ],
        },
        {
          heading: '8.6 Non-Refundable Situations',
          paragraphs: [
            'Except where HourX or the service provider cannot deliver the service, no customer cancellation refund is available when:',
          ],
          bullets: [
            'The request is received within two hours before the confirmed service start time.',
            'The service has already started.',
            'The customer does not provide access to the premises.',
            'The premises are unsafe or inaccessible.',
            'Fraudulent or abusive booking behavior occurs.',
          ],
        },
        {
          heading: '8.7 Policy Updates',
          paragraphs: [
            'HourX may update this policy to remain compliant with UAE regulations and ensure fair treatment for customers and service providers.',
          ],
        },
        {
          heading: '9. Property Damage & Insurance Claims',
          paragraphs: [
            "If a customer believes their property has been damaged during a service, they must report the issue to HourX within 24 hours of service completion, including photographic evidence where possible. HourX will coordinate with the relevant service provider (and their liability insurance, where applicable) to investigate the claim. HourX's role is limited to facilitating communication between the customer and the service provider/insurer and does not itself guarantee a compensation outcome.",
          ],
        },
        {
          heading: '10. Limitation of Liability',
          paragraphs: ['To the maximum extent permitted by UAE law:'],
          bullets: [
            'HourX is not liable for indirect, incidental, or consequential damages.',
            'HourX is not responsible for losses caused by third-party providers.',
            'Providers are solely responsible for their actions and conduct.',
          ],
        },
        {
          heading: '11. Indemnification',
          paragraphs: [
            'Users agree to indemnify and hold HourX harmless from claims, damages, or losses arising from:',
          ],
          bullets: [
            'Misuse of the platform.',
            'Violation of these Terms.',
            'Misconduct toward service providers.',
            'Breach of applicable laws.',
          ],
        },
        {
          heading: '12. Force Majeure',
          paragraphs: [
            'HourX shall not be liable for any failure or delay in performance resulting from causes beyond its reasonable control, including but not limited to natural disasters, government actions, epidemics or pandemics, strikes, or internet/utility outages.',
          ],
        },
        {
          heading: '13. Intellectual Property',
          paragraphs: [
            'All content, branding, software, and materials on the HourX website are owned by HourX and protected under UAE intellectual property laws. Users may not copy, distribute, or modify any platform content.',
          ],
        },
        {
          heading: '14. Governing Law',
          paragraphs: [
            'These Terms & Conditions are governed by the laws of the United Arab Emirates.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      lastUpdated: privacyRevision,
      intro: 'HourX Portal Co. L.L.C S.O.C, based in Dubai, United Arab Emirates, operates HourX Home, HourX Supplier, and the HourX website. This policy covers customers, supplier administrators, and supplier employees who use these services.',
      sections: [
        {
          heading: '1. Information We Collect',
          bullets: [
            'Account and support information, including your name, email address, phone number, sign-in information, and communications with HourX.',
            'HourX Home booking and payment records, including service addresses, booking history, transaction details, and saved payment method details such as card brand and last four digits. Stripe processes card payments. HourX does not store full card numbers.',
            'Location information for address selection. HourX Home can use your device location when you choose to find your current location and grant permission. The service address and coordinates you select may be saved with your address or booking.',
            'HourX Home usage information, including app activity, device or platform information, app-generated identifiers, and session identifiers. Usage events can include your account identifier, name, and related booking or payment activity.',
            'HourX Supplier business and employee records, including supplier profile and contact details, staff names and phone numbers, optional email addresses and service categories, and order assignments.',
            'HourX Supplier verification and settlement information, including trade licenses, insurance or tax documents, and bank account details such as IBAN. We also receive service records and proof photos you upload.',
          ],
        },
        {
          heading: '2. How We Use Your Information',
          paragraphs: ['Your data is used to:'],
          bullets: [
            'Authenticate users, administer accounts, and verify suppliers.',
            'Manage bookings and service delivery.',
            'Manage employee access, work assignments, service records, and supplier settlements.',
            'Communicate updates and confirmations.',
            'Measure use and improve platform performance.',
            'Ensure safety and compliance.',
            'Provide customer support.',
          ],
        },
        {
          heading: '3. Sharing of Information',
          paragraphs: ['HourX shares information as needed with:'],
          bullets: [
            'Approved suppliers and assigned employees for booking and service delivery, and authorized supplier administrators for managing their organization and staff.',
            'Stripe for payment processing.',
            'Google Maps for address search, map display, and location lookup.',
            'Legal authorities when required by UAE law.',
            'HourX technical and platform administration teams, including personnel outside the UAE, for hosting, maintaining, and operating the platform. These teams are subject to confidentiality and data protection obligations.',
          ],
        },
        {
          heading: 'Information Sharing Safeguards',
          paragraphs: [
            'HourX does not sell or trade customer data.',
            'Cross-border access and transfers are subject to applicable data protection requirements.',
          ],
        },
        {
          heading: '4. Communication Consent',
          paragraphs: [
            'By using HourX, you consent to receive booking confirmations, service updates, and account notifications.',
            'Marketing messages are optional and can be opted out at any time.',
          ],
        },
        {
          heading: '5. Cookie Policy',
          paragraphs: [
            'The HourX website may use cookies and similar tracking technologies to remember preferences, keep you signed in, and analyze site traffic. You can control or disable cookies through your browser settings; doing so may affect certain website functionality.',
          ],
        },
        {
          heading: '6. Data Protection',
          paragraphs: [
            'HourX uses technical and organizational safeguards designed to protect personal data from unauthorized access, loss, or misuse.',
          ],
        },
        {
          heading: 'Data Retention',
          paragraphs: [
            'HourX keeps personal data for as long as needed to provide services, meet legal, tax, or regulatory obligations, and resolve disputes. For customer records, this is typically 2 years after account closure or the last booking. HourX deletes or anonymizes the data when that period ends.',
            'After account deletion, HourX may retain specific records needed for legal, tax, or regulatory obligations or to resolve disputes. HourX deletes or anonymizes those records when they are no longer needed.',
          ],
        },
        {
          heading: '7. Your Rights and Privacy Contact',
          paragraphs: ['Users may request:'],
          bullets: [
            'Access to their data.',
            'Correction of inaccurate information.',
            'Deletion of your account and associated personal data, subject to the retention exceptions above.',
          ],
          links: [
            privacyContact,
            { label: 'Request account and data deletion', href: '/data-deletion' },
          ],
        },
        {
          heading: '8. Policy Updates',
          paragraphs: [
            'HourX may update this Privacy Policy and will show the revision date on this page.',
          ],
        },
      ],
    },
    deletion: {
      title: 'Account and Data Deletion Request',
      lastUpdated: privacyRevision,
      intro: 'HourX Portal Co. L.L.C S.O.C handles account and associated data deletion requests for HourX Home and HourX Supplier.',
      sections: [
        {
          heading: 'How to Request Account Deletion',
          paragraphs: [
            'Email HourX support to request deletion of your account and associated personal data. You can submit a request even after uninstalling the app.',
            'Include the following information in your request:',
          ],
          bullets: [
            'Your name',
            'The app you use, HourX Home or HourX Supplier',
            'The phone number or email address linked to your account',
            'Whether you want to delete the account and its associated data or only specific personal data',
          ],
          links: [privacyContact],
        },
        {
          heading: 'What Happens Next',
          paragraphs: [
            'HourX support will review your request within 7 business days and may contact you to verify account ownership. After verification, HourX will delete the account and its associated personal data, or the specific personal data you requested, subject to the retention exceptions below.',
          ],
        },
        {
          heading: 'Records We May Need to Keep',
          paragraphs: [
            'HourX may retain specific booking, payment, or settlement records as needed to meet legal, tax, or regulatory obligations or to resolve disputes. HourX deletes or anonymizes these records when they are no longer needed.',
          ],
        },
      ],
    },
  },
  zh: {
    terms: {
      title: 'HourX 服务条款',
      lastUpdated: '____',
      intro:
        'HourX Portal LLC（以下简称“HourX”或“我们”）- 商业执照号 1589415，阿拉伯联合酋长国迪拜。营业地址：Diamond Business Center, Dubai, UAE。法律通知请发送至 info@hourxportal.com。',
      sections: [
        {
          heading: '1. 条款接受',
          paragraphs: [
            '访问或使用 HourX 网站及在线平台，即表示您同意受本服务条款及隐私政策约束。如不同意，请停止使用本平台。',
          ],
        },
        {
          heading: '2. 平台说明',
          paragraphs: [
            'HourX 是一家在阿联酋迪拜运营的按需家庭服务平台。平台将用户与提供清洁、维护、维修及其他家庭相关服务的独立、合格第三方服务商连接起来。HourX 负责协调预订，但服务商并非 HourX 的雇员。',
          ],
        },
        {
          heading: '3. 使用资格',
          paragraphs: [
            '创建 HourX 账户或预订服务，您必须年满 18 周岁，并具备依据阿联酋法律订立有约束力合同的法律行为能力。使用本平台即表示您确认符合该要求。',
          ],
        },
        {
          heading: '4. 用户义务',
          paragraphs: ['用户必须：'],
          bullets: [
            '提供准确且最新的信息。',
            '确保服务场所安全且可进入。',
            '遵守阿联酋法律。',
            '仅将平台用于合法目的。',
            '尊重服务人员。',
          ],
        },
        {
          heading: '5. 账户注册',
          paragraphs: [
            '预订或购买任何服务前，用户必须在网站上创建 HourX 账户。',
            '创建账户即表示您同意提供准确的个人资料、妥善保管登录凭证、对账户下的所有活动负责，并在发现未经授权的访问时通知 HourX。',
            '如账户涉及欺诈、滥用或违反本条款，HourX 可暂停或终止该账户。',
            '您可随时联系 HourX 客服关闭账户。关闭账户不会取消现有预订，也不会产生退款；现有预订仍适用下文第 8 节《取消、改期与退款政策》。',
          ],
        },
        {
          heading: '6. 服务与预订',
          paragraphs: [
            '服务由独立、合格的专业人员提供。',
            'HourX 通过网站管理服务排期、协调和沟通。',
            '服务是否可用取决于服务商时间安排及服务地点。',
            '用户必须确保服务场所安全且可进入。',
          ],
        },
        {
          heading: '7. 支付与费用',
          paragraphs: [
            '所有付款均通过 Stripe 安全处理。',
            'HourX 不存储或访问银行卡信息。',
            '额外工作、额外服务时间、特殊材料或与进入场所有关的费用可能产生额外收费。',
            '任何额外收费在收取前都会告知客户并取得客户同意。',
            'HourX 及其服务商不会在未经客户事先同意的情况下收取额外费用；但如预订时已经披露可能产生的额外费用标准（例如按小时计算的延时费），则不在此限。',
            '增值税（VAT）：平台显示的价格已包含按适用税率计算的阿联酋增值税。',
            '客户可联系 HourX 客服，为已完成的预订申请税务发票。',
          ],
        },
        {
          heading: '8. 取消、改期与退款',
          paragraphs: [
            '本政策适用于通过 HourX 在阿拉伯联合酋长国境内作出的全部预订，以确保透明、公平，并符合阿联酋消费者保护标准。',
            '所有取消、改期及退款均适用以下 HourX 政策。',
          ],
        },
        {
          heading: '8.1 Stripe 支付处理费（不可退还）',
          paragraphs: [
            '所有付款均通过 Stripe 安全处理。客户取消且符合退款条件时，不可退还的银行/支付处理费从实付金额中扣除。HourX 不另收平台取消费。',
            '所有银行卡的处理费均为：实付金额的 3.9% + AED 1。该费用只在本可退款的客户取消中扣除；对不可退款的取消，不会另外加收这笔费用。',
            '客户确认取消前，HourX 会展示处理费和预计退款金额。如因 HourX 或服务商无法提供服务而由客户选择取消，处理费由 HourX 承担，并全额退还实付金额。',
          ],
        },
        {
          heading: '8.2 取消政策',
          paragraphs: [
            '所有时间窗口均以已确认的预定服务开始时间计算，不以结束时间或预约时段中的其他时点计算。相关申请时间是 HourX 收到客户申请的时间。2 小时窗口与 3 小时窗口重叠时，以 2 小时规则为准。',
            '下单后、处于服务开始前 3 小时时段内（受下述 2 小时规则约束）：可免费改期。不收取 HourX 平台取消费。退还实付金额，并扣除银行/支付处理费。',
            '服务开始前 2 小时内：客户可申请免费改期，新时间须经 HourX 确认。仅接受改期申请，不提供取消退款。新时间必须经 HourX 确认。',
            '因服务商或 HourX 无法提供服务：客户可以选择改期。如客户选择取消，HourX 全额退还实付金额，并由 HourX 承担支付处理费。',
            '服务已经开始：不可改期。不可取消，也不退款。',
            '退款计算：在客户取消符合退款条件时，退款金额 = 实付金额 −（实付金额 × 3.9% + AED 1）。退款金额不低于 AED 0。预计金额会在确认取消前展示。',
          ],
        },
        {
          heading: '8.3 改期政策',
          paragraphs: [
            '免费改期取决于可预约时段及人员安排。新的服务时间仅在 HourX 确认后生效。',
            '客户可在第 8.2 节所述的相应服务前时段提交免费改期申请。服务开始前 2 小时内收到的申请只作为改期申请受理，在 HourX 确认前不保证新时间。',
            '服务开始后不可改期。',
            'HourX 发起的改期：如因服务商无法提供服务、运营问题、安全问题、预订信息错误或不可抗力，HourX 可以提议改期。若 HourX 或服务商无法提供服务，客户可以接受新的已确认时间，或申请全额退款。',
          ],
        },
        {
          heading: '8.4 HourX 发起的取消',
          paragraphs: [
            '如服务无法安全或正确提供，HourX 可以取消预订。因 HourX 或服务商无法提供服务而取消时，客户获得全额退款，支付处理费由 HourX 承担。',
            '原因可能包括：服务商无法提供服务、运营或技术问题、安全问题、预订信息不正确或不完整、服务不适用，或不可抗力事件。',
            '退款将退回原付款方式，通常需要 5-10 个工作日。',
          ],
        },
        {
          heading: '8.5 退款方式与时间',
          paragraphs: [
            '退款将退回原付款方式。到账时间取决于客户的银行，通常需要 5-10 个工作日。退款发起后，客户会收到电子邮件确认。',
          ],
        },
        {
          heading: '8.6 不予退款的情形',
          paragraphs: [
            '除 HourX 或服务商无法提供服务的情形外，出现以下情况时，客户取消不予退款：',
          ],
          bullets: [
            '申请于已确认的服务开始时间前 2 小时内收到。',
            '服务已经开始。',
            '客户未允许服务人员进入服务场所。',
            '服务场所不安全或无法进入。',
            '存在欺诈或滥用预订的行为。',
          ],
        },
        {
          heading: '8.7 政策更新',
          paragraphs: [
            'HourX 可更新本政策，以持续符合阿联酋法规，并确保公平对待客户与服务商。',
          ],
        },
        {
          heading: '9. 财产损坏与保险索赔',
          paragraphs: [
            '如客户认为其财产在服务期间受损，必须在服务完成后 24 小时内向 HourX 报告，并尽可能提供照片证据。HourX 将协调相关服务商及其责任保险方（如适用）调查索赔。HourX 仅负责协助客户与服务商或保险方沟通，并不保证最终获得赔偿。',
          ],
        },
        {
          heading: '10. 责任限制',
          paragraphs: ['在阿联酋法律允许的最大范围内：'],
          bullets: [
            'HourX 不对间接、附带或后果性损害承担责任。',
            'HourX 不对第三方服务商造成的损失承担责任。',
            '服务商对其自身行为和操守承担全部责任。',
          ],
        },
        {
          heading: '11. 赔偿与免责',
          paragraphs: [
            '如因以下原因产生索赔、损害或损失，用户同意赔偿 HourX 并使其免责：',
          ],
          bullets: [
            '滥用平台。',
            '违反本条款。',
            '对服务商存在不当行为。',
            '违反适用法律。',
          ],
        },
        {
          heading: '12. 不可抗力',
          paragraphs: [
            '如因超出 HourX 合理控制范围的原因导致未能履行或延迟履行，包括但不限于自然灾害、政府行为、流行病或大规模传染病、罢工、互联网或公共设施中断，HourX 不承担责任。',
          ],
        },
        {
          heading: '13. 知识产权',
          paragraphs: [
            'HourX 网站上的所有内容、品牌、软件及材料均归 HourX 所有，并受阿联酋知识产权法律保护。用户不得复制、分发或修改任何平台内容。',
          ],
        },
        {
          heading: '14. 法律适用',
          paragraphs: ['本服务条款受阿拉伯联合酋长国法律管辖。'],
        },
      ],
    },
    privacy: {
      title: '隐私政策',
      lastUpdated: privacyRevision,
      intro: 'HourX Portal Co. L.L.C S.O.C 位于阿联酋迪拜，运营 HourX Home、HourX Supplier 和 HourX 网站。本政策适用于使用这些服务的客户、供应商管理员和供应商员工。',
      sections: [
        {
          heading: '1. 我们收集的信息',
          bullets: [
            '账户及支持信息，包括姓名、电子邮箱、手机号、登录信息以及您与 HourX 的沟通记录。',
            'HourX Home 的预订和付款记录，包括服务地址、预订历史、交易详情，以及已保存付款方式的银行卡品牌和末四位等信息。Stripe 处理银行卡付款，HourX 不存储完整卡号。',
            '选择地址时使用的位置信息。当您在 HourX Home 中选择获取当前位置并授权时，App 可使用您的设备位置。您选择的服务地址和坐标可能随地址或预订一起保存。',
            'HourX Home 的使用信息，包括 App 操作、设备或平台信息、App 生成的标识符和会话标识符。使用事件可能包含账户标识、姓名及相关预订或付款活动。',
            'HourX Supplier 的企业及员工资料，包括供应商档案和联系方式、员工姓名和手机号、选填的电子邮箱及服务类别，以及订单分派记录。',
            'HourX Supplier 的验证及结算资料，包括营业执照、保险或税务文件，以及 IBAN 等银行账户信息。我们也会接收您提交的服务记录和凭证照片。',
          ],
        },
        {
          heading: '2. 我们如何使用您的信息',
          paragraphs: ['您的数据用于：'],
          bullets: [
            '验证用户身份、管理账户及审核供应商资质。',
            '管理预订和服务交付。',
            '管理员工权限、订单分派、服务记录及供应商结算。',
            '发送更新和确认通知。',
            '分析使用情况并改善平台性能。',
            '确保安全与合规。',
            '提供客户支持。',
          ],
        },
        {
          heading: '3. 信息共享',
          paragraphs: ['HourX 根据需要与以下各方共享信息：'],
          bullets: [
            '经批准的供应商及被分派的员工，用于预订和服务交付。授权的供应商管理员可使用相关信息管理所属组织和员工。',
            'Stripe，用于处理付款。',
            'Google Maps，用于搜索地址、显示地图和查询位置。',
            '阿联酋法律要求时的主管机关。',
            'HourX 的技术、开发及平台管理团队，包括位于阿联酋境外、为维护、托管和运营平台而工作的人员；相关人员均受保密和数据保护义务约束。',
          ],
        },
        {
          heading: '信息共享保障',
          paragraphs: [
            'HourX 不出售或交易客户数据。',
            '跨境访问和传输受适用的数据保护要求约束。',
          ],
        },
        {
          heading: '4. 通信同意',
          paragraphs: [
            '使用 HourX 即表示您同意接收预订确认、服务更新及账户通知。',
            '营销信息为可选内容，您可随时退订。',
          ],
        },
        {
          heading: '5. Cookie 政策',
          paragraphs: [
            'HourX 网站可能使用 Cookie 及类似跟踪技术来记住偏好、保持登录状态并分析网站流量。您可以通过浏览器设置控制或禁用 Cookie，但这样做可能影响网站的部分功能。',
          ],
        },
        {
          heading: '6. 数据保护',
          paragraphs: [
            'HourX 通过技术和组织措施保护个人信息，防止未经授权的访问、丢失或滥用。',
          ],
        },
        {
          heading: '数据保留',
          paragraphs: [
            'HourX 会在提供服务、履行法律、税务或监管义务及解决争议所需的期限内保留个人数据。客户记录通常保留至账户关闭或最后一次预订后 2 年，期满后删除或匿名化。',
            '账户删除后，HourX 可能保留履行法律、税务或监管义务或解决争议所需的特定记录，并在相关用途结束后删除或匿名化这些记录。',
          ],
        },
        {
          heading: '7. 用户权利和隐私联系渠道',
          paragraphs: ['用户可以申请：'],
          bullets: [
            '访问其个人数据。',
            '更正不准确的信息。',
            '申请删除账户及关联个人数据，适用上述保留例外。',
          ],
          links: [
            privacyContact,
            { label: '申请删除账户及数据', href: '/data-deletion' },
          ],
        },
        {
          heading: '8. 政策更新',
          paragraphs: [
            'HourX 可能更新本隐私政策，并在本页面显示更新日期。',
          ],
        },
      ],
    },
    deletion: {
      title: '账户及数据删除申请',
      lastUpdated: privacyRevision,
      intro: 'HourX Portal Co. L.L.C S.O.C 处理 HourX Home 和 HourX Supplier 的账户及关联数据删除申请。',
      sections: [
        {
          heading: '如何申请删除账户',
          paragraphs: [
            '请发送邮件给 HourX 支持团队，申请删除您的账户和关联个人数据。卸载 App 后，您仍可通过邮件提交申请。',
            '请在申请中提供以下信息：',
          ],
          bullets: [
            '您的姓名',
            '您使用的 App（HourX Home 或 HourX Supplier）',
            '与账户绑定的手机号或电子邮箱',
            '您希望删除账户及关联数据，还是只删除特定个人数据',
          ],
          links: [privacyContact],
        },
        {
          heading: '申请处理流程',
          paragraphs: [
            'HourX 支持团队将在 7 个工作日内审核您的申请，并可能联系您验证账户归属。验证后，HourX 将按申请删除账户及关联个人数据，或删除您指定的个人数据。下文所述的保留例外适用。',
          ],
        },
        {
          heading: '可能保留的记录',
          paragraphs: [
            'HourX 可能保留履行法律、税务或监管义务或解决争议所需的特定预订、付款或结算记录，并在相关用途结束后删除或匿名化这些记录。',
          ],
        },
      ],
    },
  },
};

export const resolveLegalLocale = (locale: string): LegalLocale =>
  locale === 'zh' || locale.startsWith('zh') ? 'zh' : 'en';
