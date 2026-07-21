<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Command: php artisan cek:rps-semester
 *
 * Diagnostik cepat: per semester (1-8), berapa banyak matkul yang SUDAH
 * punya RPS (bisa diisi nilai) vs yang BELUM. Dipakai buat nentuin matkul
 * mana aja yang perlu dibikinin RPS dulu supaya bisa demo capaian nilai
 * mahasiswa dari semester 1 sampai 8 di KTI.
 */
class CekRpsSemester extends Command
{
    protected $signature = 'cek:rps-semester';
    protected $description = 'Tampilkan status RPS per semester (1-8) -- matkul mana yang sudah/belum punya RPS';

    public function handle(): int
    {
        $tenant = Tenant::find('tro');
        if (!$tenant) {
            $this->error('Tenant tro tidak ditemukan.');
            return self::FAILURE;
        }
        tenancy()->initialize($tenant);

        $tenantId = 'tro';

        for ($semester = 1; $semester <= 8; $semester++) {
            $matkuls = DB::table('mata_kuliahs')
                ->where('tenant_id', $tenantId)
                ->where('semester', $semester)
                ->orderBy('nama_mk')
                ->get();

            if ($matkuls->isEmpty()) {
                $this->line("Semester $semester: tidak ada matkul terdaftar sama sekali.");
                $this->newLine();
                continue;
            }

            $sudahAdaRps = DB::table('rps')
                ->where('tenant_id', $tenantId)
                ->whereIn('mata_kuliah_id', $matkuls->pluck('id'))
                ->pluck('mata_kuliah_id')
                ->toArray();

            $this->info("=== Semester $semester ({$matkuls->count()} matkul) ===");
            foreach ($matkuls as $mk) {
                $status = in_array($mk->id, $sudahAdaRps) ? '<fg=green>✓ SUDAH ada RPS</>' : '<fg=red>✗ BELUM ada RPS</>';
                $this->line("  [{$mk->kode_mk}] {$mk->nama_mk}  -  " . $status);
            }
            $this->newLine();
        }

        return self::SUCCESS;
    }
}