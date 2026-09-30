import http from '@/modules/admin/utils/request';

export function listNotificationCatalog(params: { channel?: string; keyword?: string } = {}) {
  return http.get('/api/admin/notification/catalog', { params });
}

export type NotificationTestPayload = {
  orderNo: string
  type: string
  to?: string
  outcome?: string
  reason?: string
}

export function testNotificationEmail(params: NotificationTestPayload) {
  return http.get('/api/orderHeader/emailTest', { params });
}

export function testNotificationWhatsApp(params: NotificationTestPayload) {
  return http.get('/api/orderHeader/whatsappTest', { params });
}
