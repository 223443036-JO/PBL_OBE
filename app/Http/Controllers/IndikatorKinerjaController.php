<?php

namespace App\Http\Controllers;

use App\Models\Cpl;
use App\Models\IndikatorKinerja;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class IndikatorKinerjaController extends Controller
{
    public function index()
    {
        return Inertia::render('IndikatorKinerja/page', [
            'indikator_kinerjas' => IndikatorKinerja::with('cpl')->orderBy('kode', 'asc')->get(),
            'cpls'               => Cpl::select('id', 'kode', 'deskripsi')->orderBy('kode', 'asc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = tenant('id');

        $request->validate([
            'cpl_id'    => 'required|exists:cpls,id',
            // FIX: kode IK (mis. "A1") harusnya hanya unik per prodi,
            // bukan unik di seluruh database lintas prodi
            'kode'      => [
                'required', 'string',
                Rule::unique('indikator_kinerjas', 'kode')->where('tenant_id', $tenantId),
            ],
            'deskripsi' => 'required|string|min:5',
        ]);

        IndikatorKinerja::create([
            'cpl_id'    => $request->cpl_id,
            'kode'      => $request->kode,
            'deskripsi' => $request->deskripsi,
        ]);

        return redirect()->back()->with('success', 'Indikator Kinerja berhasil ditambahkan!');
    }

    public function update(Request $request, IndikatorKinerja $indikatorKinerja)
    {
        $tenantId = tenant('id');

        $request->validate([
            'cpl_id'    => 'required|exists:cpls,id',
            'kode'      => [
                'required', 'string',
                Rule::unique('indikator_kinerjas', 'kode')
                    ->ignore($indikatorKinerja->id)
                    ->where('tenant_id', $tenantId),
            ],
            'deskripsi' => 'required|string|min:5',
        ]);

        $indikatorKinerja->update([
            'cpl_id'    => $request->cpl_id,
            'kode'      => $request->kode,
            'deskripsi' => $request->deskripsi,
        ]);

        return redirect()->back()->with('success', 'Data Indikator Kinerja berhasil diperbarui!');
    }

    public function destroy(IndikatorKinerja $indikatorKinerja)
    {
        $indikatorKinerja->delete();
        return redirect()->back()->with('success', 'Indikator Kinerja berhasil dihapus!');
    }
}