<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ppm extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = ['kode', 'deskripsi'];

    public function ieas()
    {
        return $this->belongsToMany(Iea::class, 'ppm_iea')
                    ->withPivot('is_selected')
                    ->withTimestamps();
    }
}