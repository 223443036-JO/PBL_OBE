<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            $table->foreignId('wali_dosen_id')
                ->nullable()
                ->after('tahun_masuk')
                ->constrained('dosen_biodatas')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('kelas', function (Blueprint $table) {
            $table->dropForeign(['wali_dosen_id']);
            $table->dropColumn('wali_dosen_id');
        });
    }
};