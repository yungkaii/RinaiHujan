import { useEffect, useRef, useState, useCallback } from 'react'
import type { LocationPlace } from '../types/weather'
import type { Map as LeafletMap, CircleMarker, TileLayer } from 'leaflet'
import { getRadarPathServerFn } from '../server/weatherFn'
import { Maximize2, Minimize2, Play, Pause, Layers, Map as MapIcon } from 'lucide-react'

interface WeatherMapProps {
  place: LocationPlace
  theme?: 'light' | 'dark'
}

export function WeatherMap({ place, theme = 'light' }: WeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<CircleMarker | null>(null)
  const baseTileLayerRef = useRef<TileLayer | null>(null)
  const radarLayerRef = useRef<TileLayer | null>(null)

  const [isClient, setIsClient] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Radar controls
  const [radarEnabled, setRadarEnabled] = useState(true)
  const [radarFrames, setRadarFrames] = useState<Array<{ time: number; path: string }>>([])
  const [radarHost, setRadarHost] = useState<string>('')
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch Radar Frames
  const fetchRadar = useCallback(async () => {
    try {
      const radar = await getRadarPathServerFn()
      if (radar && radar.frames.length > 0) {
        setRadarHost(radar.host)
        setRadarFrames(radar.frames)
        setCurrentFrameIndex(radar.frames.length - 1)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!isClient) return
    fetchRadar()

    // Refresh radar every 10 minutes
    const radarInterval = setInterval(fetchRadar, 10 * 60 * 1000)
    return () => clearInterval(radarInterval)
  }, [isClient, fetchRadar])

  // Initialize Map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return

    let cancelled = false

    async function initMap() {
      const L = await import('leaflet')
      if (cancelled || !mapContainerRef.current) return

      const pos: [number, number] = [place.latitude, place.longitude]
      const tileUrl =
        theme === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'

      if (!mapInstanceRef.current) {
        // Initialize Map with zoom control
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false,
          scrollWheelZoom: false, // Prevent desktop scroll trap
        }).setView(pos, 8)

        // CartoDB base tile layer
        const baseLayer = L.tileLayer(tileUrl, {
          maxZoom: 18,
          subdomains: 'abcd',
        }).addTo(map)
        baseTileLayerRef.current = baseLayer

        // Pulse Marker for selected city
        const marker = L.circleMarker(pos, {
          radius: 9,
          color: '#ffffff',
          weight: 3,
          fillColor: theme === 'dark' ? '#38bdf8' : '#2563eb',
          fillOpacity: 1,
        }).addTo(map)

        mapInstanceRef.current = map
        markerRef.current = marker

        setIsMapLoaded(true)
      } else {
        // Update view & marker
        mapInstanceRef.current.setView(pos, 8)
        if (markerRef.current) {
          markerRef.current.setLatLng(pos)
          markerRef.current.setStyle({
            fillColor: theme === 'dark' ? '#38bdf8' : '#2563eb',
          })
        }

        if (baseTileLayerRef.current) {
          baseTileLayerRef.current.setUrl(tileUrl)
        }
      }
    }

    initMap()

    return () => {
      cancelled = true
    }
  }, [isClient, place.latitude, place.longitude, theme])

  // Update Radar Layer when frame or toggle changes
  useEffect(() => {
    if (!isClient || !mapInstanceRef.current || radarFrames.length === 0) return

    async function updateRadar() {
      const currentMap = mapInstanceRef.current
      if (!currentMap) return

      const L = await import('leaflet')
      const activeFrame = radarFrames[currentFrameIndex]

      if (radarLayerRef.current) {
        currentMap.removeLayer(radarLayerRef.current)
        radarLayerRef.current = null
      }

      if (radarEnabled && activeFrame && radarHost) {
        const radarTileUrl = `${radarHost}${activeFrame.path}/256/{z}/{x}/{y}/2/1_1.png`
        const newRadarLayer = L.tileLayer(radarTileUrl, {
          opacity: 0.72,
          zIndex: 20,
        }).addTo(currentMap)
        radarLayerRef.current = newRadarLayer
      }
    }

    updateRadar()
  }, [isClient, radarEnabled, currentFrameIndex, radarFrames, radarHost])

  // Play / Pause Animation Loop
  useEffect(() => {
    if (isPlaying && radarFrames.length > 1) {
      playTimerRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % radarFrames.length)
      }, 1000)
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }
  }, [isPlaying, radarFrames.length])

  // Handle Resize on Expand/Collapse
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize()
      }, 300)
    }
  }, [isExpanded])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        radarLayerRef.current = null
        baseTileLayerRef.current = null
      }
    }
  }, [])

  const activeTimeFormatted =
    radarFrames[currentFrameIndex]
      ? new Date(radarFrames[currentFrameIndex].time * 1000).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--:--'

  return (
    <section
      id="peta"
      className={`bg-theme-surface backdrop-blur-md rounded-3xl p-5 shadow-theme-card border border-theme-card scroll-mt-6 transition-all duration-200 ${
        isExpanded
          ? 'fixed inset-4 sm:inset-10 z-50 flex flex-col justify-between max-w-5xl mx-auto shadow-2xl'
          : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-black text-theme-primary flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-theme-accent" />
          <span>Peta Cuaca & Radar</span>
        </h3>

        <div className="flex items-center gap-2">
          {/* Radar Toggle Button */}
          <button
            type="button"
            onClick={() => setRadarEnabled(!radarEnabled)}
            className={`text-xs font-bold px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 ${
              radarEnabled
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-theme-elevated text-theme-muted border-theme-subtle'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Radar {radarEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Expand / Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Kecilkan peta' : 'Perbesar peta'}
            aria-label={isExpanded ? 'Kecilkan peta' : 'Perbesar peta'}
            className="p-1.5 rounded-full bg-theme-elevated border border-theme-subtle text-theme-muted hover:text-theme-primary transition"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Map Container (min-height 260px) */}
      <div
        className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100 to-blue-200 dark:from-slate-900 dark:to-slate-800 border border-theme-subtle shadow-inner ${
          isExpanded ? 'flex-1 min-h-[380px]' : 'h-64 sm:h-72'
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-theme-surface/80 z-20">
            <div className="flex items-center gap-2 text-xs font-bold text-theme-accent">
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Memuat Peta & Kontrol...</span>
            </div>
          </div>
        )}
      </div>

      {/* Radar Time Slider & Controls */}
      {radarEnabled && radarFrames.length > 0 && (
        <div className="mt-3 p-2.5 rounded-2xl bg-theme-elevated border border-theme-subtle flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Jeda radar' : 'Putar animasi radar'}
            aria-label={isPlaying ? 'Jeda radar' : 'Putar animasi radar'}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 shadow-sm"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-bold text-theme-muted mb-1">
              <span>Waktu Radar:</span>
              <span className="text-theme-primary font-black">{activeTimeFormatted}</span>
            </div>
            <input
              type="range"
              min={0}
              max={radarFrames.length - 1}
              value={currentFrameIndex}
              onChange={(e) => {
                setIsPlaying(false)
                setCurrentFrameIndex(Number(e.target.value))
              }}
              className="w-full accent-blue-600 cursor-pointer h-1.5"
              aria-label="Waktu frame radar"
            />
          </div>
        </div>
      )}

      {/* Intensity Legend & Attribution */}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs font-bold text-theme-muted">
        <div className="flex items-center gap-1.5 flex-1 max-w-[220px]">
          <span>Ringan</span>
          <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-[#8ad8ff] via-[#4fd16d] via-[#ffe14d] to-[#ff5f5f]" />
          <span>Lebat</span>
        </div>
        <span className="truncate">
          © OpenStreetMap, © CARTO, RainViewer
        </span>
      </div>
    </section>
  )
}
