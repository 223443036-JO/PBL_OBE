<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\AsesmenService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Command: php artisan recalc:capaian-tro
 *
 * Membersihkan lalu MENGHITUNG ULANG capaian_cpls & capaian_ieas untuk
 * mahasiswa TRO tertentu, dari nilai_mahasiswas yang SUDAH ADA di database
 * (tidak mengubah nilai mentah quiz/tugas/project/uts/uas sama sekali).
 *
 * KENAPA PERLU INI:
 * Sebelumnya RPS Fisika Dasar (id 4031) punya tahun_akademik '2023/2024',
 * beda sendiri dari matkul semester 1 lain yang '2022/2023'. Karena
 * capaian_cpls disimpan per kombinasi (mahasiswa, cpl, semester,
 * tahun_akademik), ini bikin data semester 1 "pecah" jadi 2 baris berbeda
 * untuk CPL yang sama -- yang bikin radar chart (sum lintas baris) dan
 * tabel detail (ambil 1 baris acak) jadi tidak konsisten.
 *
 * Setelah tahun_akademik RPS Fisika Dasar dibetulkan jadi '2022/2023',
 * command ini menghapus baris capaian_cpls/capaian_ieas lama punya
 * mahasiswa ini (yang mungkin masih "pecah" dari sebelumnya), lalu
 * menghitung ulang dari nol dengan memanggil AsesmenService::hitungCapaian()
 * untuk SETIAP rps yang mahasiswa ini punya nilainya -- menggunakan
 * tahun_akademik ASLI dari tabel rps (bukan nilai hardcode), supaya hasilnya
 * benar-benar konsisten dengan data rps saat ini.
 *
 * AMAN dijalankan berkali-kali (idempotent): setiap run selalu hapus dulu
 * baris lama punya mahasiswa ini sebelum hitung ulang, jadi tidak akan
 * menumpuk duplikat.
 */
class RecalculateCapaianTro extends Command
{
    protected $signature = 'recalc:capaian-tro {mahasiswa_id=4005 : ID mahasiswa yang mau dihitung ulang}';
    protected $description = 'Hapus & hitung ulang capaian_cpls + capaian_ieas untuk 1 mahasiswa TRO dari nilai_mahasiswas yang sudah ada';

    public function handle(): int
    {
        $tenant = Tenant::find('tro');
        if (!$tenant) {
            $this->error('Tenant tro tidak ditemukan.');
            return self::FAILURE;
        }
        tenancy()->initialize($tenant);

        $mahasiswaId = (int) $this->argument('mahasiswa_id');

        $mhs = DB::table('mahasiswas')->where('id', $mahasiswaId)->where('tenant_id', 'tro')->first();
        if (!$mhs) {
            $this->error("Mahasiswa id $mahasiswaId tidak ditemukan di tenant tro.");
            return self::FAILURE;
        }
        $this->info("Mahasiswa: {$mhs->nama} (NIM {$mhs->nim}, id {$mhs->id})");

        // --- 1. Bersihkan capaian lama punya mahasiswa ini ---
        $hapusCpl = DB::table('capaian_cpls')->where('mahasiswa_id', $mahasiswaId)->where('tenant_id', 'tro')->delete();
        $hapusIea = DB::table('capaian_ieas')->where('mahasiswa_id', $mahasiswaId)->where('tenant_id', 'tro')->delete();
        $this->line("Hapus $hapusCpl baris capaian_cpls lama, $hapusIea baris capaian_ieas lama.");

        // --- 2. Ambil semua RPS yang mahasiswa ini punya nilainya ---
        $rpsIds = DB::table('nilai_mahasiswas')
            ->where('mahasiswa_id', $mahasiswaId)
            ->where('tenant_id', 'tro')
            ->distinct()
            ->pluck('rps_id');

        if ($rpsIds->isEmpty()) {
            $this->warn('Mahasiswa ini belum punya nilai_mahasiswas sama sekali, tidak ada yang dihitung.');
            return self::SUCCESS;
        }

        $this->info('RPS yang akan dihitung ulang: ' . $rpsIds->implode(', '));

        // --- 3. Hitung ulang tiap RPS, pakai tahun_akademik ASLI dari tabel rps ---
        $asesmen = app(AsesmenService::class);

        foreach ($rpsIds as $rpsId) {
            $rps = DB::table('rps')->where('id', $rpsId)->where('tenant_id', 'tro')->first();
            if (!$rps) {
                $this->warn("SKIP RPS $rpsId -- data RPS tidak ditemukan (mungkin sudah dihapus).");
                continue;
            }

            $asesmen->hitungCapaian($mahasiswaId, $rpsId, $rps->tahun_akademik);
            $this->info("RPS $rpsId (TA {$rps->tahun_akademik}) selesai dihitung ulang.");
        }

        $this->newLine();
        $this->info("SELESAI. Capaian CPL/IEA untuk {$mhs->nama} sudah dihitung ulang dari awal,");
        $this->info('bebas dari duplikasi tahun_akademik. Cek hasilnya di menu Asesmen CPL > Rerata.');

        return self::SUCCESS;
    }
}
