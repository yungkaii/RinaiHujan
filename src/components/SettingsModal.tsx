import { useState } from 'react'
import {
  Settings,
  X,
  Thermometer,
  Wind,
  Palette,
  BellRing,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react'
import type { AppSettings } from '../types/weather'
import { useModalA11y } from '../hooks/useModalA11y'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  const [notifError, setNotifError] = useState<string | null>(null)
  const modalRef = useModalA11y({ isOpen, onClose })

  if (!isOpen) return null

  const handleToggleNotifications = async () => {
    setNotifError(null)

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifError('Browser Anda tidak mendukung Web Notification API.')
      return
    }

    if (settings.browserNotifications) {
      onUpdateSettings({ browserNotifications: false })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        onUpdateSettings({ browserNotifications: true })
        // Test notification
        try {
          new Notification('RinaiHujan', {
            body: 'Notifikasi cuaca RinaiHujan berhasil diaktifkan!',
            icon: '/favicon.svg',
          })
        } catch {}
      } else {
        setNotifError(
          'Izin notifikasi ditolak di browser Anda. Aktifkan izin notifikasi pada setelan situs browser untuk menerima peringatan.',
        )
      }
    } catch {
      setNotifError('Gagal meminta izin notifikasi.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-md bg-theme-modal rounded-3xl p-6 shadow-2xl border border-theme-card animate-scale-up outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-theme-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 id="settings-title" className="font-extrabold text-lg text-theme-primary">
                Pengaturan RinaiHujan
              </h3>
              <p className="text-xs text-theme-muted">Preferensi satuan dan tema otomatis tersimpan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="p-1.5 rounded-full hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Temperature Unit */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
              <Thermometer className="w-4 h-4 text-theme-accent" />
              Satuan Suhu
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ tempUnit: 'celsius' })}
                className={`py-2.5 px-4 rounded-xl text-sm font-extrabold transition border ${
                  settings.tempUnit === 'celsius'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-theme-elevated text-theme-secondary border-theme-subtle hover:bg-theme-surface-hover'
                }`}
              >
                Celsius (°C)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ tempUnit: 'fahrenheit' })}
                className={`py-2.5 px-4 rounded-xl text-sm font-extrabold transition border ${
                  settings.tempUnit === 'fahrenheit'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-theme-elevated text-theme-secondary border-theme-subtle hover:bg-theme-surface-hover'
                }`}
              >
                Fahrenheit (°F)
              </button>
            </div>
          </div>

          {/* Wind Speed Unit */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
              <Wind className="w-4 h-4 text-theme-accent" />
              Satuan Kecepatan Angin
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ windUnit: 'kmh' })}
                className={`py-2.5 px-4 rounded-xl text-sm font-extrabold transition border ${
                  settings.windUnit === 'kmh'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-theme-elevated text-theme-secondary border-theme-subtle hover:bg-theme-surface-hover'
                }`}
              >
                Kilometer / Jam (km/j)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ windUnit: 'mph' })}
                className={`py-2.5 px-4 rounded-xl text-sm font-extrabold transition border ${
                  settings.windUnit === 'mph'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-theme-elevated text-theme-secondary border-theme-subtle hover:bg-theme-surface-hover'
                }`}
              >
                Mil / Jam (mph)
              </button>
            </div>
          </div>

          {/* Theme Mode */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
              <Palette className="w-4 h-4 text-theme-accent" />
              Tema Tampilan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'auto'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdateSettings({ theme: mode })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold capitalize transition border flex items-center justify-center gap-1.5 ${
                    settings.theme === mode
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-theme-elevated text-theme-secondary border-theme-subtle hover:bg-theme-surface-hover'
                  }`}
                >
                  {mode === 'light' ? (
                    <>
                      <Sun className="w-3.5 h-3.5" />
                      <span>Cerah</span>
                    </>
                  ) : mode === 'dark' ? (
                    <>
                      <Moon className="w-3.5 h-3.5" />
                      <span>Malam</span>
                    </>
                  ) : (
                    <>
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Otomatis</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Web Notification Toggle */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-muted mb-2">
              <BellRing className="w-4 h-4 text-theme-accent" />
              Peringatan Cuaca Browser
            </label>
            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold transition flex items-center justify-between border ${
                settings.browserNotifications
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-theme-elevated text-theme-secondary border-theme-subtle hover:bg-theme-surface-hover'
              }`}
            >
              <span>Notifikasi Hujan & UV</span>
              <span className="text-xs font-black uppercase">
                {settings.browserNotifications ? 'Aktif' : 'Nonaktif'}
              </span>
            </button>
            {notifError && (
              <p className="text-xs text-rose-500 mt-1.5 font-medium leading-relaxed">
                {notifError}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-theme-subtle flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 text-white font-extrabold text-sm shadow-md hover:from-blue-700 hover:to-sky-700 transition active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
