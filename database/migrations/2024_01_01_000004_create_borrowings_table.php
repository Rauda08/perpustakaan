<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('borrowings', function (Blueprint $table) {
            $table->id();
            $table->string('batch_id'); // Grup peminjaman serentak
            $table->foreignId('member_id')->constrained('members');
            $table->foreignId('book_copy_id')->constrained('book_copies');
            $table->date('borrow_date');
            $table->date('due_date');
            $table->date('return_date')->nullable();
            $table->string('return_time')->nullable();
            $table->enum('status', ['Aktif', 'Terlambat', 'Dikembalikan'])->default('Aktif');
            $table->enum('loan_type', ['Harian', 'Mingguan', 'Tahunan', 'Guru']);
            $table->string('loan_sub_type')->nullable(); // Pribadi, Kelas, dll
            $table->integer('quantity')->default(1);
            $table->string('class_name')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('borrowings');
    }
};
