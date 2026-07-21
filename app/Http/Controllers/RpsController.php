<?php

namespace App\Http\Controllers;

use App\Models\Rps;
use App\Models\MataKuliah;
use App\Models\DosenBiodata;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Validation\Rule;

class RpsController extends Controller
{
    public function index()
    {
        $user    = auth()->user();
        $isDosen = $user->hasRole('Dosen');

        $query = Rps::with(['mataKuliah:id,kode_mk,nama_mk', 'penilaians', 'details']);

        if ($isDosen && $user->dosen_biodata_id) {
            $query->where('dosen_biodata_id', $user->dosen_biodata_id);
        }

        $rps = $query->get();

        $rps->each(function ($item) {
            if ($item->dosen_biodata_id) {
                $item->dosen_biodata = DosenBiodata::find($item->dosen_biodata_id);
            }
        });

        // FIX: dosen sebelumnya lihat SEMUA matkul di dropdown "Tambah RPS"
        // (61 matkul se-prodi), bikin susah dicari. Sekarang difilter cuma
        // matkul yang dia ampu -- pola sama seperti nilaiIndex() di
        // AsesmenController. Kaprodi tetap lihat semua matkul.
        $mataKuliahQuery = MataKuliah::select('id', 'kode_mk', 'nama_mk');
        if ($isDosen && $user->dosen_biodata_id) {
            $tenantId = tenant('id');
            $mkIds = DB::table('dosen_biodata_mata_kuliah')
                ->where('dosen_biodata_id', $user->dosen_biodata_id)
                ->where('tenant_id', $tenantId)
                ->pluck('mata_kuliah_id');
            $mataKuliahQuery->whereIn('id', $mkIds);
        }
        $mataKuliahs = $mataKuliahQuery->orderBy('nama_mk')->get();
        $allDosen    = DosenBiodata::orderBy('nama_lengkap')->get();

        return Inertia::render('Rps/page', [
            'rps'         => $rps,
            'mataKuliahs' => $mataKuliahs,
            'allDosen'    => $allDosen,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateRps($request);

        try {
            DB::transaction(function () use ($validated, $request) {
                $rps = Rps::create([
                    'mata_kuliah_id'     => $validated['mata_kuliah_id'],
                    'dosen_biodata_id'   => $validated['dosen_biodata_id'],
                    'tahun_akademik'     => $validated['tahun_akademik'],
                    'tanggal_penyusunan' => $validated['tanggal_penyusunan'],
                    'pustaka_utama'      => $validated['pustaka_utama'],
                    'pustaka_pendukung'  => $validated['pustaka_pendukung'] ?? null,
                    'bahan_kajian_utama' => $validated['bahan_kajian_utama'],
                    'tte_dosen'          => $request->hasFile('tte_dosen') ? $request->file('tte_dosen')->store('rps_tte', 'public') : null,
                    'tte_kaprodi'        => $request->hasFile('tte_kaprodi') ? $request->file('tte_kaprodi')->store('rps_tte', 'public') : null,
                    'tte_kajur'          => $request->hasFile('tte_kajur') ? $request->file('tte_kajur')->store('rps_tte', 'public') : null,
                    'kode_dokumen'       => $validated['kode_dokumen'],
                    'komponen_labels'    => $validated['komponen_labels'] ?? Rps::defaultKomponenLabels(),
                    // RPS baru selalu mulai dari status menunggu verifikasi Kaprodi
                    'status'             => 'menunggu_verifikasi',
                ]);

                $rps->penilaians()->createMany($validated['penilaians']);
                $rps->details()->createMany($validated['details']);
            });

            return redirect()->route('rps.index')->with('success', 'RPS berhasil ditambahkan dan menunggu verifikasi Kaprodi.');
        } catch (\Exception $e) {
            return back()->withErrors(['dosen_biodata_id' => 'Sistem gagal menyimpan: ' . $e->getMessage()]);
        }
    }

    public function update(Request $request, $id)
    {
        $rps       = Rps::findOrFail($id);
        $validated = $this->validateRps($request, true);

        try {
            DB::transaction(function () use ($validated, $request, $rps) {
                $data = [
                    'mata_kuliah_id'     => $validated['mata_kuliah_id'],
                    'dosen_biodata_id'   => $validated['dosen_biodata_id'],
                    'tahun_akademik'     => $validated['tahun_akademik'],
                    'tanggal_penyusunan' => $validated['tanggal_penyusunan'],
                    'pustaka_utama'      => $validated['pustaka_utama'],
                    'pustaka_pendukung'  => $validated['pustaka_pendukung'] ?? null,
                    'bahan_kajian_utama' => $validated['bahan_kajian_utama'],
                    'kode_dokumen'       => $validated['kode_dokumen'],
                    'komponen_labels'    => $validated['komponen_labels'] ?? Rps::defaultKomponenLabels(),
                    // Kalau Dosen edit RPS yang sudah disetujui, status balik ke
                    // menunggu verifikasi supaya Kaprodi perlu approve ulang
                    'status'             => 'menunggu_verifikasi',
                ];

                foreach (['tte_dosen', 'tte_kaprodi', 'tte_kajur'] as $tte) {
                    if ($request->hasFile($tte)) {
                        if ($rps->$tte) Storage::disk('public')->delete($rps->$tte);
                        $data[$tte] = $request->file($tte)->store('rps_tte', 'public');
                    }
                }

                $rps->update($data);

                $rps->penilaians()->delete();
                $rps->penilaians()->createMany($validated['penilaians']);

                $rps->details()->delete();
                $rps->details()->createMany($validated['details']);
            });

            return redirect()->route('rps.index')->with('success', 'RPS berhasil diperbarui dan menunggu verifikasi ulang Kaprodi.');
        } catch (\Exception $e) {
            return back()->withErrors(['dosen_biodata_id' => 'Sistem gagal update: ' . $e->getMessage()]);
        }
    }

    /**
     * Kaprodi verifikasi/menyetujui RPS yang sudah dibuat Dosen.
     * Hanya bisa diakses oleh role Kaprodi (dijaga di route middleware).
     */
    public function verifikasi($id)
    {
        $rps = Rps::findOrFail($id);

        $rps->update(['status' => 'disetujui']);

        return redirect()->back()->with('success', 'RPS berhasil diverifikasi dan disetujui.');
    }

    /**
     * Kaprodi batal verifikasi (kembalikan ke menunggu).
     * Berguna kalau ada revisi setelah sempat disetujui.
     */
    public function batalVerifikasi($id)
    {
        $rps = Rps::findOrFail($id);

        $rps->update(['status' => 'menunggu_verifikasi']);

        return redirect()->back()->with('success', 'Status RPS dikembalikan ke menunggu verifikasi.');
    }

    public function destroy($id)
    {
        $rps = Rps::findOrFail($id);

        foreach (['tte_dosen', 'tte_kaprodi', 'tte_kajur'] as $tte) {
            if ($rps->$tte) Storage::disk('public')->delete($rps->$tte);
        }

        $rps->delete();

        return redirect()->back()->with('success', 'RPS berhasil dihapus.');
    }

    private function validateRps(Request $request, $isUpdate = false)
    {
        return $request->validate([
            'mata_kuliah_id'           => 'required|exists:mata_kuliahs,id',
            'dosen_biodata_id'         => ['nullable', Rule::exists(DosenBiodata::class, 'id')],
            'tahun_akademik'           => 'required|string|max:20',
            'tanggal_penyusunan'       => 'required|date',
            'pustaka_utama'            => 'required|string',
            'pustaka_pendukung'        => 'nullable|string',
            'bahan_kajian_utama'       => 'required|string',
            'tte_dosen'                => 'nullable|file|mimes:png,jpg,jpeg,pdf|max:2048',
            'tte_kaprodi'              => 'nullable|file|mimes:png,jpg,jpeg,pdf|max:2048',
            'tte_kajur'                => 'nullable|file|mimes:png,jpg,jpeg,pdf|max:2048',
            'kode_dokumen'             => 'required|string',
            'komponen_labels'          => 'nullable|array',
            'komponen_labels.quiz'     => 'nullable|string|max:50',
            'komponen_labels.tugas'    => 'nullable|string|max:50',
            'komponen_labels.project'  => 'nullable|string|max:50',
            'komponen_labels.uts'      => 'nullable|string|max:50',
            'komponen_labels.uas'      => 'nullable|string|max:50',
            'penilaians'               => 'required|array',
            'penilaians.*.cpmk_id'    => 'required|exists:cpmks,id',
            'penilaians.*.quiz'        => 'numeric|min:0|max:100',
            'penilaians.*.tugas'       => 'numeric|min:0|max:100',
            'penilaians.*.project'     => 'numeric|min:0|max:100',
            'penilaians.*.uts'         => 'numeric|min:0|max:100',
            'penilaians.*.uas'         => 'numeric|min:0|max:100',
            'details'                        => 'required|array',
            'details.*.pertemuan_ke'         => 'required|string|max:10',
            'details.*.kemampuan_akhir'      => 'required|string',
            'details.*.indikator'            => 'required|string',
            'details.*.bahan_kajian'         => 'required|string',
            'details.*.metode_pembelajaran'  => 'required|string',
            'details.*.estimasi_waktu'       => 'required|string',
            'details.*.pengalaman_belajar'   => 'nullable|string',
            'details.*.penilaian_komponen'   => 'nullable|string',
            'details.*.penilaian_bobot'      => 'nullable|numeric|min:0|max:100',
        ]);
    }

    public function printPdf($id)
    {
        $rps = Rps::with([
            'mataKuliah.cpmks.indikatorKinerjas.cpl',
            'penilaians.cpmk',
            'details',
            'mataKuliah.prasyarats',
        ])->findOrFail($id);

        if ($rps->dosen_biodata_id) {
            $rps->dosen_biodata = DosenBiodata::find($rps->dosen_biodata_id);
        }

        $dosen     = $rps->dosen_biodata;
        $namaDosen = $dosen
            ? trim(implode(' ', array_filter([$dosen->gelar_depan, $dosen->nama_lengkap, $dosen->gelar_belakang])))
            : '(................................)';

        // FIX: Kajur sekarang dicari dari kolom jabatan_struktural,
        // bukan jabatan_akademik lagi. Ini supaya kolom jabatan_akademik
        // tetap murni buat pangkat (Lektor, dst), dan posisi struktural
        // (Kajur/Kaprodi) dicatat terpisah tanpa saling menimpa.
        $kajur     = DosenBiodata::where('jabatan_struktural', 'Kajur')->first();
        $namaKajur = $kajur
            ? trim(implode(' ', array_filter([$kajur->gelar_depan, $kajur->nama_lengkap, $kajur->gelar_belakang])))
            : '(................................)';

        $segmenKode    = explode('_', $rps->kode_dokumen);
        $kodeProdi     = $segmenKode[1] ?? '';
        $kunciProdiMap = 'RPS_' . $kodeProdi;

        $prodiMap = [
            'RPS_TRIN' => 'Teknologi Rekayasa Informatika Industri',
            'RPS_TRO'  => 'Teknologi Rekayasa Otomasi',
            'RPS_TRMO' => 'Teknologi Rekayasa Mekatronika',
            'RPS_TRSA' => 'Teknologi Rekayasa Sistem Aerial Nirawak',
        ];

        $namaProdiLengkap = $prodiMap[$kunciProdiMap] ?? '';

        // FIX: sama seperti Kajur, Kaprodi sekarang dicari dari
        // jabatan_struktural. Sebelumnya dicari dari jabatan_akademik,
        // yang bikin dosen yang jabatan akademiknya "Lektor" tapi
        // menjabat Kaprodi tidak pernah ketemu di pencarian ini.
        $kaprodi = DosenBiodata::where('jabatan_struktural', 'Kaprodi')
            ->where(function ($query) use ($kodeProdi, $namaProdiLengkap) {
                $query->where('prodi', $namaProdiLengkap)
                      ->orWhere('prodi', $kodeProdi)
                      ->orWhere('prodi', 'LIKE', '%' . $kodeProdi . '%');
            })->first();

        $namaKaprodi = $kaprodi
            ? trim(implode(' ', array_filter([$kaprodi->gelar_depan, $kaprodi->nama_lengkap, $kaprodi->gelar_belakang])))
            : '(................................)';

        $pdf = Pdf::loadView('pdf.rps', compact('rps', 'namaDosen', 'namaKajur', 'namaKaprodi'))
            ->setPaper('a4', 'landscape')
            ->setOptions([
                'isRemoteEnabled'      => true,
                'isHtml5ParserEnabled' => true,
                'chroot' => [
                    public_path(),
                    storage_path('app/public'),
                ],
            ]);

        return $pdf->stream('RPS_' . $rps->mataKuliah->kode_mk . '.pdf');
    }
}