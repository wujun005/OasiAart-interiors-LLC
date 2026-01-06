const en = {
  common: {
    back: 'Back',
    submit: 'Submit',
    login: 'Login',
    reserve: 'Book',
    keepPxTip: 'Keep px',
  },
  home: {
    navTitle: 'OasiAart Mobile',
    login: 'Login',
    notice:
      'Home cleaning, commercial maintenance, deep cleaning and appliance care can all be booked online. Same-day service available.',
    shortcutsTitle: 'Quick Links',
    popularTitle: 'Popular Services',
    reviewsTitle: 'Customer Voices',
    bannerCta: 'Book Now',
    tabbar: {
      home: 'Home',
      services: 'Services',
      profile: 'Me',
    },
    banners: [
      { title: 'Daily Cleaning', desc: 'Basic cleaning + organizing. Book today, serve today.', image: 'daily-cleaning.png' },
      { title: 'Deep Refresh', desc: 'Heavy kitchen degreasing and mite removal for peace of mind.', image: 'deep-cleaning.png' },
      { title: 'Appliance Care', desc: 'Fridge/AC/washer deep clean to extend lifespan.', image: 'appliance-cleaning.png' },
    ],
    shortcuts: [
      { text: 'Book Service', icon: 'calendar-o', to: '/services' },
      { text: 'Price Estimate', icon: 'diamond', to: '/services' },
      { text: 'Contact CS', icon: 'service-o', to: '/login' },
      { text: 'My Orders', icon: 'orders-o', to: '/login' },
    ],
    services: [
      {
        title: 'Deep Home Clean',
        desc: 'Kitchen/bathroom degrease, mattress mite removal, full disinfection',
        duration: '2-3h · 2 staff',
        price: 'From ¥199',
        tags: ['Deep Clean', 'Mite Removal'],
        thumb: 'deep-cleaning.png',
      },
      {
        title: 'Routine Cleaning',
        desc: 'Living/bedroom upkeep plus basic organizing',
        duration: '1.5-2h · 1 staff',
        price: 'From ¥129',
        tags: ['Frequent', 'On-time'],
        thumb: 'daily-cleaning.png',
      },
      {
        title: 'Appliance Deep Wash',
        desc: 'Fridge, washer, AC deep clean and sanitize',
        duration: '90 min · Specialist',
        price: 'From ¥159',
        tags: ['Pro Tools', 'Eco'],
        thumb: 'appliance-cleaning.png',
      },
    ],
    reviews: [
      { user: 'Ms. Chen · Baolong', comment: 'Done in two hours, tidy organizing. Will book again.', score: 4.5 },
      { user: 'Mr. Li · Binjiang', comment: 'Range hood spotless, technician on time.', score: 5 },
      { user: 'Ms. Zhao · Jiangnan', comment: 'AC blows fresh now, tools were complete.', score: 4.5 },
    ],
  },
  services: {
    navTitle: 'Services',
    back: 'Back',
    schemes: 'Featured Plans',
    tabs: [
      {
        name: 'cleaning',
        title: 'Home Cleaning',
        plans: [
          { title: 'Routine · Standard', desc: 'Living/bedroom basic clean + desk tidy', price: 'From ¥129', duration: '1.5h', icon: 'brush-o' },
          { title: 'Deep · Kitchen/Bath', desc: 'Heavy grease removal + disinfection', price: 'From ¥199', duration: '3h', icon: 'fire' },
        ],
      },
      {
        name: 'appliance',
        title: 'Appliance Wash',
        plans: [
          { title: 'AC Steam Clean', desc: 'Indoor+outdoor unit sanitize, restore airflow', price: 'From ¥159', duration: '90 min', icon: 'underway-o' },
          { title: 'Fridge Odor Clean', desc: 'Seal strip wash, deep deodorizing', price: 'From ¥129', duration: '60 min', icon: 'smile' },
        ],
      },
      {
        name: 'commercial',
        title: 'Commercial',
        plans: [
          { title: 'Store Opening Clean', desc: 'Floor/glass deep clean before opening', price: 'From ¥699', duration: 'Half day', icon: 'shop-o' },
          { title: 'Monthly Care', desc: 'Scheduled visits to keep it pristine', price: 'From ¥1299', duration: 'Monthly', icon: 'balance-list-o' },
        ],
      },
    ],
    contact: {
      title: 'Booking & Inquiry',
      name: 'Name',
      phone: 'Phone',
      note: 'Need',
      namePlaceholder: 'Please enter name',
      phonePlaceholder: 'We’ll confirm time via phone',
      notePlaceholder: 'e.g. Deep clean + fridge wash, weekend visit',
      submit: 'Submit Booking',
      or: 'or',
      login: 'Login to view orders',
    },
    toast: {
      needPhone: 'Please leave a phone number',
      submitted: 'Submitted, our agent will contact you shortly',
    },
  },
  auth: {
    navTitle: 'Login',
    back: 'Back',
    welcome: 'Welcome back',
    desc: 'See bookings and membership perks on mobile',
    mobile: 'Mobile',
    code: 'Code',
    mobilePlaceholder: 'Enter mobile number',
    codePlaceholder: 'Enter SMS code',
    sendCode: 'Send Code',
    submit: 'Login / Register',
    other: 'Other methods',
    coming: 'Coming soon',
    toast: {
      needMobile: 'Please enter mobile number',
      needAll: 'Please complete all fields',
      success: 'Login success',
      sent: 'Code sent',
    },
  },
}

export default en
