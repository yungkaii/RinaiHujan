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
      !