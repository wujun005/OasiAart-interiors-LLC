<template>
  <section
    class="google-address-picker"
    :class="{
      'is-unavailable': !hasGoogleMapsApiKey,
      'is-dragging': mapDragging,
      'is-mobile-fullscreen': mobileFullscreen && hasGoogleMapsApiKey,
    }"
  >
    <template v-if="hasGoogleMapsApiKey">
      <div class="google-address-picker__map-wrap">
        <div
          ref="mapRef"
          class="google-address-picker__map"
          @pointerdown.capture="handleMapInteraction"
        />
        <Teleport
          :to="mobileSearchTarget || 'body'"
          :disabled="!useHeaderSearch"
        >
          <div
            v-show="!initializationFailed"
            class="google-address-picker__search-shell"
            :class="{ 'google-address-picker__search-shell--header': useHeaderSearch }"
          >
            <div ref="autocompleteHostRef" class="google-address-picker__search" />
          </div>
        </Teleport>
        <div class="google-address-picker__pin" aria-hidden="true"><i /></div>
        <button
          class="google-address-picker__locate"
          type="button"
          :disabled="locating"
          :aria-label="locale.startsWith('zh') ? '使用当前位置' : 'Use current location'"
          @click="handleLocate"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="7" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
        <div v-if="isMobileViewport" class="google-address-picker__zoom" aria-label="Map zoom controls">
          <button
            type="button"
            :disabled="loading || initializationFailed"
            :aria-label="locale.startsWith('zh') ? '放大地图' : 'Zoom in'"
            @click="changeZoom(1)"
          >+</button>
          <button
            type="button"
            :disabled="loading || initializationFailed"
            :aria-label="locale.startsWith('zh') ? '缩小地图' : 'Zoom out'"
            @click="changeZoom(-1)"
          >−</button>
        </div>
        <div v-if="!selectedLabel && !resolving && !statusText && !errorText" class="google-address-picker__hint">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 10.5a4 4 0 1 1 8 0c0 3-4 7.5-4 7.5s-4-4.5-4-7.5Z" />
            <circle cx="12" cy="10.5" r="1.25" />
          </svg>
          <span>{{ locale.startsWith('zh') ? '点按或拖动地图，缩放后精准扎针' : 'Tap or drag the map, then zoom for precise pin placement' }}</span>
        </div>
        <div v-if="loading" class="google-address-picker__loading">
          {{ locale.startsWith('zh') ? '地图加载中…' : 'Loading map…' }}
        </div>
      </div>
      <div class="google-address-picker__feedback">
        <div v-if="selectedLabel || resolving" class="google-address-picker__selected" role="status">
          <span class="google-address-picker__selected-icon" aria-hidden="true">{{ resolving ? '…' : '✓' }}</span>
          <span>
            <strong>{{ resolving ? (locale.startsWith('zh') ? '正在识别位置' : 'Finding this address') : (locale.startsWith('zh') ? '已选择服务地址' : 'Service address selected') }}</strong>
            <small>{{ selectedLabel || (locale.startsWith('zh') ? '请稍候…' : 'One moment…') }}</small>
          </span>
        </div>
        <p
          v-if="statusText && (statusType === 'error' || !selectedLabel)"
          class="google-address-picker__status"
          :class="`is-${statusType}`"
          role="status"
        >
          {{ statusText }}
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
      </div>
    </template>
    <template v-else>
      <p class="google-address-picker__config">
        {{
          locale.startsWith('zh')
            ? 'Google 地图尚未配置，仍可使用当前位置或手动填写地址。'
            : 'Google Maps is not configured yet. You can still use your current location or enter the address manually.'
        }}
      </p>
      <button
        class="google-address-picker__fallback-locate"
        type="button"
        :disabled="locating"
        @click="emit('locate')"
      >
        {{ locating ? (locale.startsWith('zh') ? '正在定位…' : 'Locating…') : (locale.startsWith('zh') ? '使用当前位置' : 'Use current location') }}
      </button>
      <p v-if="statusText" class="google-address-picker__status" :class="`is-${statusType}`" role="status">
        {{ statusText }}
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  hasGoogleMapsApiKey,
  loadGoogleMapsApi,
  type GoogleAddressSelection,
} from '@/modules/client/utils/google-maps';

const props = withDefaults(defineProps<{
  locale: string;
  latitude?: number | null;
  longitude?: number | null;
  locating?: boolean;
  statusText?: string;
  statusType?: 'info' | 'success' | 'error';
  mobileSearchTarget?: HTMLElement | null;
  mobileFullscreen?: boolean;
}>(), {
  latitude: null,
  longitude: null,
  locating: false,
  statusText: '',
  statusType: 'info',
  mobileSearchTarget: null,
  mobileFullscreen: false,
});
const emit = defineEmits<{
  select: [value: GoogleAddressSelection];
  locate: [];
  adjust: [];
}>();

const DUBAI_CENTER = { lat: 25.2048, lng: 55.2708 };
const autocompleteHostRef = ref<HTMLElement | null>(null);
const mapRef = ref<HTMLElement | null>(null);
const loading = ref(false);
const resolving = ref(false);
const mapDragging = ref(false);
const errorText = ref('');
const selectedLabel = ref('');
const initializationFailed = ref(false);
const isMobileViewport = ref(false);
const useHeaderSearch = computed(() => isMobileViewport.value && Boolean(props.mobileSearchTarget));
let map: any = null;
let geocoder: any = null;
let mapClickListener: any = null;
let mapDragStartListener: any = null;
let mapDragListener: any = null;
let autocompleteElement: any = null;
let lastEmittedCoordinateKey = '';
let reverseGeocodeRequestId = 0;
let mobileViewportQuery: MediaQueryList | null = null;
let mapResizeObserver: ResizeObserver | null = null;
let mapResizeAnimationFrame = 0;
let mapsEvent: any = null;

const handleMobileViewportChange = (event: MediaQueryListEvent) => {
  isMobileViewport.value = event.matches;
  map?.setOptions?.({
    zoomControl: !event.matches,
    gestureHandling: event.matches ? 'greedy' : 'cooperative',
  });
};

const handleMapInteraction = () => {
  emit('adjust');
};

const handleLocate = () => {
  emit('adjust');
  emit('locate');
};

const changeZoom = (delta: number) => {
  emit('adjust');
  const currentZoom = Number(map?.getZoom?.());
  if (!Number.isFinite(currentZoom)) return;
  map.setZoom(Math.min(22, Math.max(2, currentZoom + delta)));
};

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

const coordinateKey = (position: { lat: number; lng: number } | null) => position
  ? `${position.lat.toFixed(6)},${position.lng.toFixed(6)}`
  : '';

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
  lastEmittedCoordinateKey = coordinateKey({ lat: selection.latitude, lng: selection.longitude });
  emit('select', selection);
};

const reverseGeocode = async (location: any) => {
  if (!geocoder || !location) return;
  const requestId = ++reverseGeocodeRequestId;
  errorText.value = '';
  resolving.value = true;
  try {
    const response = await geocoder.geocode({ location });
    if (requestId !== reverseGeocodeRequestId) return;
    const result = response?.results?.[0];
    if (!result) throw new Error('No address found at this map position');
    const selection = buildSelection(
      result.formatted_address,
      '',
      result.address_components || [],
      result.geometry?.location || location,
    );
    map?.setCenter?.(result.geometry?.location || location);
    applySelection(selection);
  } catch (error) {
    if (requestId !== reverseGeocodeRequestId) return;
    errorText.value = props.locale.startsWith('zh')
      ? '无法识别该位置，请搜索地址或换一个位置重试。'
      : 'Unable to resolve this location. Search for an address or try another point.';
    console.warn('Google Maps reverse geocoding failed:', error);
  } finally {
    if (requestId === reverseGeocodeRequestId) resolving.value = false;
  }
};

const initialize = async () => {
  if (!hasGoogleMapsApiKey || !mapRef.value || !autocompleteHostRef.value) return;
  loading.value = true;
  errorText.value = '';
  initializationFailed.value = false;
  try {
    const mapsApi = await loadGoogleMapsApi(props.locale);
    mapsEvent = mapsApi.event;
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
      zoomControl: !isMobileViewport.value,
      gestureHandling: isMobileViewport.value ? 'greedy' : 'cooperative',
    });
    if (typeof ResizeObserver !== 'undefined') {
      mapResizeObserver?.disconnect();
      mapResizeObserver = new ResizeObserver(() => {
        if (!map) return;
        const center = map.getCenter?.();
        window.cancelAnimationFrame(mapResizeAnimationFrame);
        mapResizeAnimationFrame = window.requestAnimationFrame(() => {
          mapsEvent?.trigger?.(map, 'resize');
          if (center) map.setCenter(center);
        });
      });
      mapResizeObserver.observe(mapRef.value);
    }
    geocoder = new Geocoder();

    autocompleteElement = new PlaceAutocompleteElement();
    autocompleteElement.placeholder = props.locale.startsWith('zh')
      ? useHeaderSearch.value ? '搜索社区、街道或建筑' : '搜索社区、街道、建筑或地点'
      : useHeaderSearch.value ? 'Search address' : 'Search community, street, building, or place';
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
      emit('adjust');
      try {
        const place = event?.placePrediction?.toPlace?.();
        if (!place) throw new Error('Google Places did not return a place');
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'addressComponents'],
        });
        if (!place.location) throw new Error('Selected place has no location');
        if (place.viewport) map.fitBounds(place.viewport);
        else map.setZoom(17);
        map.setCenter(place.location);
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
      if (!event?.latLng) return;
      selectedLabel.value = '';
      emit('adjust');
      map.panTo?.(event.latLng);
      void reverseGeocode(event.latLng);
    });
    mapDragStartListener = map.addListener('dragstart', () => {
      mapDragging.value = true;
      selectedLabel.value = '';
      errorText.value = '';
      emit('adjust');
    });
    mapDragListener = map.addListener('dragend', () => {
      mapDragging.value = false;
      const center = map?.getCenter?.();
      if (center) void reverseGeocode(center);
    });
    if (initialPosition) void reverseGeocode(initialPosition);
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
  () => {
    const position = getProvidedCoordinates();
    if (!position || coordinateKey(position) === lastEmittedCoordinateKey) return;
    focusProvidedCoordinates();
    if (geocoder) void reverseGeocode(position);
  },
);

onMounted(() => {
  mobileViewportQuery = window.matchMedia('(max-width: 700px)');
  isMobileViewport.value = mobileViewportQuery.matches;
  mobileViewportQuery.addEventListener('change', handleMobileViewportChange);
  void initialize();
});
onBeforeUnmount(() => {
  reverseGeocodeRequestId += 1;
  mapClickListener?.remove?.();
  mapClickListener = null;
  mapDragStartListener?.remove?.();
  mapDragStartListener = null;
  mapDragListener?.remove?.();
  mapDragListener = null;
  autocompleteElement?.remove?.();
  autocompleteElement = null;
  mapResizeObserver?.disconnect();
  mapResizeObserver = null;
  window.cancelAnimationFrame(mapResizeAnimationFrame);
  mapResizeAnimationFrame = 0;
  mapsEvent = null;
  mobileViewportQuery?.removeEventListener('change', handleMobileViewportChange);
  mobileViewportQuery = null;
  geocoder = null;
  map = null;
});
</script>

<style scoped>
.google-address-picker { margin: 16px 22px 0; overflow: hidden; border: 1px solid #dbe3ec; border-radius: 18px; background: #fff; box-shadow: 0 12px 32px rgb(5 21 43 / 8%); }
.google-address-picker__map-wrap { position: relative; height: 320px; overflow: hidden; background: #e2e8f0; }
.google-address-picker__map { width: 100%; height: 100%; }
.google-address-picker__search-shell { position: absolute; z-index: 4; top: 14px; left: 14px; right: 14px; min-height: 52px; padding: 6px; display: grid; align-items: center; border: 1px solid rgb(255 255 255 / 84%); border-radius: 14px; background: rgb(255 255 255 / 96%); box-shadow: 0 10px 30px rgb(5 21 43 / 16%); backdrop-filter: blur(12px); }
.google-address-picker__search-shell--header { position: static; width: 100%; min-width: 0; min-height: 44px; padding: 2px; border: 0; border-radius: 999px; background: #fff; box-shadow: 0 5px 16px rgb(5 21 43 / 9%); backdrop-filter: none; }
.google-address-picker__search { min-width: 0; min-height: 42px; display: flex; align-items: center; }
.google-address-picker__search :deep(gmp-place-autocomplete) { width: 100%; color-scheme: light; }
.google-address-picker__search-shell--header .google-address-picker__search { min-height: 40px; }
.google-address-picker__search-shell--header .google-address-picker__search :deep(gmp-place-autocomplete) { min-width: 0; height: 40px; overflow: hidden; border: 0; border-radius: 999px; background: #fff; box-shadow: none; }
.google-address-picker__search-shell--header .google-address-picker__search :deep(gmp-place-autocomplete::part(input)) { min-height: 40px; padding-block: 0; border: 0; border-radius: 999px; background: #fff; color: #17233a; font-size: 16px; box-shadow: none; }
.google-address-picker__pin { position: absolute; left: 50%; top: 50%; z-index: 2; width: 40px; height: 40px; transform: translate(-50%, -100%); pointer-events: none; transition: transform .18s ease; filter: drop-shadow(0 7px 8px rgb(5 21 43 / 24%)); }
.google-address-picker.is-dragging .google-address-picker__pin { transform: translate(-50%, calc(-100% - 8px)); }
.google-address-picker__pin::before { content: ''; position: absolute; inset: 0; border: 9px solid #1769c2; border-radius: 50% 50% 50% 0; background: #fff; transform: rotate(-45deg); }
.google-address-picker__pin::after { content: ''; position: absolute; left: 50%; bottom: -9px; width: 12px; height: 5px; border-radius: 50%; background: rgb(5 21 43 / 18%); transform: translateX(-50%); transition: transform .18s ease, opacity .18s ease; }
.google-address-picker.is-dragging .google-address-picker__pin::after { opacity: .55; transform: translateX(-50%) scale(1.35); }
.google-address-picker__pin i { position: absolute; left: 50%; top: 50%; width: 8px; height: 8px; z-index: 1; border-radius: 50%; background: #1769c2; transform: translate(-50%, -88%); }
.google-address-picker__locate { position: absolute; z-index: 3; right: 15px; bottom: 70px; width: 46px; height: 46px; padding: 0; display: grid; place-items: center; border: 0; border-radius: 50%; background: #fff; color: #1769c2; box-shadow: 0 8px 24px rgb(5 21 43 / 20%); cursor: pointer; }
.google-address-picker__locate svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.google-address-picker__locate:disabled { opacity: .68; cursor: wait; }
.google-address-picker__locate:disabled svg { animation: address-picker-spin 1s linear infinite; }
.google-address-picker__zoom { position: absolute; z-index: 3; right: 15px; top: 76px; display: grid; overflow: hidden; border-radius: 13px; background: #fff; box-shadow: 0 8px 24px rgb(5 21 43 / 18%); }
.google-address-picker__zoom button { width: 44px; height: 42px; padding: 0; border: 0; background: #fff; color: #17233a; font-size: 24px; font-weight: 500; line-height: 1; cursor: pointer; }
.google-address-picker__zoom button + button { border-top: 1px solid #e4eaf1; }
.google-address-picker__zoom button:disabled { color: #a8b3c1; cursor: wait; }
.google-address-picker__hint { position: absolute; z-index: 3; left: 14px; right: 14px; bottom: 14px; min-height: 40px; padding: 8px 58px 8px 12px; display: flex; align-items: center; gap: 8px; border: 1px solid rgb(255 255 255 / 76%); border-radius: 12px; background: rgb(255 255 255 / 92%); color: #526176; box-shadow: 0 6px 20px rgb(5 21 43 / 12%); font-size: 11px; font-weight: 750; line-height: 1.4; backdrop-filter: blur(10px); }
.google-address-picker__hint svg { width: 18px; height: 18px; flex: 0 0 auto; fill: none; stroke: #1769c2; stroke-width: 1.8; }
.google-address-picker__loading { position: absolute; inset: 0; display: grid; place-items: center; background: rgb(248 250 252 / 82%); color: #475569; font-size: 12px; font-weight: 800; }
.google-address-picker__selected { min-height: 66px; padding: 12px 14px; display: flex; align-items: center; gap: 11px; border-top: 1px solid #e7edf4; background: #fff; color: #17233a; }
.google-address-picker__feedback:empty { display: none; }
.google-address-picker__selected-icon { width: 34px; height: 34px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 50%; background: #eaf8f0; color: #079455; font-size: 16px; font-weight: 900; }
.google-address-picker__selected > span:last-child { min-width: 0; display: grid; gap: 3px; }
.google-address-picker__selected strong { font-size: 12px; }
.google-address-picker__selected small { color: #68778c; font-size: 11px; line-height: 1.45; overflow-wrap: anywhere; }
.google-address-picker__status, .google-address-picker__error, .google-address-picker__config { margin: 0; padding: 10px 13px; font-size: 11px; line-height: 1.5; }
.google-address-picker__status { border-top: 1px solid #e7edf4; background: #f8fbff; color: #526176; }
.google-address-picker__status.is-success { border-top-color: #dcfce7; background: #f0fdf4; color: #047857; }
.google-address-picker__status.is-error { border-top-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.google-address-picker__error { border-top: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; }
.google-address-picker__retry { width: 100%; min-height: 36px; border: 0; border-top: 1px solid #fecaca; background: #fff; color: #1769c2; font-size: 11px; font-weight: 800; cursor: pointer; }
.google-address-picker__retry:disabled { cursor: wait; opacity: 0.65; }
.google-address-picker__config { color: #64748b; text-align: center; }
.google-address-picker__fallback-locate { width: calc(100% - 24px); min-height: 42px; margin: 0 12px 12px; border: 0; border-radius: 11px; background: #1769c2; color: #fff; font-weight: 800; cursor: pointer; }
.google-address-picker__fallback-locate:disabled { opacity: .62; cursor: wait; }
.google-address-picker.is-unavailable { padding-top: 6px; border-style: dashed; box-shadow: none; }
@keyframes address-picker-spin { to { transform: rotate(360deg); } }
@media (max-width: 700px) {
  .google-address-picker { margin: 12px 16px 0; border-radius: 16px; }
  .google-address-picker__map-wrap { height: clamp(360px, 46dvh, 480px); }
  .google-address-picker__search-shell:not(.google-address-picker__search-shell--header) { top: 12px; left: 12px; right: 12px; }
  .google-address-picker__hint { left: 12px; right: 12px; bottom: 12px; }
  .google-address-picker.is-mobile-fullscreen { position: absolute; inset: 0 0 var(--address-drawer-peek, 116px); width: auto; height: auto; min-height: 0; margin: 0; overflow: hidden; border: 0; border-radius: 0; box-shadow: none; }
  .google-address-picker.is-mobile-fullscreen .google-address-picker__map-wrap { position: absolute; inset: 0; height: auto; }
  .google-address-picker.is-mobile-fullscreen .google-address-picker__hint { top: 12px; bottom: auto; }
  .google-address-picker.is-mobile-fullscreen .google-address-picker__locate { bottom: 64px; }
  .google-address-picker.is-mobile-fullscreen .google-address-picker__zoom { top: auto; bottom: 122px; }
  .google-address-picker.is-mobile-fullscreen .google-address-picker__feedback { position: absolute; z-index: 4; top: 12px; right: 12px; left: 12px; bottom: auto; display: grid; gap: 7px; }
  .google-address-picker.is-mobile-fullscreen .google-address-picker__feedback > * { overflow: hidden; border: 1px solid rgb(255 255 255 / 82%); border-radius: 14px; box-shadow: 0 8px 24px rgb(5 21 43 / 14%); }
}
</style>
