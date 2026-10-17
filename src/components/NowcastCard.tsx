import { CloudRain, CheckCircle2, Clock } from 'lucide-react'
import type { NowcastData } from '../types/weather'

interface NowcastCardProps {
  nowcast?: NowcastData
}

export function NowcastCard({ nowcast }: NowcastCardProps) {
  if (!nowcast || nowcast.intervals.length === 0) return null

  return (
    <section className="bg-theme-surface backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-theme-card border border-theme-card transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-black text-theme-primary flex items-center gap-2">
          <CloudRain className="w-5 h-5 text-blue-500" />
          <span>Prediksi Hujan 2 Jam ke Depan</span>
        </h3>
        <span className="text-xs font-bold text-sky-600 dark:text-sky-300 bg-sky-100/70 dark:bg-sky-950/70 px-2.5 py-0.5 rounded-full border border-sky-200/50 dark:border-sky-800/50">
          Nowcast 15 Menit
        </span>
      </div>

      <div className="p-3.5 rounded-2xl bg-theme-elevated border border-theme-subtle flex items-center gap-3 mb-4">
        {nowcast.hasRainSoon ? (
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex-none">
            <Clock className="w-5 h-5" />
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex-none">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <b className="text-sm font-extrabold text-theme-primary block">
            {nowcast.hasRainSoon ? 'Perhatian: Ada Hujan Mendekat' : 'Langit Relatif Aman'}
          </b>
          <p className="text-xs text-theme-secondary mt-0.5 leading-snug">
            {nowcast.summaryMessage}
          </p>
        </div>
      </div>

      {/* 15-minute interval precipitation bars */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {nowcast.intervals.map((intv) => {
          const isRainy = intv.precipMm > 0.1
          return (
            <div
              key={intv.time}
              className={`p-2 rounded-xl text-center border transition-all ${
                isRainy
                  ? 'bg-blue-100/80 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 font-bold'
                  : 'bg-theme-elevated border-theme-subtle'
              }`}
            >
              <small className="text-xs font-bold text-theme-muted block">
                {intv.timeFormatted}
              </small>
              <div className="my-1.5 flex justify-center items-end h-8">
                <div
                  className={`w-3 rounded-full transition-all ${
                    isRainy ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  style={{
                    height: `${Math.min(Math.max(intv.precipMm * 15, 6), 32)}px`,
                  }}
                  title={`${intv.precipMm} mm`}
                />
              </div>
              <span className={`text-xs font-black block ${isRainy ? 'text-blue-600 dark:text-sky-300' : 'text-theme-muted'}`}>
                {intv.precipMm > 0 ? `${intv.precipMm}mm` : '0'}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
