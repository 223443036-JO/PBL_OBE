<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles, BelongsToTenant;

    protected $fillable = [
        'dosen_biodata_id',
        'name',
        'email',
        'password',
        'nip',
        'tenant_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    public function getDosenBiodataAttribute(): ?DosenBiodata
    {
        if (!$this->dosen_biodata_id) {
            return null;
        }
        return DosenBiodata::query()->find($this->dosen_biodata_id);
    }
}
