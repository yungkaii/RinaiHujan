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
    place.admin1,
  ].filter(Boolean)

  return parts.join(', ')
}

export function formatTimeHHMM(isoString: string): string {
  if (!isoString) return '--.--'
  const match = isoString.match(/T(\d{2}):(\d{2})/)
  if (match) {
    return `${match[1]}.${match[2]}`
  }
  return isoString.slice(11, 16).replace(':', '.')
}

export function getUVLabel(uv: number): string {
  if (uv < 3) return 'Rendah'
  if (uv < 6) return 'Sedang'
  if (uv < 8) return 'Tinggi'
  if (uv < 11) return 'Sangat Tinggi'
  return 'Ekstrem'
}

export function getGreeting(hour?: number): string {
  const h =
    hour !== undefined
      ? hour
      : typeof window !== 'undefined'
        ? new Date().getHours()
        : 12
  if (h >= 4 && h < 11) {
    return 'Pagi yang cerah, semoga harimu indah!'
  }
  if (h >= 11 && h < 15) {
    return 'Siang yang penuh energi, tetap semangat ya!'
  }
  if (h >= 15 && h < 18) {
    return 'Sore yang teduh, nikmati senjamu!'
  }
  return 'Malam yang damai, istirahat yang cukup yaa!'
}

export function convertTemp(
  celsius: number,
  unit: 'celsius' | 'fahrenheit',
): number {
  if (unit === 'fahrenheit') {
    return Math.round((celsius * 9) / 5 + 32)
  }
  return Math.round(celsius)
}

export function convertWind(kmh: number, unit: 'kmh' | 'mph'): number {
  if (unit === 'mph') {
    return Math.round(kmh * 0.621371)
  }
  return Math.round(kmh)
}

export function getWindCardinal(degrees: number): string {
  const cardinals = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL']
  const index = Math.round(((degrees % 360) / 45)) % 8
  return cardinals[index]
}

export function parseAirQualityCategory(aqi: number): {
  category: AirQualityData['category']
  color: string
  advice: string
} {
  if (aqi <= 50) {
    return {
      category: 'Baik',
      color: '#10b981',
      advice: 'Kualitas udara sangat bersih dan segar. Nikmati aktivitas di luar ruangan!',
    }
  }
  if (aqi <= 100) {
    return {
      category: 'Sedang',
      color: '#eab308',
      advice: '