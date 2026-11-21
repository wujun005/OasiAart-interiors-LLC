import type { AxiosAdapter } from 'axios';

const labels = (zh: string, en: string) => ({ zh, en });
const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit',
});
const today = dayFormat.format(new Date());
const dayAt = (offset: number, from = today) => {
  const date = new Date(`${from}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
const dailyCounts = [0, 1, 0, 2, 0, 1, 2, 1, 0, 3, 2, 4, 1, 3];
const recentJoinDates = dailyCounts.flatMap((count, index) => Array(count).fill(dayAt(index - 13)) as string[]);
const categories = [
  [labels('家庭清洁', 'Home cleaning'), [
    labels('日常保洁', 'Regular cleaning'), labels('深度清洁', 'Deep cleaning'),
    labels('搬入搬出清洁', 'Move-in and move-out cleaning'), labels('沙发清洁', 'Sofa cleaning'),
  ]],
  [labels('家居维修', 'Home maintenance'), [
    labels('空调保养', 'AC maintenance'), labels('水管维修', 'Plumbing repair'),
    labels('电气维修', 'Electrical repair'), labels('家具组装', 'Furniture assembly'),
  ]],
  [labels('健康护理', 'Wellness'), [
    labels('舒缓按摩', 'Relaxation massage'), labels('运动按摩', 'Sports massage'), labels('足部护理', 'Foot care'),
  ]],
  [labels('其他家政', 'Other home services'), []],
] as const;
const packageGroups = [
  [labels('家居焕新套餐', 'Home refresh bundles'), [
    labels('全屋深度焕新', 'Whole-home refresh'), labels('搬家安心组合', 'Move-day essentials'),
    labels('布艺家具焕新', 'Upholstery refresh'),
  ]],
  [labels('定期护理套餐', 'Recurring care bundles'), [
    labels('每月清洁计划', 'Monthly cleaning plan'), labels('季节空调养护', 'Seasonal AC care'),
  ]],
] as const;

const supplierNames = [
  '晴朗家政', '绿洲清洁', '棕榈家居', '安心维修', '海湾护理', '悦居服务', '新叶家庭服务', '白沙生活',
  '晨光家政', '珊瑚清洁', '城市好助手', '云杉护理', '蓝湾到家', '松林清洁', '暖风维修', '橙树服务',
  '花园家政', '银沙生活', '安邻服务', '新月护理', '石榴到家', '清风保洁', '北岸家庭服务', '甜橙家政',
];
const suppliers = supplierNames.map((supplierName, index) => {
  const supplierType = index % 4 === 3 ? 2 : 1;
  const onboardingStatus = index < 18 ? 2 : [0, 1, 3][index % 3];
  const joinedIndex = index - (supplierNames.length - recentJoinDates.length);
  const createDate = recentJoinDates[joinedIndex] ?? dayAt(index - 24);
  return {
    supplierId: index + 1, supplierName, supplierNo: `DEMO-${String(index + 1).padStart(3, '0')}`,
    supplierType, supplierTypeI18n: supplierType === 2 ? labels('个人', 'Individual') : labels('企业', 'Company'),
    onboardingStatus,
    onboardingStatusI18n: [labels('草稿', 'Draft'), labels('已提交', 'Submitted'), labels('已通过', 'Approved'), labels('已驳回', 'Rejected')][onboardingStatus],
    status: index % 9 === 8 ? 0 : 1,
    createTime: `${createDate}T12:00:00+04:00`,
  };
});

type CatalogName = ReturnType<typeof labels>;
type DrillRow = typeof suppliers[number] & {
  quoteStatus: number | null;
  quoteStatusI18n: CatalogName | null;
  fulfillable: boolean;
  profitRate: number | null;
};
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const statusNames = [labels('草稿', 'Draft'), labels('待审核', 'Pending review'), labels('已通过', 'Approved'), labels('已拒绝', 'Rejected')];
const supplierDrills = new Map<number, DrillRow[]>();
const makeItem = (nameI18n: CatalogName, id: number, { supplierLimit, negative }: { supplierLimit?: number; negative?: boolean } = {}) => {
  let ready = 0;
  const mockRows: DrillRow[] = suppliers.filter((row) => (row.supplierId + id) % 5 < 3).map((row) => {
    const slot = (row.supplierId + id) % 6;
    const quoteStatus = id % 5 === 0 ? (slot === 1 ? 1 : null) : [2, 2, 1, 0, 3, null][slot];
    const canFulfill = row.status === 1 && row.onboardingStatus === 2 && quoteStatus === 2;
    const fulfillable = canFulfill && (supplierLimit == null || ready < supplierLimit);
    const loss = negative && fulfillable && ready === 0;
    if (fulfillable) ready++;
    return {
      ...row, quoteStatus, quoteStatusI18n: quoteStatus === null ? null : statusNames[quoteStatus],
      fulfillable, profitRate: quoteStatus === 2 ? (loss ? -0.085 : (14 + (row.supplierId * 11 % 25)) / 100) : null,
    };
  });
  const rows = id % 11 === 0 ? [] : mockRows;
  rows.sort((a, b) => (b.profitRate ?? -1) - (a.profitRate ?? -1));
  supplierDrills.set(id, rows);
  const profits = rows.flatMap(({ profitRate }) => profitRate === null ? [] : [profitRate]);
  return {
    nameI18n, status: 1, selectedSupplierCount: rows.length,
    quotedSupplierCount: rows.filter((row) => row.quoteStatus !== null).length,
    fullyApprovedSupplierCount: rows.filter((row) => row.quoteStatus === 2).length,
    reviewingSupplierCount: rows.filter((row) => row.quoteStatus === 1).length,
    pendingQuoteSupplierCount: rows.filter((row) => row.quoteStatus !== 1 && row.quoteStatus !== 2).length,
    fulfillableSupplierCount: rows.filter((row) => row.fulfillable).length,
    avgProfitRate: average(profits),
    minProfitRate: profits.length ? Math.min(...profits) : null,
    maxProfitRate: profits.length ? Math.max(...profits) : null,
  };
};

const servicesByCategory = categories.map(([, names], categoryIndex) =>
  names.map((name, index) => {
    const spuId = 100 + 10 * categoryIndex + index;
    const supplierLimit = spuId === 100 ? 0 : spuId === 101 ? 1 : undefined;
    return {
      spuId, spuCode: `DEMO-S${spuId}`, spuName: name.zh, packageService: 0, quoteMode: 1,
      ...makeItem(name, spuId, { supplierLimit, negative: spuId === 102 }),
    };
  }),
);
const services = servicesByCategory.flat();
const duplicateService = services.find(({ spuId }) => spuId === 102)!;
const serviceCategories = categories.map(([nameI18n], categoryIndex) => {
  // One negative-margin service is genuinely bound to two catalog categories.
  const services = categoryIndex === 1
    ? [...servicesByCategory[categoryIndex], duplicateService]
    : servicesByCategory[categoryIndex];
  const rows = services.flatMap((service) => supplierDrills.get(service.spuId) ?? []);
  const coveredServiceCount = services.filter((service) => service.fulfillableSupplierCount > 0).length;
  return {
    categoryId: categoryIndex + 1, categoryName: nameI18n.zh, nameI18n, services, coveredServiceCount,
    onShelfServiceCount: services.length, serviceCount: services.length, coverageRate: coveredServiceCount / (services.length || 1),
    quotedSupplierCount: new Set(rows.filter(({ quoteStatus }) => quoteStatus !== null).map(({ supplierId }) => supplierId)).size,
    fulfillableSupplierCount: new Set(rows.filter(({ fulfillable }) => fulfillable).map(({ supplierId }) => supplierId)).size,
  };
});
const packageCategories = packageGroups.map(([nameI18n, names], categoryIndex) => {
  const packages = names.map((name, index) => {
    const packageId = 201 + 10 * categoryIndex + index;
    const supplierLimit = packageId === 203 ? 0 : packageId === 211 ? 1 : undefined;
    return {
      packageId, packageCode: `DEMO-P${packageId}`, packageName: name.zh,
      ...makeItem(name, packageId, { supplierLimit, negative: packageId === 202 || packageId === 212 }),
      status: packageId === 212 ? 0 : 1,
    };
  });
  const onShelf = packages.filter((item) => item.status === 1);
  const coveredPackageCount = onShelf.filter((item) => item.fulfillableSupplierCount > 0).length;
  const rows = packages.flatMap((item) => supplierDrills.get(item.packageId) ?? []);
  return {
    categoryId: categoryIndex + 21, categoryName: nameI18n.zh, nameI18n, packages, coveredPackageCount,
    onShelfPackageCount: onShelf.length, packageCount: packages.length, coverageRate: coveredPackageCount / (onShelf.length || 1),
    selectedSupplierCount: new Set(rows.map(({ supplierId }) => supplierId)).size,
    fulfillableSupplierCount: new Set(rows.filter(({ fulfillable }) => fulfillable).map(({ supplierId }) => supplierId)).size,
  };
});
const packages = packageCategories.flatMap((category) => category.packages);
const refFor = (supplierId: number, id: number, nameI18n: CatalogName) => {
  const drillRow = supplierDrills.get(id)?.find((row) => row.supplierId === supplierId);
  return drillRow ? [{ id, name: nameI18n.zh, nameI18n, fulfillable: drillRow.fulfillable }] : [];
};
const profitBand = (rate: number) => rate >= 0.3 ? 1 : rate < 0.2 ? 3 : 2;
const supplierRows = suppliers.map((row) => {
  const serviceRefs = services.flatMap(({ spuId, nameI18n }) => refFor(row.supplierId, spuId, nameI18n));
  const packageRefs = packages.flatMap(({ packageId, nameI18n }) => refFor(row.supplierId, packageId, nameI18n));
  const profits = serviceRefs.flatMap(({ id }) => {
    const rate = supplierDrills.get(id)?.find((item) => item.supplierId === row.supplierId)?.profitRate;
    return rate == null ? [] : [rate];
  });
  const avgProfitRate = average(profits);
  return {
    ...row, services: serviceRefs, packages: packageRefs,
    selectedServiceCount: serviceRefs.length, effectiveServiceCount: serviceRefs.filter((item) => item.fulfillable).length,
    selectedPackageCount: packageRefs.length, fulfillablePackageCount: packageRefs.filter((item) => item.fulfillable).length,
    avgProfitRate, profitBand: avgProfitRate === null ? null : profitBand(avgProfitRate),
  };
}).sort((a, b) => (b.avgProfitRate ?? -1) - (a.avgProfitRate ?? -1));
const quotes = services.flatMap(({ spuId }) => supplierDrills.get(spuId) ?? []);
const effectiveMargins = quotes.flatMap(({ profitRate }) => profitRate === null ? [] : [profitRate]);
const coveredServiceCount = services.filter((item) => item.fulfillableSupplierCount > 0).length;
const onShelfPackages = packages.filter((item) => item.status === 1);
const coveredPackageCount = onShelfPackages.filter((item) => item.fulfillableSupplierCount > 0).length;
const onboardingTrend = (startDate?: string, endDate?: string) => {
  const start = startDate || dayAt(-13, endDate || today);
  const end = endDate || (startDate ? [dayAt(13, start), today].sort()[0] : today);
  const count = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
  if (!Number.isFinite(count) || count < 1 || count > 366) throw new Error('Invalid preview date range.');
  return Array.from({ length: count }, (_, offset) => {
    const date = dayAt(offset, start);
    const joined = suppliers.filter((row) => row.createTime.slice(0, 10) === date);
    return {
      date, newSupplierCount: joined.length,
      suppliers: joined.map(({ supplierId, supplierName, supplierNo, supplierType }) => (
        { supplierId, supplierName, supplierNo, supplierType }
      )),
    };
  });
};
const overview = {
  summary: {
    serviceCategoryCount: serviceCategories.length, onShelfServiceCount: services.length, coveredServiceCount,
    serviceCoverageRate: coveredServiceCount / services.length, offShelfServiceCount: 2,
    packageCategoryCount: packageCategories.length, onShelfPackageCount: onShelfPackages.length, coveredPackageCount,
    packageCoverageRate: coveredPackageCount / onShelfPackages.length, supplierTotal: suppliers.length,
    offShelfPackageCount: packages.length - onShelfPackages.length,
    supplierEnabled: suppliers.filter((row) => row.status === 1).length,
    supplierOnboarded: suppliers.filter((row) => row.onboardingStatus === 2).length,
    supplierPendingReview: suppliers.filter((row) => row.onboardingStatus === 1).length,
    supplierRejected: suppliers.filter((row) => row.onboardingStatus === 3).length,
    supplierCompanyCount: suppliers.filter((row) => row.supplierType === 1).length,
    supplierIndividualCount: suppliers.filter((row) => row.supplierType === 2).length,
    supplierWithQuote: new Set(quotes.filter((row) => row.quoteStatus !== null).map(({ supplierId }) => supplierId)).size,
    supplierWithEffectiveQuote: new Set(quotes.filter((row) => row.profitRate !== null).map(({ supplierId }) => supplierId)).size,
    quotePendingCount: quotes.filter(({ quoteStatus }) => quoteStatus === 1).length,
    quoteRejectedCount: quotes.filter(({ quoteStatus }) => quoteStatus === 3).length,
    quoteDraftCount: quotes.filter(({ quoteStatus }) => quoteStatus === 0).length,
    newSuppliersToday: dailyCounts.at(-1),
    newSuppliersLast3Days: dailyCounts.slice(-3).reduce((sum, count) => sum + count, 0),
    newSuppliersLast7Days: dailyCounts.slice(-7).reduce((sum, count) => sum + count, 0),
    avgProfitRate: average(effectiveMargins),
    minProfitRate: Math.min(...effectiveMargins),
    maxProfitRate: Math.max(...effectiveMargins),
  },
  onboardingTrend: onboardingTrend(),
  profitBands: [labels('高利润', 'High margin'), labels('中利润', 'Mid margin'), labels('低利润', 'Low margin')].map(({ zh, en }, index) => ({
    band: index + 1, bandI18nZh: zh, bandI18nEn: en,
    supplierCount: supplierRows.filter((row) => row.profitBand === index + 1).length,
    quotePairCount: effectiveMargins.filter((rate) => profitBand(rate) === index + 1).length,
  })),
};

type SupplierQuery = {
  keyword?: string;
  status?: number;
  supplierType?: number;
  onboardingStatus?: number;
  onlyFulfillable?: boolean;
  createTimeStart?: string;
  createTimeEnd?: string;
  pageNum?: number;
  pageSize?: number;
};
const pageOf = <T>(rows: T[], query: { pageNum?: number; pageSize?: number }, defaultSize = 20) => {
  const pageNum = query.pageNum ?? 1;
  const pageSize = query.pageSize ?? defaultSize;
  const total = rows.length;
  return { list: rows.slice((pageNum - 1) * pageSize, pageNum * pageSize), pageNum, pageSize, total, totalPages: Math.ceil(total / pageSize) };
};
const pageSuppliers = (query: SupplierQuery) => {
  const keyword = query.keyword?.trim().toLowerCase();
  const matches = supplierRows.filter((row) => (
    (!keyword || `${row.supplierName} ${row.supplierNo}`.toLowerCase().includes(keyword)) &&
    (query.status == null || row.status === query.status) &&
    (query.supplierType == null || row.supplierType === query.supplierType) &&
    (query.onboardingStatus == null || row.onboardingStatus === query.onboardingStatus) &&
    (!query.createTimeStart || row.createTime.slice(0, 10) >= query.createTimeStart) &&
    (!query.createTimeEnd || row.createTime.slice(0, 10) <= query.createTimeEnd) &&
    (!query.onlyFulfillable || row.effectiveServiceCount > 0 || row.fulfillablePackageCount > 0)
  ));
  return pageOf(matches, query);
};

const orderFixtures = [
  { time: '08:30', service: 0, assigned: null },
  { time: '09:30', service: 1, assigned: 0 },
  { time: '10:00', service: 2, assigned: null },
  { time: '11:30', service: 1, assigned: 4 },
  { time: '12:30', service: 2, assigned: 0 },
  { time: '13:30', service: 1, assigned: null },
  { time: '15:30', service: 4, assigned: 3 },
].map(({ time, service, assigned }, index) => ({
  orderId: 71_001 + index, orderNo: `DEMO-HX${71_001 + index}`,
  orderStatus: 1, paymentStatus: 1, packageOrder: false,
  serviceDate: today, serviceTime: `${today} ${time}`,
  orderTime: `${dayAt(-1)} 13:20:00`,
  productName: services[service].spuName, productNameI18n: services[service].nameI18n,
  packageView: { packageOrder: false },
  assignedSuppliers: assigned === null ? [] : [{ supplierId: index + 1, serviceStatus: assigned }],
}));
const pageOrders = (query: {
  pageNum?: number; pageSize?: number; serviceTimeStart?: string; serviceTimeEnd?: string; orderNo?: string;
}) => pageOf(orderFixtures.filter((order) => (
  (!query.serviceTimeStart || order.serviceDate >= query.serviceTimeStart) &&
  (!query.serviceTimeEnd || order.serviceDate <= query.serviceTimeEnd) &&
  (!query.orderNo || order.orderNo === query.orderNo)
)), query, 50);

const quotesForSupplier = (supplierId: number) => services.flatMap((service) => {
  const quote = supplierDrills.get(service.spuId)?.find((row) => row.supplierId === supplierId);
  if (!quote) return [];
  const category = serviceCategories.find(({ services: items }) => items.includes(service));
  return [{
    spuId: service.spuId, spuCode: service.spuCode, spuName: service.spuName, nameI18n: service.nameI18n,
    categoryId: category?.categoryId, categoryName: category?.categoryName,
    status: quote.quoteStatus, statusI18n: quote.quoteStatusI18n,
    effective: quote.quoteStatus === 2,
    priceChangeStatus: quote.quoteStatus === 2 && service.spuId % 3 === 0 && supplierId % 2 === 1 ? 1 : undefined,
  }];
});
const quoteSuppliers = suppliers.map((row) => {
  const versions = quotesForSupplier(row.supplierId);
  return {
    ...row, id: row.supplierId, latestSubmitTime: row.createTime,
    serviceCount: versions.length,
    pendingCount: versions.filter(({ status }) => status === 1).length,
    priceChangePendingCount: versions.filter(({ priceChangeStatus }) => priceChangeStatus === 1).length,
    effectiveCount: versions.filter(({ effective }) => effective).length,
    quoteStatuses: versions.map(({ status }) => status),
  };
});

export const mockDashboardRequest: AxiosAdapter = async (config) => {
  const url = config.url ?? '';
  const endpoint = config.url?.match(/^\/api\/platform\/supplierDashboard\/(.+)$/)?.[1];
  const drill = endpoint?.match(/^(service|package)\/(\d+)\/suppliers$/);
  const fulfillable = endpoint?.match(/^supplier\/(\d+)\/fulfillableServices$/);
  const onboardingDetail = url.match(/^\/api\/supplier\/onboarding\/detail\/(\d+)$/);
  const payload = () => typeof config.data === 'string' ? JSON.parse(config.data) : config.data ?? {};
  let data: unknown;
  if (config.method === 'get' && endpoint === 'overview') data = overview;
  else if (config.method === 'get' && endpoint === 'catalog') data = { serviceCategories, packageCategories };
  else if (config.method === 'post' && endpoint === 'suppliers') data = pageSuppliers(payload());
  else if (config.method === 'get' && endpoint === 'onboardingTrend') data = onboardingTrend(config.params?.startDate, config.params?.endDate);
  else if (config.method === 'get' && drill) data = supplierDrills.get(Number(drill[2])) ?? [];
  else if (config.method === 'get' && fulfillable) {
    data = supplierRows.find((row) => row.supplierId === Number(fulfillable[1]))?.services.filter((item) => item.fulfillable) ?? [];
  } else if (config.method === 'post' && url === '/api/orderHeader/page') data = pageOrders(payload());
  else if (config.method === 'post' && url === '/api/platform/supplierQuote/page') {
    const query = payload();
    data = pageOf(quoteSuppliers.filter((row) => (
      (query.quoteStatus == null || row.quoteStatuses.includes(query.quoteStatus)) &&
      (query.onboardingStatus == null || row.onboardingStatus === query.onboardingStatus) &&
      (!query.keyword || `${row.supplierName} ${row.supplierNo}`.includes(query.keyword))
    )), query, 10);
  } else if (config.method === 'post' && url === '/api/supplier/onboarding/page') {
    const query = payload();
    data = pageOf(quoteSuppliers.filter((row) => query.status == null || row.onboardingStatus === query.status)
      .map((row) => ({ ...row, status: row.onboardingStatus, pendingReview: row.onboardingStatus === 1 || row.pendingCount > 0 })), query);
  } else if (config.method === 'get' && onboardingDetail) {
    const row = quoteSuppliers.find(({ id }) => id === Number(onboardingDetail[1]));
    data = row && { ...row, companyName: row.supplierName, status: row.onboardingStatus };
  } else if (config.method === 'get' && url === '/api/platform/supplierQuote/services') {
    data = quotesForSupplier(Number(config.params?.supplierId));
  } else if (config.method === 'get' && url === '/api/platform/supplierQuote/skus') {
    data = { ...quotesForSupplier(Number(config.params?.supplierId)).find((row) => row.spuId === Number(config.params?.spuId)), quoteMode: 1, skus: [], attaches: [] };
  } else if (config.method === 'get' && url.endsWith('/client/supplier/onboarding/service-categories')) {
    data = serviceCategories.map(({ categoryId, categoryName, nameI18n }) => ({ categoryId: String(categoryId), categoryName, nameI18n }));
  } else if (config.method === 'get' && ['/api/supplier/tools/services', '/api/supplier/tools/packages/quotes'].includes(url)) data = [];
  else throw new Error(`Unmocked supplier coverage request (${config.method} ${url}).`);
  const response = { success: true, message: '操作成功', data };
  if (url.endsWith('/client/supplier/onboarding/service-categories') && config.responseType !== 'json') {
    return { config, data: JSON.stringify(response), headers: {}, status: 200, statusText: 'OK' };
  }
  return { config, data: response, headers: {}, status: 200, statusText: 'OK' };
};
