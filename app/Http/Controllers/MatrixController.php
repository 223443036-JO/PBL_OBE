<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Cpl;
use App\Models\Iea;
use App\Models\Ppm;
use App\Models\MataKuliah;
use Illuminate\Support\Facades\DB;

class MatrixController extends Controller
{
    public function index()
    {
        $cpls        = Cpl::with('ieas')->get();
        $ppms        = Ppm::with('ieas')->get();
        $ieas        = Iea::all();
        $mataKuliahs = MataKuliah::with('cpls')->get();

        $ppmIeaMap = [];
        foreach ($ppms as $ppm) {
            $ppmIeaMap[$ppm->id] = $ppm->ieas->pluck('id')->toArray();
        }

        $cplToPpmMatrix = [];
        foreach ($cpls as $cpl) {
            $cplIeaIds = $cpl->ieas->pluck('id')->toArray();
            foreach ($ppms as $ppm) {
                $cplToPpmMatrix[$cpl->id][$ppm->id] = !empty(
                    array_intersect($cplIeaIds, $ppmIeaMap[$ppm->id])
                );
            }
        }

        return Inertia::render('Matrix/Page', [
            'cpls'          => $cpls,
            'ieas'          => $ieas,
            'ppms'          => $ppms,
            'mataKuliahs'   => $mataKuliahs,
            'cplToPpmMatrix' => $cplToPpmMatrix,
        ]);
    }

    // FIX: syncWithoutDetaching() tidak menyertakan tenant_id ke pivot.
    // Ganti ke updateOrInsert manual supaya tenant_id tersimpan.
    public function syncCplIea(Request $request)
    {
        $tenantId = tenant('id');

        $request->validate([
            'cpl_id'      => 'required|exists:cpls,id',
            'iea_id'      => 'required|exists:ieas,id',
            'is_selected' => 'required|boolean',
        ]);

        if ($request->is_selected) {
            DB::table('cpl_iea')->updateOrInsert(
                [
                    'cpl_id'    => $request->cpl_id,
                    'iea_id'    => $request->iea_id,
                    'tenant_id' => $tenantId,
                ],
                [
                    'is_selected' => true,
                    'updated_at'  => now(),
                    'created_at'  => now(),
                ]
            );
        } else {
            DB::table('cpl_iea')
                ->where('cpl_id', $request->cpl_id)
                ->where('iea_id', $request->iea_id)
                ->where('tenant_id', $tenantId)
                ->delete();
        }

        return redirect()->back();
    }

    public function syncPpmIea(Request $request)
    {
        $tenantId = tenant('id');

        $request->validate([
            'ppm_id'      => 'required|exists:ppms,id',
            'iea_id'      => 'required|exists:ieas,id',
            'is_selected' => 'required|boolean',
        ]);

        if ($request->is_selected) {
            DB::table('ppm_iea')->updateOrInsert(
                [
                    'ppm_id'    => $request->ppm_id,
                    'iea_id'    => $request->iea_id,
                    'tenant_id' => $tenantId,
                ],
                [
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        } else {
            DB::table('ppm_iea')
                ->where('ppm_id', $request->ppm_id)
                ->where('iea_id', $request->iea_id)
                ->where('tenant_id', $tenantId)
                ->delete();
        }

        return redirect()->back();
    }

    public function syncMkCpl(Request $request)
    {
        $tenantId = tenant('id');

        $request->validate([
            'mata_kuliah_id' => 'required|exists:mata_kuliahs,id',
            'cpl_id'         => 'required|exists:cpls,id',
            'is_selected'    => 'required|boolean',
            'bobot'          => 'nullable|integer',
        ]);

        if ($request->is_selected) {
            DB::table('mk_cpl')->updateOrInsert(
                [
                    'mata_kuliah_id' => $request->mata_kuliah_id,
                    'cpl_id'         => $request->cpl_id,
                    'tenant_id'      => $tenantId,
                ],
                [
                    'bobot'      => $request->bobot ?? 0,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        } else {
            DB::table('mk_cpl')
                ->where('mata_kuliah_id', $request->mata_kuliah_id)
                ->where('cpl_id', $request->cpl_id)
                ->where('tenant_id', $tenantId)
                ->delete();
        }

        return redirect()->back()->with('success', 'Ikatan Mata Kuliah dan CPL telah diperbarui.');
    }
}
