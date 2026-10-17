import type {
  LocationPlace,
  WeatherCondition,
  WeatherData,
  WeatherAlertItem,
  ActivitySuggestion,
  AirQualityData,
  AppSettings,
} from '../types/weather'

// Fallback lokasi awal untuk pengguna baru: Jakarta
export const DEFAULT_PLACE: LocationPlace = {
  name: 'Jakarta',
  admin2: 'Kota Jakarta Pusat',
  admin1: 'DKI Jakarta',
  country: 'Indonesia',
  latitude: -6.2146,
  longitude: 106.8451,
}

// Pengguna baru mulai dengan daftar kosong (tanpa dummy developer)
export const DEFAULT_FAVS: LocationPlace[] = []

export function weatherByCode(code: number): WeatherCondition {
  if (code === 0) {
    return { label: 'Cerah', icon: 'sunny' }
  }
  if (code <= 2) {
    return { label: 'Cerah Berawan', icon: 'partly' }
  }
  if (code === 3) {
    return { label: 'Berawan', icon: 'cloudy' }
  }
  if (code === 45 || code === 48) {
    return { label: 'Berkabut', icon: 'cloudy' }
  }
  if (code >= 51 && code <= 55) {
    return { label: 'Gerimis Ringan', icon: 'rainy' }
  }
  if (code >= 56 && code <= 67) {
    return { label: 'Hujan', icon: 'rainy' }
  }
  if (code >= 80 && code <= 82) {
    return { label: 'Hujan Lebat', icon: 'rainy' }
  }
  if (code >= 95) {
    return { label: 'Badai Petir', icon: 'storm' }
  }
  return { label: 'Berawan', icon: 'partly' }
}

export function formatRegion(place: LocationPlace): string {
  const parts = [
    place.admin3 && place.admin3.toLowerCase() !== place.name.toLowerCase()
      ? place.admin3
      : '',
    place.admin2,
    