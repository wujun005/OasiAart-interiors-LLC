export type DispatchRiskStatus = 'unassigned' | 'awaiting';

export type DispatchRiskOrder = {
  orderId: string;
  orderNo: string;
  productName: string;
  productNameI18n: Record<string, string>;
  serviceTime: string;
  status: DispatchRiskStatus;
};

type DispatchRiskSnapshot = {
  checked: number;
  total: number;
  complete: boolean;
  counts: Record<DispatchRiskStatus, number>;
  orders: DispatchRiskOrder[];
};

const PAGE_SIZE = 50;
const MAX_PAGES = 5;

export function dispatchRiskOrdersQuery(date: string, pageNum: number) {
  return {
    pageNum,
    pageSize: PAGE_SIZE,
    serviceTimeStart: date,
    serviceTimeEnd: date,
    orderStatuses: [1],
    paymentStatuses: [1],
    packageOrder: false,
    sortField: 'serviceTime',
    sortOrder: 'ASC',
  };
}

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';

const id = (value: unknown) => {
  const identifier = typeof value === 'number' ? String(value) : text(value);
  return /^[1-9]\d*$/.test(identifier) ? identifier : '';
};

function assignmentRisk(order: Record<string, unknown>): DispatchRiskStatus | 'unknown' | null {
  const suppliers = order.assignedSuppliers;
  if (!Array.isArray(suppliers)) return 'unknown';
  if (suppliers.length === 0) return id(order.supplierId) ? 'unknown' : 'unassigned';

  const statuses = suppliers.map((value) => {
    const supplier = record(value);
    if (!id(supplier?.supplierId)) return '';
    return String(supplier?.serviceStatus ?? '');
  });
  if (statuses.includes('0')) return 'awaiting';
  return statuses.every((status) => ['1', '2', '3', '4'].includes(status)) ? null : 'unknown';
}

function orderPage(payload: unknown, expectedPage: number) {
  const envelope = record(payload);
  const page = record(envelope?.data ?? payload);
  const total = Number(page?.total);
  if (!page || !Array.isArray(page.list) || Number(page.pageNum) !== expectedPage ||
      page.total == null || !Number.isSafeInteger(total) || total < 0) {
    throw new Error('Invalid order page response');
  }
  return { list: page.list, total };
}

const startMinute = (schedule: string) => {
  const match = schedule.match(/(?:^|[ T])(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : Infinity;
};

export async function loadDispatchRisk(
  fetchPage: (query: ReturnType<typeof dispatchRiskOrdersQuery>) => Promise<unknown>,
  date: string,
  isCurrent = () => true,
): Promise<DispatchRiskSnapshot | null> {
  const rows = new Map<string, Record<string, unknown>>();
  let total = 0;
  for (let pageNum = 1; pageNum <= MAX_PAGES && isCurrent(); pageNum++) {
    try {
      const response = await fetchPage(dispatchRiskOrdersQuery(date, pageNum));
      if (!isCurrent()) return null;
      const page = orderPage(response, pageNum);
      total = Math.max(total, page.total);
      for (const item of page.list) {
        const row = record(item);
        const orderId = id(row?.orderId);
        if (row && orderId) rows.set(orderId, row);
      }
      if (rows.size >= total || !page.list.length) break;
    } catch (error) {
      if (!isCurrent()) return null;
      if (pageNum === 1) throw error;
      break;
    }
  }
  if (!isCurrent()) return null;

  let checked = 0;
  const counts = { unassigned: 0, awaiting: 0 };
  const orders: Array<DispatchRiskOrder & { orderTime: string }> = [];
  for (const [orderId, row] of rows) {
    const packageView = record(row.packageView);
    if (String(row.orderStatus) !== '1' || String(row.paymentStatus) !== '1' ||
        row.packageOrder === true || packageView?.packageOrder === true ||
        text(row.serviceDate).slice(0, 10) !== date) continue;
    const status = assignmentRisk(row);
    if (status === 'unknown') continue;
    checked++;
    if (!status) continue;
    counts[status]++;
    const productNameI18n = record(row.productNameI18n) ?? {};
    orders.push({
      orderId,
      orderNo: text(row.orderNo),
      productName: text(row.productName),
      productNameI18n: Object.fromEntries(Object.entries(productNameI18n).filter(([, value]) => typeof value === 'string')) as Record<string, string>,
      serviceTime: text(row.serviceTime) || text(row.serviceDateTime),
      orderTime: text(row.orderTime),
      status,
    });
  }
  orders.sort((left, right) => (
    (startMinute(left.serviceTime) - startMinute(right.serviceTime)) ||
    left.orderTime.localeCompare(right.orderTime) || left.orderId.localeCompare(right.orderId)
  ));
  return { total, checked, complete: checked === total, counts, orders };
}
