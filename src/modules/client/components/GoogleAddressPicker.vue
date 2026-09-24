<template>
  <section class="google-address-picker" :class="{ 'is-unavailable': !hasGoogleMapsApiKey }">
    <template v-if="hasGoogleMapsApiKey">
      <div ref="autocompleteHostRef" class="google-address-picker__search" />
      <div class="google-address-picker__map-wrap">
        <div ref="mapRef" class="google-address-picker__map" />
        <div class="google-address-picker__pin" aria-hidden="true"><i /></div>
        <div v-if="loading" class="google-address-picker__loading">
          {{ locale.startsWith('zh') ? '地图加载中…' : 'Loading map…' }}
        </div>
      </div>
      <p v-if="selectedLabel" class="google-address-picker__selected">
        <span aria-hidden="true">✓</span>{{ selectedLabel }}
      </p>
      <p v-if="errorText" class="google-address-picker__error" role="alert">{{ errorText }}</p>
      <button
        v-if="initializationFailed"
        class="google-address-picker__retry"
        type="button"
        :disabled="loading"
        @click="initialize"
      >
        {{
          loading
            ? locale.startsWith('zh') ? '正在重新加载…' : 'Reloading…'
            : locale.startsWith('zh') ? '重新加载 Google 地图' : 'Reload Google Maps'
        }}
      </button>
    </template>
    <p v-else class="google-address-picker__config">
      {{
        locale.startsWith('zh')
          ? 'Google 地图尚未配置，仍可使用当前位置或手动填写地址。'
          : 'Google Maps is not configured yet. You can still use your current location or enter the address manually.'
      }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  hasGoogleMapsApiKey,
  loadGoogleMapsApi,
  type GoogleAddressSelection,
} from '@/modules/client/utils/google-maps';

const props = withDefaults(defineProps<{
  locale: string;
  latitude?: number | null;
  longitude?: number | null;
}>(), {
  latitude: null,
  longitude: null,
});
const emit = defineEmits<{
  select: [value: GoogleAddressSelection];
}>();

const DUBAI_CENTER = { lat: 25.2048, lng: 55.2708 };
const autocompleteHostRef = ref<HTMLElement | null>(null);
const mapRef = ref<HTMLElement | null>(null);
const loading = ref(false);
const errorText = ref('');
const selectedLabel = ref('');
const initializationFailed = ref(false);
let map: any = null;
let geocoder: any = null;
let mapClickListener: any = null;
let mapDragListener: any = null;
let autocompleteElement: any = null;

const normalize = (value: unknown) => String(value ?? '').trim();
const getProvidedCoordinates = () => {
  if (
    props.latitude === null
    || props.latitude === undefined
    || props.longitude === null
    || props.longitude === undefined
  ) return null;
  const lat = Number(props.latitude);
  const lng = Number(props.longitude);
  if (
    !Number.isFinite(lat)
    || !Number.isFinite(lng)
    || lat < -90
    || lat > 90
    || lng < -180
    || lng > 180
  ) return null;
  return { lat, lng };
};

const focusProvidedCoordinates = () => {
  const position = getProvidedCoordinates();
  if (!position || !map) return;
  map.setCenter(position);
  map.setZoom(17);
};

const getComponentText = (component: any) =>
  normalize(component?.longText || component?.long_name || component?.shortText || component?.short_name);

const getComponent = (components: any[], ...types: string[]) => {
  const match = components.find((component) => {
    const componentTypes = Array.isArray(component?.types) ? component.types : [];
    return types.some((type) => componentTypes.includes(type));
  });
  return getComponentText(match);
};

const buildSelection = (
  formattedAddress: unknown,
  displayName: unknown,
  components: any[],
  location: any,
): GoogleAddressSelection => {
  const streetNumber = getComponent(components, 'street_number');
  const route = getComponent(components, 'route');
  const street = [streetNumber, route].filter(Boolean).join(' ')
    || normalize(displayName)
    || normalize(formattedAddress);
  const community = getComponent(
    components,
    'neighborhood',
    'sublocality_level_1',
    'sublocality',
    'locality',
    'administrative_area_level_2',
  );
  const building = getComponent(components, 'premise', 'subpremise');
  const latitude = typeof location?.lat === 'function' ? location.lat() : Number(location?.lat);
  const longitude = typeof location?.lng === 'function' ? location.lng() : Number(location?.lng);

  return {
    formattedAddress: normalize(formattedAddress),
    community,
    street,
    building,
    latitude: Number.isFinite(latitude) ? latitude : DUBAI_CENTER.lat,
    longitude: Number.isFinite(longitude) ? longitude : DUBAI_CENTER.lng,
  };
};

const applySelection = (selection: GoogleAddressSelection, label?: string) => {
  selectedLabel.value = normalize(label) || selection.formattedAddress;
  emit('select', selection);
};

const reverseGeocode = async (location: any) => {
  if (!geocoder || !location) return;
  errorText.value = '';
  try {
    const response = await geocoder.geocode({ location });
    const result = response?.results?.[0];
    if (!result) throw new Error('No address found at this map position');
    const selection = buildSelection(
      result.formatted_address,
      '',
      result.address_components || [],
      result.geometry?.location || location,
    );
    map?.setCenter?.(result.geometry?.location || location);
    map?.setZoom?.(17);
    applySelection(selection);
  } catch (error) {
    errorText.value = props.locale.startsWith('zh')
      ? '无法识别该位置，请搜索地址或换一个位置重试。'
      : 'Unable to resolve this location. Search for an address or try another point.';
    console.warn('Google Maps reverse geocoding failed:', error);
  }
};

const initialize = async () => {
  if (!hasGoogleMapsApiKey || !mapRef.value || !autocompleteHostRef.value) return;
  loading.value = true;
  errorText.value = '';
  initializationFailed.value = false;
  try {
    const mapsApi = await loadGoogleMapsApi(props.locale);
    const [{ Map }, { PlaceAutocompleteElement }, { Geocoder }] = await Promise.all([
      mapsApi.importLibrary('maps'),
      mapsApi.importLibrary('places'),
      mapsApi.importLibrary('geocoding'),
    ]);

    const initialPosition = getProvidedCoordinates();
    map = new Map(mapRef.value, {
      center: initialPosition || DUBAI_CENTER,
      zoom: initialPosition ? 17 : 12,
      clickableIcons: false,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      gestureHandling: 'cooperative',
    });
    geocoder = new Geocoder();

    autocompleteElement = new PlaceAutocompleteElement();
    autocompleteElement.placeholder = props.locale.startsWith('zh')
      ? '搜索社区、街道、建筑或地点'
      : 'Search community, street, building, or place';
    autocompleteElement.includedRegionCodes = ['ae'];
    autocompleteElement.locationBias = {
      center: initialPosition || DUBAI_CENTER,
      radius: 50000,
    };
    autocompleteHostRef.value.replaceChildren(autocompleteElement);

    autocompleteElement.addEventListener('gmp-error', () => {
      errorText.value = props.locale.startsWith('zh')
        ? 'Google 地址搜索暂不可用，请稍后重试或手动填写地址。'
        : 'Google address search is unavailable. Try again later or enter the address manually.';
    });

    autocompleteElement.addEventListener('gmp-select', async (event: any) => {
      errorText.value = '';
      try {
        const place = event?.placePrediction?.toPlace?.();
        if (!place) throw new Error('Google Places did not return a place');
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'addressComponents'],
        });
        if (!place.location) throw new Error('Selected place has no location');
        if (place.viewport) map.fitBounds(place.viewport);
        else {
          map.setCenter(place.location);
          map.setZoom(17);
        }
        const selection = buildSelection(
          place.formattedAddress,
          place.displayName,
          place.addressComponents || [],
          place.location,
        );
        applySelection(selection, [normalize(place.displayName), selection.formattedAddress].filter(Boolean).join(' · '));
      } catch (error) {
        errorText.value = props.locale.startsWith('zh')
          ? '地址详情加载失败，请重试。'
          : 'Unable to load this address. Please try again.';
        console.warn('Google Places selection failed:', error);
      }
    });

    mapClickListener = map.addListener('click', (event: any) => {
      if (event?.latLng) void reverseGeocode(event.latLng);
    });
    mapDragListener = map.addListener('dragend', () => {
      const center = map?.getCenter?.();
      if (center) void reverseGeocode(center);
    });
  } catch (error) {
    initializationFailed.value = true;
    errorText.value = props.locale.startsWith('zh')
      ? 'Google 地图加载失败，请检查 API 配置或手动填写地址。'
      : 'Google Maps failed to load. Check the API configuration or enter the address manually.';
    console.warn('Google Maps initialization failed:', error);
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.latitude, props.longitude],
  () => focusProvidedCoordinates(),
);

onMounted(initialize);
onBeforeUnmount(() => {
  mapClickListener?.remove?.();
  mapClickListener = null;
  mapDragListener?.remove?.();
  mapDragListener = null;
  autocompleteElement?.remove?.();
  autocompleteElement = null;
  geocoder = null;
  map = null;
});
</script>

<style scoped>
.google-address-picker { margin: 16px 22px 0; overflow: hidden; border: 1px solid #dbe3ec; border-radius: 14px; background: #f8fafc; }
.google-address-picker__search { min-height: 54px; padding: 9px 10px; background: #fff; }
.google-address-picker__search :deep(gmp-place-autocomplete) { width: 100%; color-scheme: light; }
.google-address-picker__map-wrap { position: relative; height: 245px; background: #e2e8f0; }
.google-address-picker__map { width: 100%; height: 100%; }
.google-address-picker__pin { position: absolute; left: 50%; top: 50%; z-index: 2; width: 34px; height: 34px; transform: translate(-50%, -100%); pointer-events: none; }
.google-address-picker__pin::before { content: ''; position: absolute; inset: 0; border: 8px solid #1769c2; border-radius: 50% 50% 50% 0; background: #fff; transform: rotate(-45deg); box-shadow: 0 5px 14px rgb(5 21 43 / 28%); }
.google-address-picker__pin i { position: absolute; left: 50%; top: 50%; width: 8px; height: 8px; z-index: 1; border-radius: 50%; background: #1769c2; transform: translate(-50%, -88%); }
.google-address-picker__loading { position: absolute; inset: 0; display: grid; place-items: center; background: rgb(248 250 252 / 82%); color: #475569; font-size: 12px; font-weight: 800; }
.google-address-picker__selected, .google-address-picker__error, .google-address-picker__config { margin: 0; padding: 10px 13px; font-size: 11px; line-height: 1.5; }
.google-address-picker__selected { display: flex; align-items: flex-start; gap: 7px; border-top: 1px solid #dcfce7; background: #f0fdf4; color: #047857; }
.google-address-picker__selected span { font-weight: 900; }
.google-address-picker__error { border-top: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; }
.google-address-picker__retry { width: 100%; min-height: 36px; border: 0; border-top: 1px solid #fecaca; background: #fff; color: #1769c2; font-size: 11px; font-weight: 800; cursor: pointer; }
.google-address-picker__retry:disabled { cursor: wait; opacity: 0.65; }
.google-address-picker__config { color: #64748b; }
.google-address-picker.is-unavailable { border-style: dashed; }
@media (max-width: 700px) {
  .google-address-picker { margin: 14px 16px 0; }
  .google-address-picker__map-wrap { height: 220px; }
}
</style>
