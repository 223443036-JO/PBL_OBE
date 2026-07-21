<?php

namespace App\Services;

use App\Models\NilaiMahasiswa;
use App\Models\CapaianCpl;
use App\Models\CapaianIea;
use Illuminate\Support\Facades\DB;

class AsesmenService
{
    /**
     * Entry point utama.
     * Panggil ini setiap kali dosen selesai input nilai mahasiswa.
     */
    public function hitungCapaian(int $mahasiswaId, int $rpsId, string $tahunAkademik): void
    {
        DB::transaction(function () use ($mahasiswaId, $rpsId, $tahunAkademik) {
            $this->hitungNilaiCpmk($mahasiswaId, $rpsId);
            $nilaiPerIk = $this->hitungNilaiIk($mahasiswaId, $rpsId);
            $this->hitungDanSimpanCpl($mahasiswaId, $rpsId, $nilaiPerIk, $tahunAkademik);
            $this->hitungDanSimpanIea($mahasiswaId, $tahunAkademik);
        });
    }

    // =============================================================
    // FIX #1 — hitungNilaiCpmk()
    //
    // BUG LAMA: dibagi langsung 100, padahal total bobot per CPMK
    // tidak selalu = 100. Kalau dosen input 5+5+10 = 20, hasilnya
    // 1.21 bukan 81.5.
    //
    // PERBAIKAN: bagi dengan total_bobot AKTUAL per CPMK, lalu x100.
    // Hasilnya selalu skala 0-100 (Norm CLO) sesuai rumus Excel.
    // =============================================================
    private function hitungNilaiCpmk(int $mahasiswaId, int $rpsId): void
    {
        $tenantId = tenant('id');

        $rows = DB::table('nilai_mahasiswas')
            ->join('rps_penilaians', function ($j) use ($rpsId) {
                $j->on('rps_penilaians.cpmk_id', '=', 'nilai_mahasiswas.cpmk_id')
                  ->where('rps_penilaians.rps_id', $rpsId);
            })
            ->where('nilai_mahasiswas.mahasiswa_id', $mahasiswaId)
            ->where('nilai_mahasiswas.rps_id', $rpsId)
            ->where('nilai_mahasiswas.tenant_id', $tenantId)
            ->select(
                'nilai_mahasiswas.id',
                DB::raw('(
                    nilai_mahasiswas.quiz    * rps_penilaians.quiz    +
                    nilai_mahasiswas.tugas   * rps_penilaians.tugas   +
                    nilai_mahasiswas.project * rps_penilaians.project +
                    nilai_mahasiswas.uts     * rps_penilaians.uts     +
                    nilai_mahasiswas.uas     * rps_penilaians.uas
                ) AS nilai_weighted'),
                DB::raw('(
                    rps_penilaians.quiz    +
                    rps_penilaians.tugas   +
                    rps_penilaians.project +
                    rps_penilaians.uts     +
                    rps_penilaians.uas
                ) AS total_bobot')
            )
            ->get();

        foreach ($rows as $row) {
            $nilaiAkhir = ($row->total_bobot > 0)
                ? round(($row->nilai_weighted / $row->total_bobot), 2)
                : 0;

            DB::table('nilai_mahasiswas')
                ->where('id', $row->id)
                ->update(['nilai_akhir_cpmk' => $nilaiAkhir]);
        }
    }

    // =============================================================
    // FIX #11 (baru) — totalSksUntukCpl()
    //
    // TEMUAN dari pencocokan dengan Excel acuan dosen pembimbing:
    // Sebelumnya $totalSks dihitung PER-IK sendiri-sendiri (mis. C-1
    // dinormalisasi ke 100% sendiri, C-2 sendiri, C-3 sendiri), lalu
    // ketiganya DIJUMLAHKAN ke level CPL -- ini bisa bikin 1 CPL
    // secara matematis tembus 300% (kalau CPL itu punya 3 IK anak).
    //
    // Formula asli di Excel (sheet 'Sem 1' dst, kolom final per-CPL,
    // mis. AI5 utk CPL-C) menjumlahkan LANGSUNG semua kontribusi
    // matkul yang menuju SEMUA IK anak CPL itu (C-1, C-2, C-3
    // digabung jadi SATU kelompok pembagi), bukan per-IK terpisah.
    // Terbukti dari total bobot per CPL lintas 8 semester di Excel
    // yang semuanya <= 1.0 (tidak pernah lebih dari 100%).
    //
    // PERBAIKAN: totalSks sekarang dihitung dari SKS semua matkul
    // yang menuju IK MANAPUN yang jadi anak dari CPL yang sama
    // dengan $ikId -- bukan cuma matkul yang menuju $ikId itu sendiri.
    // =============================================================
    private function totalSksUntukCpl(int $ikId, string $tenantId): float
    {
        $cplId = DB::table('indikator_kinerjas')
            ->where('id', $ikId)
            ->where('tenant_id', $tenantId)
            ->value('cpl_id');

        if (!$cplId) return 0;

        $siblingIkIds = DB::table('indikator_kinerjas')
            ->where('cpl_id', $cplId)
            ->where('tenant_id', $tenantId)
            ->pluck('id');

        // PENTING (dikoreksi setelah cek ulang formula sumber di Excel):
        // TIDAK dedup per matkul. Kalau 1 matkul mapping ke 2 IK berbeda
        // dalam CPL yang sama (mis. matkul X menuju C-1 DAN C-3), SKS
        // matkul itu dihitung 2x -- sekali buat tiap IK yang dia tuju.
        // Ini persis formula J2 = F2 / VLOOKUP(B2,$H$2:$I$325,2) di sheet
        // 'Evaluasi IK-Proses', di mana total SKS per grup CPL (kolom I)
        // dijumlahkan dari SEMUA baris (matkul, IK), bukan dari matkul unik.
        $pairs = DB::table('cpmk_indikator_kinerja as cik')
            ->join('cpmks as c', 'c.id', '=', 'cik.cpmk_id')
            ->join('mata_kuliahs as mk', 'mk.id', '=', 'c.mata_kuliah_id')
            ->whereIn('cik.indikator_kinerja_id', $siblingIkIds)
            ->where('cik.tenant_id', $tenantId)
            ->where('c.tenant_id', $tenantId)
            ->where('mk.tenant_id', $tenantId)
            ->select('mk.id as mk_id', 'mk.sks as sks', 'cik.indikator_kinerja_id')
            ->distinct() // dedup per (matkul, IK) -- bukan per matkul saja
            ->get();

        return (float) $pairs->sum('sks');
    }

    // =============================================================
    // FIX #2 — hitungNilaiIk()
    //
    // BUG LAMA: setiap CPMK langsung di-accumulate dengan bobot
    // yang sama — kalau 1 MK punya 2 CPMK ke IK yang sama,
    // bobot dikali 2x, nilai IK jadi 2x lipat (double-count).
    //
    // BUG BARU (arsitektur single DB): totalSks dan mappings tidak
    // filter tenant_id, menghitung SKS dari semua 4 prodi sekaligus.
    //
    // PERBAIKAN:
    // 1. Kelompokkan CPMK per IK dalam MK yang sama, rata-rata dulu
    //    baru kali bobot. Sesuai penjelasan Mas Cepi.
    // 2. Tambah where('tenant_id') di semua query.
    // 3. (FIX #11) totalSks sekarang di level CPL, lihat
    //    totalSksUntukCpl() di atas.
    // =============================================================
    private function hitungNilaiIk(int $mahasiswaId, int $rpsId): array
    {
        $tenantId  = tenant('id');
        $rps       = DB::table('rps')->where('id', $rpsId)->first();
        $sksMatkul = DB::table('mata_kuliahs')
                        ->where('id', $rps->mata_kuliah_id)
                        ->where('tenant_id', $tenantId)
                        ->value('sks');

        $nilaiCpmk = DB::table('nilai_mahasiswas')
                        ->where('mahasiswa_id', $mahasiswaId)
                        ->where('rps_id', $rpsId)
                        ->where('tenant_id', $tenantId)
                        ->pluck('nilai_akhir_cpmk', 'cpmk_id');

        $mappings = DB::table('cpmk_indikator_kinerja as cik')
            ->join('cpmks as c', 'c.id', '=', 'cik.cpmk_id')
            ->where('c.mata_kuliah_id', $rps->mata_kuliah_id)
            ->where('cik.tenant_id', $tenantId)
            ->where('c.tenant_id', $tenantId)
            ->select('cik.cpmk_id', 'cik.indikator_kinerja_id')
            ->get();

        // Langkah 1: kelompokkan nilai CPMK per IK dalam MK ini
        $cpmkPerIk = [];
        foreach ($mappings as $map) {
            $cpmkPerIk[$map->indikator_kinerja_id][] = $nilaiCpmk[$map->cpmk_id] ?? 0;
        }

        $nilaiPerIk = [];
        foreach ($cpmkPerIk as $ikId => $nilaiList) {

            // FIX #11: total SKS sekarang di level CPL (semua IK anak
            // digabung), bukan per-IK sendiri-sendiri
            $totalSks = $this->totalSksUntukCpl((int) $ikId, $tenantId);

            if ($totalSks == 0) continue;

            // Langkah 2: rata-rata CPMK dalam MK ini untuk IK tsb
            $avgNilaiCpmk = array_sum($nilaiList) / count($nilaiList);

            // Langkah 3: bobot = SKS MK ini / total SKS semua MK pendukung CPL ini
            $bobot = $sksMatkul / $totalSks;

            // Langkah 4: akumulasi kontribusi (weighted sum)
            $nilaiPerIk[$ikId] = ($nilaiPerIk[$ikId] ?? 0) + ($avgNilaiCpmk * $bobot);
        }

        return $nilaiPerIk;
    }

    // =============================================================
    // FIX #3 + FIX #10 — hitungDanSimpanCpl()
    //
    // BUG LAMA #3: nilai CPL = rata-rata(IK), sudah difix jadi sum.
    //
    // BUG #10 (akumulasi lintas MK):
    // Fungsi ini dipanggil PER mata kuliah (per rpsId). $nilaiPerIk
    // hanya berisi kontribusi IK dari satu MK saja. Kalau dua MK
    // berbeda sama-sama menyumbang ke CPL yang sama lewat IK berbeda,
    // nilai CPL MK pertama DITIMPA MK kedua (bukan dijumlahkan).
    //
    // Contoh: MK Matematika ke IK-C1, simpan nilaiCpl = 24.5
    //         MK Fisika ke IK-C2, TIMPA dengan nilaiCpl = 18.3
    //         Hasil = 18.3, padahal harusnya 24.5 + 18.3 = 42.8
    //
    // PERBAIKAN: sebelum simpan, recalculate nilai CPL dari SEMUA MK
    // di semester yang sama yang sudah punya nilai untuk mahasiswa ini.
    // =============================================================
    private function hitungDanSimpanCpl(
        int $mahasiswaId, int $rpsId, array $nilaiPerIk, string $tahunAkademik
    ): void {
        $tenantId = tenant('id');
        $rps      = DB::table('rps')->where('id', $rpsId)->first();
        $semester = DB::table('mata_kuliahs')
                        ->where('id', $rps->mata_kuliah_id)
                        ->where('tenant_id', $tenantId)
                        ->value('semester');

        // Ambil SEMUA RPS di semester yang sama dari prodi aktif
        $semuaRpsIdSemester = DB::table('rps')
            ->join('mata_kuliahs', 'mata_kuliahs.id', '=', 'rps.mata_kuliah_id')
            ->where('mata_kuliahs.semester', $semester)
            ->where('mata_kuliahs.tenant_id', $tenantId)
            ->where('rps.tenant_id', $tenantId)
            ->pluck('rps.id');

        // Recalculate kontribusi IK dari SEMUA MK di semester ini
        $semuaNilaiPerIk = [];

        foreach ($semuaRpsIdSemester as $thisRpsId) {
            $thisRps = DB::table('rps')->where('id', $thisRpsId)->first();
            $thisMk  = DB::table('mata_kuliahs')
                ->where('id', $thisRps->mata_kuliah_id)
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$thisMk) continue;

            $nilaiCpmkMk = DB::table('nilai_mahasiswas')
                ->where('mahasiswa_id', $mahasiswaId)
                ->where('rps_id', $thisRpsId)
                ->where('tenant_id', $tenantId)
                ->pluck('nilai_akhir_cpmk', 'cpmk_id');

            if ($nilaiCpmkMk->isEmpty()) continue;

            $mappings = DB::table('cpmk_indikator_kinerja as cik')
                ->join('cpmks as c', 'c.id', '=', 'cik.cpmk_id')
                ->where('c.mata_kuliah_id', $thisMk->id)
                ->where('cik.tenant_id', $tenantId)
                ->where('c.tenant_id', $tenantId)
                ->select('cik.cpmk_id', 'cik.indikator_kinerja_id')
                ->get();

            $cpmkPerIkMk = [];
            foreach ($mappings as $map) {
                $cpmkPerIkMk[$map->indikator_kinerja_id][] =
                    $nilaiCpmkMk[$map->cpmk_id] ?? 0;
            }

            foreach ($cpmkPerIkMk as $ikId => $nilaiList) {
                // FIX #11: total SKS di level CPL (lihat totalSksUntukCpl())
                $totalSks = $this->totalSksUntukCpl((int) $ikId, $tenantId);

                if ($totalSks == 0) continue;

                $avgNilai = array_sum($nilaiList) / count($nilaiList);
                $bobot    = $thisMk->sks / $totalSks;
                $semuaNilaiPerIk[$ikId] = ($semuaNilaiPerIk[$ikId] ?? 0) + ($avgNilai * $bobot);
            }
        }

        if (empty($semuaNilaiPerIk)) return;

        $cplIds = DB::table('indikator_kinerjas')
                    ->whereIn('id', array_keys($semuaNilaiPerIk))
                    ->where('tenant_id', $tenantId)
                    ->pluck('cpl_id')
                    ->unique();

        foreach ($cplIds as $cplId) {
            $ikMilikCpl = DB::table('indikator_kinerjas')
                            ->where('cpl_id', $cplId)
                            ->where('tenant_id', $tenantId)
                            ->pluck('id');

            $nilaiList = [];
            foreach ($ikMilikCpl as $ikId) {
                if (isset($semuaNilaiPerIk[$ikId])) {
                    $nilaiList[] = $semuaNilaiPerIk[$ikId];
                }
            }
            if (empty($nilaiList)) continue;

            $nilaiCpl = round(array_sum($nilaiList), 2);

            DB::table('capaian_cpls')->updateOrInsert(
                [
                    'mahasiswa_id'   => $mahasiswaId,
                    'cpl_id'         => $cplId,
                    'semester'       => $semester,
                    'tahun_akademik' => $tahunAkademik,
                    'tenant_id'      => $tenantId,
                ],
                [
                    'nilai'      => $nilaiCpl,
                    'tercapai'   => $nilaiCpl >= 55,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    // =============================================================
    // FIX #5 & #6 — hitungDanSimpanIea()
    //
    // BUG BARU (arsitektur single DB): query ieas tanpa filter tenant
    // → mahasiswa TRO dihitung pakai IEA milik TRIN, TRMO, TRSA.
    //
    // PERBAIKAN: tambah where('tenant_id') di semua query.
    // Logika rata-rata CPL per IEA tidak diubah, sudah benar.
    // =============================================================
    private function hitungDanSimpanIea(int $mahasiswaId, string $tahunAkademik): void
    {
        $tenantId = tenant('id');

        $semesters = DB::table('capaian_cpls')
            ->where('mahasiswa_id', $mahasiswaId)
            ->where('tahun_akademik', $tahunAkademik)
            ->where('tenant_id', $tenantId)
            ->pluck('semester')
            ->unique();

        // FIX: hanya IEA milik prodi aktif
        $ieaIds = DB::table('ieas')
                    ->where('tenant_id', $tenantId)
                    ->pluck('id');

        foreach ($semesters as $semester) {
            $nilaiCpl = DB::table('capaian_cpls')
                ->where('mahasiswa_id', $mahasiswaId)
                ->where('semester', $semester)
                ->where('tahun_akademik', $tahunAkademik)
                ->where('tenant_id', $tenantId)
                ->pluck('nilai', 'cpl_id');

            foreach ($ieaIds as $ieaId) {
                $cplMapped = DB::table('cpl_iea')
                    ->where('iea_id', $ieaId)
                    ->where('tenant_id', $tenantId)
                    ->pluck('cpl_id');

                $nilaiList = [];
                foreach ($cplMapped as $cplId) {
                    if (isset($nilaiCpl[$cplId])) {
                        $nilaiList[] = $nilaiCpl[$cplId];
                    }
                }
                if (empty($nilaiList)) continue;

                $nilaiIea = round(array_sum($nilaiList) / count($nilaiList), 2);

                DB::table('capaian_ieas')->updateOrInsert(
                    [
                        'mahasiswa_id'   => $mahasiswaId,
                        'iea_id'         => $ieaId,
                        'semester'       => $semester,
                        'tahun_akademik' => $tahunAkademik,
                        'tenant_id'      => $tenantId,
                    ],
                    [
                        'nilai'      => $nilaiIea,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }
    }

    // =============================================================
    // FIX #4 & #8 & #9 — getDataGrafik()
    //
    // BUG LAMA #4: Radar pakai max('nilai') bukan sum kumulatif.
    // BUG BARU #8: cpls dan ieas tanpa filter tenant.
    // BUG BARU #9: PPM pakai max('nilai') dan tanpa filter tenant.
    //
    // PERBAIKAN:
    // - Semua query tambah where('tenant_id')
    // - max('nilai') diganti sum('nilai') untuk radar dan PPM
    // =============================================================
    public function getDataGrafik(int $mahasiswaId): array
    {
        $tenantId = tenant('id');

        $mahasiswa = DB::table('mahasiswas')
            ->join('kelas', 'kelas.id', '=', 'mahasiswas.kelas_id')
            ->select('mahasiswas.*', 'kelas.kode_kelas', 'kelas.tingkat')
            ->where('mahasiswas.id', $mahasiswaId)
            ->where('mahasiswas.tenant_id', $tenantId)
            ->first();

        // FIX #8: hanya CPL dan IEA milik prodi aktif
        $cpls = DB::table('cpls')
                    ->where('tenant_id', $tenantId)
                    ->orderBy('kode')->get();

        $ieas = DB::table('ieas')
                    ->where('tenant_id', $tenantId)
                    ->orderBy('kode')->get();

        // Bar chart CPL per semester
        $grafikCpl = [];
        foreach ($cpls as $cpl) {
            $data = [];
            for ($sem = 1; $sem <= 8; $sem++) {
                $data[] = (float)(DB::table('capaian_cpls')
                    ->where('mahasiswa_id', $mahasiswaId)
                    ->where('cpl_id', $cpl->id)
                    ->where('semester', $sem)
                    ->where('tenant_id', $tenantId)
                    ->sum('nilai')); // FIX: sum, bukan value() -- value() ambil 1 baris
                    // acak kalau ada >1 baris (mis. gara-gara duplikasi tahun_akademik),
                    // sum() konsisten dengan radarCpl yang sudah pakai sum() di bawah.
            }
            $grafikCpl[] = [
                'label'     => $cpl->kode,
                'deskripsi' => $cpl->deskripsi,
                'data'      => $data,
            ];
        }

        // FIX #4: Radar CPL — sum kumulatif semua semester
        $radarCpl = [];
        foreach ($cpls as $cpl) {
            $radarCpl[] = [
                'label' => $cpl->kode,
                'nilai' => (float)(DB::table('capaian_cpls')
                    ->where('mahasiswa_id', $mahasiswaId)
                    ->where('cpl_id', $cpl->id)
                    ->where('tenant_id', $tenantId)
                    ->sum('nilai') ?? 0),
            ];
        }

        // Bar chart IEA per semester
        $grafikIea = [];
        foreach ($ieas as $iea) {
            $data = [];
            for ($sem = 1; $sem <= 8; $sem++) {
                $val = DB::table('capaian_ieas')
                    ->where('mahasiswa_id', $mahasiswaId)
                    ->where('iea_id', $iea->id)
                    ->where('semester', $sem)
                    ->where('tenant_id', $tenantId)
                    ->sum('nilai'); // FIX: sum, bukan value() -- alasan sama seperti grafikCpl di atas
                $data[] = $val ? round((float)$val, 2) : 0;
            }
            $grafikIea[] = [
                'label'     => $iea->kode,
                'deskripsi' => $iea->deskripsi,
                'data'      => $data,
            ];
        }

        // FIX #4: Radar IEA — sum kumulatif semua semester
        $radarIea = [];
        foreach ($ieas as $iea) {
            $radarIea[] = [
                'label' => '(' . $iea->kode . ') ' . $iea->deskripsi,
                'nilai' => (float)(DB::table('capaian_ieas')
                    ->where('mahasiswa_id', $mahasiswaId)
                    ->where('iea_id', $iea->id)
                    ->where('tenant_id', $tenantId)
                    ->sum('nilai') ?? 0),
            ];
        }

        // IPS per semester — sudah benar, hanya tambah filter tenant
        $ips = [];
        for ($sem = 1; $sem <= 8; $sem++) {
            $avg = DB::table('capaian_cpls')
                ->where('mahasiswa_id', $mahasiswaId)
                ->where('semester', $sem)
                ->where('tenant_id', $tenantId)
                ->avg('nilai');
            $ips[] = $avg ? round($avg, 2) : 0;
        }

        // FIX #9: PPM — filter tenant + sum kumulatif
        $ppms = DB::table('ppms')
                    ->where('tenant_id', $tenantId)
                    ->orderBy('kode')->get();

        $grafikPpm = [];
        foreach ($ppms as $ppm) {
            $ieaIds = DB::table('ppm_iea')
                        ->where('ppm_id', $ppm->id)
                        ->where('tenant_id', $tenantId)
                        ->pluck('iea_id');

            $cplIds = DB::table('cpl_iea')
                        ->whereIn('iea_id', $ieaIds)
                        ->where('tenant_id', $tenantId)
                        ->pluck('cpl_id')
                        ->unique();

            $nilaiList = [];
            foreach ($cplIds as $cplId) {
                $n = DB::table('capaian_cpls')
                    ->where('mahasiswa_id', $mahasiswaId)
                    ->where('cpl_id', $cplId)
                    ->where('tenant_id', $tenantId)
                    ->sum('nilai');  // FIX: sum, bukan max
                if ($n) $nilaiList[] = $n;
            }

            $grafikPpm[] = [
                'kode'      => $ppm->kode,
                'deskripsi' => $ppm->deskripsi,
                'nilai'     => count($nilaiList) > 0
                    ? round(array_sum($nilaiList) / count($nilaiList), 2)
                    : 0,
            ];
        }

        return compact(
            'mahasiswa', 'grafikCpl', 'radarCpl',
            'grafikIea', 'radarIea', 'ips', 'grafikPpm',
            'cpls', 'ieas', 'ppms'
        );
    }
}