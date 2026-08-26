export type LocationLookupErrorCode =
  | 'UNSUPPORTED'
  | 'PERMISSION_DENIED'
  | 'UNAVAILABLE'
  | 'TIMEOUT'
  | 'LOOKUP_FAILED';

export class LocationLookupError extends Error {
  code: LocationLookupErrorCode;

  constructor(code: LocationLookupErrorCode, message: string) {
    super(message);
    this.name = 'LocationLookupError';
    this.code = code;
  }
}

export type LocatedAddress = {
  district: string;
  address: string;
  latitude: number;
  longitude: number;
};

type ReverseGeocodePayload = {
  features?: Array<{
    properties?: {
      geocoding?: {
        label?: string;
        district?: string;
        locality?: string;
        city?: string;
      };
    };
  }>;
};

const DEFAULT_REVERSE_GEOCODING_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

const reverseGeocodingEndpoint =
  typeof import.meta.env.VITE_REVERSE_GEOCODING_ENDPOINT === 'string' &&
  import.meta.env.VITE_REVERSE_GEOCODING_ENDPOINT.trim()
    ? import.meta.env.VITE_REVERSE_GEOCODING_ENDPOINT.trim()
    : DEFAULT_REVERSE_GEOCODING_ENDPOINT;

const getBrowserPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new LocationLookupError('UNSUPPORTED', 'Browser geolocation is unavailable'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new LocationLookupError('PERMISSION_DENIED', error.message));
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(new LocationLookupError('TIMEOUT', error.message));
          return;
        }
        reject(new LocationLookupError('UNAVAILABLE', error.message));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  });

export const locateCurrentAddress = async (language: string): Promise<LocatedAddress> => {
  const position = await getBrowserPosition();
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  try {
    const url = new URL(reverseGeocodingEndpoint);
    url.searchParams.set('format', 'geocodejson');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '18');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('accept-language', language.startsWith('zh') ? 'zh,en' : 'en');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ReverseGeocodePayload;
    const geocoding = payload.features?.[0]?.properties?.geocoding;
    const address = String(geocoding?.label || '').trim();
    if (!address) {
      throw new Error('Reverse geocoding returned an empty address');
    }

    return {
      district: String(
        geocoding?.district || geocoding?.locality || geocoding?.city || '',
      ).trim(),
      address,
      latitude,
      longitude,
    };
  } catch (error) {
    if (error instanceof LocationLookupError) {
      throw error;
    }
    throw new LocationLookupError(
      'LOOKUP_FAILED',
      error instanceof Error ? error.message : 'Unable to resolve the current address',
    );
  }
};
