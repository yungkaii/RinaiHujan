import type { HourlySlot, AppSettings } from '../types/weather'
import { WeatherIcon } from './WeatherIcons'
import { convertTemp } from '../utils/weatherUtils'
import { Clock, Droplets, ChevronRight } from 'lucide-react'

interface HourlyForecastProps {
  hourly: HourlySlot[]
  settings: AppSettings
}

export function HourlyForecast({ hourly, settings }: HourlyForecastProps) {
  return (
    <section className="bg-theme-surface backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-theme-card border border-theme-card transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-black text-theme-primary flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <span>Prakiraan Cuaca 24 Jam ke Depan</span>
        </h3>
        <span className="text-xs font-bold text-theme-muted flex items-center gap-1">
          <span>Geser untuk jam berikutnya</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Horizontal Scroll with snap-x */}
      <div className="flex items-stretch overflow-x-auto snap-x snap-mandatory scrollbar-none gap-2.5 pb-2">
        {hourly.map((slot, index) => {
          const temp = convertTemp(slot.temp, settings.tempUnit)

          return (
            <div key={slot.time} className="flex items-stretch gap-2.5 flex-none snap-start">
              {/* Day Change Marker Divider */}
              {slot.dayDivider && index > 0 && (
                <div className="flex flex-col items-center justify-center px-2 border-l-2 border-dashed border-blue-400/50 dark:border-blue-600/50 my-1">
                  <span className="text-xs font-black uppercase text-blue-600 dark:text-sky-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {slot.dayDivider}
                  </span>
                </div>
              )}

              <div
                className={`rounded-2xl border p-3 flex flex-col items-center justify-between text-center min-w-[84px] transition-all hover:shadow-md ${
                  slot.isNow
                    ? 'bg-blue-500/10 dark:bg-blue-600/20 border-blue-400 dark:border-blue-500 font-extrabold shadow-sm'
                    : 'bg-theme-elevated border-theme-subtle hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  {slot.isNow && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                  <small
                    className={`text-xs font-bold ${
                      slot.isNow
                        ? 'text-blue-600 dark:text-sky-300 font-black'
                        : 'text-theme-muted'
                    }`}
                  >
                    {slot.timeFormatted}
                  </small>
                </div>

                <div className="my-2.5 flex justify-center">
                  <WeatherIcon type={slot.weatherIcon} size={36} />
                </div>

                <span className="font-black text-theme-primary text-base">
                  {temp}°
                </span>

                <span className="text-xs font-bold text-sky-500 dark:text-sky-400 mt-1 flex items-center gap-0.5">
                  <Droplets className="w-3 h-3 text-sky-500" />
                  <span>{slot.precipProb}%</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
