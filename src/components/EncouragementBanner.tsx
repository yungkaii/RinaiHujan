import { Link } from '@tanstack/react-router'
import { MascotSvg } from './Mascot'
import type { WeatherData } from '../types/weather'
import { getBannerMessage } from '../utils/weatherUtils'
import { Info } from 'lucide-react'

interface EncouragementBannerProps {
  weather?: WeatherData | null
}

export function EncouragementBanner({ weather }: EncouragementBannerProps) {
  const message = weather ? getBannerMessage(weather) : 'Jaga hidrasi tubuh, jangan lupa minum air putih yang cukup! 🥤'

  return (
    <section
      aria-label="Pesan Ramah & Info RinaiHujan"
      className="relative bg-theme-surface backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-theme-card border border-theme-card transition-colors duration-200 overflow-hidden"
    >
      {/* Soft ambient gradient overlay to blend seamlessly */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-sky-500/8 to-emerald-500/5 dark:from-sky-500/10 dark:via-blue-500/5 dark:to-transparent pointer-events-none rounded-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left side: Brand identity & about link */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-theme-primary tracking-tight">
              RinaiHujan
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-sky-300 border border-blue-200/60 dark:border-blue-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Indonesia
            </span>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-theme-secondary mt-1.5 leading-relaxed max-w-lg">
            Informasi cuaca ramah, cerdas, dan real-time untuk seluruh wilayah Indonesia.
          </p>

          <div className="mt-3.5">
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-sky-400 bg-blue-50/90 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 active:scale-95 border border-blue-200/70 dark:border-blue-800/70 px-3 py-1.5 rounded-xl transition duration-150 shadow-sm"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Tentang RinaiHujan</span>
            </Link>
          </div>
        </div>

        {/* Right side: Speech bubble with tail + Mascot */}
        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          <div className="relative bg-theme-elevated/95 dark:bg-slate-800/95 text-theme-primary border border-theme-subtle rounded-2xl px-4 py-2.5 shadow-sm max-w-[240px] sm:max-w-[280px]">
            <p className="font-caveat text-base sm:text-lg font-bold text-center leading-snug">
              {message}
            </p>
            {/* Speech bubble tail pointer pointing right towards the mascot */}
            <div
              className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[8px] border-l-theme-subtle"
              aria-hidden="true"
            />
            <div
              className="hidden sm:block absolute -right-[7px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-theme-elevated dark:border-l-slate-800"
              aria-hidden="true"
            />
          </div>

          <div className="w-14 h-12 sm:w-16 sm:h-14 shrink-0 transition-transform hover:scale-105 duration-200">
            <MascotSvg width={60} height={52} animated />
          </div>
        </div>
      </div>
    </section>
  )
}

