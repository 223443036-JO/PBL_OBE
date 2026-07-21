<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class CapaianCpl extends Model
{
    use BelongsToTenant;

    protected $table    = 'capaian_cpls';
    protected $fillable = [
        'mahasiswa_id', 'cpl_id', 'semester', 'tahun_akademik', 'nilai', 'tercapai',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function cpl()
    {
        return $this->belongsTo(Cpl::class);
    }
}
