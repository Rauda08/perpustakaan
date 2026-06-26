// ============================================================
// ENTITY: Member (Anggota)
// ============================================================
export interface Member {
  id: number;           // PK
  name: string;
  classNip: string;     // NIS (Siswa) | NIP (Guru)
  type: 'Siswa' | 'Guru';
  phone: string;
  registeredDate: string;
}

export const membersData: Member[] = [
  { id: 1, name: 'Ahmad Fauzi',   classNip: '2024001',            type: 'Siswa', phone: '081234567890', registeredDate: '2026-06-10' },
  { id: 2, name: 'Siti Nurhaliza', classNip: '2024002',           type: 'Siswa', phone: '081234567891', registeredDate: '2026-06-12' },
  { id: 3, name: 'Budi Santoso',  classNip: '197501012000031002', type: 'Guru',  phone: '081234567892', registeredDate: '2026-01-05' },
  { id: 4, name: 'Dewi Permata',  classNip: '2024003',            type: 'Siswa', phone: '081234567893', registeredDate: '2026-06-08' },
  { id: 5, name: 'Rina Kusuma',   classNip: '2024004',            type: 'Siswa', phone: '081234567894', registeredDate: '2026-05-20' },
  { id: 6, name: 'Agus Prasetyo', classNip: '198003152005021003', type: 'Guru',  phone: '081234567895', registeredDate: '2026-02-15' },
  { id: 7, name: 'Lina Marlina',  classNip: '2024005',            type: 'Siswa', phone: '081234567896', registeredDate: '2026-06-05' },
  { id: 8, name: 'Rudi Hermawan', classNip: '2024006',            type: 'Siswa', phone: '081234567897', registeredDate: '2026-06-13' },
];

// ============================================================
// ENTITY: BookMaster (Data Induk Buku)
// ============================================================
export interface BookMaster {
  id: number;           // PK
  title: string;
  author: string;
  category: string;
  shelf: string;
  publishYear: string;
}

// ============================================================
// ENTITY: BookCopy (Eksemplar Buku)
// Relasi: BookCopy N→1 BookMaster (bookId)
// ============================================================
export interface BookCopy {
  id: number;           // PK
  bookId: number;       // FK → BookMaster.id
  number: string;       // Nomor eksemplar unik (BK001, dst)
  status: 'Tersedia' | 'Dipinjam';
  acquisitionYear: string;
}

export const bookMasterData: BookMaster[] = [
  { id: 1, title: 'Laskar Pelangi',      author: 'Andrea Hirata',              category: 'Fiksi',      shelf: 'A-01', publishYear: '2005' },
  { id: 2, title: 'Bumi Manusia',         author: 'Pramoedya Ananta Toer',      category: 'Fiksi',      shelf: 'A-02', publishYear: '1980' },
  { id: 3, title: 'Negeri 5 Menara',      author: 'Ahmad Fuadi',                category: 'Fiksi',      shelf: 'A-03', publishYear: '2009' },
  { id: 4, title: 'Perahu Kertas',        author: 'Dee Lestari',                category: 'Fiksi',      shelf: 'A-04', publishYear: '2009' },
  { id: 5, title: 'Sang Pemimpi',         author: 'Andrea Hirata',              category: 'Fiksi',      shelf: 'A-05', publishYear: '2006' },
  { id: 6, title: 'Filosofi Kopi',        author: 'Dewi Lestari',               category: 'Fiksi',      shelf: 'B-01', publishYear: '2006' },
  { id: 7, title: 'Ayat-Ayat Cinta',      author: 'Habiburrahman El Shirazy',   category: 'Agama',      shelf: 'B-02', publishYear: '2004' },
  { id: 8, title: 'Matematika Kelas X',   author: 'Tim Penulis',                category: 'Pendidikan', shelf: 'C-01', publishYear: '2022' },
  { id: 9, title: 'Fisika Kelas X',       author: 'Tim Penulis',                category: 'Pendidikan', shelf: 'C-02', publishYear: '2022' },
  { id: 10, title: 'Kimia Kelas X',       author: 'Tim Penulis',                category: 'Pendidikan', shelf: 'C-03', publishYear: '2022' },
  { id: 11, title: 'Biologi Kelas X',     author: 'Tim Penulis',                category: 'Pendidikan', shelf: 'C-04', publishYear: '2022' },
];

export const bookCopyData: BookCopy[] = [
  { id: 1,  bookId: 1,  number: 'BK001', status: 'Tersedia', acquisitionYear: '2010' },
  { id: 2,  bookId: 1,  number: 'BK002', status: 'Dipinjam', acquisitionYear: '2010' },
  { id: 3,  bookId: 1,  number: 'BK003', status: 'Tersedia', acquisitionYear: '2015' },
  { id: 4,  bookId: 2,  number: 'BK004', status: 'Dipinjam', acquisitionYear: '2012' },
  { id: 5,  bookId: 2,  number: 'BK005', status: 'Tersedia', acquisitionYear: '2012' },
  { id: 6,  bookId: 3,  number: 'BK006', status: 'Tersedia', acquisitionYear: '2013' },
  { id: 7,  bookId: 4,  number: 'BK007', status: 'Tersedia', acquisitionYear: '2014' },
  { id: 8,  bookId: 5,  number: 'BK008', status: 'Dipinjam', acquisitionYear: '2011' },
  { id: 9,  bookId: 6,  number: 'BK009', status: 'Tersedia', acquisitionYear: '2016' },
  { id: 10, bookId: 7,  number: 'BK010', status: 'Tersedia', acquisitionYear: '2013' },
  { id: 11, bookId: 8,  number: 'BK011', status: 'Tersedia', acquisitionYear: '2023' },
  { id: 12, bookId: 8,  number: 'BK012', status: 'Tersedia', acquisitionYear: '2023' },
  { id: 13, bookId: 9,  number: 'BK013', status: 'Tersedia', acquisitionYear: '2023' },
  { id: 14, bookId: 10, number: 'BK014', status: 'Tersedia', acquisitionYear: '2023' },
  { id: 15, bookId: 11, number: 'BK015', status: 'Tersedia', acquisitionYear: '2023' },
];

// Helper: gabung BookCopy + BookMaster menjadi flat object (untuk backward compat halaman lain)
export interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  number: string;
  shelf: string;
  status: string;
  publishYear: string;
  acquisitionYear: string;
}

export const booksData: Book[] = bookCopyData.map(copy => {
  const master = bookMasterData.find(m => m.id === copy.bookId)!;
  return {
    id: copy.id,
    title: master.title,
    author: master.author,
    category: master.category,
    number: copy.number,
    shelf: master.shelf,
    status: copy.status,
    publishYear: master.publishYear,
    acquisitionYear: copy.acquisitionYear,
  };
});

// ============================================================
// ENTITY: Borrowing (Transaksi Peminjaman)
// Relasi: Borrowing N→1 Member  (memberId)
//         Borrowing N→1 BookCopy (bookNumber → BookCopy.number)
// ============================================================
export interface Borrowing {
  id: number;           // PK
  batchId: string;      // Grup peminjaman serentak
  memberId: number;     // FK → Member.id
  memberName: string;   // denormalized untuk display
  bookTitle: string;    // denormalized dari BookMaster
  bookNumber: string;   // FK → BookCopy.number
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  returnTime?: string;
  status: 'Aktif' | 'Terlambat' | 'Dikembalikan';
  loanType: 'Harian' | 'Mingguan' | 'Tahunan' | 'Guru';
  loanSubType?: string;
  quantity?: number;
  className?: string;
}

export const borrowingData: Borrowing[] = [
  // Aktif hari ini
  { id: 101, batchId: 'BATCH101', memberId: 1, memberName: 'Ahmad Fauzi',   bookTitle: 'Laskar Pelangi',  bookNumber: 'BK002', borrowDate: '2026-06-14', dueDate: '2026-06-14', returnTime: '17:00', status: 'Aktif',       loanType: 'Harian',   loanSubType: 'Pribadi', quantity: 1 },
  { id: 102, batchId: 'BATCH102', memberId: 2, memberName: 'Siti Nurhaliza', bookTitle: 'Bumi Manusia',    bookNumber: 'BK004', borrowDate: '2026-06-14', dueDate: '2026-06-21',                    status: 'Aktif',       loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 103, batchId: 'BATCH103', memberId: 4, memberName: 'Dewi Permata',   bookTitle: 'Sang Pemimpi',    bookNumber: 'BK008', borrowDate: '2026-06-13', dueDate: '2026-06-13', returnTime: '17:00', status: 'Aktif',       loanType: 'Harian',   loanSubType: 'Pribadi', quantity: 1 },
  { id: 104, batchId: 'BATCH104', memberId: 8, memberName: 'Rudi Hermawan',  bookTitle: 'Perahu Kertas',   bookNumber: 'BK007', borrowDate: '2026-06-10', dueDate: '2026-06-17',                    status: 'Aktif',       loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 105, batchId: 'BATCH105', memberId: 5, memberName: 'Rina Kusuma',    bookTitle: 'Filosofi Kopi',   bookNumber: 'BK009', borrowDate: '2026-06-11', dueDate: '2026-06-11', returnTime: '17:00', status: 'Aktif',       loanType: 'Harian',   loanSubType: 'Pribadi', quantity: 1 },
  { id: 106, batchId: 'BATCH106', memberId: 7, memberName: 'Lina Marlina',   bookTitle: 'Ayat-Ayat Cinta', bookNumber: 'BK010', borrowDate: '2026-06-01', dueDate: '2026-06-08',                    status: 'Terlambat',   loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 107, batchId: 'BATCH107', memberId: 3, memberName: 'Budi Santoso',   bookTitle: 'Negeri 5 Menara', bookNumber: 'BK006', borrowDate: '2026-06-03', dueDate: '2026-06-10',                    status: 'Terlambat',   loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 108, batchId: 'BATCH108', memberId: 6, memberName: 'Agus Prasetyo',  bookTitle: 'Matematika Kelas X', bookNumber: 'BK011', borrowDate: '2026-05-15', dueDate: '2026-05-22',              status: 'Aktif',       loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 109, batchId: 'BATCH109', memberId: 1, memberName: 'Ahmad Fauzi',   bookTitle: 'Fisika Kelas X',  bookNumber: 'BK013', borrowDate: '2026-01-15', dueDate: '2027-01-15',                    status: 'Aktif',       loanType: 'Tahunan',  quantity: 1 },
  { id: 110, batchId: 'BATCH109', memberId: 1, memberName: 'Ahmad Fauzi',   bookTitle: 'Kimia Kelas X',   bookNumber: 'BK014', borrowDate: '2026-01-15', dueDate: '2027-01-15',                    status: 'Aktif',       loanType: 'Tahunan',  quantity: 1 },
  // Dikembalikan
  { id: 201, batchId: 'BATCH201', memberId: 2, memberName: 'Siti Nurhaliza', bookTitle: 'Laskar Pelangi',  bookNumber: 'BK001', borrowDate: '2026-06-07', dueDate: '2026-06-14', returnDate: '2026-06-14',           status: 'Dikembalikan', loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 202, batchId: 'BATCH202', memberId: 4, memberName: 'Dewi Permata',   bookTitle: 'Filosofi Kopi',   bookNumber: 'BK009', borrowDate: '2026-06-13', dueDate: '2026-06-13', returnDate: '2026-06-14', returnTime: '16:30', status: 'Dikembalikan', loanType: 'Harian',   loanSubType: 'Pribadi', quantity: 1 },
  { id: 203, batchId: 'BATCH203', memberId: 8, memberName: 'Rudi Hermawan',  bookTitle: 'Bumi Manusia',    bookNumber: 'BK005', borrowDate: '2026-06-03', dueDate: '2026-06-10', returnDate: '2026-06-10',           status: 'Dikembalikan', loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 204, batchId: 'BATCH204', memberId: 5, memberName: 'Rina Kusuma',    bookTitle: 'Perahu Kertas',   bookNumber: 'BK007', borrowDate: '2026-06-11', dueDate: '2026-06-11', returnDate: '2026-06-11', returnTime: '16:00', status: 'Dikembalikan', loanType: 'Harian',   loanSubType: 'Pribadi', quantity: 1 },
  { id: 205, batchId: 'BATCH205', memberId: 7, memberName: 'Lina Marlina',   bookTitle: 'Sang Pemimpi',    bookNumber: 'BK008', borrowDate: '2026-06-12', dueDate: '2026-06-12', returnDate: '2026-06-12', returnTime: '15:30', status: 'Dikembalikan', loanType: 'Harian',   loanSubType: 'Pribadi', quantity: 1 },
  { id: 206, batchId: 'BATCH206', memberId: 3, memberName: 'Budi Santoso',   bookTitle: 'Negeri 5 Menara', bookNumber: 'BK006', borrowDate: '2026-05-28', dueDate: '2026-06-04', returnDate: '2026-06-04',           status: 'Dikembalikan', loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 207, batchId: 'BATCH207', memberId: 1, memberName: 'Ahmad Fauzi',   bookTitle: 'Ayat-Ayat Cinta', bookNumber: 'BK010', borrowDate: '2026-06-01', dueDate: '2026-06-01', returnDate: '2026-06-01', returnTime: '17:00', status: 'Dikembalikan', loanType: 'Harian',   loanSubType: 'Pribadi', quantity: 1 },
  { id: 208, batchId: 'BATCH208', memberId: 4, memberName: 'Dewi Permata',   bookTitle: 'Laskar Pelangi',  bookNumber: 'BK003', borrowDate: '2026-06-05', dueDate: '2026-06-05', returnDate: '2026-06-05', returnTime: '16:45', status: 'Dikembalikan', loanType: 'Harian',   loanSubType: 'Pribadi', quantity: 1 },
  { id: 209, batchId: 'BATCH209', memberId: 6, memberName: 'Agus Prasetyo',  bookTitle: 'Matematika Kelas X', bookNumber: 'BK012', borrowDate: '2026-05-10', dueDate: '2026-05-17', returnDate: '2026-05-17', status: 'Dikembalikan', loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 210, batchId: 'BATCH210', memberId: 2, memberName: 'Siti Nurhaliza', bookTitle: 'Perahu Kertas',   bookNumber: 'BK007', borrowDate: '2026-05-15', dueDate: '2026-05-15', returnDate: '2026-05-15', returnTime: '16:00', status: 'Dikembalikan', loanType: 'Harian',   loanSubType: 'Pribadi', quantity: 1 },
  { id: 211, batchId: 'BATCH211', memberId: 5, memberName: 'Rina Kusuma',    bookTitle: 'Bumi Manusia',    bookNumber: 'BK004', borrowDate: '2026-05-20', dueDate: '2026-05-27', returnDate: '2026-05-26',           status: 'Dikembalikan', loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 212, batchId: 'BATCH212', memberId: 7, memberName: 'Lina Marlina',   bookTitle: 'Filosofi Kopi',   bookNumber: 'BK009', borrowDate: '2026-04-15', dueDate: '2026-04-22', returnDate: '2026-04-22',           status: 'Dikembalikan', loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 213, batchId: 'BATCH213', memberId: 8, memberName: 'Rudi Hermawan',  bookTitle: 'Laskar Pelangi',  bookNumber: 'BK001', borrowDate: '2026-03-10', dueDate: '2026-03-17', returnDate: '2026-03-17',           status: 'Dikembalikan', loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 214, batchId: 'BATCH214', memberId: 1, memberName: 'Ahmad Fauzi',   bookTitle: 'Sang Pemimpi',    bookNumber: 'BK008', borrowDate: '2026-02-20', dueDate: '2026-02-27', returnDate: '2026-02-27',           status: 'Dikembalikan', loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
  { id: 215, batchId: 'BATCH215', memberId: 4, memberName: 'Dewi Permata',   bookTitle: 'Negeri 5 Menara', bookNumber: 'BK006', borrowDate: '2026-01-25', dueDate: '2026-02-01', returnDate: '2026-02-01',           status: 'Dikembalikan', loanType: 'Mingguan', loanSubType: 'Pribadi', quantity: 1 },
];

// ============================================================
// ENTITY: Visitor (Kunjungan)
// Relasi: Visitor N→0..1 Member (memberId — opsional, tamu non-anggota boleh berkunjung)
// ============================================================
export interface Visitor {
  id: number;           // PK
  memberId?: number;    // FK → Member.id (opsional)
  name: string;         // denormalized / input manual
  type: string;
  classNip: string;     // denormalized / input manual
  purpose: string;
  visitDate: string;
  visitTime: string;
}

export const visitorsData: Visitor[] = [
  { id: 301, memberId: 1, name: 'Ahmad Fauzi',   type: 'Siswa', classNip: '2024001',            purpose: 'Membaca',            visitDate: '2026-06-14', visitTime: '10:00' },
  { id: 302, memberId: 2, name: 'Siti Nurhaliza', type: 'Siswa', classNip: '2024002',            purpose: 'Meminjam Buku',      visitDate: '2026-06-14', visitTime: '11:30' },
  { id: 303, memberId: 4, name: 'Dewi Permata',   type: 'Siswa', classNip: '2024003',            purpose: 'Mengerjakan Tugas',  visitDate: '2026-06-14', visitTime: '13:00' },
  { id: 304, memberId: 8, name: 'Rudi Hermawan',  type: 'Siswa', classNip: '2024006',            purpose: 'Membaca',            visitDate: '2026-06-13', visitTime: '09:00' },
  { id: 305, memberId: 5, name: 'Rina Kusuma',    type: 'Siswa', classNip: '2024004',            purpose: 'Meminjam Buku',      visitDate: '2026-06-13', visitTime: '10:30' },
  { id: 306, memberId: 7, name: 'Lina Marlina',   type: 'Siswa', classNip: '2024005',            purpose: 'Membaca',            visitDate: '2026-06-13', visitTime: '14:00' },
  { id: 307, memberId: 3, name: 'Budi Santoso',   type: 'Guru',  classNip: '197501012000031002', purpose: 'Mencari Referensi',  visitDate: '2026-06-13', visitTime: '15:30' },
  { id: 308, memberId: 1, name: 'Ahmad Fauzi',   type: 'Siswa', classNip: '2024001',            purpose: 'Mengerjakan Tugas',  visitDate: '2026-06-12', visitTime: '08:30' },
  { id: 309, memberId: 4, name: 'Dewi Permata',   type: 'Siswa', classNip: '2024003',            purpose: 'Membaca',            visitDate: '2026-06-12', visitTime: '10:00' },
  { id: 310, memberId: 2, name: 'Siti Nurhaliza', type: 'Siswa', classNip: '2024002',            purpose: 'Meminjam Buku',      visitDate: '2026-06-12', visitTime: '13:30' },
  { id: 311, memberId: 6, name: 'Agus Prasetyo',  type: 'Guru',  classNip: '198003152005021003', purpose: 'Mencari Referensi',  visitDate: '2026-06-12', visitTime: '14:30' },
  { id: 312, memberId: 5, name: 'Rina Kusuma',    type: 'Siswa', classNip: '2024004',            purpose: 'Membaca',            visitDate: '2026-06-11', visitTime: '09:30' },
  { id: 313, memberId: 8, name: 'Rudi Hermawan',  type: 'Siswa', classNip: '2024006',            purpose: 'Meminjam Buku',      visitDate: '2026-06-11', visitTime: '11:00' },
  { id: 314, memberId: 7, name: 'Lina Marlina',   type: 'Siswa', classNip: '2024005',            purpose: 'Mengerjakan Tugas',  visitDate: '2026-06-11', visitTime: '13:00' },
  { id: 315, memberId: 1, name: 'Ahmad Fauzi',   type: 'Siswa', classNip: '2024001',            purpose: 'Membaca',            visitDate: '2026-06-10', visitTime: '08:00' },
  { id: 316, memberId: 4, name: 'Dewi Permata',   type: 'Siswa', classNip: '2024003',            purpose: 'Meminjam Buku',      visitDate: '2026-06-10', visitTime: '10:30' },
  { id: 317, memberId: 2, name: 'Siti Nurhaliza', type: 'Siswa', classNip: '2024002',            purpose: 'Membaca',            visitDate: '2026-06-10', visitTime: '14:00' },
  { id: 318, memberId: 3, name: 'Budi Santoso',   type: 'Guru',  classNip: '197501012000031002', purpose: 'Mencari Referensi',  visitDate: '2026-06-10', visitTime: '15:00' },
  { id: 319, memberId: 5, name: 'Rina Kusuma',    type: 'Siswa', classNip: '2024004',            purpose: 'Mengerjakan Tugas',  visitDate: '2026-06-09', visitTime: '09:00' },
  { id: 320, memberId: 8, name: 'Rudi Hermawan',  type: 'Siswa', classNip: '2024006',            purpose: 'Membaca',            visitDate: '2026-06-09', visitTime: '10:00' },
  { id: 321, memberId: 7, name: 'Lina Marlina',   type: 'Siswa', classNip: '2024005',            purpose: 'Meminjam Buku',      visitDate: '2026-06-09', visitTime: '13:30' },
  { id: 322, memberId: 1, name: 'Ahmad Fauzi',   type: 'Siswa', classNip: '2024001',            purpose: 'Membaca',            visitDate: '2026-06-05', visitTime: '10:00' },
  { id: 323, memberId: 4, name: 'Dewi Permata',   type: 'Siswa', classNip: '2024003',            purpose: 'Mengerjakan Tugas',  visitDate: '2026-06-04', visitTime: '11:00' },
];

// ============================================================
// ENTITY: Penalty (Sanksi)
// Relasi: Penalty N→1 Borrowing (borrowingId)
//         Penalty N→1 Member    (memberId)
//         Penalty N→1 BookCopy  (bookNumber → BookCopy.number)
// ============================================================
export interface Penalty {
  id: number;           // PK
  borrowingId: number;  // FK → Borrowing.id
  memberId: number;     // FK → Member.id  (denormalized untuk display)
  memberName: string;
  bookNumber: string;   // FK → BookCopy.number
  bookTitle: string;
  loanType: string;
  date: string;
  reason: 'Terlambat' | 'Rusak' | 'Hilang';
  penaltyType: 'Buku Donasi' | 'Buku Pengganti';
  penaltyBookTitle: string;
  notes: string;
}

// Dimulai kosong — diisi saat petugas memproses pengembalian dengan sanksi
export const penaltiesData: Penalty[] = [];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/** Lookup member by id */
export const getMemberById = (id: number): Member | undefined =>
  membersData.find(m => m.id === id);

/** Lookup BookCopy by nomor eksemplar */
export const getBookCopyByNumber = (number: string): BookCopy | undefined =>
  bookCopyData.find(c => c.number === number);

/** Lookup BookMaster by bookCopy number */
export const getBookMasterByNumber = (number: string): BookMaster | undefined => {
  const copy = getBookCopyByNumber(number);
  return copy ? bookMasterData.find(m => m.id === copy.bookId) : undefined;
};

/** Ambil semua peminjaman aktif satu anggota */
export const getActiveBorrowingsByMember = (memberId: number): Borrowing[] =>
  borrowingData.filter(b => b.memberId === memberId && b.status !== 'Dikembalikan');
