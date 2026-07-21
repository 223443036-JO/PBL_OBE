<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Mahasiswa extends Model
{
    use BelongsToTenant;

    protected $table = 'mahasiswas';
    protected $fillable = ['nim', 'nama', 'kelas_id'];

    public function kelas()
    {
        return $this->belongsTo(Kelas::class);
    }

    public function nilaiMahasiswas()
    {
        return $this->hasMany(NilaiMahasiswa::class);
    }

    public function capaianCpls()
    {
        return $this->hasMany(CapaianCpl::class);
    }

    public function capaianIeas()
    {
        return $this->hasMany(CapaianIea::class);
    }
}
