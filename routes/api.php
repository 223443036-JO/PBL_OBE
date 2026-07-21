<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| FIX KEAMANAN KRITIS:
| Endpoint "/v1/_debug/spawn-admin" sudah DIHAPUS TOTAL.
|
| Endpoint sebelumnya memungkinkan SIAPAPUN di internet membuat akun
| Kaprodi (akses admin penuh) hanya bermodal token statis yang
| ter-hardcode di kode ("POLMAN-TRIN-DEV-99"), tanpa autentikasi
| atau session login sama sekali.
|
| Karena aplikasi sudah online (di-hosting), endpoint ini adalah
| celah keamanan paling serius dari seluruh audit. Siapapun yang
| tahu token tersebut (termasuk siapapun yang membaca source code,
| atau membongkar request lewat browser devtools) bisa membuat akun
| admin dari luar tanpa login sama sekali.
|
| Kalau suatu saat butuh endpoint sejenis untuk development, jangan
| pernah pakai token statis. Gunakan environment check ketat
| (app()->environment('local')) DAN matikan total saat APP_ENV=production,
| atau lebih baik pakai artisan command/tinker yang hanya bisa
| dijalankan lewat akses server langsung.
|
*/