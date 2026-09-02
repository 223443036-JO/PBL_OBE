<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DosenBiodata extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'nama_lengkap', 'gelar_depan', 'gelar_belakang',
        'nip', 'nidn', 'email', 'no_hp', 'prodi',
        'jabatan_akademik',
        // FIX: kolom baru, terpisah dari jabatan_akademik. Dipakai
        // buat posisi struktural (Kaprodi, Kajur), sedangkan
        // jabatan_akademik tetap murni buat pangkat (Lektor, dst).
        // Satu dosen bisa punya dua-duanya sekaligus.
        'jabatan_struktural',
        'bidang_keahlian', 'alamat',
    ];

    public function kelasWali()
    {
        return $this->hasMany(Kelas::class, 'wali_dosen_id');
    }

    public function mataKuliahs()
    {
        return $this->belongsToMany(MataKuliah::class, 'dosen_biodata_mata_kuliah', 'dosen_biodata_id', 'mata_kuliah_id')
                    ->withTimestamps();
    }

    public function user()
    {
        return $this->hasOne(User::class, 'dosen_biodata_id');
    }
}