import { Wind } from 'lucide-react'
import type { AirQualityData } from '../types/weather'

interface AirQualityCardProps {
  airQuality?: AirQualityData
}

export function AirQualityCard({ airQuality }: AirQualityCardProps) {
  if (!airQuality) return null

  return (
    <section className="bg-theme-surface backdrop-blur-md rounded-3xl p-5 shadow-theme-card border border-theme-card transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-black text-theme-primary flex items-center gap-2">
          <Wind className="w-4 h-4 text-emerald-500" />
          <span>Kualitas Udara (AQI)</span>
        </h3>
        <span
          className="text-xs font-black px-2.5 py-0.5 rounded-full text-white shadow-sm"
          style={{ backgroundColor: airQuality.color }}
        >
          {airQuality.category}
        </span>
      </div>

      <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-theme-elevated border border-theme-subtle mb-3">
        <div className="text-center px-2 flex-none">
          <span className="text-3xl font-black text-theme-primary block leading-none">
            {airQuality.aqi}
          </span>
          <small className="text-xs uppercase font-bold text-theme-muted tracking-wider block mt-1">
            US AQI
          </small>
        </div>

        <div className="flex-1 min-w-0 pl-3 border-l border-theme-subtle">
          <div className="flex items-center gap-4 text-xs font-bold text-theme-secondary mb-1">
            <span>PM2.5: <strong className="text-theme-primary">{airQuality.pm25} µg/m³</strong></span>
            <span>PM10: <strong className="text-theme-primary">{airQuality.pm10} µg/m³</strong></span>
          </div>
          <p className="text-xs text-theme-muted leading-relaxed">
            {airQuality.advice}
          </p>
        </div>
      </div>

      {/* AQI Range meter */}
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 via-rose-500 to-purple-800 relative">
          {/* Position indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-900 shadow-md transition-all"
            style={{
              left: `${Math.min(Math.max((airQuality.aqi / 300) * 100, 2), 98)}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs font-bold text-theme-muted px-0.5">
          <span>0 (Baik)</span>
          <span>100</span>
          <span>200</span>
          <span>300+ (Berbahaya)</span>
        </div>
      </div>
    </section>
  )
}
