<?php

namespace App\Http\Controllers;

use App\Services\AsesmenService;
use App\Models\Kelas;
use App\Models\Mahasiswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AsesmenController extends Controller
{
    public function __construct(private AsesmenService $asesmen) {}

    public function index(Request $request)
    {
        $kelasList  = Kelas::orderBy('tingkat')->get();
        $kelasId    = $request->get('kelas_id');
        $mahasiswas = collect();

        if ($kelasId) {
            $mahasiswas = Mahasiswa::where('kelas_id', $kelasId)
                ->orderBy('nim')->get();
        }

        return Inertia::render('Asesmen/Index', compact('kelasList', 'mahasiswas', 'kelasId'));
    }

    public function show(int $mahasiswaId)
    {
        $data = $this->asesmen->getDataGrafik($mahasiswaId);

        // FIX: Mahasiswa model pakai BelongsToTenant, sudah auto-scoped
        $kelasId  = Mahasiswa::where('id', $mahasiswaId)->value('kelas_id');
        $mhsKelas = Mahasiswa::where('kelas_id', $kelasId)->orderBy('nim')->get();

        return Inertia::render('Asesmen/Show', array_merge($data, ['mhsKelas' => $mhsKelas]));
    }

    // ── Kelas ────────────────────────────────────────────────────
    public function kelasIndex()
    {
        $kelas = Kelas::withCount('mahasiswas')->orderBy('tingkat')->get();
        return Inertia::render('Asesmen/Kelas', compact('kelas'));
    }

    public function kelasStore(Request $request)
    {
        $request->validate([
            'kode_kelas'  => 'required|string|max:10',
            'tahun_masuk' => 'required|integer|min:2000|max:' . date('Y'),
        ]);

        $bulan         = (int) date('n');
        $tahunAkademik = $bulan >= 9 ? (int) date('Y') : (int) date('Y') - 1;
        $tingkat       = max(1, min(4, $tahunAkademik - (int) $request->tahun_masuk + 1));

        Kelas::create([
            'kode_kelas'  => $request->kode_kelas,
            'tingkat'     => $tingkat,
            'tahun_masuk' => $request->tahun_masuk,
        ]);

        return redirect()->back()->with('success', 'Kelas berhasil ditambahkan!');
    }

    public function kelasDestroy(int $id)
    {
        Kelas::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Kelas berhasil dihapus!');
    }

    // ── Mahasiswa ────────────────────────────────────────────────
    public function mahasiswaIndex(Request $request)
    {
        $kelas      = Kelas::orderBy('tingkat')->get();
        $kelasId    = $request->get('kelas_id');
        $mahasiswas = collect();

        if ($kelasId) {
            $mahasiswas = Mahasiswa::with('kelas')
                ->where('kelas_id', $kelasId)
                ->orderBy('nim')->get();
        }

        return Inertia::render('Asesmen/Mahasiswa', compact('kelas', 'mahasiswas', 'kelasId'));
    }

    public function mahasiswaStore(Request $request)
    {
        $request->validate([
            'nim'      => 'required|string|max:20|unique:mahasiswas',
            'nama'     => 'required|string',
            'kelas_id' => 'required|exists:kelas,id',
        ]);

        Mahasiswa::create($request->only(['nim', 'nama', 'kelas_id']));
        return redirect()->back()->with('success', 'Mahasiswa berhasil ditambahkan!');
    }

    public function mahasiswaDestroy(int $id)
    {
        Mahasiswa::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Mahasiswa berhasil dihapus!');
    }

    // ── Input Nilai ──────────────────────────────────────────────
    public function nilaiIndex()
    {
        $tenantId = tenant('id');
        $user = auth()->user();

        // FIX: tambah filter tenant_id pada raw query
        $query = DB::table('rps')
            ->join('mata_kuliahs', 'mata_kuliahs.id', '=', 'rps.mata_kuliah_id')
            ->where('rps.tenant_id', $tenantId)
            ->select(
                'rps.id', 'rps.tahun_akademik',
                'mata_kuliahs.nama_mk as mk_nama',
                'mata_kuliahs.kode_mk as mk_kode',
                'mata_kuliahs.semester'
            );

        // FIX: Dosen (non-Kaprodi) cuma boleh lihat RPS dari mata kuliah yang dia ampu
        if (! $user->hasRole('Kaprodi') && $user->dosen_biodata_id) {
            $mkIds = DB::table('dosen_biodata_mata_kuliah')
                ->where('dosen_biodata_id', $user->dosen_biodata_id)
                ->where('tenant_id', $tenantId)
                ->pluck('mata_kuliah_id');

            $query->whereIn('mata_kuliahs.id', $mkIds);
        }

        $rpsAll = $query->orderBy('mata_kuliahs.semester')->get();

        $kelas = Kelas::orderBy('tingkat')->get();

        return Inertia::render('Asesmen/NilaiIndex', compact('rpsAll', 'kelas'));
    }

    public function nilaiForm(Request $request)
    {
        $tenantId = tenant('id');

        $request->validate([
            'rps_id'   => 'required|exists:rps,id',
            'kelas_id' => 'required|exists:kelas,id',
        ]);

        $rps = DB::table('rps')
            ->join('mata_kuliahs', 'mata_kuliahs.id', '=', 'rps.mata_kuliah_id')
            ->where('rps.id', $request->rps_id)
            ->where('rps.tenant_id', $tenantId)
            ->select(
                'rps.*',
                'mata_kuliahs.nama_mk as mk_nama',
                'mata_kuliahs.kode_mk as mk_kode',
                'mata_kuliahs.semester',
                'mata_kuliahs.id as mata_kuliah_id'
            )
            ->first();

        // FIX: filter tenant pada cpmks dan bobot
        $cpmks = DB::table('cpmks')
            ->where('mata_kuliah_id', $rps->mata_kuliah_id)
            ->where('tenant_id', $tenantId)
            ->get();

        $bobot = DB::table('rps_penilaians')
            ->where('rps_id', $request->rps_id)
            ->where('tenant_id', $tenantId)
            ->select('cpmk_id', 'quiz as bobot_quiz', 'tugas as bobot_tugas',
                     'project as bobot_project', 'uts as bobot_uts', 'uas as bobot_uas')
            ->get()->keyBy('cpmk_id');

        $mahasiswas = Mahasiswa::where('kelas_id', $request->kelas_id)
            ->orderBy('nim')->get();

        $nilaiExisting = DB::table('nilai_mahasiswas')
            ->where('rps_id', $request->rps_id)
            ->where('tenant_id', $tenantId)
            ->whereIn('mahasiswa_id', $mahasiswas->pluck('id'))
            ->get()->groupBy('mahasiswa_id')
            ->map(fn ($g) => collect($g));

        foreach ($mahasiswas as $mhs) {
            if (!isset($nilaiExisting[$mhs->id])) {
                $nilaiExisting[$mhs->id] = collect();
            }
        }

        $kelas = Kelas::find($request->kelas_id);

        return Inertia::render('Asesmen/NilaiForm', compact(
            'rps', 'cpmks', 'bobot', 'mahasiswas', 'nilaiExisting', 'kelas'
        ));
    }

    public function nilaiStore(Request $request)
    {
        $tenantId = tenant('id');

        $request->validate([
            'rps_id'         => 'required|exists:rps,id',
            'tahun_akademik' => 'required|string',
            'nilai'          => 'required|array',
        ]);

        DB::transaction(function () use ($request, $tenantId) {
            foreach ($request->nilai as $mhsId => $cpmkNilai) {
                foreach ($cpmkNilai as $cpmkId => $komponen) {
                    // FIX: sertakan tenant_id di data insert
                    // Tanpa ini AsesmenService tidak bisa menemukan record ini
                    DB::table('nilai_mahasiswas')->updateOrInsert(
                        [
                            'mahasiswa_id' => $mhsId,
                            'cpmk_id'      => $cpmkId,
                            'rps_id'       => $request->rps_id,
                            'tenant_id'    => $tenantId,
                        ],
                        [
                            'quiz'             => $komponen['quiz']    ?? 0,
                            'tugas'            => $komponen['tugas']   ?? 0,
                            'project'          => $komponen['project'] ?? 0,
                            'uts'              => $komponen['uts']     ?? 0,
                            'uas'              => $komponen['uas']     ?? 0,
                            'nilai_akhir_cpmk' => 0,
                            'updated_at'       => now(),
                            'created_at'       => now(),
                        ]
                    );
                }
                $this->asesmen->hitungCapaian($mhsId, $request->rps_id, $request->tahun_akademik);
            }
        });

        return redirect()->back()->with('success', 'Nilai berhasil disimpan dan CPL dihitung!');
    }

    // ── Rerata Kelas ─────────────────────────────────────────────
    public function rerata(Request $request)
    {
        $tenantId  = tenant('id');
        $kelasId   = $request->get('kelas_id');
        $kelasList = Kelas::orderBy('tingkat')->get();

        if (!$kelasId) {
            return Inertia::render('Asesmen/Rerata', [
                'kelas'            => null,
                'kelasList'        => $kelasList,
                'grafikRerataCpl'  => [],
                'radarRerataCpl'   => [],
                'grafikRerataIea'  => [],
                'radarRerataIea'   => [],
                'rerataPpm'        => [],
                'ppms'             => [],
            ]);
        }

        $kelas    = Kelas::findOrFail($kelasId);
        $mhsIds   = Mahasiswa::where('kelas_id', $kelasId)->pluck('id');
        $totalMhs = count($mhsIds);

        // FIX: semua query raw tambah filter tenant_id
        $cpls = DB::table('cpls')->where('tenant_id', $tenantId)->orderBy('kode')->get();
        $ieas = DB::table('ieas')->where('tenant_id', $tenantId)->orderBy('kode')->get();

        // Grafik CPL per semester (bar)
        $grafikRerataCpl = [];
        foreach ($cpls as $cpl) {
            $data = [];
            for ($sem = 1; $sem <= 8; $sem++) {
                $sum = DB::table('capaian_cpls')
                    ->whereIn('mahasiswa_id', $mhsIds)
                    ->where('cpl_id', $cpl->id)
                    ->where('semester', $sem)
                    ->where('tenant_id', $tenantId)
                    ->sum('nilai');
                $data[] = $totalMhs > 0 ? round($sum / $totalMhs, 2) : 0;
            }
            $grafikRerataCpl[] = ['label' => $cpl->kode, 'deskripsi' => $cpl->deskripsi, 'data' => $data];
        }

        // Radar CPL: rata-rata kumulatif per mahasiswa lalu dirata-rata kelas
        $radarRerataCpl = [];
        foreach ($cpls as $cpl) {
            $totalNilai = 0;
            foreach ($mhsIds as $mhsId) {
                $totalNilai += DB::table('capaian_cpls')
                    ->where('mahasiswa_id', $mhsId)
                    ->where('cpl_id', $cpl->id)
                    ->where('tenant_id', $tenantId)
                    ->sum('nilai') ?? 0;
            }
            $radarRerataCpl[] = [
                'label' => $cpl->kode,
                'nilai' => $totalMhs > 0 ? round($totalNilai / $totalMhs, 2) : 0,
            ];
        }

        // Grafik IEA per semester (bar)
        $grafikRerataIea = [];
        foreach ($ieas as $iea) {
            $data = [];
            for ($sem = 1; $sem <= 8; $sem++) {
                $sum = DB::table('capaian_ieas')
                    ->whereIn('mahasiswa_id', $mhsIds)
                    ->where('iea_id', $iea->id)
                    ->where('semester', $sem)
                    ->where('tenant_id', $tenantId)
                    ->sum('nilai');
                $data[] = $totalMhs > 0 ? round($sum / $totalMhs, 2) : 0;
            }
            $grafikRerataIea[] = ['label' => $iea->kode, 'deskripsi' => $iea->deskripsi, 'data' => $data];
        }

        // Radar IEA
        $radarRerataIea = [];
        foreach ($ieas as $iea) {
            $totalNilai = 0;
            foreach ($mhsIds as $mhsId) {
                $totalNilai += DB::table('capaian_ieas')
                    ->where('mahasiswa_id', $mhsId)
                    ->where('iea_id', $iea->id)
                    ->where('tenant_id', $tenantId)
                    ->sum('nilai') ?? 0;
            }
            $radarRerataIea[] = [
                'label' => '(' . $iea->kode . ') ' . $iea->deskripsi,
                'nilai' => $totalMhs > 0 ? round($totalNilai / $totalMhs, 2) : 0,
            ];
        }

        // Rerata PPM
        $ppms      = DB::table('ppms')->where('tenant_id', $tenantId)->orderBy('kode')->get();
        $rerataPpm = [];
        foreach ($ppms as $ppm) {
            $ieaIds = DB::table('ppm_iea')
                        ->where('ppm_id', $ppm->id)
                        ->where('tenant_id', $tenantId)
                        ->pluck('iea_id');
            $cplIds = DB::table('cpl_iea')
                        ->whereIn('iea_id', $ieaIds)
                        ->where('tenant_id', $tenantId)
                        ->pluck('cpl_id')->unique();

            $nilaiList = [];
            foreach ($cplIds as $cplId) {
                $totalNilai = 0;
                foreach ($mhsIds as $mhsId) {
                    $totalNilai += DB::table('capaian_cpls')
                        ->where('mahasiswa_id', $mhsId)
                        ->where('cpl_id', $cplId)
                        ->where('tenant_id', $tenantId)
                        ->sum('nilai') ?? 0;
                }
                $nilaiList[] = $totalMhs > 0 ? round($totalNilai / $totalMhs, 2) : 0;
            }
            $rerataPpm[] = [
                'kode'      => $ppm->kode,
                'deskripsi' => $ppm->deskripsi,
                'nilai'     => count($nilaiList) > 0 ? round(array_sum($nilaiList) / count($nilaiList), 2) : 0,
            ];
        }

        return Inertia::render('Asesmen/Rerata', compact(
            'kelas', 'kelasList', 'cpls', 'ieas', 'ppms',
            'grafikRerataCpl', 'radarRerataCpl',
            'grafikRerataIea', 'radarRerataIea',
            'rerataPpm'
        ));
    }
}