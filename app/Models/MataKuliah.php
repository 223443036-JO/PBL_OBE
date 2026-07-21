<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class MataKuliah extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'kode_mk',
        'nama_mk',
        'sks',
        'jenis',
        'semester',
        'sifat_pengambilan',
        'cara_pembelajaran',
        'deskripsi',
        // FIX: 'prasyarat_id' dihapus dari fillable karena sudah
        // digantikan relasi many-to-many lewat prasyarats()
    ];

    public function cpls()
    {
        return $this->belongsToMany(Cpl::class, 'mk_cpl', 'mata_kuliah_id', 'cpl_id')
                    ->withTimestamps();
    }

    public function cpmks()
    {
        return $this->hasMany(Cpmk::class);
    }

    public function dosenPengampu()
    {
        return $this->belongsToMany(DosenBiodata::class, 'dosen_biodata_mata_kuliah', 'mata_kuliah_id', 'dosen_biodata_id')
                    ->withTimestamps();
    }

    // =============================================================
    // FIX: relasi prasyarat() lama (belongsTo, hanya 1 prasyarat)
    // diganti jadi prasyarats() (belongsToMany, banyak prasyarat).
    //
    // MASALAH SEBELUMNYA: satu MK cuma bisa punya 1 prasyarat karena
    // pakai kolom FK tunggal prasyarat_id. Padahal di RPS asli,
    // satu MK bisa butuh banyak prasyarat sekaligus (contoh: Ekonomi
    // Teknik butuh 3 prasyarat: Praktek Produksi, Pengetahuan
    // Lingkungan, dan Matematika Terapan 2).
    //
    // Relasi ini self-referencing many-to-many: MataKuliah yang sama
    // bisa jadi "pemilik" prasyarat maupun "jadi" prasyarat untuk MK lain.
    // =============================================================
    public function prasyarats()
    {
        return $this->belongsToMany(
            MataKuliah::class,
            'mata_kuliah_prasyarat',
            'mata_kuliah_id',
            'prasyarat_id'
        )->withTimestamps();
    }

    /**
     * Kebalikan dari prasyarats() — MK mana saja yang menjadikan
     * MK ini sebagai prasyaratnya. Berguna untuk validasi, misalnya
     * mencegah penghapusan MK yang masih jadi prasyarat MK lain.
     */
    public function menjadiPrasyaratUntuk()
    {
        return $this->belongsToMany(
            MataKuliah::class,
            'mata_kuliah_prasyarat',
            'prasyarat_id',
            'mata_kuliah_id'
        )->withTimestamps();
    }

    public function rps()
    {
        return $this->hasMany(Rps::class);
    }
}