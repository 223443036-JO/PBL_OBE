<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Stancl\Tenancy\Facades\Tenancy;
use App\Models\Kelas;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */

    public function share(Request $request): array
    {
        $user = $request->user();

        $hasWaliKelas = false;

        if ($user && $user->dosen_biodata_id) {
            $hasWaliKelas = Kelas::where(
                'wali_dosen_id',
                $user->dosen_biodata_id
            )->exists();
        }

        return [
            ...parent::share($request),

            'auth' => [
                'user' => $user,
                'roles' => $user?->getRoleNames() ?? [],
                'has_wali_kelas' => $hasWaliKelas,
            ],
            
            'tenant' => [
                'id'   => tenancy()->initialized ? tenant('id') : null,
                'kode' => tenancy()->initialized ? strtoupper(tenant('id')) : (request()->getHost() !== 'localhost' ? strtoupper(explode('.', request()->getHost())[0]) : 'PORTAL'),
            ],
            // Opsional: Flash message untuk notifikasi sukses/error
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}