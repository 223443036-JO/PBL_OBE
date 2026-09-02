<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class Kelas extends Model
{
    use HasFactory, BelongsToTenant;

    protected $table = 'kelas';

    protected $fillable = [
        'kode_kelas',
        'tingkat',
        'tahun_masuk',
        'wali_dosen_id',
        'tenant_id',
    ];

    /**
     * Mahasiswa yang berada di kelas ini.
     */
    public function mahasiswas()
    {
        return $this->hasMany(Mahasiswa::class, 'kelas_id');
    }

    /**
     * Dosen yang menjadi wali kelas.
     */
    public function waliDosen()
    {
        return $this->belongsTo(DosenBiodata::class, 'wali_dosen_id');
    }
}