<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: pisahkan jabatan struktural (Kaprodi, Kajur) dari
 * jabatan akademik (Asisten Ahli, Lektor, Lektor Kepala, Guru Besar).
 *
 * MASALAH SEBELUMNYA: kolom jabatan_akademik dipakai buat dua hal
 * sekaligus. Kalau diisi "Kaprodi", info pangkat akademik aslinya
 * (misal "Lektor") jadi hilang dari tampilan. Padahal satu dosen bisa
 * punya jabatan akademik SEKALIGUS jabatan struktural di waktu
 * bersamaan (contoh: Bu Siti adalah Lektor yang juga menjabat Kaprodi).
 *
 * SOLUSI: tambah kolom baru jabatan_struktural, terpisah dari
 * jabatan_akademik yang sudah ada. Kolom lama TIDAK diubah/dihapus,
 * jadi data yang sudah terisi sebelumnya tetap aman.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dosen_biodatas', function (Blueprint $table) {
            $table->string('jabatan_struktural')->nullable()->after('jabatan_akademik');
        });
    }

    public function down(): void
    {
        Schema::table('dosen_biodatas', function (Blueprint $table) {
            $table->dropColumn('jabatan_struktural');
        });
    }
};