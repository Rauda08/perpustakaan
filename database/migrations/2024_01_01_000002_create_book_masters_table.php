<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_masters', function (Blueprint $table) {
            $table->id();
            $table->string('induk_number')->unique();
            $table->string('title');
            $table->string('author');
            $table->string('category');
            $table->string('shelf');
            $table->string('publish_year');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_masters');
    }
};
