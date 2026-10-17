import { createServerFn } from '@tanstack/react-start'
import type {
  LocationPlace,
  WeatherApiResponse,
  WeatherData,
  HourlySlot,
  DailySlot,
  NowcastData,
  AirQualityData,
  BmkgWarning,
  GeocodingApiResponse,
  GeocodingResult,
} from '../types/weather'
import {
  weatherByCode,
  formatTimeHHMM,
  getUVLabel,
  getWindCardinal,
  parseAirQualityCategory,
  getActivitySuggestions,
} from '../utils/weatherUtils'

// -------------------------------------------------------------
// BMKG Nowcast Weather Warnings Service with 10-Min Cache
// -------------------------------------------------------------
interface BmkgCacheEntry {
  timestamp: number
  warnings: Array<{
    id: string
    title: string
    description: string
    area: string
    time: string
  }>
}

let bmkgMemoryCache: BmkgCacheEntry | null = null
const BMKG_CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes cache

export async function fetchBmkgWeatherWarningsForPlace(place: LocationPlace): Promise<BmkgWarning> {
  const now = Date.now()
  let allWarnings: Array<{
    id: string
    title: string
    description: string
    area: string
    time: string
  }> = []

  if (bmkgMemoryCache && now - bmkgMemoryCache.timestamp < BMKG_CACHE_TTL_MS) {
    allWarnings = bmkgMemoryCache.warnings
  } else {
    try {
      const res = await fetch('https://www.bmkg.go.id/alerts/nowcast/id', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(5000),
      })

      if (res.ok) {
        const xml = await res.text()
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
        allWarnings = items.map((item) => {
          const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/)
          const descMatch = item.match(/<description>([\s\S]*?)<\/description>/)
          const guidMatch = item.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)
          const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)

          const title = titleMatch ? titleMatch[1].trim() : 'Peringatan Dini Cuaca BMKG'
          const description = descMatch ? descMatch[1].trim() : ''
          const id = guidMatch ? guidMatch[1].trim() : String(Math.random())
          const time = pubDateMatch ? pubDateMatch[1].trim() : ''

          return {
            id,
            title,
            description,
            area: title,
            time,
          }
        })

        bmkgMemoryCache = {
          timestamp: now,
          warnings: allWarnings,
        }
      } else if (bmkgMemoryCache) {
        allWarnings = bmkgMemoryCache.warnings
      } else {
        return {
          available: false,
          statusText: 'Layanan peringatan dini BMKG tidak merespons.',
          warnings: [],
        }
      }
    } catch {
      if (bmkgMemoryCache) {
        allWarnings = bmkgMemoryCache.warnings
      } else {
        return {
          available: false,
          statusText: 'Endpoint peringatan dini BMKG tidak dapat dijangkau saat ini.',
          warnings: [],
        }
      }
    }
  }

  // Filter relevansi wilayah
  if (place.country && place.country.toLowerCase() !== 'indonesia') {
    return {
      available: true,
      statusText: 'Peringatan dini BMKG hanya berlaku untuk wilayah Indonesia.',
      warnings: [],
    }
  }

  const searchKeywords: string[] = []
  if (place.name) searchKeywords.push(place.name.toLowerCase())
  if (place.admin1) {
    const a1 = place.admin1.toLowerCase()
    searchKeywords.push(a1)
    if (a1.includes('dki jakarta')) searchKeywords.push('jakarta')
    if (a1.includes('kepulauan riau')) searchKeywords.push('kep. riau', 'kep riau')
    if (a1.includes('daerah istimewa yogyakarta')) searchKeywords.push('yogyakarta', 'diy')
    if (a1.includes('bangka belitung')) searchKeywords.push('babel')
  }
  if (place.admin2) {
    searchKeywords.push(place.admin2.toLowerCase())
  }

  const matchingWarnings = allWarnings.filter((w) => {
    const fullText = (w.title + ' ' + w.description).toLowerCase()
    return searchKeywords.some((keyword) => {
      const clean = keyword.replace(/^(kota|kabupaten|kab\.|provinsi)\s+/i, '').trim()
      return clean.length >= 3 && fullText.includes(clean)
    })
  })

  return {
    available: true,
    statusText:
      matchingWarnings.length > 0
        ? 'Peringatan Dini Cuaca Resmi BMKG Aktif'
        : 'Tidak ada peringatan dini cuaca aktif dari BMKG untuk wilayah ini.',
    warnings: matchingWarnings,
  }
}

// Server Function: Ambil data cuaca lengkap (termasuk 24h, nowcast, air quality, & BMKG)
export const fetchWeatherServerFn = createServerFn({ method: 'GET' })
  .validator((d: { place: LocationPlace }) => d)
  .handler(async ({ data: { place } }): Promise<WeatherData> => {
    const { latitude, longitude } = place

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error(
        `Koordinat lokasi tidak valid: latitude harus -90 s/d 90, longitude -180 s/d 180. (Diterima: lat=${latitude}, lon=${longitude})`,
      )
    }

    // 1. Open-Meteo Forecast + Minutely_15 Nowcast via URLSearchParams
    const weatherParams = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      timezone: 'auto',
      forecast_days: '7',
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation,is_day',
      hourly:
        'temperature_2m,weather_code,precipitation_probability,precipitation,visibility,uv_index,wind_speed_10m,wind_direction_10m,dew_point_2m',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset',
      minutely_15: 'precipitation,weather_code',
    })
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`

    // 2. Open-Meteo Air Quality API via URLSearchParams
    const airParams = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'us_aqi,pm2_5,pm10',
    })
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${airParams.toString()}`

    // Run parallel server requests (Open-Meteo Forecast + Air Quality + BMKG Nowcast)
    const [weatherRes, airRes, bmkgResult] = await Promise.allSettled([
      fetch(weatherUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(9000),
      }),
      fetch(airQualityUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      }),
      fetchBmkgWeatherWarningsForPlace(place),
    ])

    if (weatherRes.status !== 'fulfilled' || !weatherRes.value.ok) {
      throw new Error(
        `Gagal memuat data cuaca dari Open-Meteo (status: ${
          weatherRes.status === 'fulfilled' ? weatherRes.value.status : 'timeout'
        })`,
      )
    }

    const d: WeatherApiResponse = await weatherRes.value.json()
    const c = d.current
    const w = weatherByCode(c.weather_code)
    const t = new Date(c.time)

    // Current hour index in hourly data
    const hourKey = c.time.slice(0, 13) + ':00'
    let hourIdx = d.hourly.time.indexOf(hourKey)
    if (hourIdx < 0) hourIdx = 0

    const uv = Math.round(d.hourly.uv_index[hourIdx] ?? 0)
    const windDir = Math.round(c.wind_direction_10m ?? 0)
    const dewPt = Math.round(d.hourly.dew_point_2m?.[hourIdx] ?? c.temperature_2m - 2)

    // Check if night
    const sunriseToday = d.daily.sunrise[0]
    const sunsetToday = d.daily.sunset[0]
    let isNight = c.is_day === 0
    if (c.is_day === undefined && sunriseToday && sunsetToday) {
      const currentH = t.getHours()
      const riseH = parseInt(sunriseToday.slice(11, 13), 10)
      const setH = parseInt(sunsetToday.slice(11, 13), 10)
      isNight = currentH < riseH || currentH >= setH
    }

    // Build 24 hourly slots starting from current hour
    const hourlySlots: HourlySlot[] = []
    let previousDateStr = ''

    for (let offset = 0; offset < 24; offset++) {
      const idx = hourIdx + offset
      if (idx >= d.hourly.time.length) break

      const tm = d.hourly.time[idx]
      const cond = weatherByCode(d.hourly.weather_code[idx] ?? 0)
      const slotDate = tm.slice(0, 10)
      let dayDivider: string | undefined = undefined

      if (offset > 0 && slotDate !== previousDateStr) {
        const nextDateObj = new Date(tm)
        dayDivider = nextDateObj.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      }
      previousDateStr = slotDate

      hourlySlots.push({
        time: tm,
        timeFormatted: offset === 0 ? 'Sekarang' : formatTimeHHMM(tm),
        temp: Math.round(d.hourly.temperature_2m[idx] ?? 0),
        weatherCode: d.hourly.weather_code[idx] ?? 0,
        weatherLabel: cond.label,
        weatherIcon: cond.icon,
        precipProb: Math.round(d.hourly.precipitation_probability[idx] ?? 0),
        precipMm: Number((d.hourly.precipitation?.[idx] ?? 0).toFixed(1)),
        isNow: offset === 0,
        dayDivider,
      })
    }

    // Build 7 daily slots (use location local date from c.time, not server UTC)
    const todayStr = c.time.slice(0, 10)
    const dailySlots: DailySlot[] = d.daily.time.map((dt, k) => {
      const dateObj = new Date(dt + 'T12:00:00')
      const cond = weatherByCode(d.daily.weather_code[k] ?? 0)
      return {
        date: dt,
        dayName: dateObj.toLocaleDateString('id-ID', { weekday: 'short' }),
        dateFormatted: dateObj.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        }),
        tempMin: Math.round(d.daily.temperature_2m_min[k] ?? 0),
        tempMax: Math.round(d.daily.temperature_2m_max[k] ?? 0),
        weatherCode: d.daily.weather_code[k] ?? 0,
        weatherLabel: cond.label,
        weatherIcon: cond.icon,
        precipProbMax: Math.round(
          d.daily.precipitation_probability_max[k] ?? 0,
        ),
        precipSumMm: Number((d.daily.precipitation_sum?.[k] ?? 0).toFixed(1)),
        sunrise: formatTimeHHMM(d.daily.sunrise[k] ?? ''),
        sunset: formatTimeHHMM(d.daily.sunset[k] ?? ''),
        isToday: dt === todayStr,
      }
    })

    // Build Nowcast data (minutely_15 for next 2 hours = 8 intervals)
    let nowcast: NowcastData | undefined = undefined
    if (d.minutely_15?.time && d.minutely_15.time.length > 0) {
      const nowIdx = d.minutely_15.time.findIndex((tStr) => tStr >= c.time)
      const startIdx = nowIdx >= 0 ? nowIdx : 0
      const nextIntervals = d.minutely_15.time.slice(startIdx, startIdx + 8).map((timeStr, k) => {
        const pId