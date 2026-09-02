<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    use BelongsToTenant;

    protected $table = 'kelas';

    protected $fillable = [
        'kode_kelas',
        'tingkat',
        'tahun_masuk',
        'wali_dosen_id',
    ];

    public function mahasiswas()
    {
        return $this->hasMany(Mahasiswa::class);
    }

    public function waliDosen()
    {
        return $this->belongsTo(DosenBiodata::class, 'wali_dosen_id');
    }
}