import { useState } from 'react'
import type { HourlySlot, AppSettings } from '../types/weather'
import { convertTemp } from '../utils/weatherUtils'
import { TrendingUp } from 'lucide-react'

interface TemperatureChart24hProps {
  hourly: HourlySlot[]
  settings: AppSettings
}

export function TemperatureChart24h({ hourly, settings }: TemperatureChart24hProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (!hourly || hourly.length === 0) return null

  const data = hourly.slice(0, 24).map((slot) => ({
    time: slot.timeFormatted,
    temp: convertTemp(slot.temp, settings.tempUnit),
    weatherLabel: slot.weatherLabel,
    precipProb: slot.precipProb,
  }))

  const temps = data.map((d) => d.temp)
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)
  const range = Math.max(maxTemp - minTemp, 1)

  // Chart dimensions
  const width = 800
  const height = 160
  const paddingX = 30
  const paddingTop = 30
  const paddingBottom = 30
  const availableWidth = width - paddingX * 2
  const availableHeight = height - paddingTop - paddingBottom

  // Compute point coordinates
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * availableWidth
    const y = paddingTop + (1 - (d.temp - minTemp) / range) * availableHeight
    return { x, y, ...d }
  })

  // Generate smooth SVG curve path
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = arr[i - 1]
    const cx = (prev.x + pt.x) / 2
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  // Area path for gradient fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  return (
    <section className="bg-theme-surface backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-theme-card border border-theme-card transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base sm:text-lg font-black text-theme-primary flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <span>Grafik Tren Suhu 24 Jam</span>
        </h3>
        <span className="text-xs font-extrabold text-theme-muted">
          Rentang: {minTemp}° - {maxTemp}°
        </span>
      </div>

      <div className="relative w-full overflow-x-auto pb-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[620px] h-40 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <path d={areaD} fill="url(#tempGradient)" />

          {/* Curve stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Data points & labels */}
          {points.map((pt, i) => {
            const isHovered = hoverIndex === i
            // Show labels every 3 hours or on hover
            const showLabel = i % 3 === 0 || i === points.length - 1 || isHovered

            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-pointer"
              >
                {/* Hit area */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {/* Point dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#3b82f6' : '#ffffff'}
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  className="transition-all"
                />

                {/* Temperature value */}
                {showLabel && (
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    className="text-[11px] font-black fill-current text-slate-800 dark:text-slate-100"
                  >
                    {pt.temp}°
                  </text>
                )}

                {/* Time label on x-axis */}
                {showLabel && (
                  <text
                    x={pt.x}
                    y={height - 8}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-current text-slate-500 dark:text-slate-400"
                  >
                    {pt.time}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {hoverIndex !== null && points[hoverIndex] && (
          <div className="mt-2 text-center text-xs font-bold text-theme-secondary animate-fade-in">
            <span>Pukul {points[hoverIndex].time}: </span>
            <strong className="text-theme-primary">{points[hoverIndex].temp}°</strong>
            <span className="text-theme-muted"> ({points[hoverIndex].weatherLabel}, Peluang Hujan {points[hoverIndex].precipProb}%)</span>
          </div>
        )}
      </div>
    </section>
  )
}
