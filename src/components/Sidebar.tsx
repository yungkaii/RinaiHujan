import { Link } from '@tanstack/react-router'
import { MascotSvg } from './Mascot'
import { Home, Map, Heart, Bell, Settings, Info } from 'lucide-react'

interface SidebarProps {
  activeTab: 'beranda' | 'peta' | 'favorit'
  onSelectTab: (tab: 'beranda' | 'peta' | 'favorit') => void
  unreadNotifsCount: number
  onOpenNotifs: () => void
  onOpenSettings: () => void
}

export function Sidebar({
  activeTab,
  onSelectTab,
  unreadNotifsCount,
  onOpenNotifs,
  onOpenSettings,
}: SidebarProps) {
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
    <aside className="side-nav hidden md:flex md:w-72 lg:w-[288px] flex-none md:sticky md:top-0 md:h-screen p-5 md:p-7 bg-theme-sidebar backdrop-blur-md flex-col justify-between overflow-hidden border-r border-theme-subtle z-20 transition-colors duration-200">
      <div>
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 mb-6 md:mb-8 cursor-pointer select-none"
          onClick={() => scrollTo('hero', 'beranda')}
        >
          <div className="w-14 h-12 flex-none">
            <MascotSvg width={56} height={48} animated />
          </div>
          <div>
            <b className="text-3xl font-black text-blue-600 dark:text-sky-400 block leading-none tracking-tight">
              RinaiHujan
            </b>
            <small className="text-xs text-theme-muted font-bold block mt-1">
              Langit selalu punya cerita 💙
            </small>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => scrollTo('hero', 'beranda')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap text-left ${
              activeTab === 'beranda'
                ? 'bg-blue-100/90 dark:bg-blue-950/80 text-blue-700 dark:text-sky-300 shadow-sm border border-blue-200/50 dark:border-blue-800/50'
                : 'text-theme-secondary hover:bg-theme-hover'
            }`}
          >
            <Home className="w-4 h-4 text-theme-accent" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => scrollTo('peta', 'peta')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap text-left ${
              activeTab === 'peta'
                ? 'bg-blue-100/90 dark:bg-blue-950/80 text-blue-700 dark:text-sky-300 shadow-sm border border-blue-200/50 dark:border-blue-800/50'
                : 'text-theme-secondary hover:bg-theme-hover'
            }`}
          >
            <Map className="w-4 h-4 text-theme-accent" />
            <span>Peta Cuaca</span>
          </button>

          <button
            type="button"
            onClick={() => scrollTo('favorit', 'favorit')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap text-left ${
              activeTab === 'favorit'
                ? 'bg-blue-100/90 dark:bg-blue-950/80 text-blue-700 dark:text-sky-300 shadow-sm border border-blue-200/50 dark:border-blue-800/50'
                : 'text-theme-secondary hover:bg-theme-hover'
            }`}
          >
            <Heart className="w-4 h-4 text-theme-accent" />
            <span>Lokasi Favorit</span>
          </button>

          <button
            type="button"
            onClick={onOpenNotifs}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-theme-secondary hover:bg-theme-hover transition-all whitespace-nowrap text-left"
          >
            <Bell className="w-4 h-4 text-theme-accent" />
            <span>Notifikasi</span>
            {unreadNotifsCount > 0 && (
              <span className="ml-auto bg-rose-500 text-white text-[11px] font-black rounded-full px-2 py-0.5 shadow-sm">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-theme-secondary hover:bg-theme-hover transition-all whitespace-nowrap text-left"
          >
            <Settings className="w-4 h-4 text-theme-accent" />
            <span>Pengaturan</span>
          </button>

          <Link
            to="/about"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-theme-secondary hover:bg-theme-hover transition-all whitespace-nowrap text-left"
          >
            <Info className="w-4 h-4 text-theme-accent" />
            <span>Tentang RinaiHujan</span>
          </Link>
        </nav>
      </div>

      {/* Motivational Note & Bottom Mascot */}
      <div className="hidden md:flex flex-col items-center mt-auto">
        <p className="font-caveat text-xl text-theme-muted -rotate-6 max-w-[170px] text-center leading-snug my-2 select-none">
          Cuaca boleh berubah, semangatmu tetap sama! 💗
        </p>
        <div className="w-full pt-3 flex justify-center">
          <MascotSvg width={128} height={105} animated />
        </div>
      </div>
    </aside>
  )
}
