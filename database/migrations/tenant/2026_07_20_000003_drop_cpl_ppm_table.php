<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('cpl_ppm');
    }

    public function down(): void
    {
        Schema::create('cpl_ppm', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cpl_id')->constrained('cpls')->onDelete('cascade');
            $table->foreignId('ppm_id')->constrained('ppms')->onDelete('cascade');
            $table->boolean('is_selected')->default(false);
            $table->timestamps();
        });
    }
};