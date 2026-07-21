<?php

namespace App\Http\Controllers;

use App\Models\DosenBiodata;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DosenBiodataController extends Controller
{
    public function index()
    {
        $tenantId = tenant('id');

        $biodatas = DosenBiodata::latest()->get();

        $users = User::whereNotNull('dosen_biodata_id')
            ->where('tenant_id', $tenantId)
            ->select('id', 'dosen_biodata_id', 'email')
            ->get()
            ->keyBy('dosen_biodata_id');

        $biodatas->each(function ($biodata) use ($users) {
            $biodata->user = $users->get($biodata->id);
        });

        return Inertia::render('DosenBiodata/page', ['biodatas' => $biodatas]);
    }

    public function store(Request $request)
    {
        $request->merge([
            'nip'  => $this->normalizeEmptyToNull($request->nip),
            'nidn' => $this->normalizeEmptyToNull($request->nidn),
        ]);

        DosenBiodata::create($this->validatedData($request));
        return redirect()->back()->with('success', 'Biodata dosen berhasil ditambahkan.');
    }

    public function update(Request $request, DosenBiodata $dosenBiodata)
    {
        $request->merge([
            'nip'  => $this->normalizeEmptyToNull($request->nip),
            'nidn' => $this->normalizeEmptyToNull($request->nidn),
        ]);

        $dosenBiodata->update($this->validatedData($request, $dosenBiodata->id));
        return redirect()->back()->with('success', 'Biodata dosen berhasil diperbarui.');
    }

    public function destroy(DosenBiodata $dosenBiodata)
    {
        $tenantId = tenant('id');

        User::where('dosen_biodata_id', $dosenBiodata->id)
            ->where('tenant_id', $tenantId)
            ->delete();

        $dosenBiodata->delete();
        return redirect()->back()->with('success', 'Biodata dan akun dosen berhasil dihapus.');
    }

    private function normalizeEmptyToNull(?string $value): ?string
    {
        if ($value === null) return null;
        $trimmed = trim($value);
        return ($trimmed === '' || $trimmed === '-') ? null : $trimmed;
    }

    private function validatedData(Request $request, ?int $ignoreId = null): array
    {
        // FIX: sebelumnya Rule::unique cuma cek keunikan secara global
        // (whereNotNull('nip') doang). Sekarang ditambah ->where('tenant_id', ...)
        // supaya NIP/NIDN/email yang sama boleh dipakai di prodi lain,
        // tapi tetap harus unik dalam prodi yang sama. Ini nyambung sama
        // migration yang ngubah constraint database jadi composite unique
        // (tenant_id + kolom), bukan unique global lagi.
        $tenantId = tenant('id');

        return $request->validate([
            'nama_lengkap'     => ['required', 'string', 'max:255'],
            'gelar_depan'      => ['nullable', 'string', 'max:50'],
            'gelar_belakang'   => ['nullable', 'string', 'max:50'],
            'nip'              => [
                'nullable', 'string', 'max:50',
                Rule::unique('dosen_biodatas', 'nip')
                    ->ignore($ignoreId)
                    ->where('tenant_id', $tenantId)
                    ->whereNotNull('nip'),
            ],
            'nidn'             => [
                'nullable', 'string', 'max:50',
                Rule::unique('dosen_biodatas', 'nidn')
                    ->ignore($ignoreId)
                    ->where('tenant_id', $tenantId)
                    ->whereNotNull('nidn'),
            ],
            'email'            => [
                'required', 'email', 'max:255',
                Rule::unique('dosen_biodatas', 'email')
                    ->ignore($ignoreId)
                    ->where('tenant_id', $tenantId),
            ],
            'no_hp'            => ['nullable', 'string', 'max:30'],
            'prodi'            => ['required', 'string', 'max:255'],
            'jabatan_akademik' => ['required', 'string', 'max:100'],
            'jabatan_struktural' => ['nullable', 'string', 'max:100'],
            'bidang_keahlian'  => ['nullable', 'string'],
            'alamat'           => ['nullable', 'string'],
        ]);
    }

    // ── Dosen kelola biodata sendiri ─────────────────────────────
    public function showSelf()
    {
        $user    = auth()->user();
        $biodata = $user->dosen_biodata_id
            ? DosenBiodata::find($user->dosen_biodata_id)
            : null;

        return Inertia::render('DosenBiodata/ProfileSaya', [
            'biodata'    => $biodata,
            'isComplete' => $biodata !== null,
        ]);
    }

    public function updateSelf(Request $request)
    {
        $user     = auth()->user();
        $tenantId = tenant('id');

        $request->merge([
            'nip'  => $this->normalizeEmptyToNull($request->nip),
            'nidn' => $this->normalizeEmptyToNull($request->nidn),
        ]);

        $ignoreId  = $user->dosen_biodata_id ?? null;
        $validated = $request->validate([
            'nama_lengkap'       => ['required', 'string', 'max:255'],
            'gelar_depan'        => ['nullable', 'string', 'max:50'],
            'gelar_belakang'     => ['nullable', 'string', 'max:50'],
            'nip'                => [
                'nullable', 'string', 'max:50',
                Rule::unique('dosen_biodatas', 'nip')
                    ->ignore($ignoreId)
                    ->where('tenant_id', $tenantId)
                    ->whereNotNull('nip'),
            ],
            'nidn'               => [
                'nullable', 'string', 'max:50',
                Rule::unique('dosen_biodatas', 'nidn')
                    ->ignore($ignoreId)
                    ->where('tenant_id', $tenantId)
                    ->whereNotNull('nidn'),
            ],
            'email'              => [
                'required', 'email', 'max:255',
                Rule::unique('dosen_biodatas', 'email')
                    ->ignore($ignoreId)
                    ->where('tenant_id', $tenantId),
            ],
            'no_hp'              => ['nullable', 'string', 'max:30'],
            'prodi'              => ['required', 'string', 'max:255'],
            'jabatan_akademik'   => ['required', 'string', 'max:100'],
            'jabatan_struktural' => ['nullable', 'string', 'max:100'],
            'bidang_keahlian'    => ['nullable', 'string'],
            'alamat'             => ['nullable', 'string'],
        ]);

        if ($ignoreId) {
            DosenBiodata::findOrFail($ignoreId)->update($validated);
        } else {
            $biodata = DosenBiodata::create($validated);
            $user->update([
                'dosen_biodata_id' => $biodata->id,
                'name'             => trim(implode(' ', array_filter([
                    $validated['gelar_depan'] ?? null,
                    $validated['nama_lengkap'],
                    $validated['gelar_belakang'] ?? null,
                ]))),
            ]);
        }

        return redirect()->back()->with('success', 'Profil berhasil disimpan.');
    }
}