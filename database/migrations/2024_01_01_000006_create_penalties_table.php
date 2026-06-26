<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penalties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrowing_id')->constrained('borrowings');
            $table->foreignId('member_id')->constrained('members');
            $table->foreignId('book_copy_id')->constrained('book_copies');
            $table->string('loan_type');
            $table->date('date');
            $table->enum('reason', ['Terlambat', 'Rusak', 'Hilang']);
            $table->enum('penalty_type', ['Buku Donasi', 'Buku Pengganti']);
            $table->string('penalty_book_title');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penalties');
    }
};
