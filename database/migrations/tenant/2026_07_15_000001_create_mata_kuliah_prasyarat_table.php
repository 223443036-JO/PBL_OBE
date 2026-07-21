<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Migration: ubah prasyarat mata kuliah dari relasi tunggal (1 FK)
 * jadi relasi many-to-many lewat tabel pivot.
 *
 * MASALAH SEBELUMNYA: kolom prasyarat_id di mata_kuliahs cuma bisa
 * nyimpen SATU prasyarat, padahal di RPS satu MK bisa punya banyak
 * prasyarat sekaligus (contoh: Ekonomi Teknik butuh 3 prasyarat).
 *
 * SOLUSI: bikin tabel pivot mata_kuliah_prasyarat, lalu migrasikan
 * data lama (kolom prasyarat_id yang sudah terisi) ke tabel baru ini
 * supaya tidak ada data yang hilang.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mata_kuliah_prasyarat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliahs')->onDelete('cascade');
            $table->foreignId('prasyarat_id')->constrained('mata_kuliahs')->onDelete('cascade');
            $table->string('tenant_id');
            $table->timestamps();

            $table->unique(['mata_kuliah_id', 'prasyarat_id', 'tenant_id'], 'mk_prasyarat_unique');
        });

        // Migrasikan data lama dari kolom prasyarat_id (single FK)
        // ke tabel pivot baru, supaya prasyarat yang sudah diinput
        // sebelumnya tidak hilang begitu saja.
        $existingData = DB::table('mata_kuliahs')
            ->whereNotNull('prasyarat_id')
            ->select('id', 'prasyarat_id', 'tenant_id')
            ->get();

        foreach ($existingData as $row) {
            DB::table('mata_kuliah_prasyarat')->insert([
                'mata_kuliah_id' => $row->id,
                'prasyarat_id'   => $row->prasyarat_id,
                'tenant_id'      => $row->tenant_id,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }

        // Kolom lama TIDAK dihapus dulu, dibiarkan ada tapi tidak
        // dipakai lagi di kode. Ini jaga-jaga kalau ternyata masih
        // ada bagian lain yang bergantung padanya. Bisa dihapus nanti
        // lewat migration terpisah setelah dipastikan aman.
    }

    public function down(): void
    {
        Schema::dropIfExists('mata_kuliah_prasyarat');
    }
};