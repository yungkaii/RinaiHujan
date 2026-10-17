import type { WeatherData, AppSettings } from '../types/weather'
import { WeatherIcon } from './WeatherIcons'
import { MascotSvg } from './Mascot'
import { formatRegion, convertTemp, convertWind, getHeroMascotMessage } from '../utils/weatherUtils'
import { RotateCw, Star, Share2 } from 'lucide-react'

interface WeatherHeroProps {
  weather: WeatherData
  settings: AppSettings
  isFavorited: boolean
  onToggleFavorite: () => void
  onRefresh: () => void
  onShare: () => void
  isRefreshing?: boolean
  lastUpdatedFormatted?: string
}

export function WeatherHero({
  weather,
  settings,
  isFavorited,
  onToggleFavorite,
  onRefresh,
  onShare,
  isRefreshing = false,
  lastUpdatedFormatted,
}: WeatherHeroProps) {
  const { place, current } = weather
  const temp = convertTemp(current.temp, settings.tempUnit)
  const apparentTemp = convertTemp(current.apparentTemp, settings.tempUnit)
  const minTemp = convertTemp(current.tempMin, settings.tempUnit)
  const maxTemp = convertTemp(current.tempMax, settings.tempUnit)
  const wind = convertWind(current.windSpeed, settings.windUnit)
  const tempUnitSymbol = settings.tempUnit === 'fahrenheit' ? '°F' : '°C'
  const windUnitSymbol = settings.windUnit === 'mph' ? 'mph' : 'km/j'

  const mascotMessage = getHeroMascotMessage(weather)
  const isNight = current.isNight
  const isStorm = current.weatherCode >= 95
  const isRain = (current.weatherCode >= 51 && current.weatherCode <= 67) || (current.weatherCode >= 80 && current.weatherCode <= 82)
  const isCloudy = current.weatherCode === 3 || current.weatherCode === 45 || current.weatherCode === 48

  // Compute dynamic hero background classes
  let heroGradientClass = 'bg-gradient-to-b from-[#3b82f6] via-[#60a5fa] to-[#93c5fd]'
  if (isNight) {
    if (isStorm) {
      heroGradientClass = 'bg-gradient-to-b from-[#0b0f19] via-[#1e1b4b] to-[#0f172a]'
    } else if (isRain) {
      heroGradientClass = 'bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#334155]'
    } else {
      heroGradientClass = 'bg-gradient-to-b from-[#090d16] via-[#172554] to-[#1e3a8a]'
    }
  } else {
    if (isStorm) {
      heroGradientClass = 'bg-gradient-to-b from-[#334155] via-[#475569] to-[#64748b]'
    } else if (isRain) {
      heroGradientClass = 'bg-gradient-to-b from-[#475569] via-[#64748b] to-[#94a3b8]'
    } else if (isCloudy) {
      heroGradientClass = 'bg-gradient-to-b from-[#60a5fa] via-[#93c5fd] to-[#cbd5e1]'
    }
  }

  return (
    <section
      id="hero"
      className={`relative rounded-[2rem] overflow-hidden min-h-[380px] text-white p-6 sm:p-9 pb-24 shadow-xl transition-all duration-500 ${heroGradientClass}`}
    >
      {/* Dynamic Background Scenic SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none select-none opacity-80"
        viewBox="0 0 800 330"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        {isNight ? (
          <>
            {/* Stars & Moon */}
            <circle cx="710" cy="65" r="24" fill="#fef08a" opacity="0.9" />
            <circle cx="718" cy="60" r="20" fill="#172554" />
            <circle cx="120" cy="40" r="2" fill="#fff" opacity="0.8" />
            <circle cx="280" cy="60" r="1.5" fill="#fff" opacity="0.9" />
            <circle cx="450" cy="35" r="2" fill="#fff" opacity="0.7" />
            <circle cx="590" cy="55" r="1.5" fill="#fff" opacity="0.85" />
            <path
              d="M0 250 L180 200 L300 235 L470 170 L640 240 L800 200 V330 H0Z"
              fill="#1e293b"
              opacity=".8"
            />
            <path
              d="M0 285Q200 245 400 280T800 260V330H0Z"
              fill="#0f172a"
              opacity=".9"
            />
          </>
        ) : (
          <>
            <path
              d="M0 250 L180 190 L300 230 L470 150 L640 235 L800 190 V330 H0Z"
              fill={isStorm || isRain ? '#64748b' : '#7aa3d6'}
              opacity=".5"
            />
            <path
              d="M0 285Q200 235 400 275T800 255V330H0Z"
              fill={isStorm || isRain ? '#475569' : '#8fc27a'}
              opacity=".85"
            />
            <path
              d="M0 310Q250 270 500 305T800 290V330H0Z"
              fill={isStorm || isRain ? '#334155' : '#6fae63'}
              opacity=".95"
            />
          </>
        )}
      </svg>

      {/* Top Header Row with Actions */}
      <div className="relative z-10 flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-white/90 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
          {lastUpdatedFormatted ? `Diperbarui pukul ${lastUpdatedFormatted}` : 'Pembaruan Terkini'}
        </span>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            type="button"
            onClick={onShare}
            title="Bagikan cuaca lokasi ini"
            aria-label="Bagikan tautan cuaca lokasi ini"
            className="p-2 rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 border border-white/20 transition active:scale-95"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Segarkan data cuaca"
            aria-label="Segarkan data cuaca sekarang"
            className="p-2 rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 border border-white/20 transition active:scale-95 disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-lg">
        {/* City Name with Favorite Star Button */}
        <div className="flex items-center gap-3">
          <h2 id="city-name" className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
            {place.name}
          </h2>

          <button
            type="button"
            onClick={onToggleFavorite}
            title={isFavorited ? 'Hapus dari lokasi favorit' : 'Tambahkan ke lokasi favorit'}
            aria-label={isFavorited ? 'Hapus dari lokasi favorit' : 'Tambahkan ke lokasi favorit'}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition active:scale-90"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                isFavorited
                  ? 'text-amber-300 fill-amber-300 drop-shadow'
                  : 'text-white/80 hover:text-white'
              }`}
            />
          </button>
        </div>

        <p id="region-subtitle" className="text-white/90 font-semibold text-sm sm:text-base mt-1 drop-shadow-sm">
          {formatRegion(place) || 'Wilayah Terpilih'}
        </p>
        <p id="current-date" className="text-white/80 font-medium text-xs sm:text-sm mt-0.5">
          {current.dateFormatted}
        </p>

        {/* Temperature & Condition Row */}
        <div className="flex items-center gap-4 mt-4" role="region" aria-live="polite" aria-label="Ringkasan cuaca saat ini">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex-none drop-shadow-lg">
            <WeatherIcon type={current.weatherIcon} size="100%" />
          </div>
          <div className="flex items-baseline">
            <span
              id="temperature"
              className="text-7xl sm:text-8xl font-black text-white tracking-tighter leading-none drop-shadow-md"
            >
              {temp}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white/90 ml-1 self-start mt-2">
              {tempUnitSymbol}
            </span>
          </div>
        </div>

        <div className="mt-2 ml-1" aria-live="polite">
          <b id="weather-desc" className="block text-2xl font-black text-white drop-shadow-sm">
            {current.weatherLabel}
          </b>
          <p id="feels-like" className="text-white/90 font-semibold text-sm mt-0.5">
            Terasa seperti {apparentTemp}{tempUnitSymbol}
          </p>
        </div>
      </div>

      {/* Floating Hero Mascot with Dynamic Speech Bubble */}
      <div className="hidden sm:block absolute right-8 lg:right-14 top-14 w-44 z-10 pointer-events-none">
        <div className="absolute -left-28 -top-3 w-52 font-caveat text-lg sm:text-xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl py-2 px-3.5 text-slate-900 dark:text-white font-bold -rotate-6 shadow-md border border-white/60 dark:border-slate-700/60 text-center leading-snug">
          {mascotMessage}
        </div>
        <MascotSvg width={160} height={130} animated />
      </div>

      {/* 4-Metric Quick Strip */}
      <div className="absolute left-3 right-3 sm:left-4 sm:right-4 bottom-3 sm:bottom-4 z-20 bg-theme-surface backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-md border border-theme-subtle grid grid-cols-2 sm:grid-cols-4 gap-2 text-theme-primary transition-colors">
        <div className="px-3 py-1">
          <small className="block text-xs text-theme-muted font-bold">Kelembapan</small>
          <b id="humidity" className="text-base sm:text-lg font-black text-theme-primary">
            {current.humidity}%
          </b>
        </div>

        <div className="px-3 py-1 border-l border-theme-subtle">
          <small className="block text-xs text-theme-muted font-bold">Angin</small>
          <b id="wind-speed" className="text-base sm:text-lg font-black text-theme-primary">
            {wind} {windUnitSymbol} ({current.windDirectionCardinal})
          </b>
        </div>

        <div className="px-3 py-1 border-l-0 sm:border-l border-theme-subtle">
          <small className="block text-xs text-theme-muted font-bold">Indeks UV</small>
          <b id="uv-strip" className="text-base sm:text-lg font-black text-theme-primary">
            {current.uvIndex} ({current.uvLabel})
          </b>
        </div>

        <div className="px-3 py-1 border-l border-theme-subtle">
          <small className="block text-xs text-theme-muted font-bold">Min / Maks</small>
          <b id="minmax" className="text-base sm:text-lg font-black text-theme-primary">
            {minTemp}° / {maxTemp}°
          </b>
        </div>
      </div>
    </section>
  )
}
