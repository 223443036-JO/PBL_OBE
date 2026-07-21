<?php

namespace App\Http\Controllers;

use App\Models\MataKuliah;
use App\Models\DosenBiodata;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MataKuliahController extends Controller
{
    public function index()
    {
        $mataKuliahs = MataKuliah::with('prasyarats')
            ->orderBy('semester')
            ->orderBy('kode_mk')
            ->get();

        return Inertia::render('MataKuliah/page', ['mataKuliahs' => $mataKuliahs]);
    }

    public function store(Request $request)
    {
        $tenantId = tenant('id');

        $validated = $request->validate([
            'kode_mk' => [
                'required', 'string',
                Rule::unique('mata_kuliahs', 'kode_mk')->where('tenant_id', $tenantId),
            ],
            'nama_mk'           => 'required|string|max:255',
            'sks'               => 'required|integer|min:1',
            'jenis'             => 'required|in:Teori,Praktek',
            'semester'          => 'nullable|string|max:20',
            'sifat_pengambilan' => 'nullable|string|max:50',
            'cara_pembelajaran' => 'nullable|string|max:100',
            'deskripsi'         => 'nullable|string',
            'prasyarat_ids'     => 'nullable|array',
            'prasyarat_ids.*'   => 'exists:mata_kuliahs,id',
        ]);

        $mataKuliah = MataKuliah::create([
            'kode_mk'           => $validated['kode_mk'],
            'nama_mk'           => $validated['nama_mk'],
            'sks'               => $validated['sks'],
            'jenis'             => $validated['jenis'],
            'semester'          => $validated['semester'] ?? null,
            'sifat_pengambilan' => $validated['sifat_pengambilan'] ?? null,
            'cara_pembelajaran' => $validated['cara_pembelajaran'] ?? null,
            'deskripsi'         => $validated['deskripsi'] ?? null,
        ]);

        // FIX: SQLSTATE 1364 "Field 'tenant_id' doesn't have a default value"
        // sync() standar cuma isi kolom FK + timestamps di tabel pivot,
        // dia tidak tahu kalau mata_kuliah_prasyarat punya kolom tenant_id
        // yang wajib diisi. Solusinya: bikin array asosiatif [id => data_pivot]
        // supaya sync() menyertakan tenant_id di setiap baris yang diinsert.
        $this->syncPrasyaratDenganTenant($mataKuliah, $validated['prasyarat_ids'] ?? [], $tenantId);

        return redirect()->back()->with('success', 'Mata Kuliah berhasil ditambahkan.');
    }

    public function update(Request $request, MataKuliah $mataKuliah)
    {
        $tenantId = tenant('id');

        $validated = $request->validate([
            'kode_mk' => [
                'required', 'string',
                Rule::unique('mata_kuliahs', 'kode_mk')
                    ->ignore($mataKuliah->id)
                    ->where('tenant_id', $tenantId),
            ],
            'nama_mk'           => 'required|string|max:255',
            'sks'               => 'required|integer|min:1',
            'jenis'             => 'required|in:Teori,Praktek',
            'semester'          => 'nullable|string|max:20',
            'sifat_pengambilan' => 'nullable|string|max:50',
            'cara_pembelajaran' => 'nullable|string|max:100',
            'deskripsi'         => 'nullable|string',
            'prasyarat_ids'     => 'nullable|array',
            'prasyarat_ids.*'   => 'exists:mata_kuliahs,id',
        ]);

        if (!empty($validated['prasyarat_ids']) && in_array($mataKuliah->id, $validated['prasyarat_ids'])) {
            return redirect()->back()->withErrors([
                'prasyarat_ids' => 'Mata kuliah tidak dapat menjadi prasyarat untuk dirinya sendiri.',
            ]);
        }

        $mataKuliah->update([
            'kode_mk'           => $validated['kode_mk'],
            'nama_mk'           => $validated['nama_mk'],
            'sks'               => $validated['sks'],
            'jenis'             => $validated['jenis'],
            'semester'          => $validated['semester'] ?? null,
            'sifat_pengambilan' => $validated['sifat_pengambilan'] ?? null,
            'cara_pembelajaran' => $validated['cara_pembelajaran'] ?? null,
            'deskripsi'         => $validated['deskripsi'] ?? null,
        ]);

        // FIX: sama seperti di store(), sertakan tenant_id lewat
        // array asosiatif supaya sync() tidak gagal insert
        $this->syncPrasyaratDenganTenant($mataKuliah, $validated['prasyarat_ids'] ?? [], $tenantId);

        return redirect()->back()->with('success', 'Data Mata Kuliah berhasil diperbarui.');
    }

    /**
     * Helper: sync relasi prasyarat sambil menyertakan tenant_id
     * di setiap baris pivot, karena tabel mata_kuliah_prasyarat
     * punya kolom tenant_id yang wajib diisi (NOT NULL tanpa default).
     *
     * Format yang diharapkan sync(): [id => ['kolom_tambahan' => nilai]]
     * bukan cuma [id, id, id] biasa, supaya kolom tambahan ikut terisi.
     */
    private function syncPrasyaratDenganTenant(MataKuliah $mataKuliah, array $prasyaratIds, $tenantId): void
    {
        $syncData = [];
        foreach ($prasyaratIds as $id) {
            $syncData[$id] = ['tenant_id' => $tenantId];
        }

        $mataKuliah->prasyarats()->sync($syncData);
    }

    public function destroy(MataKuliah $mataKuliah)
    {
        $mataKuliah->delete();
        return redirect()->back()->with('success', 'Mata Kuliah berhasil dihapus.');
    }

    public function apiGetRpsData($id)
    {
        $mataKuliah = MataKuliah::with([
            'cpls.indikatorKinerjas',
            'cpmks.indikatorKinerjas',
            'dosenPengampu',
        ])->findOrFail($id);

        return response()->json(['status' => 'success', 'data' => $mataKuliah]);
    }

    public function dosenPengampu($id)
    {
        $mk       = MataKuliah::with('dosenPengampu')->findOrFail($id);
        $allDosen = DosenBiodata::orderBy('nama_lengkap')->get();

        return Inertia::render('MataKuliah/DosenPengampu', [
            'mataKuliah'    => $mk,
            'assignedDosen' => $mk->dosenPengampu,
            'allDosen'      => $allDosen,
        ]);
    }

    public function attachDosen(Request $request, $id)
    {
        $tenantId = tenant('id');
        $mk       = MataKuliah::findOrFail($id);

        $validated = $request->validate([
            'dosen_biodata_id' => 'required|exists:dosen_biodatas,id',
        ]);

        DB::table('dosen_biodata_mata_kuliah')->updateOrInsert(
            [
                'mata_kuliah_id'   => $mk->id,
                'dosen_biodata_id' => $validated['dosen_biodata_id'],
                'tenant_id'        => $tenantId,
            ],
            [
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return redirect()->back()->with('success', 'Dosen pengampu berhasil ditambahkan.');
    }

    public function detachDosen($mkId, $dosenId)
    {
        $tenantId = tenant('id');

        DB::table('dosen_biodata_mata_kuliah')
            ->where('mata_kuliah_id', $mkId)
            ->where('dosen_biodata_id', $dosenId)
            ->where('tenant_id', $tenantId)
            ->delete();

        return redirect()->back()->with('success', 'Dosen pengampu berhasil dihapus.');
    }
}