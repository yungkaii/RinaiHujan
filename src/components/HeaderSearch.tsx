import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Loader2, X, History, Trash2, Search } from 'lucide-react'
import type { LocationPlace, SearchHistoryItem } from '../types/weather'
import { searchLocationsServerFn, reverseGeocodeServerFn } from '../server/weatherFn'
import { MascotSvg } from './Mascot'
import { formatRegion, getGreeting } from '../utils/weatherUtils'

interface HeaderSearchProps {
  onSelectPlace: (place: LocationPlace) => void
  onError: (msg: string) => void
  isLoading?: boolean
}

export function HeaderSearch({ onSelectPlace, onError, isLoading = false }: HeaderSearchProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<LocationPlace[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [isNoResults, setIsNoResults] = useState(false)
  const [greeting, setGreeting] = useState('Semoga harimu menyenangkan!')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const latestRequestIdRef = useRef<number>(0)

  // Load search history from localStorage & update greeting safely on client
  useEffect(() => {
    setGreeting(getGreeting())
    try {
      const saved =
        localStorage.getItem('rinaihujan-search-history') ||
        localStorage.getItem('skycast-search-history')
      if (saved) {
        setSearchHistory(JSON.parse(saved))
      }
    } catch {}
  }, [])

  // Save place to history helper
  const addToHistory = (place: LocationPlace) => {
    try {
      const newItem: SearchHistoryItem = {
        id: `${place.latitude}-${place.longitude}-${Date.now()}`,
        query: place.name,
        place,
        timestamp: Date.now(),
      }
      const filtered = searchHistory.filter(
        (h) =>
          Math.abs(h.place.latitude - place.latitude) > 0.001 ||
          Math.abs(h.place.longitude - place.longitude) > 0.001,
      )
      const updated = [newItem, ...filtered].slice(0, 5)
      setSearchHistory(updated)
      localStorage.setItem('rinaihujan-search-history', JSON.stringify(updated))
    } catch {}
  }

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSearchHistory([])
    try {
      localStorage.removeItem('rinaihujan-search-history')
      localStorage.removeItem('skycast-search-history')
    } catch {}
  }

  // Debounced search with race-condition guard
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSelectedIndex(-1)

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setIsNoResults(false)
      setIsSearching(false)
      return
    }

    const currentReqId = Date.now()
    latestRequestIdRef.current = currentReqId
    setIsSearching(true)
    setIsNoResults(false)

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchLocationsServerFn({ data: trimmed })
        // Check if this is still the latest request
        if (latestRequestIdRef.current === currentReqId) {
          setSuggestions(results)
          setIsNoResults(results.length === 0)
          setIsOpen(true)
        }
      } catch {
        if (latestRequestIdRef.current === currentReqId) {
          setSuggestions([])
          setIsNoResults(true)
        }
      } finally {
        if (latestRequestIdRef.current === currentReqId) {
          setIsSearching(false)
        }
      }
    }, 280)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Click outside to close popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleSelect = (place: LocationPlace) => {
    setQuery(place.name)
    setIsOpen(false)
    setSelectedIndex(-1)
    addToHistory(place)
    onSelectPlace(place)
  }

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (suggestions.length > 0) {
        setIsOpen(true)
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
      } else if (searchHistory.length > 0 && query.trim().length === 0) {
        setIsOpen(true)
        setSelectedIndex((prev) => (prev + 1) % searchHistory.length)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (suggestions.length > 0) {
        setIsOpen(true)
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (searchHistory.length > 0 && query.trim().length === 0) {
        setIsOpen(true)
        setSelectedIndex((prev) => (prev - 1 + searchHistory.length) % searchHistory.length)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) {
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        } else {
          handleSelect(suggestions[0])
        }
      } else if (query.trim().length === 0 && searchHistory.length > 0 && selectedIndex >= 0) {
        handleSelect(searchHistory[selectedIndex].place)
      } else if (query.trim().length >= 2) {
        setIsSearching(true)
        searchLocationsServerFn({ data: query.trim() })
          .then((res) => {
            if (res.length > 0) {
              handleSelect(res[0])
            } else {
              onError(`Lokasi "${query}" tidak ditemukan. Coba nama kota atau kecamatan lain.`)
            }
          })
          .catch(() => {
            onError('Gagal mencari lokasi. Periksa koneksi internet Anda.')
          })
          .finally(() => setIsSearching(false))
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setSelectedIndex(-1)
    }
  }

  const handleClearQuery = () => {
    setQuery('')
    setSuggestions([])
    setIsNoResults(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleGpsClick = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      onError('Browser Anda tidak mendukung deteksi lokasi GPS.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const place = await reverseGeocodeServerFn({
            data: { latitude, longitude },
          })
          setQuery(place.name)
          setIsOpen(false)
          addToHistory(place)
          onSelectPlace(place)
        } catch {
          onError('Gagal mendapatkan nama wilayah dari koordinat GPS.')
        } finally {
          setIsLocating(false)
        }
      },
      (err) => {
        setIsLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          onError('Izin lokasi ditolak. Cari nama kota secara manual di kotak pencarian.')
        } else {
          onError('Tidak dapat menemukan sinyal GPS. Coba cari nama kota secara manual.')
        }
      },
      { timeout: 10000, enableHighAccuracy: true },
    )
  }

  const showHistory = query.trim().length === 0 && searchHistory.length > 0 && isOpen

  return (
    <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-1">
      {/* Combobox Search Container */}
      <div ref={containerRef} className="relative flex-1 max-w-xl z-30">
        <div
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="suggestions-list"
          className="flex items-center bg-theme-input rounded-full px-4 py-2.5 shadow-md shadow-blue-500/5 border border-theme-subtle focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent transition-all"
        >
          <MapPin className="w-5 h-5 text-sky-400 flex-none ml-1 mr-2" aria-hidden="true" />
          <input
            ref={inputRef}
            id="city-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder="Cari kota, kabupaten, atau kecamatan..."
            autoComplete="off"
            aria-autocomplete="list"
            aria-label="Cari lokasi cuaca"
            aria-activedescendant={
              selectedIndex >= 0 ? `suggestion-item-${selectedIndex}` : undefined
            }
            className="flex-1 bg-transparent border-0 outline-none text-theme-primary placeholder-theme-muted text-sm md:text-base font-semibold min-w-0"
          />

          {/* Clear text button */}
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClearQuery}
              title="Hapus pencarian"
              aria-label="Hapus teks pencarian"
              className="p-1 text-theme-muted hover:text-theme-primary transition rounded-full mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {(isSearching || isLoading) && (
            <Loader2 className="w-4 h-4 text-sky-400 animate-spin mr-2" aria-hidden="true" />
          )}

          <button
            id="gps-btn"
            type="button"
            onClick={handleGpsClick}
            disabled={isLocating}
            title="Gunakan lokasi saya saat ini"
            aria-label="Gunakan lokasi saya saat ini"
            className="p-1.5 rounded-full text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition active:scale-95 disabled:opacity-50"
          >
            {isLocating ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-sky-400" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Suggestions & Search History Popover */}
        {isOpen && (
          <div
            id="suggestions-list"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-2 bg-theme-elevated rounded-3xl shadow-xl shadow-slate-900/10 dark:shadow-black/50 border border-theme-subtle overflow-hidden max-h-72 overflow-y-auto p-2 z-40 animate-fade-in"
          >
            {/* 1. Results found */}
            {suggestions.length > 0 &&
              suggestions.slice(0, 8).map((p, idx) => {
                const isSelected = selectedIndex === idx
                return (
                  <button
                    key={`${p.latitude}-${p.longitude}-${p.name}`}
                    id={`suggestion-item-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={`w-full text-left px-4 py-2.5 rounded-2xl cursor-pointer transition flex flex-col gap-0.5 group ${
                      isSelected ? 'bg-blue-100/90 dark:bg-blue-900/50' : 'hover:bg-theme-surface-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-theme-primary group-hover:text-theme-accent transition">
                        {p.name}
                      </span>
                      <span className="text-xs font-bold bg-sky-100/70 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-full">
                        {p.admin2 || p.country || 'Lokasi'}
                      </span>
                    </div>
                    <span className="text-xs text-theme-muted">
                      {formatRegion(p)}
                      {p.country ? `, ${p.country}` : ''}
                    </span>
                  </button>
                )
              })}

            {/* 2. No Results Message */}
            {isNoResults && query.trim().length >= 2 && !isSearching && (
              <div className="py-6 px-4 text-center">
                <Search className="w-8 h-8 text-theme-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-theme-primary">Lokasi tidak ditemukan</p>
                <p className="text-xs text-theme-muted mt-1">
                  Coba periksa ejaan atau ketik nama kabupaten/provinsinya.
                </p>
              </div>
            )}

            {/* 3. Search History */}
            {showHistory && (
              <div>
                <div className="flex items-center justify-between px-3 py-1.5 text-xs font-bold text-theme-muted border-b border-theme-subtle mb-1">
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Pencarian Terakhir</span>
                  </span>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-xs hover:text-rose-500 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>

                {searchHistory.map((item, idx) => {
                  const isSelected = selectedIndex === idx
                  return (
                    <button
                      key={item.id}
                      id={`suggestion-item-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      type="button"
                      onClick={() => handleSelect(item.place)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between group ${
                        isSelected
                          ? 'bg-blue-100/90 dark:bg-blue-900/50'
                          : 'hover:bg-theme-surface-hover'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-theme-muted" />
                        <span className="font-bold text-sm text-theme-primary group-hover:text-theme-accent">
                          {item.place.name}
                        </span>
                      </div>
                      <span className="text-xs text-theme-muted">
                        {[item.place.admin2, item.place.admin1].filter(Boolean).join(', ')}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cheerful Greeting & Avatar */}
      <div className="hidden sm:flex items-center gap-3 text-right">
        <div>
          <span className="text-xs font-bold text-theme-muted block">
            {greeting}
          </span>
        </div>
        <div className="w-11 h-11 rounded-full bg-blue-100/80 dark:bg-blue-950/80 p-1 flex items-center justify-center flex-none shadow-sm border border-blue-200/50 dark:border-blue-800/50">
          <MascotSvg width={38} height={32} />
        </div>
      </div>
    </header>
  )
}
