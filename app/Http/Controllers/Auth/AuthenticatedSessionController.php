<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Tampilkan halaman login (central domain).
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Proses login di central → cari tenant user → redirect ke domain tenant.
     */
    public function store(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::withoutGlobalScopes()
            ->where('email', $request->input('email'))
            ->first();

        if (!$user || !Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Email atau password salah.',
            ]);
        }

        if (empty($user->tenant_id)) {
            throw ValidationException::withMessages([
                'email' => 'Akun belum terhubung ke program studi manapun.',
            ]);
        }

        $tenant = tenancy()->find($user->tenant_id);

        if (!$tenant) {
            throw ValidationException::withMessages([
                'email' => 'Program studi tidak ditemukan.',
            ]);
        }

        $domain = $tenant->domains->first()?->domain;

        if (!$domain) {
            throw ValidationException::withMessages([
                'email' => 'Domain program studi belum dikonfigurasi.',
            ]);
        }

        $token = Str::random(64);

        Cache::put("login_token:{$token}", [
            'user_id'   => $user->id,
            'tenant_id' => $tenant->id,
        ], now()->addMinutes(2));

        $scheme = $request->getScheme();
        $port   = $request->getPort();
        $portPart = ($port && !in_array((int) $port, [80, 443], true)) ? ":{$port}" : '';

        $url = "{$scheme}://{$domain}{$portPart}/auto-login?token={$token}";

        // Full page redirect antar domain (wajib untuk Inertia)
        return Inertia::location($url);
    }

    /**
     * Auto-login di domain tenant lewat one-time token.
     */
    public function autoLogin(Request $request): RedirectResponse
    {
        $token = $request->query('token');

        if (!$token) {
            abort(403, 'Token tidak valid.');
        }

        $data = Cache::pull("login_token:{$token}");

        if (!$data) {
            abort(403, 'Token tidak valid atau sudah kadaluarsa.');
        }

        if (tenant('id') !== $data['tenant_id']) {
            abort(403, 'Token tidak cocok dengan program studi ini.');
        }

        $user = User::withoutGlobalScopes()->find($data['user_id']);

        if (!$user) {
            abort(403, 'User tidak ditemukan.');
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Logout.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $central = config('tenancy.central_domains')[0] ?? 'localhost';
        $scheme  = $request->getScheme();
        $port    = $request->getPort();
        $portPart = ($port && !in_array((int) $port, [80, 443], true)) ? ":{$port}" : '';

        return redirect()->away("{$scheme}://{$central}{$portPart}/");
    }
}