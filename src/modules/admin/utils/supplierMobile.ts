export const SUPPLIER_DESKTOP_BASE = '/admin/supplier-management';
export const SUPPLIER_MOBILE_BASE = `${SUPPLIER_DESKTOP_BASE}/h5`;

export const SUPPLIER_MOBILE_SECTIONS = [
  'overview', 'orders', 'pricing', 'package-pricing', 'coverage-availability', 'staff', 'profile',
] as const;
export type SupplierMobileSection = typeof SUPPLIER_MOBILE_SECTIONS[number];

const sectionAliases: Record<string, SupplierMobileSection> = {
  '': 'overview',
  'service-area': 'coverage-availability',
  availability: 'coverage-availability',
  services: 'pricing',
  schedule: 'profile',
  settlement: 'profile',
  'orders/h5': 'orders',
};

/** Maps only known supplier routes; unrelated admin paths are never rewritten. */
export function supplierSectionFromPath(rawPath: string): SupplierMobileSection | '' {
  // Vue Router matches static route segments case-insensitively by default.
  // Apply the same normalization before making access or device decisions.
  const path = (rawPath.split(/[?#]/)[0] ?? '').replace(/\/+$/, '').toLowerCase();
  let section = path;
  if (path === SUPPLIER_MOBILE_BASE || path === SUPPLIER_DESKTOP_BASE) section = '';
  else if (path.startsWith(`${SUPPLIER_MOBILE_BASE}/`)) section = path.slice(SUPPLIER_MOBILE_BASE.length + 1);
  else if (path.startsWith(`${SUPPLIER_DESKTOP_BASE}/`)) section = path.slice(SUPPLIER_DESKTOP_BASE.length + 1);
  else if (path.includes('/')) return '';
  if (Object.prototype.hasOwnProperty.call(sectionAliases, section)) return sectionAliases[section] ?? '';
  return (SUPPLIER_MOBILE_SECTIONS as readonly string[]).includes(section) ? section as SupplierMobileSection : '';
}

export function supplierDesktopPath(pathOrSection: string): string {
  const section = supplierSectionFromPath(pathOrSection);
  return section ? `${SUPPLIER_DESKTOP_BASE}/${section}` : '';
}

export function supplierMobilePath(pathOrSection: string): string {
  const section = supplierSectionFromPath(pathOrSection);
  return section ? `${SUPPLIER_MOBILE_BASE}/${section}` : '';
}

export function supplierResponsivePath(
  path: string,
  options: { mobile: boolean; staffOrdersOnly?: boolean },
): string {
  if (!supplierSectionFromPath(path)) return '';
  if (options.staffOrdersOnly) return supplierMobilePath('orders');
  return options.mobile ? supplierMobilePath(path) : supplierDesktopPath(path);
}

/** A parent navigation group does not unlock ungranted owner pages. */
export function canAccessSupplierSection(
  section: SupplierMobileSection,
  allowedPaths: readonly string[],
  staffOrdersOnly = false,
): boolean {
  const granted = allowedPaths.map((path) => path === SUPPLIER_DESKTOP_BASE ? path : supplierDesktopPath(path));
  if (staffOrdersOnly) {
    return section === 'orders' && (granted.includes(SUPPLIER_DESKTOP_BASE) || granted.includes(supplierDesktopPath('orders')));
  }
  return granted.includes(supplierDesktopPath(section));
}

/** Restore supplier deep links after login, checking grants via their desktop path. */
export function supplierAwareLoginRedirect(
  requested: unknown,
  resolveAllowed: (path: string) => string,
  fallbackPath: string,
): string {
  if (typeof requested !== 'string' || /[\\\u0000-\u001f\u007f]/.test(requested)) return fallbackPath;
  const path = requested.split(/[?#]/)[0] ?? '';
  if (!/^\/admin(?:\/|$)/i.test(path) || /^\/admin\/login(?:\/|$)/i.test(path)) return fallbackPath;
  const desktopPath = supplierDesktopPath(path);
  if (desktopPath) {
    const allowed = resolveAllowed(desktopPath);
    // The router remains the authority for device redirects and staff-only access.
    return allowed === desktopPath ? requested : allowed || fallbackPath;
  }
  if (/^\/admin\/supplier-management(?:\/|$)/i.test(path)) return fallbackPath;
  // Keep the established redirect behavior of other admin modules.
  return resolveAllowed(requested) || fallbackPath;
}
