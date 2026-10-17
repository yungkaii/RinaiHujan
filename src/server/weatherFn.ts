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
        const pIdx = startIdx + k
        const pMm = Number((d.minutely_15?.precipitation?.[pIdx] ?? 0).toFixed(2))
        return {
          time: timeStr,
          timeFormatted: formatTimeHHMM(timeStr),
          precipMm: pMm,
        }
      })

      const rainInterval = nextIntervals.find((intv) => intv.precipMm > 0.1)
      const maxIntensity = Math.max(...nextIntervals.map((i) => i.precipMm), 0)

      nowcast = {
        hasRainSoon: !!rainInterval,
        rainStartTime: rainInterval ? rainInterval.timeFormatted : undefined,
        maxIntensityMm: maxIntensity,
        summaryMessage: rainInterval
          ? `Hujan diprakirakan mulai sekitar pukul ${rainInterval.timeFormatted} (${maxIntensity} mm)`
          : 'Tidak ada hujan signifikan dalam 2 jam ke depan.',
        intervals: nextIntervals,
      }
    }

    // Build Air Quality data
    let airQuality: AirQualityData | undefined = undefined
    if (airRes.status === 'fulfilled' && airRes.value.ok) {
      try {
        const airJson = await airRes.value.json()
        const aqiVal = Math.round(airJson.current?.us_aqi ?? 0)
        const pm25Val = Number((airJson.current?.pm2_5 ?? 0).toFixed(1))
        const pm10Val = Number((airJson.current?.pm10 ?? 0).toFixed(1))
        const parsed = parseAirQualityCategory(aqiVal)
        airQuality = {
          aqi: aqiVal,
          pm25: pm25Val,
          pm10: pm10Val,
          category: parsed.category,
          color: parsed.color,
          advice: parsed.advice,
        }
      } catch {
        // Silent fallback
      }
    }

    const dateFormatted = `${t.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} • ${t.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).replace(':', '.')}`

    const preliminaryWeather: WeatherData = {
      place,
      current: {
        temp: Math.round(c.temperature_2m),
        apparentTemp: Math.round(c.apparent_temperature),
        humidity: Math.round(c.relative_humidity_2m),
        windSpeed: Math.round(c.wind_speed_10m),
        windDirection: windDir,
        windDirectionCardinal: getWindCardinal(windDir),
        surfacePressure: Math.round(c.surface_pressure),
        precipitationMm: Number((c.precipitation ?? 0).toFixed(1)),
        dewPoint: dewPt,
        weatherCode: c.weather_code,
        weatherLabel: w.label,
        weatherIcon: w.icon,
        uvIndex: uv,
        uvLabel: getUVLabel(uv),
        visibilityKm: Math.round((d.hourly.visibility[hourIdx] || 0) / 1000),
        precipProb: Math.round(
          d.hourly.precipitation_probability[hourIdx] ?? 0,
        ),
        isNight,
        time: c.time,
        dateFormatted,
        sunrise: formatTimeHHMM(d.daily.sunrise[0] ?? ''),
        sunset: formatTimeHHMM(d.daily.sunset[0] ?? ''),
        tempMin: Math.round(d.daily.temperature_2m_min[0] ?? 0),
        tempMax: Math.round(d.daily.temperature_2m_max[0] ?? 0),
      },
      hourly: hourlySlots,
      daily: dailySlots,
      nowcast,
      airQuality,
      bmkg:
        bmkgResult.status === 'fulfilled'
          ? bmkgResult.value
          : {
              available: false,
              statusText: 'Layanan BMKG tidak dapat dijangkau saat ini.',
              warnings: [],
            },
    }

    preliminaryWeather.activities = getActivitySuggestions(preliminaryWeather)
    return preliminaryWeather
  })

// Server Function: Smart search lokasi dengan Open-Meteo Geocoding
export const searchLocationsServerFn = createServerFn({ method: 'GET' })
  .validator((query: string) => query)
  .handler(async ({ data: rawQuery }): Promise<LocationPlace[]> => {
    // Batasi panjang query maksimal 80 karakter
    const q = typeof rawQuery === 'string' ? rawQuery.trim().slice(0, 80) : ''
    if (!q || q.length < 2) return []

    const words = q.replace(/,/g, ' ').trim().split(/\s+/)

    async function fetchGeo(name: string, count: number): Promise<GeocodingResult[]> {
      try {
        const geoParams = new URLSearchParams({
          name,
          count: String(count),
          language: 'id',
          format: 'json',
        })
        const url = `https://geocoding-api.open-meteo.com/v1/search?${geoParams.toString()}`
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
        if (!res.ok) return []
        const data: GeocodingApiResponse = await res.json()
        return data.results || []
      } catch {
        return []
      }
    }

    const full = await fetchGeo(words.join(' '), 20)

    if (words.length > 1) {
      const extraWords = words.slice(1).map((w) => w.toLowerCase())
      const initialWordResults = await fetchGeo(words[0], 30)
      const combined = [...full, ...initialWordResults]

      const uniqueMap = new Map<number, GeocodingResult>()
      for (const item of combined) {
        uniqueMap.set(item.id, item)
      }
      const unique = Array.from(uniqueMap.values())

      const hits = unique.filter((item) => {
        const text = `${item.name} ${item.admin3 || ''} ${item.admin2 || ''} ${
          item.admin1 || ''
        } ${item.country || ''}`.toLowerCase()
        return extraWords.every((word) => text.includes(word))
      })

      if (hits.length > 0) {
        return hits.map((p) => ({
          id: p.id,
          name: p.name,
          admin1: p.admin1,
          admin2: p.admin2,
          admin3: p.admin3,
          country: p.country,
          latitude: p.latitude,
          longitude: p.longitude,
        }))
      }
    }

    return full.map((p) => ({
      id: p.id,
      name: p.name,
      admin1: p.admin1,
      admin2: p.admin2,
      admin3: p.admin3,
      country: p.country,
      latitude: p.latitude,
      longitude: p.longitude,
    }))
  })

// Server Function: Reverse Geocode via BigDataCloud
export const reverseGeocodeServerFn = createServerFn({ method: 'GET' })
  .validator((coords: { latitude: number; longitude: number }) => coords)
  .handler(async ({ data: { latitude, longitude } }): Promise<LocationPlace> => {
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error(
        `Koordinat reverse-geocode tidak valid: lat=${latitude}, lon=${longitude}`,
      )
    }

    try {
      const geoParams = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        localityLanguage: 'id',
      })
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?${geoParams.toString()}`
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) throw new Error()
      const r = await res.json()
      return {
        name: r.locality || r.city || 'Lokasi Saya',
        admin2: r.city || '',
        admin1: r.principalSubdivision || '',
        country: r.countryName || 'Indonesia',
        latitude,
        longitude,
      }
    } catch {
      return {
        name: 'Lokasi Saya',
        admin1: '',
        latitude,
        longitude,
      }
    }
  })

// Server Function: RainViewer Radar Tile Frames (untuk time slider & play/pause)
export const getRadarPathServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    host: string
    path: string
    frames: Array<{ time: number; path: string }>
  } | null> => {
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return null
      const data = await res.json()
      if (data.radar?.past && data.radar.past.length > 0) {
        const last = data.radar.past[data.radar.past.length - 1]
        return {
          host: data.host,
          path: last.path,
          frames: data.radar.past.map((f: { time: number; path: string }) => ({
            time: f.time,
            path: f.path,
          })),
        }
      }
      return null
    } catch {
      return null
    }
  },
)

// Server Function: Peringatan Dini Cuaca BMKG
export const fetchBmkgWarningsServerFn = createServerFn({ method: 'GET' })
  .validator((d?: { place?: LocationPlace }) => d)
  .handler(async ({ data }): Promise<BmkgWarning> => {
    const targetPlace = data?.place ?? { name: 'Indonesia', latitude: -6.2, longitude: 106.8 }
    return fetchBmkgWeatherWarningsForPlace(targetPlace)
  })

// Server Function: Batch fetch temperatures for favorite locations
export const fetchFavoritesWeatherServerFn = createServerFn({ method: 'POST' })
  .validator((favs: LocationPlace[]) => favs)
  .handler(
    async ({
      data: favs,
    }): Promise<Array<{ latitude: number; longitude: number; temp: number; weatherCode: number }>> => {
      // Batasi maksimal 20 item favorit untuk keamanan dan performa server
      const safeFavs = Array.isArray(favs) ? favs.slice(0, 20) : []

      const results = await Promise.all(
        safeFavs.map(async (f) => {
          if (
            !Number.isFinite(f.latitude) ||
            !Number.isFinite(f.longitude) ||
            f.latitude < -90 ||
            f.latitude > 90 ||
            f.longitude < -180 ||
            f.longitude > 180
          ) {
            return null
          }

          try {
            const params = new URLSearchParams({
              latitude: String(f.latitude),
              longitude: String(f.longitude),
              current: 'temperature_2m,weather_code',
            })
            const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
            if (!res.ok) return null
            const d = await res.json()
            return {
              latitude: f.latitude,
              longitude: f.longitude,
              temp: Math.round(d.current?.temperature_2m ?? 0),
              weatherCode: d.current?.weather_code ?? 0,
            }
          } catch {
            return null
          }
        }),
      )

      return results.filter(
        (r): r is { latitude: number; longitude: number; temp: number; weatherCode: number } =>
          r !== null,
      )
    },
  )
