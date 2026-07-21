<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait TenantScoped
{
    protected static function bootTenantScoped(): void
    {
        // Otomatis filter semua query berdasarkan tenant aktif di session
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenantId = session('tenant_id');
            if ($tenantId) {
                $table = (new static)->getTable();
                $builder->where("{$table}.tenant_id", $tenantId);
            }
        });

        // Otomatis isi tenant_id saat data baru dibuat
        static::creating(function ($model) {
            if (empty($model->tenant_id)) {
                $model->tenant_id = session('tenant_id');
            }
        });
    }

    /**
     * Ambil semua data tanpa filter tenant (untuk keperluan admin/debug)
     */
    public static function withoutTenantScope(): Builder
    {
        return static::withoutGlobalScope('tenant');
    }
}
