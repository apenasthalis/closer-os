<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('follow_up_tasks', function (Blueprint $table) {
            $table->string('cadence_step')->nullable()->after('had_response');
        });
    }

    public function down(): void
    {
        Schema::table('follow_up_tasks', function (Blueprint $table) {
            $table->dropColumn('cadence_step');
        });
    }
};
