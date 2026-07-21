<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Iea extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = ['kode', 'deskripsi'];

    public function cpls()
    {
        return $this->belongsToMany(Cpl::class, 'cpl_iea')
                    ->withPivot('is_selected')
                    ->withTimestamps();
    }

    public function ppms()
    {
        return $this->belongsToMany(Ppm::class, 'ppm_iea')
                    ->withPivot('is_selected')
                    ->withTimestamps();
    }
}
