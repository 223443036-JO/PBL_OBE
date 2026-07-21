<?php

namespace App\Http\Controllers;

use App\Models\Cpmk;
use App\Models\MataKuliah;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CpmkController extends Controller
{
    /**
     * FIX (fitur baru): dosen pengampu sekarang boleh kelola CPMK, TAPI
     * cuma buat mata kuliah yang dia ampu sendiri. Kaprodi tetap bebas akses
     * semua matkul. Pola ini sama seperti yang dipakai di
     * AsesmenController::nilaiIndex() buat filter RPS per dosen pengampu.
     */
    private function pastikanBerhakAtasMatkul(int $mataKuliahId): void
    {
        $user = auth()->user();

        if ($user->hasRole('Kaprodi')) {
            return; // Kaprodi bebas akses semua matkul
        }

        if (!$user->dosen_biodata_id) {
            abort(403, 'Akun ini belum terhubung ke data dosen.');
        }

        $tenantId = tenant('id');
        $diampu = DB::table('dosen_biodata_mata_kuliah')
            ->where('dosen_biodata_id', $user->dosen_biodata_id)
            ->where('mata_kuliah_id', $mataKuliahId)
            ->where('tenant_id', $tenantId)
            ->exists();

        if (!$diampu) {
            abort(403, 'Anda bukan dosen pengampu mata kuliah ini.');
        }
    }

    public function index(string $mataKuliahId)
    {
        $this->pastikanBerhakAtasMatkul((int) $mataKuliahId);

        $mk = MataKuliah::with([
            'cpls.indikatorKinerjas',
            'cpmks.indikatorKinerjas',
        ])->findOrFail($mataKuliahId);

        return Inertia::render('Cpmk/page', [
            'mataKuliah'    => $mk,
            'existingCpmks' => $mk->cpmks,
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = tenant('id');

        $validated = $request->validate([
            'mata_kuliah_id'   => 'required|exists:mata_kuliahs,id',
            'kode_cpmk'        => 'required|string',
            'deskripsi'        => 'required|string',
            'indikator_ids'    => 'required|array',
            'indikator_ids.*'  => 'exists:indikator_kinerjas,id',
        ]);

        $this->pastikanBerhakAtasMatkul((int) $validated['mata_kuliah_id']);

        $cpmk = Cpmk::create([
            'mata_kuliah_id' => $validated['mata_kuliah_id'],
            'kode_cpmk'      => $validated['kode_cpmk'],
            'deskripsi'      => $validated['deskripsi'],
        ]);

        // FIX: sync() tidak menyertakan tenant_id ke pivot cpmk_indikator_kinerja.
        // Tabel pivot ini punya kolom tenant_id, dan dipakai langsung oleh
        // AsesmenService::hitungNilaiIk() yang sudah difilter tenant_id.
        // Tanpa fix ini, mapping CPMK-IK tidak akan ketemu saat hitung nilai
        // karena tenant_id di pivot bakal NULL.
        $this->syncIndikatorDenganTenant($cpmk->id, $validated['indikator_ids'], $tenantId);

        return redirect()->back()->with('success', 'CPMK berhasil ditambahkan dan diikat ke Indikator.');
    }

    public function update(Request $request, Cpmk $cpmk)
    {
        $tenantId = tenant('id');

        $this->pastikanBerhakAtasMatkul($cpmk->mata_kuliah_id);

        $validated = $request->validate([
            'kode_cpmk'        => 'required|string',
            'deskripsi'        => 'required|string',
            'indikator_ids'    => 'required|array',
            'indikator_ids.*'  => 'exists:indikator_kinerjas,id',
        ]);

        $cpmk->update([
            'kode_cpmk' => $validated['kode_cpmk'],
            'deskripsi' => $validated['deskripsi'],
        ]);

        // FIX: ganti sync() biasa, hapus dulu pivot lama lalu insert ulang dengan tenant_id
        DB::table('cpmk_indikator_kinerja')
            ->where('cpmk_id', $cpmk->id)
            ->where('tenant_id', $tenantId)
            ->delete();

        $this->syncIndikatorDenganTenant($cpmk->id, $validated['indikator_ids'], $tenantId);

        return redirect()->back()->with('success', 'CPMK berhasil diperbarui.');
    }

    public function destroy(Cpmk $cpmk)
    {
        $this->pastikanBerhakAtasMatkul($cpmk->mata_kuliah_id);

        $cpmk->delete();
        return redirect()->back()->with('success', 'CPMK berhasil dihapus.');
    }

    /**
     * Helper: insert manual ke pivot cpmk_indikator_kinerja dengan tenant_id.
     * Dipakai di store() dan update() supaya konsisten dan tidak duplikasi kode.
     */
    private function syncIndikatorDenganTenant(int $cpmkId, array $indikatorIds, $tenantId): void
    {
        foreach ($indikatorIds as $ikId) {
            DB::table('cpmk_indikator_kinerja')->updateOrInsert(
                [
                    'cpmk_id'              => $cpmkId,
                    'indikator_kinerja_id' => $ikId,
                    'tenant_id'            => $tenantId,
                ],
                [
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}