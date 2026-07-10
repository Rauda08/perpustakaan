<?php

namespace Database\Seeders;

use App\Models\BookCopy;
use App\Models\BookMaster;
use App\Models\Borrowing;
use App\Models\Member;
use App\Models\Penalty;
use App\Models\User;
use App\Models\Visitor;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();

        /*
        |--------------------------------------------------------------------------
        | Admin User
        |--------------------------------------------------------------------------
        */

        User::create([
            'name' => 'Petugas Perpustakaan',
            'username' => 'admin',
            'password' => Hash::make('admin123'),
        ]);

        /*
        |--------------------------------------------------------------------------
        | Members
        |--------------------------------------------------------------------------
        */

        $members = [
            ['name' => 'Ahmad Fauzi', 'class_nip' => '2024001', 'type' => 'Siswa', 'phone' => '081234567890', 'registered_date' => $today->copy()->subDays(15)->toDateString()],
            ['name' => 'Siti Nurhaliza', 'class_nip' => '2024002', 'type' => 'Siswa', 'phone' => '081234567891', 'registered_date' => $today->copy()->subDays(13)->toDateString()],
            ['name' => 'Budi Santoso', 'class_nip' => '197501012000031002', 'type' => 'Guru', 'phone' => '081234567892', 'registered_date' => $today->copy()->subMonths(5)->toDateString()],
            ['name' => 'Dewi Permata', 'class_nip' => '2024003', 'type' => 'Siswa', 'phone' => '081234567893', 'registered_date' => $today->copy()->subDays(17)->toDateString()],
            ['name' => 'Rina Kusuma', 'class_nip' => '2024004', 'type' => 'Siswa', 'phone' => '081234567894', 'registered_date' => $today->copy()->subMonth()->toDateString()],
            ['name' => 'Agus Prasetyo', 'class_nip' => '198003152005021003', 'type' => 'Guru', 'phone' => '081234567895', 'registered_date' => $today->copy()->subMonths(4)->toDateString()],
            ['name' => 'Lina Marlina', 'class_nip' => '2024005', 'type' => 'Siswa', 'phone' => '081234567896', 'registered_date' => $today->copy()->subDays(20)->toDateString()],
            ['name' => 'Rudi Hermawan', 'class_nip' => '2024006', 'type' => 'Siswa', 'phone' => '081234567897', 'registered_date' => $today->copy()->subDays(12)->toDateString()],
        ];

        $memberIds = [];

        foreach ($members as $member) {
            $createdMember = Member::create($member);
            $memberIds[] = $createdMember->id;
        }

        /*
        |--------------------------------------------------------------------------
        | Book Masters
        |--------------------------------------------------------------------------
        */

        $masters = [
    [
        'induk_number' => 'AAC-001',
        'title' => 'Laskar Pelangi',
        'author' => 'Andrea Hirata',
        'category' => 'Fiksi',
        'shelf' => 'A-01',
        'publish_year' => '2005',
    ],
    [
        'induk_number' => 'AAC-002',
        'title' => 'Bumi Manusia',
        'author' => 'Pramoedya Ananta Toer',
        'category' => 'Fiksi',
        'shelf' => 'A-02',
        'publish_year' => '1980',
    ],
    [
        'induk_number' => 'AAC-003',
        'title' => 'Negeri 5 Menara',
        'author' => 'Ahmad Fuadi',
        'category' => 'Fiksi',
        'shelf' => 'A-03',
        'publish_year' => '2009',
    ],
    [
        'induk_number' => 'AAC-004',
        'title' => 'Perahu Kertas',
        'author' => 'Dee Lestari',
        'category' => 'Fiksi',
        'shelf' => 'A-04',
        'publish_year' => '2009',
    ],
    [
        'induk_number' => 'AAC-005',
        'title' => 'Sang Pemimpi',
        'author' => 'Andrea Hirata',
        'category' => 'Fiksi',
        'shelf' => 'A-05',
        'publish_year' => '2006',
    ],
    [
        'induk_number' => 'AAC-006',
        'title' => 'Filosofi Kopi',
        'author' => 'Dewi Lestari',
        'category' => 'Fiksi',
        'shelf' => 'B-01',
        'publish_year' => '2006',
    ],
    [
        'induk_number' => 'AAC-007',
        'title' => 'Ayat-Ayat Cinta',
        'author' => 'Habiburrahman El Shirazy',
        'category' => 'Agama',
        'shelf' => 'B-02',
        'publish_year' => '2004',
    ],
    [
        'induk_number' => 'AAC-008',
        'title' => 'Matematika Kelas X',
        'author' => 'Tim Penulis',
        'category' => 'Pendidikan',
        'shelf' => 'C-01',
        'publish_year' => '2022',
    ],
    [
        'induk_number' => 'AAC-009',
        'title' => 'Fisika Kelas X',
        'author' => 'Tim Penulis',
        'category' => 'Pendidikan',
        'shelf' => 'C-02',
        'publish_year' => '2022',
    ],
    [
        'induk_number' => 'AAC-010',
        'title' => 'Kimia Kelas X',
        'author' => 'Tim Penulis',
        'category' => 'Pendidikan',
        'shelf' => 'C-03',
        'publish_year' => '2022',
    ],
    [
        'induk_number' => 'AAC-011',
        'title' => 'Biologi Kelas X',
        'author' => 'Tim Penulis',
        'category' => 'Pendidikan',
        'shelf' => 'C-04',
        'publish_year' => '2022',
    ],
];

        $masterIds = [];

        foreach ($masters as $master) {
            $createdMaster = BookMaster::create($master);
            $masterIds[] = $createdMaster->id;
        }

        /*
        |--------------------------------------------------------------------------
        | Book Copies
        |--------------------------------------------------------------------------
        */

        $copies = [
            [$masterIds[0], 'BK001', 'Tersedia', '2010'],
            [$masterIds[0], 'BK002', 'Dipinjam', '2010'],
            [$masterIds[0], 'BK003', 'Tersedia', '2015'],
            [$masterIds[1], 'BK004', 'Dipinjam', '2012'],
            [$masterIds[1], 'BK005', 'Tersedia', '2012'],
            [$masterIds[2], 'BK006', 'Dipinjam', '2013'],
            [$masterIds[3], 'BK007', 'Dipinjam', '2014'],
            [$masterIds[4], 'BK008', 'Dipinjam', '2011'],
            [$masterIds[5], 'BK009', 'Dipinjam', '2016'],
            [$masterIds[6], 'BK010', 'Dipinjam', '2013'],
            [$masterIds[7], 'BK011', 'Dipinjam', '2023'],
            [$masterIds[7], 'BK012', 'Tersedia', '2023'],
            [$masterIds[8], 'BK013', 'Dipinjam', '2023'],
            [$masterIds[9], 'BK014', 'Dipinjam', '2023'],
            [$masterIds[10], 'BK015', 'Tersedia', '2023'],
        ];

        $copyMap = [];

        foreach ($copies as [$masterId, $number, $status, $year]) {
            $copy = BookCopy::create([
                'book_master_id' => $masterId,
                'number' => $number,
                'status' => $status,
                'acquisition_year' => $year,
            ]);

            $copyMap[$number] = $copy->id;
        }

        /*
        |--------------------------------------------------------------------------
        | Borrowings
        |--------------------------------------------------------------------------
        | Data ini dibuat dinamis agar dashboard selalu punya:
        | - Jatuh Tempo Hari Ini
        | - Pengembalian Terlambat
        */

        $borrowings = [
            // Jatuh tempo hari ini
            ['BATCH101', $memberIds[0], 'BK002', $today->copy()->toDateString(), $today->copy()->toDateString(), null, '17:00', 'Aktif', 'Harian', 'Pribadi'],
            ['BATCH102', $memberIds[1], 'BK004', $today->copy()->subDays(7)->toDateString(), $today->copy()->toDateString(), null, null, 'Aktif', 'Mingguan', 'Pribadi'],

            // Terlambat
            ['BATCH103', $memberIds[3], 'BK008', $today->copy()->subDays(1)->toDateString(), $today->copy()->subDays(1)->toDateString(), null, '17:00', 'Terlambat', 'Harian', 'Pribadi'],
            ['BATCH104', $memberIds[7], 'BK007', $today->copy()->subDays(15)->toDateString(), $today->copy()->subDays(8)->toDateString(), null, null, 'Terlambat', 'Mingguan', 'Pribadi'],
            ['BATCH105', $memberIds[4], 'BK009', $today->copy()->subDays(5)->toDateString(), $today->copy()->subDays(5)->toDateString(), null, '17:00', 'Terlambat', 'Harian', 'Pribadi'],
            ['BATCH106', $memberIds[6], 'BK010', $today->copy()->subDays(12)->toDateString(), $today->copy()->subDays(5)->toDateString(), null, null, 'Terlambat', 'Mingguan', 'Pribadi'],
            ['BATCH107', $memberIds[2], 'BK006', $today->copy()->subDays(10)->toDateString(), $today->copy()->subDays(3)->toDateString(), null, null, 'Terlambat', 'Mingguan', 'Pribadi'],
            ['BATCH108', $memberIds[5], 'BK011', $today->copy()->subDays(20)->toDateString(), $today->copy()->subDays(13)->toDateString(), null, null, 'Terlambat', 'Mingguan', 'Pribadi'],

            // Aktif belum jatuh tempo
            ['BATCH109', $memberIds[0], 'BK013', $today->copy()->toDateString(), $today->copy()->addDays(7)->toDateString(), null, null, 'Aktif', 'Mingguan', 'Pribadi'],
            ['BATCH110', $memberIds[0], 'BK014', $today->copy()->toDateString(), $today->copy()->addYear()->toDateString(), null, null, 'Aktif', 'Tahunan', null],

            // Sudah dikembalikan
            ['BATCH201', $memberIds[1], 'BK001', $today->copy()->subDays(7)->toDateString(), $today->copy()->toDateString(), $today->copy()->toDateString(), null, 'Dikembalikan', 'Mingguan', 'Pribadi'],
            ['BATCH202', $memberIds[3], 'BK003', $today->copy()->subDays(1)->toDateString(), $today->copy()->subDays(1)->toDateString(), $today->copy()->toDateString(), '16:30', 'Dikembalikan', 'Harian', 'Pribadi'],
            ['BATCH203', $memberIds[7], 'BK005', $today->copy()->subDays(10)->toDateString(), $today->copy()->subDays(3)->toDateString(), $today->copy()->subDays(3)->toDateString(), null, 'Dikembalikan', 'Mingguan', 'Pribadi'],
            ['BATCH204', $memberIds[5], 'BK012', $today->copy()->subDays(20)->toDateString(), $today->copy()->subDays(13)->toDateString(), $today->copy()->subDays(13)->toDateString(), null, 'Dikembalikan', 'Mingguan', 'Pribadi'],
            ['BATCH205', $memberIds[4], 'BK015', $today->copy()->subDays(30)->toDateString(), $today->copy()->subDays(23)->toDateString(), $today->copy()->subDays(22)->toDateString(), null, 'Dikembalikan', 'Mingguan', 'Pribadi'],
        ];

        $borrowingMap = [];

        foreach ($borrowings as [$batch, $memberId, $copyNum, $borrowDate, $dueDate, $returnDate, $returnTime, $status, $loanType, $subType]) {
            $borrowing = Borrowing::create([
                'batch_id' => $batch,
                'member_id' => $memberId,
                'book_copy_id' => $copyMap[$copyNum],
                'borrow_date' => $borrowDate,
                'due_date' => $dueDate,
                'return_date' => $returnDate,
                'return_time' => $returnTime,
                'status' => $status,
                'loan_type' => $loanType,
                'loan_sub_type' => $subType,
                'quantity' => 1,
                'class_name' => Member::find($memberId)?->class_nip,
            ]);

            $borrowingMap[$batch] = $borrowing;
        }

        /*
        |--------------------------------------------------------------------------
        | Penalties
        |--------------------------------------------------------------------------
        */

        $penalties = [
            ['BATCH103', 'Terlambat', 'Buku Donasi', 'Buku bacaan umum', 'Terlambat mengembalikan buku harian.'],
            ['BATCH104', 'Terlambat', 'Buku Donasi', 'Buku fiksi ringan', 'Terlambat lebih dari satu minggu.'],
            ['BATCH107', 'Terlambat', 'Buku Pengganti', 'Buku pengganti sejenis', 'Perlu konfirmasi pengembalian.'],
        ];

        foreach ($penalties as [$batch, $reason, $penaltyType, $penaltyBookTitle, $notes]) {
            $borrowing = $borrowingMap[$batch];

            Penalty::create([
                'borrowing_id' => $borrowing->id,
                'member_id' => $borrowing->member_id,
                'book_copy_id' => $borrowing->book_copy_id,
                'loan_type' => $borrowing->loan_type,
                'date' => $today->copy()->toDateString(),
                'reason' => $reason,
                'penalty_type' => $penaltyType,
                'penalty_book_title' => $penaltyBookTitle,
                'notes' => $notes,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Visitors
        |--------------------------------------------------------------------------
        */

        $visitors = [
            [$memberIds[0], 'Ahmad Fauzi', 'Siswa', '2024001', 'Membaca', $today->copy()->toDateString(), '10:00'],
            [$memberIds[1], 'Siti Nurhaliza', 'Siswa', '2024002', 'Meminjam Buku', $today->copy()->toDateString(), '11:30'],
            [$memberIds[3], 'Dewi Permata', 'Siswa', '2024003', 'Mengerjakan Tugas', $today->copy()->toDateString(), '13:00'],
            [$memberIds[7], 'Rudi Hermawan', 'Siswa', '2024006', 'Membaca', $today->copy()->subDays(1)->toDateString(), '09:00'],
            [$memberIds[4], 'Rina Kusuma', 'Siswa', '2024004', 'Meminjam Buku', $today->copy()->subDays(1)->toDateString(), '10:30'],
            [$memberIds[6], 'Lina Marlina', 'Siswa', '2024005', 'Membaca', $today->copy()->subDays(1)->toDateString(), '14:00'],
            [$memberIds[2], 'Budi Santoso', 'Guru', '197501012000031002', 'Mencari Referensi', $today->copy()->subDays(1)->toDateString(), '15:30'],
            [$memberIds[0], 'Ahmad Fauzi', 'Siswa', '2024001', 'Mengerjakan Tugas', $today->copy()->subDays(2)->toDateString(), '08:30'],
            [$memberIds[3], 'Dewi Permata', 'Siswa', '2024003', 'Membaca', $today->copy()->subDays(2)->toDateString(), '10:00'],
            [$memberIds[1], 'Siti Nurhaliza', 'Siswa', '2024002', 'Meminjam Buku', $today->copy()->subDays(2)->toDateString(), '13:30'],
            [$memberIds[5], 'Agus Prasetyo', 'Guru', '198003152005021003', 'Mencari Referensi', $today->copy()->subDays(2)->toDateString(), '14:30'],
            [$memberIds[4], 'Rina Kusuma', 'Siswa', '2024004', 'Membaca', $today->copy()->subDays(3)->toDateString(), '09:30'],
            [$memberIds[7], 'Rudi Hermawan', 'Siswa', '2024006', 'Meminjam Buku', $today->copy()->subDays(3)->toDateString(), '11:00'],
            [$memberIds[6], 'Lina Marlina', 'Siswa', '2024005', 'Mengerjakan Tugas', $today->copy()->subDays(3)->toDateString(), '13:00'],
            [$memberIds[0], 'Ahmad Fauzi', 'Siswa', '2024001', 'Membaca', $today->copy()->subDays(4)->toDateString(), '08:00'],
            [$memberIds[3], 'Dewi Permata', 'Siswa', '2024003', 'Meminjam Buku', $today->copy()->subDays(4)->toDateString(), '10:30'],
            [$memberIds[1], 'Siti Nurhaliza', 'Siswa', '2024002', 'Membaca', $today->copy()->subDays(4)->toDateString(), '14:00'],
            [$memberIds[2], 'Budi Santoso', 'Guru', '197501012000031002', 'Mencari Referensi', $today->copy()->subDays(4)->toDateString(), '15:00'],
            [$memberIds[4], 'Rina Kusuma', 'Siswa', '2024004', 'Mengerjakan Tugas', $today->copy()->subDays(5)->toDateString(), '09:00'],
            [$memberIds[7], 'Rudi Hermawan', 'Siswa', '2024006', 'Membaca', $today->copy()->subDays(5)->toDateString(), '10:00'],
            [$memberIds[6], 'Lina Marlina', 'Siswa', '2024005', 'Meminjam Buku', $today->copy()->subDays(5)->toDateString(), '13:30'],
        ];

        foreach ($visitors as [$memberId, $name, $type, $classNip, $purpose, $visitDate, $visitTime]) {
            Visitor::create([
                'member_id' => $memberId,
                'name' => $name,
                'type' => $type,
                'class_nip' => $classNip,
                'purpose' => $purpose,
                'visit_date' => $visitDate,
                'visit_time' => $visitTime,
            ]);
        }
    }
}
