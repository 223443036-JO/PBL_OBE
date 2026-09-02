<?php

declare(strict_types=1);

use App\Http\Controllers\AsesmenController;
use App\Http\Controllers\CplController;
use App\Http\Controllers\CpmkController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DosenBiodataController;
use App\Http\Controllers\DosenController;
use App\Http\Controllers\IeaController;
use App\Http\Controllers\IndikatorKinerjaController;
use App\Http\Controllers\MataKuliahController;
use App\Http\Controllers\MatrixController;
use App\Http\Controllers\PpmController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RpsController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {

    require __DIR__.'/auth.php';

    /*
    |--------------------------------------------------------------------------
    | One-time auto login dari central
    |--------------------------------------------------------------------------
    */
    Route::get(
        '/auto-login',
        [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'autoLogin']
    )->name('auto-login');


    /*
    |--------------------------------------------------------------------------
    | Semua user yang sudah login
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth', 'verified'])->group(function () {

        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->name('dashboard');

        Route::get('/profile', [ProfileController::class, 'edit'])
            ->name('profile.edit');

        Route::patch('/profile', [ProfileController::class, 'update'])
            ->name('profile.update');

        Route::delete('/profile', [ProfileController::class, 'destroy'])
            ->name('profile.destroy');
    });


    /*
    |--------------------------------------------------------------------------
    | KAPRODI + DOSEN
    |--------------------------------------------------------------------------
    |
    | Fitur yang berhubungan dengan RPS, Matrix, CPMK, dan Asesmen.
    |
    */
    Route::middleware(['auth', 'role:Kaprodi|Dosen'])->group(function () {

        /*
        |--------------------------------------------------------------------------
        | RPS
        |--------------------------------------------------------------------------
        */
        Route::resource('rps', RpsController::class)
            ->except(['show']);

        Route::get(
            '/mata-kuliah/{id}/rps-data',
            [MataKuliahController::class, 'apiGetRpsData']
        )->name('mata-kuliah.rps-data');

        Route::get(
            '/rps/{id}/pdf',
            [RpsController::class, 'printPdf']
        )->name('rps.pdf');

        Route::get(
            '/rps/{id}/download',
            [RpsController::class, 'downloadPdf']
        )->name('rps.download');


        /*
        |--------------------------------------------------------------------------
        | Matrix
        |--------------------------------------------------------------------------
        */
        Route::get('/matrix', [MatrixController::class, 'index'])
            ->name('matrix.index');


        /*
        |--------------------------------------------------------------------------
        | Asesmen Nilai
        |--------------------------------------------------------------------------
        */
        Route::get(
            '/asesmen/nilai',
            [AsesmenController::class, 'nilaiIndex']
        )->name('asesmen.nilai');

        Route::get(
            '/asesmen/nilai/form',
            [AsesmenController::class, 'nilaiForm']
        )->name('asesmen.nilai.form');

        Route::post(
            '/asesmen/nilai',
            [AsesmenController::class, 'nilaiStore']
        )->name('asesmen.nilai.store');

        Route::get(
            '/asesmen',
            [AsesmenController::class, 'index']
        )->name('asesmen.index');

        Route::get(
            '/asesmen/mhs/{id}',
            [AsesmenController::class, 'show']
        )->name('asesmen.show');

        Route::get(
            '/asesmen/rerata',
            [AsesmenController::class, 'rerata']
        )->name('asesmen.rerata');


        /*
        |--------------------------------------------------------------------------
        | CPMK
        |--------------------------------------------------------------------------
        */
        Route::prefix('cpmk')->group(function () {

            Route::get(
                '/mk/{mata_kuliah_id}',
                [CpmkController::class, 'index']
            )->name('cpmk.index');

            Route::post(
                '/',
                [CpmkController::class, 'store']
            )->name('cpmk.store');

            Route::put(
                '/{cpmk}',
                [CpmkController::class, 'update']
            )->name('cpmk.update');

            Route::patch(
                '/{cpmk}',
                [CpmkController::class, 'update']
            );

            Route::delete(
                '/{cpmk}',
                [CpmkController::class, 'destroy']
            )->name('cpmk.destroy');
        });


        /*
        |--------------------------------------------------------------------------
        | Biodata Dosen milik diri sendiri
        |--------------------------------------------------------------------------
        |
        | Dosen hanya dapat melihat dan mengubah biodata dirinya sendiri.
        |
        */
        Route::get(
            '/biodata-saya',
            [DosenBiodataController::class, 'showSelf']
        )->name('biodata-saya.show');

        Route::patch(
            '/biodata-saya',
            [DosenBiodataController::class, 'updateSelf']
        )->name('biodata-saya.update');
    });

    /*
    |--------------------------------------------------------------------------
    | DOSEN - KELAS WALI
    |--------------------------------------------------------------------------
    */

    Route::middleware(['auth', 'role:Dosen'])->group(function () {

        Route::get(
            '/asesmen/kelas-wali',
            [AsesmenController::class, 'kelasWali']
        )->name('asesmen.kelas.wali.dosen');

        Route::get(
            '/asesmen/kelas-wali/{kelas}',
            [AsesmenController::class, 'kelasWaliShow']
        )->name('asesmen.kelas.wali.show');
    });



    /*
    |--------------------------------------------------------------------------
    | KAPRODI + ADMIN JURUSAN
    |--------------------------------------------------------------------------
    |
    | Fitur pengelolaan data akademik tingkat jurusan/prodi.
    |
    */
    Route::middleware(['auth', 'role:Kaprodi|Admin Jurusan'])->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Mata Kuliah
        |--------------------------------------------------------------------------
        */
        Route::resource('mata-kuliah', MataKuliahController::class)
            ->except(['create', 'show', 'edit']);


        /*
        |--------------------------------------------------------------------------
        | Verifikasi RPS
        |--------------------------------------------------------------------------
        |
        | Hanya Kaprodi yang boleh melakukan verifikasi.
        |
        */
        Route::middleware(['role:Kaprodi'])->group(function () {

            Route::patch(
                '/rps/{id}/verifikasi',
                [RpsController::class, 'verifikasi']
            )->name('rps.verifikasi');

            Route::patch(
                '/rps/{id}/batal-verifikasi',
                [RpsController::class, 'batalVerifikasi']
            )->name('rps.batal-verifikasi');
        });


        /*
        |--------------------------------------------------------------------------
        | BIODATA DOSEN - LIHAT
        |--------------------------------------------------------------------------
        |
        | Kaprodi dan Admin Jurusan boleh melihat biodata dosen.
        |
        | PENTING:
        | Hanya INDEX yang berada di sini.
        | Tidak ada store/update/destroy.
        |
        */
        Route::get(
            '/biodata-dosen',
            [DosenBiodataController::class, 'index']
        )->name('biodata-dosen.index');


        /*
        |--------------------------------------------------------------------------
        | Dosen Pengampu
        |--------------------------------------------------------------------------
        */
        Route::get(
            '/mata-kuliah/{id}/dosen-pengampu',
            [MataKuliahController::class, 'dosenPengampu']
        )->name('mata-kuliah.dosen-pengampu');

        Route::post(
            '/mata-kuliah/{id}/dosen-pengampu',
            [MataKuliahController::class, 'attachDosen']
        )->name('mata-kuliah.attach-dosen');

        Route::delete(
            '/mata-kuliah/{mkId}/dosen-pengampu/{dosenId}',
            [MataKuliahController::class, 'detachDosen']
        )->name('mata-kuliah.detach-dosen');


        /*
        |--------------------------------------------------------------------------
        | Indikator Kinerja
        |--------------------------------------------------------------------------
        */
        Route::resource('indikator-kinerja', IndikatorKinerjaController::class)
            ->except(['create', 'show', 'edit']);


        /*
        |--------------------------------------------------------------------------
        | CPL
        |--------------------------------------------------------------------------
        */
        Route::get('/cpl', [CplController::class, 'index'])
            ->name('cpl.index');

        Route::post('/cpl', [CplController::class, 'store'])
            ->name('cpl.store');

        Route::patch('/cpl/{cpl}', [CplController::class, 'update'])
            ->name('cpl.update');

        Route::delete('/cpl/{cpl}', [CplController::class, 'destroy'])
            ->name('cpl.destroy');


        /*
        |--------------------------------------------------------------------------
        | PPM
        |--------------------------------------------------------------------------
        */
        Route::get('/ppm', [PpmController::class, 'index'])
            ->name('ppm.index');

        Route::post('/ppm', [PpmController::class, 'store'])
            ->name('ppm.store');

        Route::patch('/ppm/{ppm}', [PpmController::class, 'update'])
            ->name('ppm.update');

        Route::delete('/ppm/{ppm}', [PpmController::class, 'destroy'])
            ->name('ppm.destroy');


        /*
        |--------------------------------------------------------------------------
        | IEA
        |--------------------------------------------------------------------------
        */
        Route::get('/iea', [IeaController::class, 'index'])
            ->name('iea.index');

        Route::post('/iea', [IeaController::class, 'store'])
            ->name('iea.store');

        Route::patch('/iea/{iea}', [IeaController::class, 'update'])
            ->name('iea.update');

        Route::delete('/iea/{iea}', [IeaController::class, 'destroy'])
            ->name('iea.destroy');


        /*
        |--------------------------------------------------------------------------
        | Matrix Sync
        |--------------------------------------------------------------------------
        */
        Route::post(
            '/matrix/bulk-sync',
            [MatrixController::class, 'syncCplBulk']
        )->name('matrix.sync.bulk');

        Route::post(
            '/matrix/sync-cpl-iea',
            [MatrixController::class, 'syncCplIea']
        )->name('matrix.sync-cpl-iea');

        Route::post(
            '/matrix/sync-ppm-iea',
            [MatrixController::class, 'syncPpmIea']
        )->name('matrix.sync-ppm-iea');

        Route::post(
            '/matrix/sync-mk-cpl',
            [MatrixController::class, 'syncMkCpl']
        )->name('matrix.sync-mk-cpl');


        /*
        |--------------------------------------------------------------------------
        | Asesmen - Kelas
        |--------------------------------------------------------------------------
        */
        Route::get('/asesmen/kelas', [AsesmenController::class, 'kelasIndex'])
            ->middleware('role:Kaprodi|Admin Jurusan')
            ->name('asesmen.kelas');

        Route::post('/asesmen/kelas', [AsesmenController::class, 'kelasStore'])
            ->middleware('role:Admin Jurusan')
            ->name('asesmen.kelas.store');

        Route::delete('/asesmen/kelas/{id}', [AsesmenController::class, 'kelasDestroy'])
            ->middleware('role:Admin Jurusan')
            ->name('asesmen.kelas.destroy');

        Route::patch('/asesmen/kelas/{kelas}/wali', [AsesmenController::class, 'assignWali'])
            ->middleware('role:Kaprodi')
            ->name('asesmen.kelas.wali');

        



        /*
        |--------------------------------------------------------------------------
        | Asesmen - Mahasiswa
        |--------------------------------------------------------------------------
        */
        Route::get(
            '/asesmen/mahasiswa',
            [AsesmenController::class, 'mahasiswaIndex']
        )->name('asesmen.mahasiswa');

        Route::post(
            '/asesmen/mahasiswa',
            [AsesmenController::class, 'mahasiswaStore']
        )
            ->middleware('role:Admin Jurusan')
            ->name('asesmen.mahasiswa.store');

        Route::delete(
            '/asesmen/mahasiswa/{id}',
            [AsesmenController::class, 'mahasiswaDestroy']
        )
            ->middleware('role:Admin Jurusan')
            ->name('asesmen.mahasiswa.destroy');
    });


    


    /*
    |--------------------------------------------------------------------------
    | ADMIN JURUSAN SAJA
    |--------------------------------------------------------------------------
    |
    | Semua fitur yang mengubah/mengelola data dosen dan akun dosen.
    |
    */
    Route::middleware(['auth', 'role:Admin Jurusan'])->group(function () {

        /*
        |--------------------------------------------------------------------------
        | BIODATA DOSEN - KELOLA
        |--------------------------------------------------------------------------
        |
        | Admin dapat:
        | - tambah biodata
        | - edit biodata
        | - hapus biodata
        |
        | Kaprodi TIDAK mempunyai akses ke route-route ini.
        |
        */
        Route::post(
            '/biodata-dosen',
            [DosenBiodataController::class, 'store']
        )->name('biodata-dosen.store');

        Route::patch(
            '/biodata-dosen/{dosenBiodata}',
            [DosenBiodataController::class, 'update']
        )->name('biodata-dosen.update');

        Route::delete(
            '/biodata-dosen/{dosenBiodata}',
            [DosenBiodataController::class, 'destroy']
        )->name('biodata-dosen.destroy');


        /*
        |--------------------------------------------------------------------------
        | AKUN DOSEN
        |--------------------------------------------------------------------------
        |
        | Admin dapat:
        | - melihat daftar akun
        | - membuat akun dosen
        | - mengubah email
        | - mengubah password
        |
        */
        Route::get(
            '/dosen',
            [DosenController::class, 'index']
        )->name('dosen.index');

        Route::get(
            '/dosen/create',
            [DosenController::class, 'create']
        )->name('dosen.create');

        Route::post(
            '/dosen',
            [DosenController::class, 'store']
        )->name('dosen.store');

        Route::put(
            '/dosen/{user}',
            [DosenController::class, 'update']
        )->name('dosen.update');
    });
});