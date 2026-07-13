<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('book_masters', function (Blueprint $table) {
            if (!Schema::hasColumn('book_masters', 'induk_number')) {
                $table->string('induk_number')->nullable()->after('id');
            }
        });

        DB::table('book_masters')
            ->whereNull('induk_number')
            ->orderBy('id')
            ->get()
            ->each(function ($book) {
                DB::table('book_masters')
                    ->where('id', $book->id)
                    ->update([
                        'induk_number' => 'AAC-' . str_pad($book->id, 3, '0', STR_PAD_LEFT),
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('book_masters', function (Blueprint $table) {
            if (Schema::hasColumn('book_masters', 'induk_number')) {
                $table->dropColumn('induk_number');
            }
        });
    }
};
