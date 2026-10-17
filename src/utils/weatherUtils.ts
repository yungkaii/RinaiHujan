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
      advice: 'Kualitas udara dapat diterima. Kelompok sangat sensitif mungkin perlu membatasi aktivitas berat.',
    }
  }
  if (aqi <= 150) {
    return {
      category: 'Tidak Sehat (Sensitif)',
      color: '#f97316',
      advice: 'Kelompok rentan (anak-anak, lansia, penderita asma) disarankan memakai masker.',
    }
  }
  if (aqi <= 200) {
    return {
      category: 'Tidak Sehat',
      color: '#ef4444',
      advice: 'Masyarakat umum mulai merasakan dampak kesehatan. Hindari olahraga luar ruangan yang berat.',
    }
  }
  if (aqi <= 300) {
    return {
      category: 'Sangat Tidak Sehat',
      color: '#a855f7',
      advice: 'Peringatan kesehatan darurat. Kurangi aktivitas di luar dan nyalakan penjernih udara.',
    }
  }
  return {
    category: 'Berbahaya',
    color: '#7f1d1d',
    advice: 'Tingkat bahaya tinggi! Tetap berada di dalam ruangan dan tutup ventilasi udara luar.',
  }
}

// -------------------------------------------------------------
// Helper Notifikasi Dinamis dari Data Cuaca Nyata
// -------------------------------------------------------------
export function generateWeatherAlerts(
  weather: WeatherData,
  settings?: AppSettings,
): WeatherAlertItem[] {
  const alerts: WeatherAlertItem[] = []
  const { place, current, hourly } = weather
  const localDate = current.time.slice(0, 10) // YYYY-MM-DD
  const placeSlug = place.name.toLowerCase().replace(/[^a-z0-9]/g, '-')

  const tempUnit = settings?.tempUnit || 'celsius'
  const windUnit = settings?.windUnit || 'kmh'
  const displayTemp = convertTemp(current.temp, tempUnit)
  const displayApparent = convertTemp(current.apparentTemp, tempUnit)
  const tempUnitSymbol = tempUnit === 'fahrenheit' ? '°F' : '°C'
  const displayWind = convertWind(current.windSpeed, windUnit)
  const windUnitSymbol = windUnit === 'mph' ? 'mph' : 'km/j'

  // Current local time
  const timeStr = current.time.slice(11, 16).replace(':', '.')

  // 1. Cek potensi hujan dalam beberapa jam ke depan
  const nextRainSlot = hourly.slice(0, 6).find(
    (slot) => slot.precipProb >= 40 || (slot.weatherCode >= 51 && slot.weatherCode <= 82),
  )

  if (nextRainSlot) {
    const rainTiming = nextRainSlot.isNow
      ? 'saat ini'
      : `sekitar pukul ${nextRainSlot.timeFormatted}`

    alerts.push({
      id: `rain-${placeSlug}-${localDate}`,
      title: 'Peluang Hujan Terdeteksi 🌧️',
      message: `Potensi hujan ${rainTiming} (${nextRainSlot.precipProb}% kemungkinan). Bawa payung jika berencana keluar rumah ya!`,
      type: 'warning',
      time: nextRainSlot.isNow ? 'Saat ini' : nextRainSlot.timeFormatted,
    })
  }

  // 2. Cek Indeks UV tinggi
  if (current.uvIndex >= 6) {
    alerts.push({
      id: `uv-${placeSlug}-${localDate}`,
      title: 'Indeks UV Cukup Tinggi ☀️',
      message: `Indeks UV berada pada level ${current.uvIndex} (${current.uvLabel}). Gunakan tabir surya dan pelindung kepala jika beraktivitas di bawah matahari.`,
      type: 'warning',
      time: timeStr,
    })
  }

  // 3. Cek Suhu Ekstrem
  if (current.temp >= 33) {
    alerts.push({
      id: `heat-${placeSlug}-${localDate}`,
      title: 'Suhu Udara Panas Terik 🥤',
      message: `Suhu mencapai ${displayTemp}${tempUnitSymbol} (terasa seperti ${displayApparent}${tempUnitSymbol}). Perbanyak minum air putih agar tidak dehidrasi.`,
      type: 'tip',
      time: timeStr,
    })
  } else if (current.temp <= 19) {
    alerts.push({
      id: `cold-${placeSlug}-${localDate}`,
      title: 'Suhu Udara Sejuk / Dingin 🧣',
      message: `Suhu tercatat ${displayTemp}${tempUnitSymbol}. Siapkan pakaian hangat atau jaket agar tetap nyaman.`,
      type: 'tip',
      time: timeStr,
    })
  }

  // 4. Cek Angin Kencang
  if (current.windSpeed >= 20) {
    alerts.push({
      id: `wind-${placeSlug}-${localDate}`,
      title: 'Hembusan Angin Kencang 💨',
      message: `Kecepatan angin terdeteksi ${displayWind} ${windUnitSymbol}. Berhati-hatilah saat berkendara roda dua atau di dekat pohon rindang.`,
      type: 'warning',
    