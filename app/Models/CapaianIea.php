<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class CapaianIea extends Model
{
    use BelongsToTenant;

    protected $table    = 'capaian_ieas';
    protected $fillable = [
        'mahasiswa_id', 'iea_id', 'semester', 'tahun_akademik', 'nilai',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function iea()
    {
        return $this->belongsTo(Iea::class);
    }
}
