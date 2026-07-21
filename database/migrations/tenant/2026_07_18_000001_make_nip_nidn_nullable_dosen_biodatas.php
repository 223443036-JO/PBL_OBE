<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: ubah kolom nip dan nidn di tabel dosen_biodatas
 * supaya boleh NULL (nullable).
 *
 * MASALAH SEBELUMNYA: migration awal bikin dua kolom ini WAJIB diisi
 * (NOT NULL), padahal di kenyataan banyak dosen yang belum atau tidak
 * akan pernah punya NIP (khusus PNS) atau NIDN (perlu pengajuan ke
 * Dikti). Kode controller (normalizeEmptyToNull) sudah dirancang buat
 * ngubah input kosong/"-" jadi NULL, tapi database menolak karena
 * kolomnya belum diizinkan NULL sejak awal dibuat.
 *
 * PENTING: mengubah kolom yang punya constraint unique() butuh
 * package doctrine/dbal supaya Laravel bisa modifikasi kolom lewat
 * change(). Kalau belum terpasang, jalankan dulu:
 *   composer require doctrine/dbal
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dosen_biodatas', function (Blueprint $table) {
            $table->string('nip')->nullable()->change();
            $table->string('nidn')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('dosen_biodatas', function (Blueprint $table) {
            $table->string('nip')->nullable(false)->change();
            $table->string('nidn')->nullable(false)->change();
        });
    }
};