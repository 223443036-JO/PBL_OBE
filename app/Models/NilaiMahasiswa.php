<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class NilaiMahasiswa extends Model
{
    use BelongsToTenant;

    protected $table = 'nilai_mahasiswas';
    protected $fillable = [
        'mahasiswa_id', 'cpmk_id', 'rps_id',
        'quiz', 'tugas', 'project', 'uts', 'uas', 'nilai_akhir_cpmk',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    public function cpmk()
    {
        return $this->belongsTo(Cpmk::class);
    }

    public function rps()
    {
        return $this->belongsTo(Rps::class);
    }
}
