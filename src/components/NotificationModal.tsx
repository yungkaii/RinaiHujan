import { Bell, X, CloudRain, Sun, Info, CheckCheck } from 'lucide-react'
import type { WeatherAlertItem } from '../types/weather'
import { useModalA11y } from '../hooks/useModalA11y'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  notifications: WeatherAlertItem[]
  onMarkAllRead: () => void
}

export function NotificationModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}: NotificationModalProps) {
  const modalRef = useModalA11y({ isOpen, onClose })

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-md bg-theme-modal rounded-3xl p-6 shadow-2xl border border-theme-card transform transition-all animate-scale-up outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-theme-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="notif-title" className="font-extrabold text-lg text-theme-primary">
                  Notifikasi Langit
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-black bg-rose-500 text-white rounded-full px-2 py-0.2">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              <p className="text-xs text-theme-muted">Pemberitahuan cuaca dan saran harian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="p-1.5 rounded-full hover:bg-theme-surface-hover text-theme-muted hover:text-theme-primary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-theme-muted">
              <CheckCheck className="w-10 h-10 mx-auto text-sky-400 mb-2 opacity-60" />
              <p className="text-sm font-semibold">Tidak ada notifikasi saat ini</p>
              <p className="text-xs text-theme-muted mt-1">Langit saat ini dalam kondisi tenang.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.isRead
              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border transition relative flex items-start gap-3 ${
                    isUnread
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60'
                      : 'bg-theme-elevated border-theme-subtle opacity-75'
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-theme-surface shadow-sm text-theme-accent">
                    {n.type === 'warning' ? (
                      <CloudRain className="w-4 h-4 text-amber-500" />
                    ) : n.type === 'tip' ? (
                      <Sun className="w-4 h-4 text-sky-500" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-none" />
                        )}
                        <b className="text-sm text-theme-primary font-bold truncate">
                          {n.title}
                        </b>
                      </div>
                      <small className="text-xs text-theme-muted flex-none font-semibold">
                        {n.time}
                      </small>
                    </div>
                    <p className="text-xs text-theme-secondary mt-1 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-theme-subtle flex items-center justify-between">
          {unreadCount > 0 ? (
            <button
              onClick={onMarkAllRead}
              className="text-xs font-bold text-theme-accent hover:underline py-1.5 px-2 rounded-lg transition"
            >
              Tandai Semua Dibaca
            </button>
          ) : (
            <span className="text-xs font-semibold text-theme-muted">
              Semua telah dibaca
            </span>
          )}

          <button
            onClick={onClose}
            className="text-xs font-extrabold bg-theme-elevated text-theme-primary border border-theme-subtle py-1.5 px-4 rounded-xl hover:bg-theme-hover transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
