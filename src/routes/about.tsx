import { createFileRoute, Link } from '@tanstack/react-router'
import { MascotSvg } from '../components/Mascot'
import { ShieldCheck, Zap, Cloud, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <main className="min-h-screen bg-theme-page p-6 sm:p-12 text-theme-primary flex items-center justify-center transition-colors duration-200">
      <div className="max-w-2xl w-full bg-theme-surface backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-theme-card border border-theme-card">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-theme-accent hover:underline mb-6 group transition"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
          <span>Kembali ke Dasbor Cuaca</span>
        </Link>

        <div className="flex items-center gap-4 mb-6">
          <MascotSvg width={72} height={60} animated />
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-sky-400 tracking-tight">
              Tentang RinaiHujan
            </h1>
            <p className="text-sm text-theme-muted font-semibold">
              Platform Dasbor Cuaca Berbasis TanStack Start + TypeScript
            </p>
          </div>
        </div>

        <p className="text-theme-secondary leading-relaxed font-medium mb-6">
          RinaiHujan adalah aplikasi prakiraan cuaca modern dengan antarmuka yang ramah dan
          hangat. Awalnya dibangun dengan HTML, CSS, dan JS statis, RinaiHujan kini telah
          dimigrasikan ke arsitektur <b>TypeScript + TanStack Start</b> untuk memberikan keamanan
          tipe (type-safety) menyeluruh, performa SSR super cepat, dan pemisahan logika yang aman.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-theme-elevated border border-theme-subtle">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-sky-400 mb-2" />
            <b className="text-sm font-bold text-theme-primary block">End-to-End Type Safety</b>
            <p className="text-xs text-theme-muted mt-1">
              Semua response API Open-Meteo, geocoding, dan parameter rute divalidasi dengan TypeScript.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-theme-elevated border border-theme-subtle">
            <Zap className="w-6 h-6 text-amber-500 mb-2" />
            <b className="text-sm font-bold text-theme-primary block">Server Functions</b>
            <p className="text-xs text-theme-muted mt-1">
              Data fetching dijalankan aman di server melalui TanStack Start Server Functions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-theme-elevated border border-theme-subtle">
            <Cloud className="w-6 h-6 text-sky-500 mb-2" />
            <b className="text-sm font-bold text-theme-primary block">Radar Cuaca Realtime</b>
            <p className="text-xs text-theme-muted mt-1">
              Visualisasi radar Leaflet + RainViewer dengan status cuaca terkini di Indonesia.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-theme-subtle flex items-center justify-between text-xs text-theme-muted font-bold">
          <span>RinaiHujan v2.0 • TanStack Start + Vite</span>
          <span>Dibuat dengan cinta 💙</span>
        </div>
      </div>
    </main>
  )
}
