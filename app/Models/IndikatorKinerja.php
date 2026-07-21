<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IndikatorKinerja extends Model
{
    use HasFactory, BelongsToTenant;

    protected $table = 'indikator_kinerjas';

    protected $fillable = ['cpl_id', 'kode', 'deskripsi'];

    public function cpl()
    {
        return $this->belongsTo(Cpl::class);
    }

    public function cpmks()
    {
        return $this->belongsToMany(Cpmk::class, 'cpmk_indikator_kinerja');
    }
}
