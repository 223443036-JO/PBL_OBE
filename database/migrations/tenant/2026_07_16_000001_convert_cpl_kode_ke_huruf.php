<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Migration sekali jalan: convert semua kode CPL yang masih format
 * angka ("CPL-1", "CPL-02", dst) jadi format huruf ("CPL-A", "CPL-B", dst).
 *
 * PENTING: karena arsitektur sistem sekarang single database dengan
 * banyak tenant (prodi) dalam satu tabel yang sama, konversi ini
 * dilakukan PER TENANT. Artinya penomoran huruf dimulai dari A lagi
 * untuk setiap prodi, tidak nyambung lintas prodi. Ini supaya urutan
 * CPL di prodi TRO tidak tercampur sama urutan CPL prodi TRIN dst.
 *
 * Urutan huruf mengikuti urutan `id` (urutan CPL dibuat), bukan
 * urutan kode lama, supaya konsisten dan bisa diprediksi.
 *
 * Migration ini AMAN dijalankan berkali-kali (idempotent) karena
 * hasil akhirnya selalu sama asal data CPL tidak berubah di antara
 * dua kali run.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Ambil semua tenant_id yang punya data CPL
        $tenantIds = DB::table('cpls')->distinct()->pluck('tenant_id');

        foreach ($tenantIds as $tenantId) {
            $cpls = DB::table('cpls')
                ->where('tenant_id', $tenantId)
                ->orderBy('id', 'asc')
                ->get();

            foreach ($cpls as $index => $cpl) {
                $kodeBaru = 'CPL-' . $this->generateKodeHuruf($index + 1);

                DB::table('cpls')
                    ->where('id', $cpl->id)
                    ->update(['kode' => $kodeBaru]);
            }
        }
    }

    public function down(): void
    {
        // Sengaja tidak ada rollback otomatis, karena kode angka
        // aslinya sudah tertimpa dan tidak disimpan di tempat lain.
        // Kalau perlu balik ke angka, lakukan manual lewat form
        // Kelola CPL, atau restore dari backup database sebelum
        // migration ini dijalankan.
    }

    /**
     * Sama persis dengan fungsi di CplController.php, supaya hasil
     * konversi data lama konsisten dengan kode yang dipakai untuk
     * generate CPL baru ke depannya.
     */
    private function generateKodeHuruf(int $angka): string
    {
        $kode = '';

        while ($angka > 0) {
            $angka--;
            $kode  = chr(65 + ($angka % 26)) . $kode;
            $angka = intdiv($angka, 26);
        }

        return $kode;
    }
};