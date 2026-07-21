<?php

namespace App\Http\Controllers;

use App\Models\Cpl;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CplController extends Controller
{
    public function index()
    {
        return Inertia::render('Cpl/page', [
            'cpls' => Cpl::orderBy('id', 'asc')->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate(['deskripsi' => 'required|string|min:5']);

        // FIX: dulu generate kode angka (CPL-01, CPL-02, dst).
        // Sekarang generate kode huruf (CPL-A, CPL-B, ..., CPL-Z,
        // lanjut CPL-AA, CPL-AB, dst kalau lebih dari 26).
        $count = Cpl::count();
        $kode  = 'CPL-' . $this->generateKodeHuruf($count + 1);

        Cpl::create([
            'kode'      => $kode,
            'deskripsi' => $request->deskripsi
        ]);

        return redirect()->back()->with('success', 'CPL berhasil ditambahkan!');
    }

    public function update(Request $request, Cpl $cpl)
    {
        $request->validate(['deskripsi' => 'required|string|min:5']);

        $cpl->update(['deskripsi' => $request->deskripsi]);

        return redirect()->back()->with('success', 'Deskripsi CPL berhasil diubah!');
    }

    public function destroy(Cpl $cpl)
    {
        $cpl->delete(); // Relasi di pivot cpl_iea akan otomatis hilang karena cascade
        return redirect()->back()->with('success', 'CPL berhasil dihapus!');
    }

    /**
     * Ubah angka urutan (1, 2, 3, ...) jadi kode huruf gaya kolom Excel
     * (A, B, C, ..., Z, AA, AB, ..., AZ, BA, ...).
     *
     * Dipakai supaya CPL ke-27 dan seterusnya tetap dapat kode yang
     * masuk akal (CPL-AA) kalau suatu saat jumlah CPL lebih dari 26,
     * bukan mentok atau error.
     *
     * Contoh: 1 -> A, 2 -> B, 26 -> Z, 27 -> AA, 28 -> AB
     */
    private function generateKodeHuruf(int $angka): string
    {
        $kode = '';

        while ($angka > 0) {
            $angka--;
            $kode  = chr(65 + ($angka % 26)) . $kode;
            $angka = intdiv($angka, 26);
        }

        return $kode;
    }
}