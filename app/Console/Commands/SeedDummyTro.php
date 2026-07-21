<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\AsesmenService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Command: php artisan seed:dummy-tro
 *
 * Mengisi nilai dummy untuk mahasiswa TRO yang SUDAH ADA di database
 * (tidak membuat mahasiswa baru), sesuai instruksi dosen pembimbing.
 *
 * MAHASISWA YANG DIPAKAI: Abrar Zuhdi Akbar, NIM 220441001, id 4005
 * (kalau mau ganti, ubah nilai konstanta MAHASISWA_ID di bawah)
 *
 * Mahasiswa ini SUDAH PUNYA nilai ASLI untuk 5 dari 21 matkul (Matematika 1,
 * Fisika Dasar, Fisika Terapan Otomasi 1, Matematika 2, Fisika Terapan
 * Otomasi 2 / rps_id 4023, 4031, 4032, 4033, 4043). Command ini SENGAJA
 * TIDAK menyentuh 5 matkul itu -- cuma mengisi 16 matkul sisanya yang
 * RPS-nya sudah ada tapi mahasiswa ini belum punya nilai.
 *
 * PENTING -- catat di laporan TA: hitungDanSimpanCpl() menggabungkan SEMUA
 * matkul dalam 1 semester jadi satu angka capaian CPL/IK. Begitu 16 matkul
 * dummy ini masuk, angka CPL untuk mahasiswa ini jadi CAMPURAN nilai asli +
 * simulasi, dan sistem TIDAK menyimpan penanda mana asli mana dummy.
 */
class SeedDummyTro extends Command
{
    protected $signature = 'seed:dummy-tro';
    protected $description = 'Isi nilai dummy untuk mahasiswa TRO yang sudah ada (16 matkul yang belum ada nilainya)';

    const MAHASISWA_ID = 4005; // Abrar Zuhdi Akbar, NIM 220441001
    const TAHUN_AKADEMIK = '2022/2023';

    public function handle(): int
    {
        $tenant = Tenant::find('tro');
        if (!$tenant) {
            $this->error('Tenant tro tidak ditemukan.');
            return self::FAILURE;
        }
        tenancy()->initialize($tenant);

        $mahasiswaId = self::MAHASISWA_ID;

        $mhs = DB::table('mahasiswas')->where('id', $mahasiswaId)->where('tenant_id', 'tro')->first();
        if (!$mhs) {
            $this->error("Mahasiswa id $mahasiswaId tidak ditemukan di tenant tro.");
            return self::FAILURE;
        }
        $this->info("Pakai mahasiswa: {$mhs->nama} (NIM {$mhs->nim}, id {$mhs->id})");

        $rpsSudahAda = DB::table('nilai_mahasiswas')
            ->where('mahasiswa_id', $mahasiswaId)
            ->where('tenant_id', 'tro')
            ->distinct()
            ->pluck('rps_id')
            ->toArray();
        $this->info('Matkul yang SUDAH punya nilai asli (tidak akan ditimpa): ' . implode(', ', $rpsSudahAda));

        // Data nilai mentah dummy per RPS -> cpmk_id => [quiz, tugas, project, uts, uas]
        // Cakupan: 16 matkul (dari 21 yang punya RPS) yang BELUM ada nilainya
        // untuk mahasiswa ini.
        $dataNilai = [
            4025 => [ // Praktik Gambar Teknik Otomasi (sem 1)
                3001 => [79, 96, 85, 96, 92],
                3002 => [81, 85, 75, 67, 72],
                3003 => [95, 92, 90, 86, 88],
                3004 => [73, 72, 82, 73, 81],
            ],
            4026 => [ // Praktik Logika & Pemrograman Komputer (sem 1)
                3005 => [79, 72, 85, 88, 74],
                3006 => [74, 89, 81, 83, 90],
                3007 => [68, 67, 73, 75, 68],
                3008 => [70, 79, 75, 81, 78],
            ],
            4027 => [ // Praktik Metrologi Otomasi (sem 1)
                3009 => [76, 76, 71, 73, 67],
                4045 => [84, 96, 86, 84, 93],
                4046 => [80, 89, 79, 82, 73],
                4047 => [68, 77, 79, 75, 69],
            ],
            4028 => [ // Praktik Elektronika Otomasi Industri (sem 1)
                4051 => [84, 76, 72, 81, 78],
                4052 => [94, 84, 88, 84, 87],
                4053 => [94, 85, 95, 90, 95],
            ],
            4029 => [ // Elektronika Otomasi Industri (sem 1)
                4054 => [83, 79, 76, 88, 87],
                4055 => [63, 65, 66, 67, 75],
                4056 => [81, 91, 91, 93, 95],
                4057 => [85, 68, 71, 85, 76],
            ],
            4034 => [ // Elemen Mesin (sem 2)
                4073 => [72, 86, 77, 78, 85],
                4074 => [83, 70, 84, 84, 81],
                4075 => [82, 80, 73, 70, 70],
                4076 => [94, 92, 94, 94, 95],
            ],
            4035 => [ // Proses Manufaktur 1 (sem 2)
                4077 => [64, 62, 73, 71, 64],
                4078 => [73, 73, 84, 81, 71],
                4079 => [78, 81, 87, 80, 75],
                4080 => [91, 77, 75, 91, 74],
            ],
            4036 => [ // Praktik Digital dan Mikrokontroler (sem 2)
                4081 => [69, 67, 75, 77, 77],
                4082 => [78, 67, 71, 78, 66],
                4083 => [80, 86, 81, 85, 89],
                4084 => [96, 85, 87, 90, 87],
            ],
            4037 => [ // Praktik Proses Manufaktur 1 (sem 2)
                4085 => [79, 78, 62, 71, 62],
                4086 => [79, 76, 77, 77, 66],
                4087 => [77, 63, 66, 63, 63],
                4088 => [88, 93, 84, 99, 88],
            ],
            4038 => [ // Praktik Gambar Teknik Mesin & CAD (sem 2)
                4089 => [79, 80, 91, 96, 96],
                4090 => [86, 84, 82, 86, 83],
                4091 => [80, 72, 77, 82, 78],
                4092 => [62, 76, 80, 65, 64],
            ],
            4039 => [ // Olahraga (sem 2)
                4093 => [83, 93, 85, 81, 88],
                4094 => [69, 73, 71, 67, 76],
            ],
            4040 => [ // Matematika Terapan Otomasi / Matematika 3 (sem 3)
                4095 => [86, 93, 77, 94, 86],
                4096 => [84, 85, 89, 84, 84],
                4097 => [81, 85, 86, 83, 87],
            ],
            4041 => [ // Matematika Numerik (sem 3)
                4098 => [74, 82, 81, 74, 67],
                4099 => [75, 70, 63, 62, 72],
                4100 => [72, 69, 78, 81, 77],
            ],
            4042 => [ // Kimia Dasar (sem 3)
                4101 => [77, 80, 79, 81, 94],
                4102 => [72, 79, 78, 65, 74],
                4103 => [65, 73, 75, 65, 75],
                4104 => [73, 69, 77, 83, 79],
            ],
            4044 => [ // Kendali Motor Listrik (sem 3)
                4109 => [66, 72, 70, 68, 62],
                4110 => [79, 84, 80, 85, 78],
                4111 => [63, 68, 65, 78, 68],
            ],
            4045 => [ // matkul RPS ke-21 (cek nama sesuai kode_mk 3022 di aplikasi)
                4112 => [64, 74, 72, 71, 74],
                4113 => [95, 82, 91, 97, 85],
                4114 => [69, 81, 68, 84, 85],
                4115 => [87, 92, 94, 83, 91],
            ],
        ];

        $asesmen = app(AsesmenService::class);

        foreach ($dataNilai as $rpsId => $cpmkScores) {
            if (in_array($rpsId, $rpsSudahAda)) {
                $this->line("SKIP RPS $rpsId -- mahasiswa ini sudah punya nilai asli untuk matkul ini.");
                continue;
            }

            foreach ($cpmkScores as $cpmkId => $scores) {
                [$quiz, $tugas, $project, $uts, $uas] = $scores;

                DB::table('nilai_mahasiswas')->insert([
                    'mahasiswa_id'     => $mahasiswaId,
                    'cpmk_id'          => $cpmkId,
                    'rps_id'           => $rpsId,
                    'quiz'             => $quiz,
                    'tugas'            => $tugas,
                    'project'          => $project,
                    'uts'              => $uts,
                    'uas'              => $uas,
                    'nilai_akhir_cpmk' => 0,
                    'tenant_id'        => 'tro',
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);
            }

            $asesmen->hitungCapaian($mahasiswaId, $rpsId, self::TAHUN_AKADEMIK);
            $this->info("RPS $rpsId selesai diisi & dihitung (CPMK, IK, CPL, IEA).");
        }

        $this->newLine();
        $this->info("SELESAI. Mahasiswa id={$mahasiswaId} ({$mhs->nama}) sekarang punya nilai untuk");
        $this->info('21 matkul (5 asli + 16 simulasi) dan capaian CPL/IEA sudah dihitung ulang.');
        $this->info('Cek hasilnya di menu Asesmen CPL > Rerata.');

        return self::SUCCESS;
    }
}
