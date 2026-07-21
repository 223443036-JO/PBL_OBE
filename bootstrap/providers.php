<?php

use App\Providers\AppServiceProvider;

// TenancyServiceProvider dihapus karena sudah tidak pakai multi-tenant DB
// Semua data sekarang ada di satu database kurikulum_merged
// dengan kolom tenant_id sebagai pembeda antar prodi

return [
    AppServiceProvider::class,
];
