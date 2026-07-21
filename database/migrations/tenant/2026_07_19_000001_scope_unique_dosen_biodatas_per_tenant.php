<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Migration: ubah constraint unique di dosen_biodatas dari global
 * jadi per-tenant (per prodi).
 *
 * FIX (percobaan ke-2): migration sebelumnya gagal karena index
 * dosen_biodatas_nip_unique dan dosen_biodatas_nidn_unique ternyata
 * SUDAH TERHAPUS duluan sebagai efek samping dari migration
 * "make_nip_nidn_nullable" (mekanisme doctrine/dbal saat ->change()
 * kadang tidak mempertahankan index unique lama kalau tidak
 * dideklarasikan ulang di baris yang sama).
 *
 * Migration ini sekarang CEK DULU index mana yang beneran masih ada
 * lewat SHOW INDEX, baru hapus yang memang ada. Jadi aman dijalankan
 * berapa kali pun tanpa error "index doesn't exist".
 */
return new class extends Migration
{
    public function up(): void
    {
        $existingIndexes = collect(DB::select('SHOW INDEX FROM dosen_biodatas'))
            ->pluck('Key_name')
            ->unique()
            ->toArray();

        // Hapus index unique lama (global) — HANYA kalau memang masih ada
        Schema::table('dosen_biodatas', function (Blueprint $table) use ($existingIndexes) {
            if (in_array('dosen_biodatas_nip_unique', $existingIndexes)) {
                $table->dropUnique('dosen_biodatas_nip_unique');
            }
        });

        Schema::table('dosen_biodatas', function (Blueprint $table) use ($existingIndexes) {
            if (in_array('dosen_biodatas_nidn_unique', $existingIndexes)) {
                $table->dropUnique('dosen_biodatas_nidn_unique');
            }
        });

        Schema::table('dosen_biodatas', function (Blueprint $table) use ($existingIndexes) {
            if (in_array('dosen_biodatas_email_unique', $existingIndexes)) {
                $table->dropUnique('dosen_biodatas_email_unique');
            }
        });

        // Refresh daftar index (karena baru saja ada yang dihapus di atas)
        $existingIndexes = collect(DB::select('SHOW INDEX FROM dosen_biodatas'))
            ->pluck('Key_name')
            ->unique()
            ->toArray();

        // Tambah composite unique per tenant — HANYA kalau belum ada
        Schema::table('dosen_biodatas', function (Blueprint $table) use ($existingIndexes) {
            if (!in_array('dosen_biodatas_tenant_nip_unique', $existingIndexes)) {
                $table->unique(['tenant_id', 'nip'], 'dosen_biodatas_tenant_nip_unique');
            }
        });

        Schema::table('dosen_biodatas', function (Blueprint $table) use ($existingIndexes) {
            if (!in_array('dosen_biodatas_tenant_nidn_unique', $existingIndexes)) {
                $table->unique(['tenant_id', 'nidn'], 'dosen_biodatas_tenant_nidn_unique');
            }
        });

        Schema::table('dosen_biodatas', function (Blueprint $table) use ($existingIndexes) {
            if (!in_array('dosen_biodatas_tenant_email_unique', $existingIndexes)) {
                $table->unique(['tenant_id', 'email'], 'dosen_biodatas_tenant_email_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dosen_biodatas', function (Blueprint $table) {
            $table->dropUnique('dosen_biodatas_tenant_nip_unique');
            $table->dropUnique('dosen_biodatas_tenant_nidn_unique');
            $table->dropUnique('dosen_biodatas_tenant_email_unique');

            $table->unique(['nip']);
            $table->unique(['nidn']);
            $table->unique(['email']);
        });
    }
};