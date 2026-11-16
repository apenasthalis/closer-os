<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('goals', 'target') && !Schema::hasColumn('goals', 'target_value')) {
            Schema::table('goals', function (Blueprint $table) {
                $table->renameColumn('target', 'target_value');
            });
        } elseif (!Schema::hasColumn('goals', 'target_value')) {
            Schema::table('goals', function (Blueprint $table) {
                $table->bigInteger('target_value')->default(0);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('goals', 'target_value') && !Schema::hasColumn('goals', 'target')) {
            Schema::table('goals', function (Blueprint $table) {
                $table->renameColumn('target_value', 'target');
            });
        }
    }
};
