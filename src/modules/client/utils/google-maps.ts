const GOOGLE_MAPS_SCRIPT_ID = 'hourx-google-maps-js';
const GOOGLE_MAPS_CALLBACK = '__hourxGoogleMapsReady';

const googleMapsApiKey =
  typeof import.meta.env.VITE_GOOGLE_MAPS_API_KEY === 'string'
    ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY.trim()
    : '';

let googleMapsPromise: Promise<any> | null = null;

export type GoogleAddressSelection = {
  formattedAddress: string;
  community: string;
  street: string;
  building: string;
  latitude: number;
  longitude: number;
};

export const hasGoogleMapsApiKey = Boolean(googleMapsApiKey);

export const loadGoogleMapsApi = (language = 'en'): Promise<any> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps is only available in a browser'));
  }

  const browserWindow = window as any;
  if (browserWindow.google?.maps?.importLibrary) {
    return Promise.resolve(browserWindow.google.maps);
  }
  if (!googleMapsApiKey) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured'));
  }
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const fail = (error: Error) => {
      if (timeoutId) clearTimeout(timeoutId);
      delete browserWindow[GOOGLE_MAPS_CALLBACK];
      document.getElementById(GOOGLE_MAPS_SCRIPT_ID)?.remove();
      googleMapsPromise = null;
      reject(error);
    };

    const finish = () => {
      if (browserWindow.google?.maps?.importLibrary) {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(browserWindow.google.maps);
        return;
      }
      fail(new Error('Google Maps API loaded without the expected library API'));
    };

    timeoutId = setTimeout(
      () => fail(new Error('Google Maps API loading timed out')),
      15000,
    );

    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener(
        'error',
        () => fail(new Error('Failed to load Google Maps API')),
        { once: true },
      );
      return;
    }

    browserWindow[GOOGLE_MAPS_CALLBACK] = () => {
      delete browserWindow[GOOGLE_MAPS_CALLBACK];
      finish();
    };

    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: googleMapsApiKey,
      loading: 'async',
      callback: GOOGLE_MAPS_CALLBACK,
      v: 'weekly',
      libraries: 'places',
      language: language.startsWith('zh') ? 'zh-CN' : 'en',
      region: 'AE',
      auth_referrer_policy: 'origin',
    });
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.onerror = () => {
      fail(new Error('Failed to load Google Maps API'));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};
