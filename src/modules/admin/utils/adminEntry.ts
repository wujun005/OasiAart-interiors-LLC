export const ADMIN_LOGIN_PATH = '/admin/login';
export const ADMIN_NO_ACCESS_PATH = '/admin/no-access';
const ADMIN_ROOT = '/admin';

const isMenuPath = (path: string) =>
  path.startsWith(ADMIN_ROOT)
  && path !== ADMIN_LOGIN_PATH
  && path !== ADMIN_NO_ACCESS_PATH;

/** 登录后要去的页面。没有任何菜单时去共用说明页，不再回到登录页。 */
export const pickAdminEntryPath = (
  allowedPaths: string[],
  preferred = '',
  firstGranted = '',
) => {
  const granted = allowedPaths.filter(isMenuPath);
  const allowed = new Set(granted);
  const requested = preferred.split('?')[0].split('#')[0];
  if (requested && allowed.has(requested)) return requested;
  if (requested && requested !== ADMIN_ROOT) {
    const child = granted.find((path) => path.startsWith(`${requested}/`));
    if (child) return child;
  }
  if (firstGranted && allowed.has(firstGranted)) return firstGranted;
  return granted[0] || ADMIN_NO_ACCESS_PATH;
};
