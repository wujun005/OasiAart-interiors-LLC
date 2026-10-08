import http from '@/modules/admin/utils/request'

export const listSupplierRegistrationWhitelist = () =>
  http.get('/api/admin/supplier-registration-whitelist/list')

export const addSupplierRegistrationWhitelistPhone = (phone: string) =>
  http.post('/api/admin/supplier-registration-whitelist/add', { phone })

export const removeSupplierRegistrationWhitelistPhone = (phone: string) =>
  http.post('/api/admin/supplier-registration-whitelist/remove', { phone })
