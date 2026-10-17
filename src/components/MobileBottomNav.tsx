import { Home, Map, Heart, Bell, Settings } from 'lucide-react'

interface MobileBottomNavProps {
  activeTab: 'beranda' | 'peta' | 'favorit'
  onSelectTab: (tab: 'beranda' | 'peta' | 'favorit') => void
  unreadNotifsCount: number
  onOpenNotifs: () => void
  onOpenSettings: () => void
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  unreadNotifsCount,
  onOpenNotifs,
  onOpenSettings,
}: MobileBottomNavProps) {
  const scrollTo = (id: string, tab: 'beranda' | 'peta' | 'favorit') => {
    onSelectTab(tab)
    if (tab === 'beranda') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-theme-surface/95 backdrop-blur-lg border-t border-theme-subtle py-2 px-3 flex items-center justify-around shadow-2xl transition-colors duration-200"
      aria-label="Navigasi Bawah Seluler"
    >
      <button
        type="button"
        onClick={() => scrollTo('hero', 'beranda')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          activeTab === 'beranda'
            ? 'text-blue-600 dark:text-sky-400 font-black'
            : 'text-theme-muted hover:text-theme-primary'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-bold">Beranda</span>
      </button>

      <button
        type="button"
        onClick={() => scrollTo('peta', 'peta')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          activeTab === 'peta'
            ? 'text-blue-600 dark:text-sky-400 font-black'
            : 'text-theme-muted hover:text-theme-primary'
        }`}
      >
        <Map className="w-5 h-5" />
        <span className="text-[10px] font-bold">Peta</span>
      </button>

      <button
        type="button"
        onClick={() => scrollTo('favorit', 'favorit')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          activeTab === 'favorit'
            ? 'text-blue-600 dark:text-sky-400 font-black'
            : 'text-theme-muted hover:text-theme-primary'
        }`}
      >
        <Heart className="w-5 h-5" />
        <span className="text-[10px] font-bold">Favorit</span>
      </button>

      <button
        type="button"
        onClick={onOpenNotifs}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-theme-muted hover:text-theme-primary transition relative"
      >
        <Bell className="w-5 h-5" />
        {unreadNotifsCount > 0 && (
          <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
            {unreadNotifsCount}
          </span>
        )}
        <span className="text-[10px] font-bold">Notif</span>
      </button>

      <button
        type="button"
        onClick={onOpenSettings}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-theme-muted hover:text-theme-primary transition"
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] font-bold">Setelan</span>
      </button>
    </nav>
  )
}
