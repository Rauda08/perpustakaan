<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borrowings', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
        });

        Schema::table('borrowings', function (Blueprint $table) {
            $table->unsignedBigInteger('member_id')->nullable()->change();

            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->nullOnDelete();
        });

        Schema::table('penalties', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
        });

        Schema::table('penalties', function (Blueprint $table) {
            $table->unsignedBigInteger('member_id')->nullable()->change();

            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->nullOnDelete();
        });

        Schema::table('visitors', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
        });

        Schema::table('visitors', function (Blueprint $table) {
            $table->unsignedBigInteger('member_id')->nullable()->change();

            $table->foreign('member_id')
                ->references('id')
                ->on('members')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('borrowings', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
        });

        Schema::table('borrowings', function (Blueprint $table) {
            $table->unsignedBigInteger('member_id')->nullable(false)->change();

            $table->foreign('member_id')
                ->references('id')
                ->on('members');
        });

        Schema::table('penalties', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
        });

        Schema::table('penalties', function (Blueprint $table) {
            $table->unsignedBigInteger('member_id')->nullable(false)->change();

            $table->foreign('member_id')
                ->references('id')
                ->on('members');
        });

        Schema::table('visitors', function (Blueprint $table) {
            $table->dropForeign(['member_id']);
        });

        Schema::table('visitors', function (Blueprint $table) {
            $table->unsignedBigInteger('member_id')->nullable(false)->change();

            $table->foreign('member_id')
                ->references('id')
                ->on('members');
        });
    }
};
