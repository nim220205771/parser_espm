# Parse eSPM (Self Assessment Image Processor)

Aplikasi berbasis desktop dengan antarmuka web modern yang dirancang secara khusus untuk mengambil, memproses, dan mengelola data visual hasil inspeksi Self Assessment dari sistem [eSPM BPJT PU](https://url.espm.go.id). 

Aplikasi ini bertujuan untuk mengotomatisasi pengunduhan gambar temuan lapangan, melakukan *overlay* informasi penting (seperti Tanggal, STA, dan Lokasi) secara langsung pada gambar, dan menyinkronkannya dengan laporan PDF resmi tanpa intervensi manual yang rumit.

## 🎯 Tujuan & Tantangan Teknis

Proses pencocokan data inspeksi seringkali memakan waktu. Tantangan utama dalam sistem ini adalah **menyamakan urutan gambar dengan entri PDF**, di mana PDF resmi tidak menyertakan ID unik dan urutannya dibuat secara manual, sementara data gambar dari eSPM menggunakan ID dan *timestamp*. 

Solusi yang dihadirkan oleh aplikasi ini adalah melakukan ekstraksi data (PDF & HTML), lalu mencocokkannya secara semi-otomatis berdasarkan indikator dan deskripsi temuan, sehingga menghasilkan file gambar siap ekspor untuk pelaporan pemeliharaan.

## 🔎 Fitur Utama
Aplikasi ini secara khusus didesain untuk mendownload file `.jpg` berdasarkan *pairing* (pencocokan) PDF dan data *web scraping*, dengan rincian fungsionalitas:
- **Scraping HTML Source eSPM:** Mengambil seluruh data Self Assessment (indikator, deskripsi, lokasi, gambar) langsung dari halaman web.
- **Manajemen Database Gambar (IndexedDB):** Menyimpan hasil *parsing* secara lokal untuk digunakan ulang tanpa perlu melakukan *scraping* berulang.
- **Ekstrak Data dari PDF:** Mengurai laporan PDF dan mencocokkannya dengan database gambar.
- **Download & Overlay Otomatis:** Menambahkan stempel teks (*overlay*) seperti tanggal, STA, dan lokasi pada gambar.
- **Ekspor Kustom:** Penamaan file gambar yang dihasilkan dapat disesuaikan dan disimpan rapi di folder tujuan.

## ⚙️ Teknologi yang Digunakan
- **Frontend:** HTML, Bootstrap 5, jQuery, SweetAlert2, FontAwesome, DataTables.
- **Backend:** AutoHotkey v2 + WebView2 (Integrasi komunikasi dua arah HTML ↔ AHK).
- **PDF Parsing:** PDF.js.
- **Penyimpanan Lokal:** IndexedDB.

## 💻 Prasyarat Sistem (Prerequisites)
- **Sistem Operasi:** Windows (Diuji pada Windows 7, 10, dan 11).
- **Perangkat Keras:** Sangat ringan (Min. 10MB Disk space, 20MB RAM).

**Untuk Pengguna Umum (`.exe`):**
Tidak ada prasyarat tambahan. Anda cukup mengunduh rilis `parse_espm.exe` dan menjalankannya langsung (*portable*).

**Untuk Pengembang (Menjalankan `.ahk`):**
Jika Anda ingin memodifikasi atau menjalankan dari *source code*, pastikan Anda menginstal:
1. [AutoHotkey v2.1-alpha.3](https://www.autohotkey.com/v2/)
2. *Library* AHK berikut:
   - `ComVar` (thqby)
   - `GDI+` (Marius Șucan)
   - `JSON` (thqby, HotKeyIt)
   - `Promise` (thqby)
   - `WebView2` (thqby)
   - `WebViewToo` (Ryan Dingman)

## 🚀 Instalasi
1. Unduh rilis terbaru `parse_espm.exe` dari halaman [Releases](../../releases).
2. Letakkan di dalam folder kerja pilihan Anda.
3. Klik ganda pada `parse_espm.exe` untuk mulai menggunakan aplikasi.

## 📖 Panduan Penggunaan (Usage)

### 1️⃣ Database Images (Web Scraping)
Bagian ini mengambil informasi Self Assessment (ID, indikator, lokasi, URL gambar) dan menyimpannya ke **IndexedDB**.
1. Buka situs `url.espm.go.id` → Pilih menu **SPM → Self Assessment BUJT**.
2. Centang rentang tanggal yang diinginkan, lalu klik **Cari**.
3. Di dalam aplikasi, pilih tombol **🧠 Web Scraping** untuk melakukan *InjectJS* agar halaman *auto-scrolling* dan memuat seluruh data.
4. Lakukan pengambilan *source code* dari peramban Anda: 
   - Klik kanan → **Inspect** (atau `Ctrl` + `Shift` + `I`).
   - Pilih tab **Elements**, klik kanan pada baris `<html lang="en" data-theme="dark">` → **Copy** → **Copy element**.
5. Kembali ke aplikasi, buka tab **1. Database Images → 1. Parse view-source eSPM**.
6. *Paste* kode HTML tersebut sebagai *plain text*, lalu klik **Proses Source**.
7. Data yang berhasil diproses akan tampil pada tabel dan bisa di-*edit*, dihapus, atau diekspor ke CSV.

### 2️⃣ PDF Extract Data
Mengekstrak data temuan dari file PDF untuk dicocokkan dengan gambar dari tahap pertama.
1. Pilih file PDF laporan menggunakan input **laporan-pemenuhan-sa**.
2. Tentukan folder **Download Img Path** (untuk menyimpan gambar asli) dan **Extract Img Path** (untuk hasil kompresi + *overlay*).
3. Atur format **Susunan Nama File** sesuai kebutuhan pelaporan Anda.
4. Klik tombol **Download & Proses**. Aplikasi akan mengunduh gambar yang valid, mengompresi, menambahkan teks *overlay*, dan memindahkannya ke antrean pemrosesan.

### 3️⃣ Process Gambar
Memvisualisasikan progres kompresi dan *overlay* gambar secara *real-time*.
- Gambar yang sedang diproses akan muncul sebagai *placeholder loading*.
- Setelah selesai, kartu akan berubah menampilkan gambar hasil jadi beserta informasi ID dan lokasinya.

### 4️⃣ Configurations
Sesuaikan pengaturan teknis aplikasi, meliputi:
- **Method Load Image:** Atur metode *rendering* gambar (SetWorkingDir, LoadFilePath, atau BASE64).
- **Stamp Manager:** Atur jenis *font*, ukuran teks, tinggi kotak *overlay*, dimensi maksimal kompresi, dan waktu jeda antar proses.
- **IndexDB Manager:** Lakukan *Backup* (unduh ke `.json`), *Restore*, atau Hapus database lokal.

> **💡 Shortcut Keyboard Cepat:**
> - <kbd>F5</kbd> — Reload konten halaman
> - <kbd>F9</kbd> — Membuka Developer Tools (Inspect)
> - <kbd>Ctrl</kbd> + <kbd>Esc</kbd> — Keluar dari aplikasi

## 🔐 Privasi & Keamanan
Aplikasi ini berjalan **100% secara lokal (offline processing)**. Seluruh tahapan pengumpulan HTML, ekstraksi PDF, dan penyimpanan IndexedDB diproses di dalam komputer pengguna. Tidak ada data operasional tol atau data pribadi yang dikirim keluar atau disimpan di *server* eksternal.

## 👥 Pengembang & Tim

Aplikasi ini dikembangkan untuk mendukung kelancaran administrasi layanan pemeliharaan. 
- **Aris Nur Mahendra** (Leader / Tenaga Inspeksi) - *Lead Developer*

*(Dikembangkan dalam waktu ± 4 hari kerja - 2025)*

## 📄 Lisensi

**Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**

Aplikasi ini tidak bersifat resmi dari BPJT, melainkan *tool* pendukung untuk kebutuhan tim lapangan atau verifikasi data. Bebas digunakan, didistribusikan, dan dimodifikasi untuk keperluan **internal dan non-komersial**, dengan tetap mencantumkan kredit kepada pengembang asli.

---
*Dibuat dengan ❤️ oleh ᗩris Ոur ᗰahendra*
