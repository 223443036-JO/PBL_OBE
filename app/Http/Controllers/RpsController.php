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
    /**
     * Menampilkan daftar RPS.
     *
     * Dosen:
     * - Hanya melihat RPS yang dibuat/ditugaskan kepadanya.
 *     *
     * Kaprodi:
     * - Melihat seluruh RPS pada tenant/prodi.
     */
    public function index()
    {
        $user = auth()->user();

        $isDosen = $user->hasRole('Dosen');
        $isKaprodi = $user->hasRole('Kaprodi');

        $query = Rps::with([
            'mataKuliah:id,kode_mk,nama_mk',
            'penilaians',
            'details'
        ]);

        /**
         * DOSEN
         *
         * Dosen hanya melihat RPS miliknya sendiri.
         */
        if ($isDosen && $user->dosen_biodata_id) {
            $query->where(
                'dosen_biodata_id',
                $user->dosen_biodata_id
            );
        }

        /**
         * KAPRODI
         *
         * Kaprodi melihat semua RPS.
         */
        $rps = $query->get();

        /**
         * Ambil biodata dosen penyusun RPS.
         */
        $rps->each(function ($item) {
            if ($item->dosen_biodata_id) {
                $item->dosen_biodata = DosenBiodata::find(
                    $item->dosen_biodata_id
                );
            }
        });

        /**
         * =========================================================
         * MATA KULIAH
         * =========================================================
         *
         * Dosen:
         * Hanya mendapatkan mata kuliah yang dia ampu.
         *
         * Kaprodi:
         * Mendapatkan seluruh mata kuliah.
         */
        $mataKuliahQuery = MataKuliah::select(
            'id',
            'kode_mk',
            'nama_mk'
        );

        if ($isDosen && $user->dosen_biodata_id) {

            $tenantId = tenant('id');

            $mkIds = DB::table('dosen_biodata_mata_kuliah')
                ->where(
                    'dosen_biodata_id',
                    $user->dosen_biodata_id
                )
                ->where('tenant_id', $tenantId)
                ->pluck('mata_kuliah_id');

            $mataKuliahQuery->whereIn('id', $mkIds);
        }

        $mataKuliahs = $mataKuliahQuery
            ->orderBy('nama_mk')
            ->get();

        /**
         * Semua dosen.
         *
         * Data ini tetap dikirim ke frontend.
         * Namun form Tambah RPS hanya akan tersedia untuk Dosen.
         */
        $allDosen = DosenBiodata::orderBy(
            'nama_lengkap'
        )->get();

        return Inertia::render('Rps/page', [
            'rps'         => $rps,
            'mataKuliahs' => $mataKuliahs,
            'allDosen'    => $allDosen,

            /**
             * Kirim informasi role ke frontend.
             *
             * Ini digunakan untuk menampilkan /
             * menyembunyikan tombol Tambah RPS.
             */
            'canCreateRps' => $isDosen,
            'isDosen'      => $isDosen,
            'isKaprodi'    => $isKaprodi,
        ]);
    }


    /**
     * ============================================================
     * STORE
     * ============================================================
     *
     * HANYA DOSEN yang boleh membuat RPS.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        /**
         * SECURITY CHECK
         *
         * Walaupun tombol di frontend disembunyikan,
         * tetap harus dicek di backend.
         */
        if (!$user->hasRole('Dosen')) {
            abort(403, 'Kaprodi tidak diperbolehkan menambahkan RPS.');
        }

        /**
         * Pastikan akun Dosen memiliki biodata.
         */
        if (!$user->dosen_biodata_id) {
            return back()->withErrors([
                'dosen_biodata_id' =>
                    'Akun Dosen belum memiliki biodata dosen.'
            ]);
        }

        $validated = $this->validateRps($request);

        try {

            DB::transaction(function () use (
                $validated,
                $request,
                $user
            ) {

                $rps = Rps::create([

                    'mata_kuliah_id' =>
                        $validated['mata_kuliah_id'],

                    /**
                     * PENTING:
                     *
                     * Jangan mengambil dosen_biodata_id dari
                     * request untuk pembuatan RPS oleh Dosen.
                     *
                     * Gunakan biodata dari akun yang sedang login.
                     *
                     * Jadi Dosen A tidak bisa membuat RPS
                     * atas nama Dosen B melalui manipulasi request.
                     */
                    'dosen_biodata_id' =>
                        $user->dosen_biodata_id,

                    'tahun_akademik' =>
                        $validated['tahun_akademik'],

                    'tanggal_penyusunan' =>
                        $validated['tanggal_penyusunan'],

                    'pustaka_utama' =>
                        $validated['pustaka_utama'],

                    'pustaka_pendukung' =>
                        $validated['pustaka_pendukung'] ?? null,

                    'bahan_kajian_utama' =>
                        $validated['bahan_kajian_utama'],

                    'tte_dosen' =>
                        $request->hasFile('tte_dosen')
                            ? $request
                                ->file('tte_dosen')
                                ->store('rps_tte', 'public')
                            : null,

                    'tte_kaprodi' =>
                        $request->hasFile('tte_kaprodi')
                            ? $request
                                ->file('tte_kaprodi')
                                ->store('rps_tte', 'public')
                            : null,

                    'tte_kajur' =>
                        $request->hasFile('tte_kajur')
                            ? $request
                                ->file('tte_kajur')
                                ->store('rps_tte', 'public')
                            : null,

                    'kode_dokumen' =>
                        $validated['kode_dokumen'],

                    'komponen_labels' =>
                        $validated['komponen_labels']
                        ?? Rps::defaultKomponenLabels(),

                    /**
                     * RPS baru selalu menunggu verifikasi Kaprodi.
                     */
                    'status' =>
                        'menunggu_verifikasi',
                ]);

                /**
                 * Simpan penilaian.
                 */
                $rps->penilaians()->createMany(
                    $validated['penilaians']
                );

                /**
                 * Simpan detail RPS.
                 */
                $rps->details()->createMany(
                    $validated['details']
                );
            });

            return redirect()
                ->route('rps.index')
                ->with(
                    'success',
                    'RPS berhasil ditambahkan dan menunggu verifikasi Kaprodi.'
                );

        } catch (\Exception $e) {

            return back()->withErrors([
                'dosen_biodata_id' =>
                    'Sistem gagal menyimpan: ' . $e->getMessage()
            ]);
        }
    }


    /**
     * ============================================================
     * UPDATE
     * ============================================================
     *
     * Untuk sementara Dosen dan Kaprodi tetap dapat masuk
     * ke method update jika route/frontend mengizinkannya.
     *
     * Jika Anda ingin Kaprodi hanya verifikasi tanpa edit,
     * bagian ini bisa kita kunci juga.
     */
    public function update(Request $request, $id)
    {
        $user = auth()->user();

        $rps = Rps::findOrFail($id);

        /**
         * Jika user adalah Dosen,
         * pastikan dia hanya mengedit RPS miliknya.
         */
        if ($user->hasRole('Dosen')) {

            if (
                $rps->dosen_biodata_id !==
                $user->dosen_biodata_id
            ) {
                abort(
                    403,
                    'Anda tidak diperbolehkan mengubah RPS dosen lain.'
                );
            }

            /**
             * SECURITY CHECK
             *
             * Dosen tidak boleh mengedit RPS yang statusnya
             * sudah "disetujui" oleh Kaprodi. Ini melengkapi
             * tombol Edit yang di-disable di frontend, supaya
             * tidak bisa diakali lewat request manual.
             */
            if ($rps->status === 'disetujui') {
                abort(
                    403,
                    'RPS yang sudah disetujui Kaprodi tidak dapat diedit lagi.'
                );
            }
        }

        /**
         * Jika Kaprodi tidak boleh edit RPS,
         * gunakan check berikut.
         *
         * Saat ini saya aktifkan agar Kaprodi hanya melakukan
         * verifikasi dan tidak mengedit.
         */
        if ($user->hasRole('Kaprodi')) {
            abort(
                403,
                'Kaprodi tidak diperbolehkan mengubah RPS.'
            );
        }

        $validated = $this->validateRps(
            $request,
            true
        );

        try {

            DB::transaction(function () use (
                $validated,
                $request,
                $rps
            ) {

                $data = [

                    'mata_kuliah_id' =>
                        $validated['mata_kuliah_id'],

                    'dosen_biodata_id' =>
                        $rps->dosen_biodata_id,

                    'tahun_akademik' =>
                        $validated['tahun_akademik'],

                    'tanggal_penyusunan' =>
                        $validated['tanggal_penyusunan'],

                    'pustaka_utama' =>
                        $validated['pustaka_utama'],

                    'pustaka_pendukung' =>
                        $validated['pustaka_pendukung']
                        ?? null,

                    'bahan_kajian_utama' =>
                        $validated['bahan_kajian_utama'],

                    'kode_dokumen' =>
                        $validated['kode_dokumen'],

                    'komponen_labels' =>
                        $validated['komponen_labels']
                        ?? Rps::defaultKomponenLabels(),

                    /**
                     * Jika Dosen mengedit RPS yang sudah disetujui,
                     * maka harus diverifikasi kembali.
                     */
                    'status' =>
                        'menunggu_verifikasi',
                ];

                /**
                 * File TTE.
                 */
                foreach (
                    [
                        'tte_dosen',
                        'tte_kaprodi',
                        'tte_kajur'
                    ] as $tte
                ) {

                    if ($request->hasFile($tte)) {

                        if ($rps->$tte) {
                            Storage::disk('public')
                                ->delete($rps->$tte);
                        }

                        $data[$tte] =
                            $request
                                ->file($tte)
                                ->store(
                                    'rps_tte',
                                    'public'
                                );
                    }
                }

                $rps->update($data);

                /**
                 * Update penilaian.
                 */
                $rps->penilaians()->delete();

                $rps->penilaians()->createMany(
                    $validated['penilaians']
                );

                /**
                 * Update detail RPS.
                 */
                $rps->details()->delete();

                $rps->details()->createMany(
                    $validated['details']
                );
            });

            return redirect()
                ->route('rps.index')
                ->with(
                    'success',
                    'RPS berhasil diperbarui dan menunggu verifikasi ulang Kaprodi.'
                );

        } catch (\Exception $e) {

            return back()->withErrors([
                'dosen_biodata_id' =>
                    'Sistem gagal update: ' . $e->getMessage()
            ]);
        }
    }


    /**
     * ============================================================
     * VERIFIKASI
     * ============================================================
     *
     * Hanya Kaprodi.
     */
    public function verifikasi($id)
    {
        $user = auth()->user();

        if (!$user->hasRole('Kaprodi')) {
            abort(
                403,
                'Hanya Kaprodi yang dapat memverifikasi RPS.'
            );
        }

        $rps = Rps::findOrFail($id);

        $rps->update([
            'status' => 'disetujui'
        ]);

        return redirect()
            ->back()
            ->with(
                'success',
                'RPS berhasil diverifikasi dan disetujui.'
            );
    }


    /**
     * ============================================================
     * BATAL VERIFIKASI
     * ============================================================
     *
     * Hanya Kaprodi.
     */
    public function batalVerifikasi($id)
    {
        $user = auth()->user();

        if (!$user->hasRole('Kaprodi')) {
            abort(
                403,
                'Hanya Kaprodi yang dapat mengubah status verifikasi RPS.'
            );
        }

        $rps = Rps::findOrFail($id);

        $rps->update([
            'status' => 'menunggu_verifikasi'
        ]);

        return redirect()
            ->back()
            ->with(
                'success',
                'Status RPS dikembalikan ke menunggu verifikasi.'
            );
    }


    /**
     * ============================================================
     * DELETE
     * ============================================================
     *
     * Dosen dapat menghapus RPS miliknya.
     * Kaprodi tidak dapat menghapus.
     */
    public function destroy($id)
    {
        $user = auth()->user();

        $rps = Rps::findOrFail($id);

        /**
         * Kaprodi tidak boleh menghapus RPS.
         */
        if ($user->hasRole('Kaprodi')) {
            abort(
                403,
                'Kaprodi tidak diperbolehkan menghapus RPS.'
            );
        }

        /**
         * Dosen hanya boleh menghapus RPS miliknya.
         */
        if ($user->hasRole('Dosen')) {

            if (
                $rps->dosen_biodata_id !==
                $user->dosen_biodata_id
            ) {
                abort(
                    403,
                    'Anda tidak diperbolehkan menghapus RPS dosen lain.'
                );
            }
        }

        foreach (
            [
                'tte_dosen',
                'tte_kaprodi',
                'tte_kajur'
            ] as $tte
        ) {

            if ($rps->$tte) {
                Storage::disk('public')
                    ->delete($rps->$tte);
            }
        }

        $rps->delete();

        return redirect()
            ->back()
            ->with(
                'success',
                'RPS berhasil dihapus.'
            );
    }


    /**
     * ============================================================
     * VALIDATION
     * ============================================================
     */
    private function validateRps(
        Request $request,
        $isUpdate = false
    ) {
        return $request->validate([

            'mata_kuliah_id' => [
                'required',
                'exists:mata_kuliahs,id'
            ],

            /**
             * Masih nullable karena saat store kita menggunakan
             * dosen_biodata_id dari user yang login.
             */
            'dosen_biodata_id' => [
                'nullable',
                Rule::exists(
                    DosenBiodata::class,
                    'id'
                )
            ],

            'tahun_akademik' => [
                'required',
                'string',
                'max:20'
            ],

            'tanggal_penyusunan' => [
                'required',
                'date'
            ],

            'pustaka_utama' => [
                'required',
                'string'
            ],

            'pustaka_pendukung' => [
                'nullable',
                'string'
            ],

            'bahan_kajian_utama' => [
                'required',
                'string'
            ],

            'tte_dosen' => [
                'nullable',
                'file',
                'mimes:png,jpg,jpeg,pdf',
                'max:2048'
            ],

            'tte_kaprodi' => [
                'nullable',
                'file',
                'mimes:png,jpg,jpeg,pdf',
                'max:2048'
            ],

            'tte_kajur' => [
                'nullable',
                'file',
                'mimes:png,jpg,jpeg,pdf',
                'max:2048'
            ],

            'kode_dokumen' => [
                'required',
                'string'
            ],

            'komponen_labels' => [
                'nullable',
                'array'
            ],

            'komponen_labels.quiz' => [
                'nullable',
                'string',
                'max:50'
            ],

            'komponen_labels.tugas' => [
                'nullable',
                'string',
                'max:50'
            ],

            'komponen_labels.project' => [
                'nullable',
                'string',
                'max:50'
            ],

            'komponen_labels.uts' => [
                'nullable',
                'string',
                'max:50'
            ],

            'komponen_labels.uas' => [
                'nullable',
                'string',
                'max:50'
            ],

            'penilaians' => [
                'required',
                'array'
            ],

            'penilaians.*.cpmk_id' => [
                'required',
                'exists:cpmks,id'
            ],

            'penilaians.*.quiz' => [
                'numeric',
                'min:0',
                'max:100'
            ],

            'penilaians.*.tugas' => [
                'numeric',
                'min:0',
                'max:100'
            ],

            'penilaians.*.project' => [
                'numeric',
                'min:0',
                'max:100'
            ],

            'penilaians.*.uts' => [
                'numeric',
                'min:0',
                'max:100'
            ],

            'penilaians.*.uas' => [
                'numeric',
                'min:0',
                'max:100'
            ],

            'details' => [
                'required',
                'array'
            ],

            'details.*.pertemuan_ke' => [
                'required',
                'string',
                'max:10'
            ],

            'details.*.kemampuan_akhir' => [
                'required',
                'string'
            ],

            'details.*.indikator' => [
                'required',
                'string'
            ],

            'details.*.bahan_kajian' => [
                'required',
                'string'
            ],

            'details.*.metode_pembelajaran' => [
                'required',
                'string'
            ],

            'details.*.estimasi_waktu' => [
                'required',
                'string'
            ],

            'details.*.pengalaman_belajar' => [
                'nullable',
                'string'
            ],

            'details.*.penilaian_komponen' => [
                'nullable',
                'string'
            ],

            'details.*.penilaian_bobot' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100'
            ],
        ]);
    }


    /**
     * ============================================================
     * PRINT PDF
     * ============================================================
     */
    public function printPdf($id)
    {
        $rps = Rps::with([
            'mataKuliah.cpmks.indikatorKinerjas.cpl',
            'penilaians.cpmk',
            'details',
            'mataKuliah.prasyarats',
        ])->findOrFail($id);

        if ($rps->dosen_biodata_id) {
            $rps->dosen_biodata =
                DosenBiodata::find(
                    $rps->dosen_biodata_id
                );
        }

        $dosen = $rps->dosen_biodata;

        $namaDosen = $dosen
            ? trim(
                implode(
                    ' ',
                    array_filter([
                        $dosen->gelar_depan,
                        $dosen->nama_lengkap,
                        $dosen->gelar_belakang
                    ])
                )
            )
            : '(................................)';


        /**
         * KAJUR
         */
        $kajur = DosenBiodata::where(
            'jabatan_struktural',
            'Kajur'
        )->first();

        $namaKajur = $kajur
            ? trim(
                implode(
                    ' ',
                    array_filter([
                        $kajur->gelar_depan,
                        $kajur->nama_lengkap,
                        $kajur->gelar_belakang
                    ])
                )
            )
            : '(................................)';


        /**
         * PRODI
         */
        $segmenKode = explode(
            '_',
            $rps->kode_dokumen
        );

        $kodeProdi = $segmenKode[1] ?? '';

        $kunciProdiMap = 'RPS_' . $kodeProdi;

        $prodiMap = [
            'RPS_TRIN' =>
                'Teknologi Rekayasa Informatika Industri',

            'RPS_TRO' =>
                'Teknologi Rekayasa Otomasi',

            'RPS_TRMO' =>
                'Teknologi Rekayasa Mekatronika',

            'RPS_TRSA' =>
                'Teknologi Rekayasa Sistem Aerial Nirawak',
        ];

        $namaProdiLengkap =
            $prodiMap[$kunciProdiMap] ?? '';


        /**
         * KAPRODI
         */
        $kaprodi = DosenBiodata::where(
            'jabatan_struktural',
            'Kaprodi'
        )
            ->where(function ($query) use (
                $kodeProdi,
                $namaProdiLengkap
            ) {

                $query
                    ->where(
                        'prodi',
                        $namaProdiLengkap
                    )
                    ->orWhere(
                        'prodi',
                        $kodeProdi
                    )
                    ->orWhere(
                        'prodi',
                        'LIKE',
                        '%' . $kodeProdi . '%'
                    );
            })
            ->first();

        $namaKaprodi = $kaprodi
            ? trim(
                implode(
                    ' ',
                    array_filter([
                        $kaprodi->gelar_depan,
                        $kaprodi->nama_lengkap,
                        $kaprodi->gelar_belakang
                    ])
                )
            )
            : '(................................)';


        /**
         * PDF
         */
        $pdf = Pdf::loadView(
            'pdf.rps',
            compact(
                'rps',
                'namaDosen',
                'namaKajur',
                'namaKaprodi'
            )
        )
            ->setPaper(
                'a4',
                'landscape'
            )
            ->setOptions([
                'isRemoteEnabled' =>
                    true,

                'isHtml5ParserEnabled' =>
                    true,

                'chroot' => [
                    public_path(),
                    storage_path('app/public'),
                ],
            ]);

        return $pdf->stream(
            'RPS_' .
            $rps->mataKuliah->kode_mk .
            '.pdf'
        );
    }
}