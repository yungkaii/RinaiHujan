import type { DailySlot, AppSettings } from '../types/weather'
import { WeatherIcon } from './WeatherIcons'
import { convertTemp } from '../utils/weatherUtils'
import { Calendar, Droplets } from 'lucide-react'

interface DailyForecastProps {
  daily: DailySlot[]
  settings: AppSettings
}

export function DailyForecast({ daily, settings }: DailyForecastProps) {
  // Find global min and max for range bar calculation
  const allMins = daily.map((d) => convertTemp(d.tempMin, settings.tempUnit))
  const allMaxs = daily.map((d) => convertTemp(d.tempMax, settings.tempUnit))
  const globalMin = Math.min(...allMins)
  const globalMax = Math.max(...allMaxs)
  const totalRange = Math.max(globalMax - globalMin, 1)

  return (
    <section className="bg-theme-surface backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-theme-card border border-theme-card transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-black text-theme-primary flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <span>Prakiraan 7 Hari ke Depan</span>
        </h3>
        <span className="text-xs font-bold text-theme-muted">
          Rentang Suhu & Kondisi
        </span>
      </div>

      {/* Horizontal Scroll on Mobile, 7 Columns on Desktop */}
      <div className="flex sm:grid sm:grid-cols-7 overflow-x-auto snap-x snap-mandatory scrollbar-none gap-2.5 pb-2">
        {daily.map((slot, idx) => {
          const min = convertTemp(slot.tempMin, settings.tempUnit)
          const max = convertTemp(slot.tempMax, settings.tempUnit)
          const isToday = idx === 0 || slot.isToday

          // Calculate bar left offset and width percentage
          const leftPercent = Math.max(((min - globalMin) / totalRange) * 100, 0)
          const widthPercent = Math.max(((max - min) / totalRange) * 100, 15)

          return (
            <div
              key={slot.date}
              className={`rounded-2xl border p-3 flex flex-col items-center justify-between text-center min-w-[100px] sm:min-w-0 flex-none sm:flex-initial snap-start transition-all hover:shadow-md ${
                isToday
                  ? 'bg-blue-500/10 dark:bg-blue-600/20 border-blue-400 dark:border-blue-500 shadow-sm'
                  : 'bg-theme-elevated border-theme-subtle hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <div>
                <span className="font-extrabold text-sm text-theme-primary flex items-center justify-center gap-1">
                  <span>{slot.dayName}</span>
                  {isToday && (
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-sky-300 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded-full">
                      Hari Ini
                    </span>
                  )}
                </span>
                <small className="text-xs font-semibold text-theme-muted block mt-0.5">
                  {slot.dateFormatted}
                </small>
              </div>

              <div className="my-2 flex justify-center">
                <WeatherIcon type={slot.weatherIcon} size={36} />
              </div>

              {/* Weather Condition Label */}
              <span className="text-xs font-bold text-theme-secondary truncate max-w-[95px] mb-2">
                {slot.weatherLabel}
              </span>

              {/* Temperature Values & Visual Spread Bar */}
              <div className="w-full space-y-1">
                <div className="flex justify-between text-xs font-black text-theme-primary px-1">
                  <span>{min}°</span>
                  <span>{max}°</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full relative overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-amber-400"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  />
                </div>
              </div>

              {/* Precipitation */}
              <span className="text-xs font-bold text-sky-500 dark:text-sky-400 mt-2 flex items-center gap-0.5">
                <Droplets className="w-3 h-3 text-sky-500" />
                <span>{slot.precipProbMax}%</span>
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
