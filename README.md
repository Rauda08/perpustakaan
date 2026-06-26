# Sistem Perpustakaan SMAN Bernas Binsus

Project Laravel ini berisi tampilan React yang sudah dipertahankan dari project awal, ditambah backend Laravel REST API untuk fitur perpustakaan.

## Yang sudah tersedia

- Tampilan React/Vite tetap sama.
- Backend Laravel 11.
- Migration MySQL untuk user, anggota, buku induk, eksemplar, peminjaman, kunjungan, dan sanksi.
- Seeder data awal sesuai contoh aplikasi.
- API CRUD anggota.
- API CRUD buku induk dan eksemplar.
- API peminjaman dan pengembalian.
- API kunjungan.
- API sanksi.
- API dashboard dan laporan.

Dokumentasi endpoint lengkap ada di file:

```text
BACKEND_API.md
```

## Akun awal

```text
Username: admin
Password: admin123
```

## Persiapan database

Buat database kosong di phpMyAdmin:

```text
library_db
```

Pastikan `.env` memakai konfigurasi berikut:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=library_db
DB_USERNAME=root
DB_PASSWORD=
CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync
```

## Cara menjalankan

```bash
composer install
npm install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Buka terminal kedua:

```bash
npm run dev
```

Lalu buka:

```text
http://127.0.0.1:8000
```

## Tes API

```text
http://127.0.0.1:8000/api/health
http://127.0.0.1:8000/api/dashboard
http://127.0.0.1:8000/api/members
http://127.0.0.1:8000/api/books
http://127.0.0.1:8000/api/borrowings
http://127.0.0.1:8000/api/visitors
http://127.0.0.1:8000/api/reports/summary
```

## Catatan

Backend sudah lengkap sebagai REST API. UI React masih dipertahankan agar tampilan tidak berubah. Data API menggunakan nama field camelCase agar mudah dihubungkan ke komponen React yang sudah ada.
