/**
 * 设备检测工具函数
 */

/**
 * 检测是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent || '';
  const mobileRegex =
    /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isSmallScreen = window.innerWidth <= 820;
  return mobileRegex.test(ua) || isSmallScreen;
}

/**
 * 获取支付重定向路径（根据设备类型）
 * @param type 'success' | 'failure'
 * @returns 重定向路径
 */
export function getPaymentRedirectPath(type: 'success' | 'failure'): string {
  const isMobile = isMobileDevice();
  const basePath = isMobile ? '/h5' : '';
  return `${basePath}/payment/${type}`;
}
