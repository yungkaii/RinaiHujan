# 🌤️ SkyCast - Dasbor Cuaca Ramah & Cerdas Indonesia

SkyCast adalah aplikasi web dasbor cuaca modern untuk seluruh wilayah Indonesia dengan maskot ramah, visual adaptif, dan performa tinggi. Dibangun menggunakan **TypeScript (strict)** + **TanStack Start** (`@tanstack/react-start`) + **Tailwind CSS v4** + **Leaflet** + **Open-Meteo** + **RainViewer**. Bahasa antarmuka: **Bahasa Indonesia**.

---

## ✨ Fitur Lengkap & Unggulan

### 1. Cuaca Real-Time & Visual Dinamis
- **Hero Adaptif Cuaca & Siang/Malam**: Gradasi langit dinamis berganti otomatis (cerah siang, langit malam berbintang, hujan abu-abu, badai petir).
- **Aksi Cepat Hero**: Tombol Bintang ⭐ untuk menambah/menghapus lokasi favorit langsung dari hero, dan tombol Bagikan 🔗 via **Web Share API** (dengan fallback salin URL ke papan klip).
- **Maskot Hangat & Pesan Kontekstual**: Maskot awan ramah memberikan rekomendasi dan kata-kata penyemangat berdasarkan kondisi langit saat ini.

### 2. Prakiraan & Analitik Cerdas
- **Nowcast Hujan 15-Menit (2 Jam ke Depan)**: Prediksi presipitasi jangka pendek interval 15 menit dari Open-Meteo `minutely_15`.
- **Grafik Tren Suhu 24-Jam (Pure SVG)**: Kurva tren temperatur 24 jam interaktif dengan titik jam, peluang hujan, dan tooltip hover tanpa dependensi library grafik eksternal.
- **Prakiraan 24-Jam Horizontal**: Scroll lancar dengan CSS snap (`snap-x`), penanda badge "Sekarang", dan garis pemisah pergantian hari ("Besok").
- **Prakiraan 7-Hari**: Highlight hari ini, label kondisi cuaca bahasa Indonesia, dan *spread bar* visual rentang suhu min & maks.
- **Kualitas Udara (US AQI)**: Menampilkan indeks AQI, konsentrasi PM2.5, PM10, kategori warna kualitas udara, dan rekomendasi kesehatan.
- **Rekomendasi Aktivitas Harian**: Saran otomatis untuk membawa payung, bersepeda, menjemur pakaian, dan aktivitas fisik luar ruangan.

### 3. Peta Interaktif & Radar RainViewer
- **Peta Leaflet SSR-Safe**: Menggunakan CartoDB basemap yang otomatis beralih ke mode gelap (*Dark Matter*) saat dark mode aktif.
- **Kontrol Radar & Waktu**: Slider linier riwayat radar hujan RainViewer dengan kontrol putar/jeda (play/pause animation).
- **Mode Layar Penuh (Expand)**: Tombol pembesar peta untuk inspeksi wilayah yang lebih leluasa.

### 4. Navigasi & Pengalaman Pengguna (UX)
- **Pencarian Cerdas & ARIA Combobox**: Autocomplete kecamatan/kabupaten/kota dengan navigasi keyboard lengkap (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`), tombol hapus teks (`X`), dan riwayat 5 pencarian terakhir.
- **Deep Linking URL**: Parameter rute `/?lat=...&lon=...&name=...` sehingga tautan cuaca kota manapun dapat langsung dibagikan dan dibuka dengan tepat.
- **Mobile Bottom Navigation Bar**: Bilah navigasi bawah praktis di ponsel pintar (Beranda, Peta, Favorit, Notifikasi, Pengaturan).
- **Manajemen Favorit dengan Undo Toast**: Hapus lokasi favorit dilengkapi toast "Batal (Undo)" selama 5 detik untuk mencegah salah hapus.
- **Pembaruan Otomatis 10-Menit**: Auto-refresh otomatis tiap 10 menit dan saat pengguna kembali membuka tab aktif.

### 5. Aksesibilitas, Mode Gelap & PWA
- **Mode Gelap Sempurna**: Sistem token CSS murni dengan kontras tinggi (>4.5:1 WCAG AA).
- **Aksesibilitas (A11y)**: Focus trap pada modal dialog, penutupan dengan tombol Escape, dan elemen tombol semantik.
- **PWA (Progressive Web App)**: Web app manifest (`manifest.webmanifest`), ikon SVG, dan Service Worker (`sw.js`) untuk caching shell offline.
- **Web Notification API**: Notifikasi browser opsional untuk peringatan dini cuaca ekstrem (badai petir atau indeks UV berbahaya).

---

## 🛠️ Tumpukan Teknologi & Arsitektur

| Komponen | Teknologi |
|---|---|
| **Framework Fullstack** | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) |
| **Bahasa Pemrograman** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode, 0 `any`) |
| **Styling & Desain** | [Tailwind CSS v4](https://tailwindcss.com/) + CSS Design Tokens |
| **Pemetaan & Radar** | [Leaflet](https://leafletjs.com/) + [RainViewer API](https://www.rainviewer.com/api.html) + CartoDB Tiles |
| **Sumber Data Cuaca** | [Open-Meteo Forecast & Air Quality API](https://open-meteo.com/) |
| **Ikonografi & Maskot** | [Lucide React](https://lucide.dev/) + Custom SVG Mascot & Weather Icons |
| **PWA** | Service Worker Shell Cache + Web App Manifest |

---

## 🚀 Cara Menjalankan

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Server Pengembangan
```bash
npm run dev
```
Aplikasi dapat diakses di: [http://localhost:3000](http://localhost:3000)

### 3. Validasi Tipe & Build Production
```bash
# Pemeriksaan tipe ketat (0 errors)
npx tsc --noEmit

# Build production bundle (SSR & Client)
npm run build
```

---

## 📂 Struktur Direktori Proyek

```text
skycast/
├── public/
│   ├── favicon.svg            # Maskot awan SkyCast SVG
│   ├── manifest.webmanifest   # Manifest PWA
│   └── sw.js                  # Service Worker untuk shell caching
├── src/
│   ├── components/
│   │   ├── ActivitySuggestionsCard.tsx # Rekomendasi aktivitas harian
│   │   ├── AirQualityCard.tsx          # Kartu kualitas udara (US AQI & PM2.5)
│   │   ├── DailyForecast.tsx           # Prakiraan 7 hari dengan spread bar suhu
│   │   ├── EncouragementBanner.tsx     # Banner motivasi & link /about
│   │   ├── FavoriteLocations.tsx       # Kartu lokasi favorit
│   │   ├── HeaderSearch.tsx            # Pencarian kota ARIA combobox + riwayat
│   │   ├── HourlyForecast.tsx          # Prakiraan 24-jam snap-x & day divider
│   │   ├── Mascot.tsx                  # Maskot awan animasi SVG
│   │   ├── MobileBottomNav.tsx         # Bottom nav bar untuk perangkat seluler
│   │   ├── NotificationModal.tsx       # Modal notifikasi cuaca (Escape & focus trap)
│   │   ├── NowcastCard.tsx             # Prediksi hujan 2 jam (minutely_15)
│   │   ├── SettingsModal.tsx           # Pengaturan suhu, tema & notifikasi browser
│   │   ├── Sidebar.tsx                 # Navigasi samping desktop
│   │   ├── TemperatureChart24h.tsx     # Kurva tren suhu 24-jam pure SVG
│   │   ├── WeatherDetails.tsx          # Detail angin kompas, tekanan & presipitasi mm
│   │   ├── WeatherHero.tsx             # Kartu cuaca utama, star favorite & share
│   │   ├── WeatherIcons.tsx            # Komponen ikon cuaca SVG
│   │   └── WeatherMap.tsx              # Peta Leaflet + radar RainViewer time slider
│   ├── routes/
│   │   ├── __root.tsx                  # Root layout, PWA registration, SEO meta
│   │   ├── index.tsx                   # Halaman dasbor utama (URL deep linking & SSR)
│   │   └── about.tsx                   # Halaman tentang SkyCast
│   ├── server/
│   │   └── weatherFn.ts                # Server Functions (Open-Meteo, Radar, Geocoding, BMKG)
│   ├── types/
│   │   └── weather.ts                  # Kontrak tipe TypeScript lengkap
│   ├── utils/
│   │   └── weatherUtils.ts             # Algoritma cuaca, konversi unit, dan alert
│   ├── router.tsx                      # Setup TanStack Router + Error & 404 Boundaries
│   └── styles.css                      # Desain sistem tokens & tema
├── legacy/                             # Arsip kode asli HTML/CSS/JS lama
├── tsconfig.json                       # Konfigurasi TypeScript strict
└── package.json                        # Konfigurasi package & skrip
```

---

## 🔒 Keamanan, Keandalan & Standar Mutu

1. **Strict Type Safety**: Tidak ada penggunaan tipe data `any` baru di seluruh basis kode `src/`. Semua data cuaca, riwayat pencarian, pengaturan, dan koordinat memiliki kontrak tipe eksplisit.
2. **Server Functions**: Semua panggilan ke API eksternal dijalankan melalui `createServerFn` di lingkungan server. Hal ini meniadakan kendala CORS dan menjaga koneksi tetap andal.
3. **SSR Safety**: Akses ke API browser (`window`, `localStorage`, `Notification`, `navigator`, dan `Leaflet`) diisolasi dengan aman di dalam siklus hidup client (`useEffect` / client check).
4. **Resilience & Fallbacks**: Jika layanan BMKG atau geocoding eksternal mengalami kendala jaringan, aplikasi tetap menyajikan fallback informatif tanpa pernah mengalami *white-screen crash*.
