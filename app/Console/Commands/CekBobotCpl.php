<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Command: php artisan cek:bobot-cpl {kode_cpl?}
 *
 * Menampilkan tabel bobot (SKS matkul ÷ total SKS grup CPL) per pasangan
 * matkul-IK, persis seperti kolom "BOBOT MATA KULIAH" di sheet
 * 'Evaluasi IK-Proses' pada Excel acuan dosen pembimbing -- supaya bisa
 * dibandingkan langsung angka per angka.
 *
 * CONTOH PAKAI:
 *   php artisan cek:bobot-cpl          -> tampilkan SEMUA CPL (A-I)
 *   php artisan cek:bobot-cpl C        -> tampilkan cuma CPL-C
 */
class CekBobotCpl extends Command
{
    protected $signature = 'cek:bobot-cpl {kode_cpl? : Huruf CPL, mis. C (kosongkan untuk semua)}';
    protected $description = 'Tampilkan tabel bobot matkul per IK, dikelompokkan per CPL, buat dibandingkan sama Excel acuan';

    public function handle(): int
    {
        $tenant = Tenant::find('tro');
        if (!$tenant) {
            $this->error('Tenant tro tidak ditemukan.');
            return self::FAILURE;
        }
        tenancy()->initialize($tenant);

        $filterKode = $this->argument('kode_cpl');
        $tenantId = 'tro';

        $cpls = DB::table('cpls')
            ->where('tenant_id', $tenantId)
            ->orderBy('kode')
            ->get();

        foreach ($cpls as $cpl) {
            $hurufCpl = substr($cpl->kode, -1); // 'CPL-C' -> 'C'
            if ($filterKode && strtoupper($filterKode) !== strtoupper($hurufCpl)) {
                continue;
            }

            $siblingIkIds = DB::table('indikator_kinerjas')
                ->where('cpl_id', $cpl->id)
                ->where('tenant_id', $tenantId)
                ->pluck('id');

            if ($siblingIkIds->isEmpty()) {
                continue;
            }

            // Semua pasangan (matkul, IK) unik dalam grup CPL ini
            $pairs = DB::table('cpmk_indikator_kinerja as cik')
                ->join('cpmks as c', 'c.id', '=', 'cik.cpmk_id')
                ->join('mata_kuliahs as mk', 'mk.id', '=', 'c.mata_kuliah_id')
                ->join('indikator_kinerjas as ik', 'ik.id', '=', 'cik.indikator_kinerja_id')
                ->whereIn('cik.indikator_kinerja_id', $siblingIkIds)
                ->where('cik.tenant_id', $tenantId)
                ->where('c.tenant_id', $tenantId)
                ->where('mk.tenant_id', $tenantId)
                ->select('mk.id as mk_id', 'mk.nama_mk', 'mk.sks', 'ik.kode as ik_kode')
                ->distinct()
                ->orderBy('ik.kode')
                ->orderBy('mk.nama_mk')
                ->get();

            $totalSks = $pairs->sum('sks');

            $this->info("=== {$cpl->kode} (total SKS grup: {$totalSks}) ===");

            if ($totalSks == 0) {
                $this->warn('Belum ada matkul yang mapping ke CPL ini.');
                $this->newLine();
                continue;
            }

            $rows = [];
            foreach ($pairs as $p) {
                $bobot = $p->sks / $totalSks;
                $rows[] = [
                    $p->nama_mk,
                    "({$p->ik_kode})",
                    $p->sks,
                    number_format($bobot * 100, 2) . '%',
                ];
            }

            $this->table(['Mata Kuliah', 'Kode IK', 'SKS', 'Bobot'], $rows);
            $this->newLine();
        }

        return self::SUCCESS;
    }
}
