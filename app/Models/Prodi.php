<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Prodi extends Model
{
    use BelongsToTenant;

    // $connection = 'central' dihapus, sekarang pakai DB utama (kurikulum_merged)
    protected $fillable = ['kode', 'nama', 'tenant_id'];
}
