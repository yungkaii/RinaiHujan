import { createRouter as createTanStackRouter, Link } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { MascotSvg } from './components/Mascot'
import { RefreshCw, Home, AlertTriangle } from 'lucide-react'

// Komponen Error Global Router
function GlobalErrorComponent({
  error,
  reset,
}: {
  error: unknown
  reset: () => void
}) {
  const errorMessage =
    error instanceof Error ? error.message : 'Terjadi kendala saat memuat halaman'

  return (
    <div className="min-h-screen bg-theme-page flex items-center justify-center p-6 text-theme-primary">
      <div className="max-w-md w-full bg-theme-surface backdrop-blur-md rounded-3xl p-8 shadow-theme-card border border-theme-card text-center flex flex-col items-center">
        <MascotSvg width={88} height={74} animated />
        <div className="mt-4 flex items-center gap-2 text-rose-500 font-extrabold text-base">
          <AlertTriangle className="w-5 h-5" />
          <span>Ups! Ada Masalah di Langit</span>
        </div>
        <p className="mt-2 text-sm text-theme-muted leading-relaxed">
          {errorMessage}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>
          <Link
            to="/"
            className="flex-1 py-3 px-4 rounded-2xl bg-theme-elevated hover:bg-theme-hover text-theme-primary border border-theme-subtle font-bold text-sm flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            <span>Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Komponen 404 Not Found Global Router
function GlobalNotFoundComponent() {
  return (
    <div className="min-h-screen bg-theme-page flex items-center justify-center p-6 text-theme-primary">
      <div className="max-w-md w-full bg-theme-surface backdrop-blur-md rounded-3xl p-8 shadow-theme-card border border-theme-card text-center flex flex-col items-center">
        <MascotSvg width={96} height={80} animated />
        <h2 className="mt-4 text-3xl font-black text-blue-600 tracking-tight">404</h2>
        <b className="mt-1 text-base font-bold text-theme-primary block">
          Halaman Tidak Ditemukan
        </b>
        <p className="mt-2 text-sm text-theme-muted leading-relaxed">
          Awan membimbing kita ke arah yang belum ada jalurnya. Yuk kembali ke beranda!
        </p>
        <Link
          to="/"
          className="mt-6 w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95"
        >
          <Home className="w-4 h-4" />
          <span>Kembali ke Dasbor Cuaca</span>
        </Link>
      </div>
    </div>
  )
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: GlobalErrorComponent,
    defaultNotFoundComponent: GlobalNotFoundComponent,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
