import type { LocationPlace, FavoriteItem, AppSettings } from '../types/weather'
import { WeatherIcon } from './WeatherIcons'
import { weatherByCode, convertTemp } from '../utils/weatherUtils'
import { Plus, X, Heart, Star } from 'lucide-react'

interface FavoriteLocationsProps {
  favorites: FavoriteItem[]
  currentPlace: LocationPlace
  settings: AppSettings
  onSelectPlace: (place: LocationPlace) => void
  onAddFavorite: () => void
  onRemoveFavorite: (index: number) => void
}

export function FavoriteLocations({
  favorites,
  currentPlace,
  settings,
  onSelectPlace,
  onAddFavorite,
  onRemoveFavorite,
}: FavoriteLocationsProps) {
  const isAlreadyFav = favorites.some(
    (f) =>
      Math.abs(f.latitude - currentPlace.latitude) < 0.001 &&
      Math.abs(f.longitude - currentPlace.longitude) < 0.001,
  )

  return (
    <section
      id="favorit"
      className="bg-theme-surface backdrop-blur-md rounded-3xl p-5 shadow-theme-card border border-theme-card scroll-mt-6 transition-colors duration-200"
    >
      <h3 className="text-base font-black text-theme-primary mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Lokasi Favorit</span>
        </span>
        {favorites.length > 0 && (
          <span className="text-xs font-bold text-theme-muted">
            {favorites.length} kota
          </span>
        )}
      </h3>

      <div className="space-y-2 mb-3">
        {favorites.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-2xl bg-theme-elevated/50 border border-dashed border-theme-subtle flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-400 flex items-center justify-center mb-2">
              <Heart className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-theme-secondary">
              Belum ada lokasi favorit tersimpan
            </p>
            <p className="text-xs text-theme-muted mt-1 max-w-[220px]">
              Klik tombol di bawah untuk menyimpan{' '}
              <strong className="text-theme-primary">{currentPlace.name}</strong> ke daftar favoritmu.
            </p>
          </div>
        ) : (
          favorites.map((fav, idx) => {
            const cond = weatherByCode(fav.weatherCode ?? 0)
            const temp =
              fav.currentTemp !== undefined
                ? convertTemp(fav.currentTemp, settings.tempUnit)
                : null

            return (
              <div
                key={`${fav.latitude}-${fav.longitude}-${fav.name}`}
                onClick={() => {
                  onSelectPlace(fav)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="group flex items-center gap-3 p-3 rounded-2xl bg-theme-elevated border border-theme-subtle hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex-none">
                  <WeatherIcon type={cond.icon} size={28} />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="font-extrabold text-sm text-theme-primary block truncate group-hover:text-theme-accent transition">
                    {fav.name}
                  </span>
                  <small className="text-xs font-semibold text-theme-muted block truncate">
                    {[fav.admin2, fav.admin1].filter(Boolean).join(', ') || 'Indonesia'}
                  </small>
                </div>

                {temp !== null ? (
                  <span className="text-base font-black text-theme-primary flex-none ml-2">
                    {temp}°
                  </span>
                ) : (
                  <span className="text-xs text-theme-muted flex-none ml-2 font-bold">
                    --°
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveFavorite(idx)
                  }}
                  title="Hapus dari favorit"
                  aria-label={`Hapus ${fav.name} dari favorit`}
                  className="p-1.5 rounded-full text-theme-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          })
        )}
      </div>

      <button
        type="button"
        onClick={onAddFavorite}
        disabled={isAlreadyFav}
        className={`w-full py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
          isAlreadyFav
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white shadow-blue-500/20 active:scale-95'
        }`}
      >
        <Plus className="w-4 h-4" />
        <span>{isAlreadyFav ? 'Sudah Ada di Favorit' : '+ Tambah Lokasi Favorit'}</span>
      </button>
    </section>
  )
}
