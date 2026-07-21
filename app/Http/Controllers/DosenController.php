<?php

namespace App\Http\Controllers;

use App\Models\DosenBiodata;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DosenController extends Controller
{
    public function index()
    {
        $tenantId = tenant('id');

        $dosens = User::where('users.tenant_id', $tenantId)
        ->whereHas('roles', function ($q) use ($tenantId) {
            $q->where('name', 'Dosen')
            ->where('roles.tenant_id', $tenantId);
        })
        ->get();

        $dosens->each(function ($user) {
            if ($user->dosen_biodata_id) {
                $user->dosenBiodata = DosenBiodata::find($user->dosen_biodata_id);
            }
        });

        return Inertia::render('Dosen/Index', [
            'dosens' => $dosens,
        ]);
    }

    public function create()
    {
        $tenantId = tenant('id');

        // Ambil ID dosen yang sudah punya akun di tenant ini saja
        $usedIds = User::where('tenant_id', $tenantId)
            ->whereNotNull('dosen_biodata_id')
            ->pluck('dosen_biodata_id')
            ->toArray();

        // Ambil biodata yang belum punya akun di tenant ini
        $biodatas = DosenBiodata::whereNotIn('id', $usedIds)
            ->orderBy('nama_lengkap')
            ->get(['id', 'nama_lengkap', 'gelar_depan', 'gelar_belakang', 'nip', 'email']);

        return Inertia::render('Dosen/Create', [
            'biodatas' => $biodatas,
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = tenant('id');

        $validated = $request->validate([
            'dosen_biodata_id' => [
                'required',
                'exists:dosen_biodatas,id',
                Rule::unique('users', 'dosen_biodata_id')
                    ->where('tenant_id', $tenantId),
            ],
            'email'    => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')
                    ->where('tenant_id', $tenantId),
            ],
            'password' => 'required|string|min:8',
        ]);

        $biodata = DosenBiodata::findOrFail($validated['dosen_biodata_id']);

        $user = User::create([
            'dosen_biodata_id' => $biodata->id,
            'name'             => trim(implode(' ', array_filter([
                $biodata->gelar_depan,
                $biodata->nama_lengkap,
                $biodata->gelar_belakang,
            ]))),
            'email'     => $validated['email'],
            'nip'       => $biodata->nip,
            'password'  => Hash::make($validated['password']),
            'tenant_id' => $tenantId,
        ]);

        $user->assignRole(
            \Spatie\Permission\Models\Role::firstOrCreate(
                ['name' => 'Dosen', 'guard_name' => 'web', 'tenant_id' => $tenantId]
            )
        );

        return redirect()->route('dosen.index')->with('success', 'Akun Dosen berhasil didaftarkan.');
    }

    public function update(Request $request, User $user)
    {
        $tenantId = tenant('id');

        // Pastikan dosen yang mau diedit memang punya akun di tenant ini
        abort_if($user->tenant_id !== $tenantId, 403);

        $validated = $request->validate([
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')
                    ->where('tenant_id', $tenantId)
                    ->ignore($user->id),
            ],
            'password' => 'nullable|string|min:8',
        ]);

        $user->email = $validated['email'];

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect()->route('dosen.index')->with('success', 'Akun Dosen berhasil diperbarui.');
    }
}