import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import type {
  LocationPlace,
  WeatherData,
  FavoriteItem,
  AppSettings,
  WeatherAlertItem,
  ToastUndoItem,
} from '../types/weather'
import {
  DEFAULT_PLACE,
  DEFAULT_FAVS,
  generateWeatherAlerts,
  convertTemp,
} from '../utils/weatherUtils'
import {
  fetchWeatherServerFn,
  fetchFavoritesWeatherServerFn,
  reverseGeocodeServerFn,
} from '../server/weatherFn'

// Components
import { Sidebar } from '../components/Sidebar'
import { HeaderSearch } from '../components/HeaderSearch'
import { WeatherHero } from '../components/WeatherHero'
import { NowcastCard } from '../components/NowcastCard'
import { HourlyForecast } from '../components/HourlyForecast'
import { TemperatureChart24h } from '../components/TemperatureChart24h'
import { DailyForecast } from '../components/DailyForecast'
import { ActivitySuggestionsCard } from '../components/ActivitySuggestionsCard'
import { EncouragementBanner } from '../components/EncouragementBanner'
import { WeatherDetails } from '../components/WeatherDetails'
import { AirQualityCard } from '../components/AirQualityCard'
import { WeatherMap } from '../components/WeatherMap'
import { FavoriteLocations } from '../components/FavoriteLocations'
import { MobileBottomNav } from '../components/MobileBottomNav'
import { NotificationModal } from '../components/NotificationModal'
import { SettingsModal } from '../components/SettingsModal'
import { MascotSvg } from '../components/Mascot'
import { AlertCircle, AlertTriangle, Loader2, X, RefreshCw, Undo2 } from 'lucide-react'

// Interface for URL search params deep linking
interface DashboardSearch {
  lat?: number
  lon?: number
  name?: string
  admin1?: string
  country?: string
}

// Helper to safely parse coordinate numbers including 0 (e.g. Pontianak lat 0)
function parseCoordinate(val: unknown, min: number, max: number): number | undefined {
  if (typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max) {
    return val
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val)
    if (Number.isFinite(parsed) && parsed >= min && parsed <= max) {
      return parsed
    }
  }
  return undefined
}

// Route definition with TanStack Router URL Deep-Linking & SSR Loader
export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    const lat = parseCoordinate(search.lat, -90, 90)
    const lon = parseCoordinate(search.lon, -180, 180)
    const name = typeof search.name === 'string' && search.name.trim() !== '' ? search.name : undefined
    const admin1 = typeof search.admin1 === 'string' && search.admin1.trim() !== '' ? search.admin1 : undefined
    const country = typeof search.country === 'string' && search.country.trim() !== '' ? search.country : undefined
    return { lat, lon, name, admin1, country }
  },
  loader: async ({ location }) => {
    const search = location.search as DashboardSearch
    let targetPlace = DEFAULT_PLACE
    if (search.lat !== undefined && search.lon !== undefined) {
      targetPlace = {
        name: search.name || 'Lokasi Terpilih',
        admin1: search.admin1 || '',
        admin2: '',
        admin3: '',
        country: search.country || 'Indonesia',
        latitude: search.lat,
        longitude: search.lon,
      }
    }
    try {
      const initialWeather = await fetchWeatherServerFn({
        data: { place: targetPlace },
      })
      return { initialWeather, targetPlace }
    } catch {
      return { initialWeather: null, targetPlace }
    }
  },
  head: ({ loaderData }) => {
    const cityName =
      loaderData?.targetPlace?.name || loaderData?.initialWeather?.place?.name
    const title = cityName
      ? `Cuaca ${cityName} - RinaiHujan`
      : 'RinaiHujan - Dasbor Cuaca Ramah & Cerdas Indonesia'
    const desc = cityName
      ? `Prakiraan cuaca terkini dan 7 hari ke depan untuk ${cityName}, Indonesia di RinaiHujan.`
      : 'Prakiraan cuaca cerdas, radar hujan 15-menit, kualitas udara AQI, peta interaktif, dan rekomendasi aktivitas harian di Indonesia.'
    return {
      meta: [
        { title },
        { name: 'description', content: desc },
        { property: 'og:title', content: title },
        { property: 'og:description', content: desc },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: desc },
      ],
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const searchParams = Route.useSearch()
  const { initialWeather, targetPlace } = Route.useLoaderData()

  const hasUrlCoords = searchParams.lat !== undefined && searchParams.lon !== undefined
  const userSelectedPlaceRef = useRef<boolean>(hasUrlCoords)

  const [currentPlace, setCurrentPlace] = useState<LocationPlace>(
    initialWeather?.place ?? targetPlace,
  )
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather)
  const [favorites, setFavorites] = useState<FavoriteItem[]>(DEFAULT_FAVS)
  const [activeTab, setActiveTab] = useState<'beranda' | 'peta' | 'favorit'>('beranda')
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Last update timestamp
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())
  const [lastUpdatedFormatted, setLastUpdatedFormatted] = useState<string>('')

  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    tempUnit: 'celsius',
    windUnit: 'kmh',
    theme: 'light',
    browserNotifications: false,
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Notifications State (derived from active weather data)
  const [readAlertIds, setReadAlertIds] = useState<string[]>([])
  const [notifications, setNotifications] = useState<WeatherAlertItem[]>([])
  const [isNotifsOpen, setIsNotifsOpen] = useState(false)

  // Undo Toast State
  const [undoToast, setUndoToast] = useState<ToastUndoItem | null>(null)
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Format updated time helper
  const updateTimestampLabel = useCallback((ts: number) => {
    const d = new Date(ts)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    setLastUpdatedFormatted(`${hh}.${mm}`)
  }, [])

  // Resolve theme helper
  const applyTheme = useCallback((themeMode: 'light' | 'dark' | 'auto') => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    let effective: 'light' | 'dark' = 'light'
    if (themeMode === 'auto') {
      root.removeAttribute('data-theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      effective = prefersDark ? 'dark' : 'light'
      root.classList.add(effective)
    } else {
      root.setAttribute('data-theme', themeMode)
      root.classList.add(themeMode)
      effective = themeMode
    }
    setResolvedTheme(effective)
  }, [])

  // Check extreme weather for Web Notification API (max once per alert type per location per day)
  const checkExtremesAndNotify = useCallback(
    (w: WeatherData, placeName: string, enabled?: boolean) => {
      if (typeof window === 'undefined' || !('Notification' in window)) return
      if (!enabled && !settings.browserNotifications) return
      if (Notification.permission !== 'granted') return

      const localDate = w.current.time.slice(0, 10)
      const placeSlug = placeName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const tempUnit = settings.tempUnit
      const displayTemp = convertTemp(w.current.temp, tempUnit)
      const tempUnitSymbol = tempUnit === 'fahrenheit' ? '°F' : '°C'

      // Load sent browser notifications tracking
      let sentMap: Record<string, number> = {}
      try {
        const raw =
          localStorage.getItem('rinaihujan-sent-browser-notifs') ||
          localStorage.getItem('skycast-sent-browser-notifs')
        if (raw) sentMap = JSON.parse(raw)
      } catch {}

      // Prune entries older than 7 days
      const now = Date.now()
      for (const k of Object.keys(sentMap)) {
        if (now - sentMap[k] > 7 * 24 * 60 * 60 * 1000) {
          delete sentMap[k]
        }
      }

      let alertSent = false

      if (w.current.weatherCode >= 95) {
        const stormId = `storm-${placeSlug}-${localDate}`
        if (!sentMap[stormId]) {
          try {
            new Notification(`⚠️ Peringatan Badai: ${placeName}`, {
              body: `Terdeteksi badai petir di sekitar ${placeName}. Suhu: ${displayTemp}${tempUnitSymbol}. Harap berhati-hati!`,
              icon: '/favicon.svg',
            })
            sentMap[stormId] = now
            alertSent = true
          } catch {}
        }
      } else if (w.current.uvIndex >= 9) {
        const uvId = `uv-extreme-${placeSlug}-${localDate}`
        if (!sentMap[uvId]) {
          try {
            new Notification(`☀️ Radiasi UV Sangat Tinggi: ${placeName}`, {
              body: `Indeks UV mencapai ${w.current.uvIndex} (${w.current.uvLabel}). Gunakan tabir surya dan pelindung kepala.`,
              icon: '/favicon.svg',
            })
            sentMap[uvId] = now
            alertSent = true
          } catch {}
        }
      }

      // Check BMKG warnings
      if (w.bmkg?.warnings && w.bmkg.warnings.length > 0) {
        const firstBmkg = w.bmkg.warnings[0]
        const cleanBmkgId = (firstBmkg.id || placeSlug).replace(/[^a-zA-Z0-9.-]/g, '_')
        const bmkgId = `bmkg-browser-${cleanBmkgId}-${localDate}`
        if (!sentMap[bmkgId]) {
          try {
            new Notification(`⚠️ BMKG: ${firstBmkg.title}`, {
              body: firstBmkg.description.slice(0, 140) + '...',
              icon: '/favicon.svg',
            })
            sentMap[bmkgId] = now
            alertSent = true
          } catch {}
        }
      }

      if (alertSent) {
        try {
          localStorage.setItem('rinaihujan-sent-browser-notifs', JSON.stringify(sentMap))
        } catch {}
      }
    },
    [settings],
  )

  // 1. Initial Client Mount: Read LocalStorage, last place & Check GPS if first time
  useEffect(() => {
    updateTimestampLabel(Date.now())

    // Read saved theme & settings
    let loadedSettings: AppSettings = settings
    try {
      const savedSettings =
        localStorage.getItem('rinaihujan-settings') ||
        localStorage.getItem('skycast-settings')
      if (savedSettings) {
        loadedSettings = JSON.parse(savedSettings)
        setSettings(loadedSettings)
        if (loadedSettings.theme) applyTheme(loadedSettings.theme)
      } else {
        applyTheme('light')
      }
    } catch {}

    // Read and prune read alert IDs (clean up entries older than 7 days)
    try {
      const savedReadIds =
        localStorage.getItem('rinaihujan-read-alerts') ||
        localStorage.getItem('skycast-read-alerts')
      if (savedReadIds) {
        const parsed: string[] = JSON.parse(savedReadIds)
        const nowMs = Date.now()
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

        const valid = parsed.filter((id) => {
          const dateMatch = id.match(/(\d{4}-\d{2}-\d{2})/)
          if (dateMatch) {
            const alertTime = new Date(dateMatch[1] + 'T00:00:00').getTime()
            return nowMs - alertTime < sevenDaysMs
          }
          return true
        })
        setReadAlertIds(valid)
        localStorage.setItem('rinaihujan-read-alerts', JSON.stringify(valid))
      }
    } catch {}

    // Read saved favorites (clean start, no developer defaults)
    let favsLoaded: FavoriteItem[] = []
    try {
      const savedFavs =
        localStorage.getItem('rinaihujan-favs') ||
        localStorage.getItem('skycast-favs')
      if (savedFavs) {
        favsLoaded = JSON.parse(savedFavs)
        setFavorites(favsLoaded)
      }
    } catch {}

    // Immediately fetch temperatures for loaded favorites
    if (favsLoaded.length > 0) {
      fetchFavoritesWeatherServerFn({ data: favsLoaded })
        .then((temps) => {
          setFavorites((prev) =>
            prev.map((fav) => {
              const hit = temps.find(
                (t) =>
                  Math.abs(t.latitude - fav.latitude) < 0.01 &&
                  Math.abs(t.longitude - fav.longitude) < 0.01,
              )
              return hit ? { ...fav, currentTemp: hit.temp, weatherCode: hit.weatherCode } : fav
            }),
          )
        })
        .catch(() => {})
    }

    // Auto-GPS & Last Place: only if URL has no explicit coordinates
    if (!hasUrlCoords) {
      try {
        const savedLastPlace =
          localStorage.getItem('rinaihujan-last-place') ||
          localStorage.getItem('skycast-last-place')
        if (savedLastPlace) {
          const parsed: LocationPlace = JSON.parse(savedLastPlace)
          if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
            userSelectedPlaceRef.current = true
            handleSelectPlace(parsed)
          }
        } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
          // First time visit without saved preference: query GPS
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              // If user selected a location while GPS was querying, ignore GPS
              if (userSelectedPlaceRef.current) return
              try {
                const { latitude, longitude } = pos.coords
                const place = await reverseGeocodeServerFn({
                  data: { latitude, longitude },
                })
                if (userSelectedPlaceRef.current) return
                userSelectedPlaceRef.current = true
                handleSelectPlace(place)
              } catch {}
            },
            () => {}, // silent fallback if denied
            { timeout: 6000 },
          )
        }
      } catch {}
    }
  }, [])

  // 2. Generate dynamic notifications whenever active weather or settings changes
  useEffect(() => {
    if (!weather) return
    const rawAlerts = generateWeatherAlerts(weather, settings)
    const withReadState = rawAlerts.map((a) => ({
      ...a,
      isRead: readAlertIds.includes(a.id),
    }))
    setNotifications(withReadState)
  }, [weather, readAlertIds, settings])

  // 3. Periodic 10-Minute Refresh for active weather & favorites
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        handleRefresh()
      }
    }, 10 * 60 * 1000)

    // Check visibility change: if returning to tab after > 10 mins, auto-refresh
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastUpdated
        if (elapsed > 10 * 60 * 1000) {
          handleRefresh()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentPlace, favorites, lastUpdated])

  // 4. Observe scroll sections to synchronize activeTab on desktop
  useEffect(() => {
    if (typeof window === 'undefined') return
    const heroEl = document.getElementById('hero')
    const mapEl = document.getElementById('peta')
    const favEl = document.getElementById('favorit')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (entry.target.id === 'favorit') setActiveTab('favorit')
            else if (entry.target.id === 'peta') setActiveTab('peta')
            else if (entry.target.id === 'hero') setActiveTab('beranda')
          }
        }
      },
      { threshold: 0.3 },
    )

    if (heroEl) observer.observe(heroEl)
    if (mapEl) observer.observe(mapEl)
    if (favEl) observer.observe(favEl)

    return () => observer.disconnect()
  }, [weather])

  // 5. Listen to browser Back/Forward (popstate) to keep weather in sync with URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handlePopState = async () => {
      const params = new URLSearchParams(window.location.search)
      const latStr = params.get('lat')
      const lonStr = params.get('lon')
      if (latStr !== null && lonStr !== null) {
        const lat = parseFloat(latStr)
        const lon = parseFloat(lonStr)
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const place: LocationPlace = {
            name: params.get('name') || 'Lokasi Terpilih',
            admin1: params.get('admin1') || '',
            admin2: '',
            admin3: '',
            country: params.get('country') || 'Indonesia',
            latitude: lat,
            longitude: lon,
          }
          userSelectedPlaceRef.current = true
          if (
            Math.abs(place.latitude - currentPlace.latitude) > 0.001 ||
            Math.abs(place.longitude - currentPlace.longitude) > 0.001
          ) {
            setIsLoading(true)
            try {
              const data = await fetchWeatherServerFn({ data: { place } })
              setCurrentPlace(place)
              setWeather(data)
              const now = Date.now()
              setLastUpdated(now)
              updateTimestampLabel(now)
            } catch {
              setErrorMsg('Gagal memuat data cuaca dari riwayat peramban.')
            } finally {
              setIsLoading(false)
            }
          }
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentPlace, updateTimestampLabel])

  // 6. Live OS theme change listener when theme is 'auto'
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (settings.theme !== 'auto') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const effective = e.matches ? 'dark' : 'light'
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(effective)
      setResolvedTheme(effective)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [settings.theme])

  // Helper: Save favorites to localStorage
  const saveFavorites = (items: FavoriteItem[]) => {
    setFavorites(items)
    try {
      localStorage.setItem('rinaihujan-favs', JSON.stringify(items))
    } catch {}
  }

  // Handle location selection with URL sync (Single fetch - no router double fetch)
  const handleSelectPlace = async (place: LocationPlace) => {
    userSelectedPlaceRef.current = true
    try {
      localStorage.setItem('rinaihujan-last-place', JSON.stringify(place))
    } catch {}
    setErrorMsg(null)
    setIsLoading(true)
    try {
      const data = await fetchWeatherServerFn({ data: { place } })
      setCurrentPlace(place)
      setWeather(data)
      const now = Date.now()
      setLastUpdated(now)
      updateTimestampLabel(now)

      // Sync to URL search params deep link via replaceState (does not trigger TanStack Router loader)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams()
        params.set('lat', String(place.latitude))
        params.set('lon', String(place.longitude))
        if (place.name) params.set('name', place.name)
        if (place.admin1) params.set('admin1', place.admin1)
        if (place.country) params.set('country', place.country)
        const newUrl = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState({ place }, '', newUrl)
      }

      // Check notification if extreme
      checkExtremesAndNotify(data, place.name)
    } catch {
      setErrorMsg('Gagal mengambil data cuaca. Periksa koneksi internet kamu atau coba lokasi lain.')
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh active weather data and favorites
  const handleRefresh = async () => {
    setErrorMsg(null)
    setIsRefreshing(true)
    try {
      const data = await fetchWeatherServerFn({ data: { place: currentPlace } })
      setWeather(data)
      const now = Date.now()
      setLastUpdated(now)
      updateTimestampLabel(now)

      // Check extreme alerts
      checkExtremesAndNotify(data, currentPlace.name)

      // Also refresh favorites weather
      if (favorites.length > 0) {
        const temps = await fetchFavoritesWeatherServerFn({ data: favorites })
        setFavorites((prev) =>
          prev.map((fav) => {
            const hit = temps.find(
              (t) =>
                Math.abs(t.latitude - fav.latitude) < 0.01 &&
                Math.abs(t.longitude - fav.longitude) < 0.01,
            )
            return hit ? { ...fav, currentTemp: hit.temp, weatherCode: hit.weatherCode } : fav
          }),
        )
      }
    } catch {
      setErrorMsg('Gagal memperbarui data cuaca. Menampilkan data tersimpan.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Check if current place is in favorites
  const isCurrentFavorited = favorites.some(
    (f) =>
      Math.abs(f.latitude - currentPlace.latitude) < 0.001 &&
      Math.abs(f.longitude - currentPlace.longitude) < 0.001,
  )

  // Add current place to favorites
  const handleAddFavorite = () => {
    if (isCurrentFavorited) {
      setErrorMsg('Lokasi ini sudah tersimpan di daftar favorit kamu.')
      return
    }

    const newItem: FavoriteItem = {
      name: currentPlace.name,
      admin1: currentPlace.admin1 || '',
      admin2: currentPlace.admin2 || '',
      admin3: currentPlace.admin3 || '',
      country: currentPlace.country || '',
      latitude: currentPlace.latitude,
      longitude: currentPlace.longitude,
      currentTemp: weather?.current.temp,
      weatherCode: weather?.current.weatherCode,
    }

    const updated = [...favorites, newItem]
    saveFavorites(updated)
  }

  // Remove favorite with Undo Toast
  const handleRemoveFavorite = (index: number) => {
    const removedItem = favorites[index]
    if (!removedItem) return

    const updated = favorites.filter((_, i) => i !== index)
    saveFavorites(updated)

    // Show Undo Toast
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setUndoToast({
      id: String(Date.now()),
      message: `Lokasi "${removedItem.name}" dihapus dari favorit`,
      item: removedItem,
      index,
    })

    toastTimeoutRef.current = setTimeout(() => {
      setUndoToast(null)
    }, 5000)
  }

  // Toggle favorite on Hero star click
  const handleToggleFavorite = () => {
    if (isCurrentFavorited) {
      const idx = favorites.findIndex(
        (f) =>
          Math.abs(f.latitude - currentPlace.latitude) < 0.001 &&
          Math.abs(f.longitude - currentPlace.longitude) < 0.001,
      )
      if (idx !== -1) {
        handleRemoveFavorite(idx)
      }
    } else {
      handleAddFavorite()
    }
  }

  // Undo delete favorite
  const handleUndoRemove = () => {
    if (!undoToast) return
    const restored = [...favorites]
    restored.splice(undoToast.index, 0, undoToast.item)
    saveFavorites(restored)
    setUndoToast(null)
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
  }

  // Share Weather / Copy Link Handler
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = `RinaiHujan - Prakiraan Cuaca ${currentPlace.name}`
    const tempUnit = settings.tempUnit
    const displayTemp = weather ? convertTemp(weather.current.temp, tempUnit) : ''
    const tempSymbol = tempUnit === 'fahrenheit' ? '°F' : '°C'
    const text = weather
      ? `Prakiraan cuaca ${currentPlace.name}: ${displayTemp}${tempSymbol}, ${weather.current.weatherLabel}. Cek detail di RinaiHujan!`
      : `Prakiraan cuaca terkini ${currentPlace.name} di RinaiHujan!`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    // Fallback: copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
        setUndoToast({
          id: String(Date.now()),
          message: `Tautan cuaca ${currentPlace.name} berhasil disalin ke papan klip!`,
          item: currentPlace,
          index: -1,
        })
        toastTimeoutRef.current = setTimeout(() => {
          setUndoToast(null)
        }, 4000)
      } catch {
        setErrorMsg('Tidak dapat menyalin tautan ke papan klip.')
      }
    }
  }

  // Tab navigation scroll handler
  const handleSelectTab = (tab: 'beranda' | 'peta' | 'favorit') => {
    setActiveTab(tab)
    if (typeof window === 'undefined') return
    if (tab === 'beranda') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.getElementById(tab)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Mark all notifications as read (persists to localStorage without clearing history)
  const handleMarkAllRead = () => {
    const allIds = notifications.map((n) => n.id)
    const merged = Array.from(new Set([...readAlertIds, ...allIds]))
    setReadAlertIds(merged)
    try {
      localStorage.setItem('rinaihujan-read-alerts', JSON.stringify(merged))
    } catch {}
  }

  // Update settings & theme
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    try {
      localStorage.setItem('rinaihujan-settings', JSON.stringify(updated))
      if (newSettings.theme) {
        applyTheme(newSettings.theme)
      }
    } catch {}
  }

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="min-h-screen bg-theme-page text-theme-primary transition-colors duration-200">
      <div className="flex flex-col md:flex-row max-w-[1600px] mx-auto min-h-screen">
        {/* Left Sidebar (Desktop) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          unreadNotifsCount={unreadNotifsCount}
          onOpenNotifs={() => setIsNotifsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Center Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 pb-24 md:pb-7 flex flex-col gap-5">
          {/* Header Search with Autocomplete & Geolocation */}
          <HeaderSearch
            onSelectPlace={handleSelectPlace}
            onError={(msg) => setErrorMsg(msg)}
            isLoading={isLoading}
          />

          {/* Dismissible Error Alert */}
          {errorMsg && (
            <div
              className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-sm font-bold shadow-sm animate-fade-in"
              role="alert"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-none" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                aria-label="Tutup pesan error"
                className="p-1 rounded-full text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Fallback Error Card if Weather is completely null and not loading */}
          {!weather && !isLoading && (
            <div className="bg-theme-surface rounded-3xl p-8 border border-theme-card text-center flex flex-col items-center shadow-theme-card my-6">
              <MascotSvg width={80} height={68} animated />
              <h3 className="text-xl font-black text-theme-primary mt-4">
                Gagal Memuat Data Cuaca
              </h3>
              <p className="text-sm text-theme-muted mt-2 max-w-md">
                Terjadi kendala saat menghubungkan ke server cuaca Open-Meteo. Silakan periksa koneksi internet Anda lalu coba lagi.
              </p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-5 py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-md transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2.5 text-theme-accent font-extrabold text-sm py-1 animate-pulse"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sedang memindai langit dan memperbarui prakiraan cuaca...</span>
            </div>
          )}

          {/* BMKG Official Weather Early Warning Banner */}
          {weather?.bmkg?.warnings && weather.bmkg.warnings.length > 0 && (
            <div
              className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-sm animate-fade-in flex items-start gap-3.5"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-none mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    Peringatan Dini Cuaca BMKG
                  </span>
                  {weather.bmkg.warnings[0].time && (
                    <span className="text-xs font-semibold text-theme-muted">
                      {weather.bmkg.warnings[0].time}
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-extrabold mt-1 text-theme-primary">
                  {weather.bmkg.warnings[0].title}
                </h4>
                <p className="text-xs sm:text-sm mt-1 leading-relaxed text-theme-secondary">
                  {weather.bmkg.warnings[0].description}
                </p>
              </div>
            </div>
          )}

          {/* Hero Section */}
          {weather && (
            <WeatherHero
              weather={weather}
              settings={settings}
              isFavorited={isCurrentFavorited}
              onToggleFavorite={handleToggleFavorite}
              onRefresh={handleRefresh}
              onShare={handleShare}
              isRefreshing={isRefreshing}
              lastUpdatedFormatted={lastUpdatedFormatted}
            />
          )}

          {/* Nowcast 15-Minute Rain Prediction (2 Jam ke Depan) */}
          {weather?.nowcast && <NowcastCard nowcast={weather.nowcast} />}

          {/* Hourly Forecast (24 Jam Penuh) */}
          {weather && (
            <HourlyForecast hourly={weather.hourly} settings={settings} />
          )}

          {/* 24-Hour Pure SVG Temperature Trend Chart */}
          {weather?.hourly && (
            <TemperatureChart24h hourly={weather.hourly} settings={settings} />
          )}

          {/* 7-Day Forecast */}
          {weather && <DailyForecast daily={weather.daily} settings={settings} />}

          {/* Activity Recommendations Card */}
          {weather?.activities && (
            <ActivitySuggestionsCard activities={weather.activities} />
          )}

          {/* Friendly Encouragement Banner */}
          <EncouragementBanner weather={weather} />
        </main>

        {/* Right Sidebar */}
        <aside className="w-full md:w-80 lg:w-[360px] flex-none p-4 sm:p-6 lg:p-7 md:pl-0 flex flex-col gap-5">
          {/* Deduplicated Weather Details */}
          {weather && <WeatherDetails weather={weather} settings={settings} />}

          {/* Air Quality (AQI) Card */}
          {weather?.airQuality && <AirQualityCard airQuality={weather.airQuality} />}

          {/* Interactive Weather Map & Radar */}
          <WeatherMap place={currentPlace} theme={resolvedTheme} />

          {/* Favorite Locations List */}
          <FavoriteLocations
            favorites={favorites}
            currentPlace={currentPlace}
            settings={settings}
            onSelectPlace={handleSelectPlace}
            onAddFavorite={handleAddFavorite}
            onRemoveFavorite={handleRemoveFavorite}
          />
        </aside>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        unreadNotifsCount={unreadNotifsCount}
        onOpenNotifs={() => setIsNotifsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Undo Toast Notification */}
      {undoToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-3 py-3 px-5 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700 backdrop-blur-md animate-scale-up"
        >
          <span className="text-xs sm:text-sm font-semibold">{undoToast.message}</span>
          {undoToast.index !== -1 && (
            <button
              type="button"
              onClick={handleUndoRemove}
              className="flex items-center gap-1.5 py-1 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition active:scale-95 shadow-sm"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Batal (Undo)</span>
            </button>
          )}
        </div>
      )}

      {/* Interactive Modals */}
      <NotificationModal
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  )
}
