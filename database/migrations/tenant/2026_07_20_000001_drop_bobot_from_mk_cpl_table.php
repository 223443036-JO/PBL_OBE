<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mk_cpl', function (Blueprint $table) {
            $table->dropColumn('bobot');
        });
    }

    public function down(): void
    {
        Schema::table('mk_cpl', function (Blueprint $table) {
            $table->integer('bobot')->default(0);
        });
    }
};