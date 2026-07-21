<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cpl extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = ['kode', 'deskripsi'];

    public function ieas()
    {
        return $this->belongsToMany(Iea::class, 'cpl_iea')
                    ->withPivot('is_selected')
                    ->withTimestamps();
    }

    public function mataKuliahs()
    {
        return $this->belongsToMany(MataKuliah::class, 'mk_cpl', 'cpl_id', 'mata_kuliah_id')
                    ->withTimestamps();
    }

    public function indikatorKinerjas()
    {
        return $this->hasMany(IndikatorKinerja::class, 'cpl_id');
    }
}