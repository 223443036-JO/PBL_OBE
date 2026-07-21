<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Kelas extends Model
{
    use BelongsToTenant;

    protected $table = 'kelas';
    protected $fillable = ['kode_kelas', 'tingkat', 'tahun_masuk'];

    public function mahasiswas()
    {
        return $this->hasMany(Mahasiswa::class);
    }
}
