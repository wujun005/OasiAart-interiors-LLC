export type LegalDocType = 'terms' | 'privacy' | 'deletion';

type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalDoc = {
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
};

type LegalLocale = 'en' | 'zh';

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
            'All cancellations, rescheduling, and refunds follow the HourX Service Policies outlined below.',
          ],
        },
        {
          heading: '8.1 Stripe Processing Fees (Non-Refundable)',
          paragraphs: [
            'All payments are processed securely through Stripe. Stripe deducts its processing fee immediately, and this fee is non-refundable.',
            'Stripe fee: 3.9% + AED 1 per transaction, applied to all cards.',
            'For cancellations made more than 6 hours before the scheduled service, refunds are issued minus the Stripe fee.',
            'HourX absorbs the Stripe fee only when HourX cancels the booking.',
          ],
        },
        {
          heading: '8.2 Cancellation Timing & Applicable Refunds',
          paragraphs: [
            'Instant Cancellation or Rescheduling Grace Period (Within 10 Minutes of Booking)',
            'Customers may cancel or reschedule their booking within 10 minutes of placing it, regardless of how soon the service is scheduled to begin.',
            "If cancelling, a refund will be issued minus Stripe's non-refundable processing fee. If rescheduling instead, there is no charge - see Section 8.3.",
            'This protects customers who book by mistake or change their mind immediately after booking.',
            'Cancellation Made More Than 6 Hours Before the Service Time',
            'If a customer cancels more than 6 hours before the scheduled service time, they are eligible for a refund.',
            "Because Stripe's processing fee is non-refundable, the refund will be issued minus the Stripe fee charged at the time of payment:",
            'Refund = booking amount - (3.9% + AED 1)',
            'Cancellation Made Less Than 6 Hours Before the Service Time',
            'If a customer cancels within 6 hours of the scheduled service time, the booking becomes non-refundable.',
            'Refund amount: 0%',
            'Customers may reschedule the booking only if requested more than 3 hours before service, or cancel the booking and receive no refund.',
          ],
        },
        {
          heading: '8.3 Rescheduling Policy',
          paragraphs: [
            'Rescheduling Within 10 Minutes of Booking',
            'Customers may reschedule their booking within 10 minutes of placing it at no additional cost, regardless of how soon the service is scheduled to begin. This mirrors the grace period in Section 8.2 and takes priority over the time-based rules below, even if the booking already falls inside the 3-hour or 6-hour windows.',
            'Rescheduling More Than 3 Hours Before the Scheduled Service',
            'Customers may reschedule more than 3 hours before the scheduled service time at no additional cost. The original payment remains valid for the new service time.',
            'Rescheduling Less Than 3 Hours Before the Scheduled Service',
            'If a customer requests to reschedule less than 3 hours before the scheduled service time, rescheduling is not allowed. Because service providers have already allocated time and resources, the booking becomes non-refundable.',
            'In this situation, customers may cancel the booking and receive no refund.',
            'HourX-Initiated Rescheduling',
            'HourX may reschedule a booking due to provider unavailability, operational issues, safety concerns, incorrect booking details, or force majeure events. Customers may accept the new time or request a full refund.',
          ],
        },
        {
          heading: '8.4 HourX-Initiated Cancellations',
          paragraphs: [
            'HourX may cancel a booking when the service cannot be delivered safely or correctly. In these cases, customers receive a full refund, including the Stripe fee.',
            'Reasons may include:',
          ],
          bullets: [
            'Provider unavailability.',
            'Operational or technical issues.',
            'Safety concerns.',
            'Incorrect or incomplete booking details.',
            'Service not applicable.',
            'Force majeure events.',
          ],
        },
        {
          heading: '8.5 Refund Method and Timeline',
          paragraphs: [
            'Refunds are issued and processed back to the original payment method.',
            "Processing times depend on the customer's bank and typically take 5-10 business days.",
            'Customers receive an email confirmation once the refund is initiated.',
          ],
        },
        {
          heading: '8.6 Non-Refundable Situations',
          paragraphs: ['No refund will be issued when:'],
          bullets: [
            'Cancellation is made less than 6 hours before the service.',
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
      lastUpdated: '____',
      sections: [
        {
          heading: '15. Information We Collect',
          paragraphs: [
            'HourX collects account details (name, email, phone), booking history, address and service location, communication logs, and device and usage data.',
            'Payment information is processed by Stripe; HourX does not store card numbers.',
          ],
        },
        {
          heading: '16. How We Use Your Information',
          paragraphs: ['Your data is used to:'],
          bullets: [
            'Manage bookings and service delivery.',
            'Communicate updates and confirmations.',
            'Improve platform performance.',
            'Ensure safety and compliance.',
            'Provide customer support.',
          ],
        },
        {
          heading: '17. Sharing of Information',
          paragraphs: [
            'HourX shares data only with the following parties:',
          ],
          bullets: [
            'Approved service providers for booking and service delivery.',
            'Stripe for payment processing.',
            'Legal authorities when required by UAE law.',
            "HourX's technical/development and platform administration team, including personnel located outside the UAE, for maintaining, hosting, and operating the platform, bound by confidentiality and data protection obligations.",
          ],
        },
        {
          heading: 'Information Sharing Safeguards',
          paragraphs: [
            'HourX does not sell or trade customer data.',
            'Any cross-border transfer of personal data described above is carried out in accordance with the safeguards required under UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL).',
          ],
        },
        {
          heading: '18. Communication Consent',
          paragraphs: [
            'By using HourX, you consent to receive booking confirmations, service updates, and account notifications.',
            'Marketing messages are optional and can be opted out at any time.',
          ],
        },
        {
          heading: '19. Cookie Policy',
          paragraphs: [
            'The HourX website may use cookies and similar tracking technologies to remember preferences, keep you signed in, and analyze site traffic. You can control or disable cookies through your browser settings; doing so may affect certain website functionality.',
          ],
        },
        {
          heading: '20. Data Protection',
          paragraphs: [
            'HourX uses secure systems and follows UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL) and other applicable UAE data protection standards to safeguard personal information, applying appropriate technical and organizational measures to protect it from unauthorized access, loss, or misuse.',
          ],
        },
        {
          heading: 'Data Retention',
          paragraphs: [
            'HourX retains personal data for as long as necessary to provide services, comply with legal, tax, and regulatory obligations (including UAE record-keeping requirements), and resolve disputes - typically for 2 years after account closure or the last booking, after which the data is securely deleted or anonymized.',
          ],
        },
        {
          heading: '21. User Rights',
          paragraphs: ['Users may request:'],
          bullets: [
            'Access to their data.',
            'Correction of inaccurate information.',
            'Deletion of personal data, subject to legal requirements.',
          ],
        },
        {
          heading: '22. Policy Updates',
          paragraphs: [
            'HourX may update these Terms & Conditions and Privacy Policy. Continued use of the platform constitutes acceptance of updated terms.',
          ],
        },
      ],
    },
    deletion: {
      title: 'User Data Deletion Request',
      lastUpdated: '____',
      intro: 'HourX Portal Co. L.L.C S.O.C',
      sections: [
        {
          heading: 'How to Request Data Deletion',
          paragraphs: [
            'Users can request deletion of their data by sending an email to: support@hourxportal.com',
            'Please include the following information in your request:',
          ],
          bullets: [
            'Your name',
            'Phone number used on our platform',
            'Description of your request',
          ],
        },
        {
          heading: 'Processing Time',
          paragraphs: [
            'We will process your data deletion request within 7 business days after receiving your request.',
          ],
        },
        {
          heading: 'Contact Information',
          paragraphs: [
            'HourX Portal Co. L.L.C S.O.C',
            'Dubai, United Arab Emirates',
            'Email: support@hourxportal.com',
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
          paragraphs: ['所有取消、改期及退款均适用以下 HourX 服务政策。'],
        },
        {
          heading: '8.1 Stripe 支付处理费（不可退还）',
          paragraphs: [
            '所有付款均通过 Stripe 安全处理。Stripe 会立即扣除支付处理费，该费用不可退还。',
            'Stripe 费用：所有银行卡统一按每笔交易 3.9% + AED 1 收取。',
            '如在预定服务时间前超过 6 小时取消，退款金额将扣除 Stripe 费用。',
            '仅当 HourX 取消预订时，Stripe 费用由 HourX 承担。',
          ],
        },
        {
          heading: '8.2 取消时间与适用退款',
          paragraphs: [
            '下单后 10 分钟内即时取消或改期宽限期',
            '无论距离服务开始还有多长时间，客户均可在下单后 10 分钟内取消或改期。',
            '如取消，将在扣除 Stripe 不可退还的支付处理费后退款；如改期，则不收取额外费用，详见第 8.3 节。',
            '此规则用于保护误下单或下单后立即改变决定的客户。',
            '服务开始前超过 6 小时取消',
            '如客户在预定服务时间前超过 6 小时取消，可获得退款。',
            '由于 Stripe 支付处理费不可退还，退款将扣除付款时收取的 Stripe 费用：',
            '退款金额 = 预订金额 -（3.9% + AED 1）',
            '服务开始前不足 6 小时取消',
            '如客户在预定服务时间前 6 小时内取消，该预订不可退款。',
            '退款金额：0%',
            '客户可以选择在服务开始前超过 3 小时提出改期，或取消预订且不获得退款。',
          ],
        },
        {
          heading: '8.3 改期政策',
          paragraphs: [
            '下单后 10 分钟内改期',
            '无论距离服务开始还有多长时间，客户均可在下单后 10 分钟内免费改期。该规则与第 8.2 节宽限期一致，并优先于下述时间规则，即使预订已经处于 3 小时或 6 小时时限内也同样适用。',
            '服务开始前超过 3 小时改期',
            '客户可在预定服务时间前超过 3 小时免费改期，原付款继续适用于新的服务时间。',
            '服务开始前不足 3 小时改期',
            '如客户在预定服务时间前不足 3 小时提出改期，则不允许改期。由于服务商已经安排时间和资源，该预订不可退款。',
            '在此情况下，客户只能取消预订且不获得退款。',
            'HourX 发起的改期',
            '如发生服务商无法提供服务、运营问题、安全问题、预订信息错误或不可抗力事件，HourX 可对预订进行改期。客户可以接受新时间或要求全额退款。',
          ],
        },
        {
          heading: '8.4 HourX 发起的取消',
          paragraphs: [
            '如服务无法安全或正确提供，HourX 可取消预订。在此情况下，客户将获得包含 Stripe 费用在内的全额退款。',
            '原因可能包括：',
          ],
          bullets: [
            '服务商无法提供服务。',
            '运营或技术问题。',
            '安全问题。',
            '预订信息错误或不完整。',
            '服务不适用。',
            '不可抗力事件。',
          ],
        },
        {
          heading: '8.5 退款方式与时间',
          paragraphs: [
            '退款将原路退回至原付款方式。',
            '处理时间取决于客户银行，通常需要 5-10 个工作日。',
            '退款发起后，客户将收到电子邮件确认。',
          ],
        },
        {
          heading: '8.6 不予退款的情形',
          paragraphs: ['以下情形不予退款：'],
          bullets: [
            '在服务开始前不足 6 小时取消。',
            '客户未允许服务人员进入服务场所。',
            '服务场所存在安全风险或无法进入。',
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
      lastUpdated: '____',
      sections: [
        {
          heading: '15. 我们收集的信息',
          paragraphs: [
            'HourX 收集账户资料（姓名、电子邮箱、电话）、预订历史、地址和服务地点、沟通记录，以及设备和使用数据。',
            '付款信息由 Stripe 处理；HourX 不存储银行卡号。',
          ],
        },
        {
          heading: '16. 我们如何使用您的信息',
          paragraphs: ['您的数据用于：'],
          bullets: [
            '管理预订和服务交付。',
            '发送更新和确认通知。',
            '改善平台性能。',
            '确保安全与合规。',
            '提供客户支持。',
          ],
        },
        {
          heading: '17. 信息共享',
          paragraphs: ['HourX 仅与以下对象共享数据：'],
          bullets: [
            '经批准的服务商，用于预订和服务交付。',
            'Stripe，用于处理付款。',
            '阿联酋法律要求时的主管机关。',
            'HourX 的技术、开发及平台管理团队，包括位于阿联酋境外、为维护、托管和运营平台而工作的人员；相关人员均受保密和数据保护义务约束。',
          ],
        },
        {
          heading: '信息共享保障',
          paragraphs: [
            'HourX 不出售或交易客户数据。',
            '上述任何个人数据跨境传输均按照阿联酋《2021 年第 45 号个人数据保护联邦法令》（PDPL）要求的保障措施进行。',
          ],
        },
        {
          heading: '18. 通信同意',
          paragraphs: [
            '使用 HourX 即表示您同意接收预订确认、服务更新及账户通知。',
            '营销信息为可选内容，您可随时退订。',
          ],
        },
        {
          heading: '19. Cookie 政策',
          paragraphs: [
            'HourX 网站可能使用 Cookie 及类似跟踪技术来记住偏好、保持登录状态并分析网站流量。您可以通过浏览器设置控制或禁用 Cookie，但这样做可能影响网站的部分功能。',
          ],
        },
        {
          heading: '20. 数据保护',
          paragraphs: [
            'HourX 使用安全系统，并遵守阿联酋《2021 年第 45 号个人数据保护联邦法令》（PDPL）及其他适用的数据保护标准，通过适当的技术和组织措施保护个人信息，防止未经授权的访问、丢失或滥用。',
          ],
        },
        {
          heading: '数据保留',
          paragraphs: [
            'HourX 会在提供服务、履行法律、税务和监管义务（包括阿联酋记录保存要求）及解决争议所需的期限内保留个人数据，通常保留至账户关闭或最后一次预订后 2 年，之后安全删除或匿名化。',
          ],
        },
        {
          heading: '21. 用户权利',
          paragraphs: ['用户可以申请：'],
          bullets: [
            '访问其个人数据。',
            '更正不准确的信息。',
            '在符合法律要求的前提下删除个人数据。',
          ],
        },
        {
          heading: '22. 政策更新',
          paragraphs: [
            'HourX 可更新本服务条款及隐私政策。继续使用平台即表示接受更新后的条款。',
          ],
        },
      ],
    },
    deletion: {
      title: '用户数据删除申请',
      lastUpdated: '____',
      intro: 'HourX Portal Co. L.L.C S.O.C',
      sections: [
        {
          heading: '如何申请数据删除',
          paragraphs: [
            '用户可通过发送邮件至 support@hourxportal.com 申请删除其数据。',
            '请在申请中提供以下信息：',
          ],
          bullets: [
            '您的姓名',
            '在平台使用的手机号',
            '删除申请说明',
          ],
        },
        {
          heading: '处理时效',
          paragraphs: [
            '我们将在收到申请后的 7 个工作日内完成数据删除处理。',
          ],
        },
        {
          heading: '联系方式',
          paragraphs: [
            'HourX Portal Co. L.L.C S.O.C',
            '迪拜，阿联酋',
            '邮箱：support@hourxportal.com',
          ],
        },
      ],
    },
  },
};

export const resolveLegalLocale = (locale: string): LegalLocale =>
  locale === 'zh' || locale.startsWith('zh') ? 'zh' : 'en';
