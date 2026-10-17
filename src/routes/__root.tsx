import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `
(function(){
  try {
    var stored = window.localStorage.getItem('rinaihujan-settings') || window.localStorage.getItem('skycast-settings');
    var mode = 'light';
    if (stored) {
      try { mode = JSON.parse(stored).theme || 'light'; } catch(e) {}
    }
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    if (mode === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', mode);
    }
    root.style.colorScheme = resolved;
  } catch(e) {}
})();
`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0, maximum-scale=5.0',
      },
      {
        name: 'theme-color',
        content: '#3b82f6',
      },
      {
        title: 'RinaiHujan - Dasbor Cuaca Ramah & Cerdas Indonesia',
      },
      {
        name: 'description',
        content:
          'Prakiraan cuaca cerdas, radar hujan 15-menit, kualitas udara AQI, peta interaktif, dan rekomendasi aktivitas harian ramah untuk seluruh kota dan kecamatan di Indonesia.',
      },
      // Open Graph Tags
      {
        property: 'og:site_name',
        content: 'RinaiHujan',
      },
      {
        property: 'og:title',
        content: 'RinaiHujan - Dasbor Cuaca Ramah & Cerdas Indonesia',
      },
      {
        property: 'og:description',
        content:
          'Prakiraan cuaca cerdas, radar hujan 15-menit, kualitas udara AQI, peta interaktif, dan rekomendasi aktivitas harian.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:locale',
        content: 'id_ID',
      },
      {
        property: 'og:image',
        content: `${(import.meta.env.VITE_SITE_URL || 'https://rinaihujan.id').replace(/\/+$/, '')}/icons/og-image.png`,
      },
      // Twitter Card Tags
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'RinaiHujan - Dasbor Cuaca Ramah Indonesia',
      },
      {
        name: 'twitter:description',
        content: 'Prakiraan cuaca cerdas & ramah untuk seluruh Indonesia.',
      },
      {
        name: 'twitter:image',
        content: `${(import.meta.env.VITE_SITE_URL || 'https://rinaihujan.id').replace(/\/+$/, '')}/icons/og-image.png`,
      },
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/icons/apple-touch-icon.png',
      },
      {
        rel: 'manifest',
        href: '/manifest.webmanifest',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased selection:bg-blue-200">
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
        {import.meta.env.PROD ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }`,
            }}
          />
        ) : (
          <script
            dangerouslySetInnerHTML={{
              __html: `if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (var r of regs) r.unregister();
                });
              }`,
            }}
          />
        )}
      </body>
    </html>
  )
}
