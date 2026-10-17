import type { WeatherData, AppSettings } from '../types/weather'
import { Eye, Compass, Sunrise, Sunset, Droplets, CloudRain, Info } from 'lucide-react'
import { convertTemp } from '../utils/weatherUtils'

interface WeatherDetailsProps {
  weather: WeatherData
  settings: AppSettings
}

export function WeatherDetails({ weather, settings }: WeatherDetailsProps) {
  const { current } = weather
  const dewPoint = convertTemp(current.dewPoint, settings.tempUnit)
  const tempUnitSymbol = settings.tempUnit === 'fahrenheit' ? '°F' : '°C'

  return (
    <section className="bg-theme-surface backdrop-blur-md rounded-3xl p-5 shadow-theme-card border border-theme-card transition-colors duration-200">
      <h3 className="text-base font-black text-theme-primary mb-4 flex items-center gap-2">
        <Info className="w-4 h-4 text-theme-accent" />
        <span>Detail Atmosfer & Angin</span>
      </h3>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Arah Angin & Kompas */}
        <div className="bg-theme-elevated rounded-2xl p-3.5 border border-theme-subtle shadow-sm transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-theme-muted font-bold mb-1">
            <Compass className="w-3.5 h-3.5 text-blue-500" />
            <span>Arah Angin</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block transition-transform duration-300 text-blue-600 dark:text-sky-400 font-bold"
              style={{ transform: `rotate(${current.windDirection}deg)` }}
              title={`${current.windDirection}°`}
            >
              ↑
            </span>
            <b className="text-base font-black text-theme-primary">
              {current.windDirectionCardinal}{' '}
              <span className="text-xs font-bold text-theme-muted">({current.windDirection}°)</span>
            </b>
          </div>
        </div>

        {/* Curah Hujan */}
        <div className="bg-theme-elevated rounded-2xl p-3.5 border border-theme-subtle shadow-sm transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-theme-muted font-bold mb-1">
            <CloudRain className="w-3.5 h-3.5 text-sky-500" />
            <span>Curah Hujan</span>
          </div>
          <b className="text-base font-black text-theme-primary">
            {current.precipitationMm} mm
          </b>
        </div>

        {/* Titik Embun */}
        <div className="bg-theme-elevated rounded-2xl p-3.5 border border-theme-subtle shadow-sm transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-theme-muted font-bold mb-1">
            <Droplets className="w-3.5 h-3.5 text-teal-500" />
            <span>Titik Embun</span>
          </div>
          <b className="text-base font-black text-theme-primary">
            {dewPoint}{tempUnitSymbol}
          </b>
        </div>

        {/* Jarak Pandang */}
        <div className="bg-theme-elevated rounded-2xl p-3.5 border border-theme-subtle shadow-sm transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-theme-muted font-bold mb-1">
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>Jarak Pandang</span>
          </div>
          <b id="vis" className="text-base font-black text-theme-primary">
            {current.visibilityKm} km
          </b>
        </div>

        {/* Tekanan Udara */}
        <div className="bg-theme-elevated rounded-2xl p-3.5 border border-theme-subtle shadow-sm transition-colors col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-theme-muted font-bold">Tekanan Barometrik</span>
            <b id="pressure" className="text-sm font-black text-theme-primary">
              {current.surfacePressure} hPa
            </b>
          </div>
        </div>

        {/* Matahari Terbit */}
        <div className="bg-theme-elevated rounded-2xl p-3.5 border border-theme-subtle shadow-sm transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-theme-muted font-bold mb-1">
            <Sunrise className="w-3.5 h-3.5 text-amber-500" />
            <span>Matahari Terbit</span>
          </div>
          <b id="sunrise" className="text-base font-black text-theme-primary">
            {current.sunrise}
          </b>
        </div>

        {/* Matahari Terbenam */}
        <div className="bg-theme-elevated rounded-2xl p-3.5 border border-theme-subtle shadow-sm transition-colors">
          <div className="flex items-center gap-1.5 text-xs text-theme-muted font-bold mb-1">
            <Sunset className="w-3.5 h-3.5 text-rose-500" />
            <span>Matahari Terbenam</span>
          </div>
          <b id="sunset" className="text-base font-black text-theme-primary">
            {current.sunset}
          </b>
        </div>
      </div>
    </section>
  )
}
