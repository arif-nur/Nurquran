# NurQuran PWA

Aplikasi web Al-Qur'an bernuansa dark-elegant yang dapat dipasang sebagai PWA.

## Fitur
- Daftar seluruh 114 surah dan ayat Arab + terjemahan Indonesia dari AlQuran Cloud API.
- Audio tilawah per ayat (riwayat audio Alafasy).
- Jadwal salat harian dari koordinat lokasi perangkat melalui Aladhan API.
- Tasbih digital dengan target yang dapat diubah dan penyimpanan lokal.
- Latihan tebak surah dari terjemahan ayat, dengan skor sesi dan skor terbaik.
- Rekam bacaan untuk murajaah, putar kembali, dan unduh audio langsung di perangkat.
- Simpan ayat favorit, riwayat bacaan sederhana, salin teks ayat.
- Kalkulasi azimut kiblat dari koordinat.
- Login/daftar Firebase Email & Password dan Google.
- Responsive mobile/desktop, manifest, service worker, siap deploy ke Vercel.

## 1. Jalankan di VS Code
Pastikan Node.js versi LTS sudah terpasang. Buka folder proyek di VS Code lalu jalankan terminal:

```bash
npm install
npm run dev
```

Buka alamat lokal yang muncul (biasanya `http://localhost:5173`).

## 2. Aktifkan Firebase Authentication
1. Buat project di https://console.firebase.google.com/
2. Tambahkan aplikasi Web pada Project Overview.
3. Salin konfigurasi web ke `src/firebase.js`, ganti nilai `GANTI_...`.
4. Firebase Console → Authentication → Get started → Sign-in method.
5. Aktifkan **Email/Password** dan **Google**.
6. Authentication → Settings → Authorized domains, tambahkan domain Vercel kamu.

Firebase web config memang berada di frontend. Jangan pernah memasukkan service-account JSON atau private key ke dalam proyek frontend. Untuk aplikasi produksi, atur aturan keamanan layanan Firebase yang dipakai.

## 3. Push ke GitHub
Buat repository kosong di GitHub, kemudian jalankan:

```bash
git init
git add .
git commit -m "Build NurQuran PWA"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

## 4. Deploy ke Vercel
1. Login ke https://vercel.com/ dan pilih **Add New → Project**.
2. Import repository GitHub.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Klik Deploy. `vercel.json` sudah berisi rewrite untuk SPA.
7. Tambahkan domain melalui Project → Settings → Domains.

## Catatan penting
- Jadwal salat menggunakan lokasi perangkat. Pengguna perlu memberi izin lokasi; pada web, geolocation memerlukan HTTPS (Vercel sudah HTTPS) atau localhost.
- Perhitungan jadwal memakai metode Aladhan `method=20` (Kementerian Agama RI). Periksa kesesuaian dengan jadwal resmi masjid/Kemenag setempat karena metode, zona waktu, dan kebijakan daerah dapat menghasilkan selisih.
- Data Al-Qur'an, terjemahan, dan audio diambil dari API AlQuran Cloud; koneksi internet diperlukan untuk mengambil konten yang belum tersimpan.
- Service worker menyimpan kerangka aplikasi, bukan seluruh 114 surah/audio. Jadi jangan menganggap seluruh konten Al-Qur'an sudah tersedia offline.
- Lokasi tidak diminta sampai pengguna membuka aplikasi dan browser meminta izin.
- Login Firebase pada versi ini menyediakan autentikasi, tetapi bookmark/tasbih masih tersimpan lokal di perangkat, belum disinkronkan ke cloud.
- Rekaman murajaah tidak diunggah; audio hanya disimpan sementara di memori halaman dan perlu diunduh sebelum halaman ditutup jika ingin menyimpannya.
- Perekam suara memerlukan izin mikrofon dan browser modern pada HTTPS atau localhost.
- Fitur arah kiblat menghitung azimut dari utara. Penunjuk visual tidak menggantikan kompas fisik; sensor kompas belum diintegrasikan lintas perangkat.
- Notifikasi azan belum diaktifkan. Browser/PWA tidak dapat menjamin alarm berjalan tepat waktu saat aplikasi ditutup tanpa backend/push notification dan izin pengguna.

## Sumber layanan
- AlQuran Cloud API: https://alquran.cloud/api
- Aladhan Prayer Times API: https://aladhan.com/prayer-times-api
- Firebase Authentication: https://firebase.google.com/docs/auth
