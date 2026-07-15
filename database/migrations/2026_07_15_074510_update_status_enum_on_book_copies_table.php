<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE book_copies
            MODIFY status ENUM('Tersedia', 'Dipinjam', 'Rusak', 'Hilang')
            NOT NULL DEFAULT 'Tersedia'
        ");
    }

    public function down(): void
    {
        DB::table('book_copies')
            ->whereIn('status', ['Rusak', 'Hilang'])
            ->update(['status' => 'Tersedia']);

        DB::statement("
            ALTER TABLE book_copies
            MODIFY status ENUM('Tersedia', 'Dipinjam')
            NOT NULL DEFAULT 'Tersedia'
        ");
    }
};
