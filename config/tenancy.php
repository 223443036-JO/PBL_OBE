<?php

declare(strict_types=1);

use Stancl\Tenancy\Database\Models\Domain;
use App\Models\Tenant;

return [
    'tenant_model' => Tenant::class,
    'id_generator' => Stancl\Tenancy\UUIDGenerator::class,

    'domain_model' => Domain::class,

    'central_domains' => [
        '127.0.0.1',
        'localhost',
    ],

    /*
    |--------------------------------------------------------------------------
    | SINGLE DATABASE TENANCY
    |--------------------------------------------------------------------------
    | DatabaseTenancyBootstrapper dihapus dari sini.
    | Artinya tenancy TIDAK lagi switch database saat tenant diinisialisasi.
    | Semua tenant pakai satu database yang sama (kurikulum_merged).
    | Isolasi data per tenant ditangani oleh BelongsToTenant trait
    | yang otomatis filter WHERE tenant_id = ? di setiap query.
    */
    'bootstrappers' => [
        // Stancl\Tenancy\Bootstrappers\DatabaseTenancyBootstrapper::class, // DINONAKTIFKAN
        Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class,
        Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper::class,
        Stancl\Tenancy\Bootstrappers\QueueTenancyBootstrapper::class,
    ],

    'database' => [
        'central_connection' => 'central',
        'template_tenant_connection' => 'mysql',
        'prefix' => env('TENANCY_DATABASE_PREFIX', 'kurikulum_'),
        'suffix' => '',
        'managers' => [
            'sqlite'   => Stancl\Tenancy\TenantDatabaseManagers\SQLiteDatabaseManager::class,
            'mysql'    => Stancl\Tenancy\TenantDatabaseManagers\MySQLDatabaseManager::class,
            'mariadb'  => Stancl\Tenancy\TenantDatabaseManagers\MySQLDatabaseManager::class,
            'pgsql'    => Stancl\Tenancy\TenantDatabaseManagers\PostgreSQLDatabaseManager::class,
        ],
    ],

    'cache' => [
        'tag_base' => 'tenant',
    ],

    'filesystem' => [
        'suffix_base' => 'tenant',
        'disks' => [
            'local',
            'public',
        ],
        'root_override' => [
            'local'  => '%storage_path%/app/',
            'public' => '%storage_path%/app/public/',
        ],
        'suffix_storage_path' => true,
        'asset_helper_tenancy' => false,
    ],

    'redis' => [
        'prefix_base' => 'tenant',
        'prefixed_connections' => [],
    ],

    'features' => [],

    'routes' => true,

    'migration_parameters' => [
        '--force'    => true,
        '--path'     => [database_path('migrations/tenant')],
        '--realpath' => true,
    ],

    'seeder_parameters' => [
        '--class' => 'DatabaseSeeder',
    ],
];
