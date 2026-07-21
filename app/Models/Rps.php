<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Rps extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'mata_kuliah_id', 'dosen_biodata_id', 'tahun_akademik', 'kode_dokumen',
        'tanggal_penyusunan', 'pustaka_utama', 'pustaka_pendukung',
        'bahan_kajian_utama', 'tte_dosen', 'tte_kaprodi', 'tte_kajur',
        'komponen_labels', 'status',
    ];

    protected $casts = [
        'komponen_labels' => 'array',
    ];

    public static function defaultKomponenLabels(): array
    {
        return [
            'quiz'    => 'Quiz',
            'tugas'   => 'Tugas',
            'project' => 'Project',
            'uts'     => 'UTS',
            'uas'     => 'UAS',
        ];
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function dosenBiodata()
    {
        return $this->belongsTo(DosenBiodata::class);
    }

    public function details()
    {
        return $this->hasMany(RpsDetail::class);
    }

    public function penilaians()
    {
        return $this->hasMany(RpsPenilaian::class);
    }
}