import { Umbrella, Bike, Shirt, Heart, CheckCircle2, AlertCircle } from 'lucide-react'
import type { ActivitySuggestion } from '../types/weather'

interface ActivitySuggestionsCardProps {
  activities?: ActivitySuggestion[]
}

export function ActivitySuggestionsCard({ activities }: ActivitySuggestionsCardProps) {
  if (!activities || activities.length === 0) return null

  const getIcon = (name: ActivitySuggestion['iconName']) => {
    switch (name) {
      case 'umbrella':
        return <Umbrella className="w-5 h-5" />
      case 'heart':
        return <Heart className="w-5 h-5" />
      case 'shirt':
        return <Shirt className="w-5 h-5" />
      case 'bike':
        return <Bike className="w-5 h-5" />
      default:
        return <CheckCircle2 className="w-5 h-5" />
    }
  }

  return (
    <section className="bg-theme-surface backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-theme-card border border-theme-card transition-colors duration-200">
      <h3 className="text-base sm:text-lg font-black text-theme-primary mb-3 flex items-center gap-2">
        <span>✨</span>
        <span>Rekomendasi Aktivitas Hari Ini</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activities.map((act) => (
          <div
            key={act.id}
            className="p-3.5 rounded-2xl bg-theme-elevated border border-theme-subtle flex items-start gap-3 transition-colors hover:shadow-sm"
          >
            <div
              className={`p-2.5 rounded-xl flex-none ${
                act.suitable
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              }`}
            >
              {getIcon(act.iconName)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <b className="text-sm font-extrabold text-theme-primary truncate">
                  {act.title}
                </b>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-full flex-none flex items-center gap-1 ${
                    act.suitable
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {act.suitable ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  <span>{act.status}</span>
                </span>
              </div>
              <p className="text-xs text-theme-muted leading-relaxed">
                {act.tip}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
