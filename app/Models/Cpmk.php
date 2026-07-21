<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cpmk extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = ['mata_kuliah_id', 'kode_cpmk', 'deskripsi'];

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function indikatorKinerjas()
    {
        return $this->belongsToMany(IndikatorKinerja::class, 'cpmk_indikator_kinerja');
    }

    public function rpsPenilaians()
    {
        return $this->hasMany(RpsPenilaian::class);
    }
}
