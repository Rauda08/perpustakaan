# Backend API Sistem Perpustakaan SMAN Bernas

Backend ini sudah dibuat sebagai REST API Laravel untuk fitur utama aplikasi perpustakaan. Response JSON memakai format umum:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

## Akun awal

Seeder membuat akun petugas:

- Username: `admin`
- Password: `admin123`

## Endpoint utama

### Auth

| Method | URL | Fungsi |
|---|---|---|
| POST | `/api/auth/login` | Login petugas |
| POST | `/api/auth/logout` | Logout petugas |
| GET | `/api/auth/me` | Data user aktif |

Payload login:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response login mengembalikan `token` Bearer. Simpan token ini di frontend jika nanti endpoint ingin dibuat wajib login. Saat ini endpoint CRUD dibuat mudah untuk development lokal.

### Dashboard

| Method | URL | Fungsi |
|---|---|---|
| GET | `/api/dashboard` | Statistik dashboard, jatuh tempo hari ini, transaksi terbaru |

Opsional:

```text
/api/dashboard?date=2026-06-14
```

### Anggota

| Method | URL | Fungsi |
|---|---|---|
| GET | `/api/members` | List anggota |
| POST | `/api/members` | Tambah anggota |
| GET | `/api/members/{id}` | Detail anggota |
| PUT/PATCH | `/api/members/{id}` | Update anggota |
| DELETE | `/api/members/{id}` | Hapus anggota |

Payload tambah/update:

```json
{
  "name": "Nama Siswa",
  "classNip": "2024007",
  "type": "Siswa",
  "phone": "081234567899",
  "registeredDate": "2026-06-25"
}
```

### Buku

| Method | URL | Fungsi |
|---|---|---|
| GET | `/api/books` | List semua eksemplar buku, format flat seperti data React |
| POST | `/api/books` | Tambah buku induk beserta eksemplar |
| GET | `/api/book-masters` | List data induk buku + semua eksemplar |
| GET | `/api/book-masters/{id}` | Detail buku induk |
| PUT/PATCH | `/api/book-masters/{id}` | Update buku induk |
| DELETE | `/api/book-masters/{id}` | Hapus buku induk dan eksemplar yang tidak dipinjam |
| POST | `/api/book-masters/{id}/copies` | Tambah eksemplar baru |
| GET | `/api/book-copies/{id}` | Detail eksemplar |
| PUT/PATCH | `/api/book-copies/{id}` | Update eksemplar |
| DELETE | `/api/book-copies/{id}` | Hapus eksemplar yang tidak sedang dipinjam |

Payload tambah buku:

```json
{
  "title": "Judul Buku",
  "author": "Nama Penulis",
  "category": "Fiksi",
  "shelf": "A-06",
  "publishYear": "2024",
  "copies": [
    { "number": "BK016", "acquisitionYear": "2026" },
    { "number": "BK017", "acquisitionYear": "2026" }
  ]
}
```

### Peminjaman dan Pengembalian

| Method | URL | Fungsi |
|---|---|---|
| GET | `/api/borrowings` | Semua transaksi peminjaman |
| GET | `/api/borrowings/active` | Peminjaman aktif dan terlambat |
| GET | `/api/borrowings/history` | Riwayat pengembalian |
| POST | `/api/borrowings` | Simpan peminjaman baru, bisa satu atau beberapa eksemplar |
| GET | `/api/borrowings/{id}` | Detail peminjaman |
| PUT/PATCH | `/api/borrowings/{id}` | Update transaksi aktif |
| POST | `/api/borrowings/{id}/return` | Proses pengembalian buku |
| DELETE | `/api/borrowings/{id}` | Hapus transaksi |

Payload peminjaman:

```json
{
  "memberId": 1,
  "bookNumbers": ["BK015"],
  "borrowDate": "2026-06-25",
  "dueDate": "2026-07-02",
  "loanType": "Mingguan",
  "loanSubType": "Pribadi",
  "quantity": 1
}
```

Payload pengembalian tanpa sanksi:

```json
{
  "returnDate": "2026-06-26",
  "returnTime": "15:30"
}
```

Payload pengembalian dengan sanksi:

```json
{
  "returnDate": "2026-06-26",
  "returnTime": "15:30",
  "withPenalty": true,
  "reason": "Terlambat",
  "penaltyType": "Buku Donasi",
  "penaltyBookTitle": "Buku Cerita Anak",
  "notes": "Dikembalikan lewat jatuh tempo"
}
```

### Kunjungan

| Method | URL | Fungsi |
|---|---|---|
| GET | `/api/visitors` | List kunjungan |
| POST | `/api/visitors` | Simpan kunjungan |
| GET | `/api/visitors/{id}` | Detail kunjungan |
| PUT/PATCH | `/api/visitors/{id}` | Update kunjungan |
| DELETE | `/api/visitors/{id}` | Hapus kunjungan |

Payload kunjungan anggota:

```json
{
  "memberId": 1,
  "purpose": "Membaca",
  "visitDate": "2026-06-25",
  "visitTime": "09:00"
}
```

Payload kunjungan tamu/manual:

```json
{
  "name": "Nama Tamu",
  "type": "Tamu",
  "classNip": "-",
  "purpose": "Mencari Referensi",
  "visitDate": "2026-06-25",
  "visitTime": "10:00"
}
```

### Sanksi

| Method | URL | Fungsi |
|---|---|---|
| GET | `/api/penalties` | List sanksi |
| POST | `/api/penalties` | Tambah/update sanksi berdasarkan transaksi |
| GET | `/api/penalties/{id}` | Detail sanksi |
| PUT/PATCH | `/api/penalties/{id}` | Update sanksi |
| DELETE | `/api/penalties/{id}` | Hapus sanksi |

### Laporan

| Method | URL | Fungsi |
|---|---|---|
| GET | `/api/reports/summary` | Rekap buku, anggota, peminjaman, pengembalian, kunjungan, sanksi dalam periode |
| GET | `/api/reports/monthly` | Rekap bulanan peminjaman, pengembalian, kunjungan |

Contoh:

```text
/api/reports/summary?from=2026-06-01&to=2026-06-30
/api/reports/monthly?year=2026
```

## Cara menjalankan

```bash
composer install
npm install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Terminal kedua:

```bash
npm run dev
```

Buka:

```text
http://127.0.0.1:8000
```

Tes API cepat:

```text
http://127.0.0.1:8000/api/health
http://127.0.0.1:8000/api/members
http://127.0.0.1:8000/api/books
```
