<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('monthly_compensation_snapshots', function (Blueprint $table) {
            if (!Schema::hasColumn('monthly_compensation_snapshots', 'intermediate_percent')) {
                $table->decimal('intermediate_percent', 5, 2)->default(70)->after('target_cents');
            }
            if (!Schema::hasColumn('monthly_compensation_snapshots', 'full_fixed_cents')) {
                $table->bigInteger('full_fixed_cents')->default(0)->after('intermediate_percent');
            }
            if (!Schema::hasColumn('monthly_compensation_snapshots', 'intermediate_fixed_cents')) {
                $table->bigInteger('intermediate_fixed_cents')->default(0)->after('full_fixed_cents');
            }
        });
    }

    public function down(): void
    {
        Schema::table('monthly_compensation_snapshots', function (Blueprint $table) {
            $cols = [];
            foreach (['intermediate_percent', 'full_fixed_cents', 'intermediate_fixed_cents'] as $col) {
                if (Schema::hasColumn('monthly_compensation_snapshots', $col)) $cols[] = $col;
            }
            if ($cols) $table->dropColumn($cols);
        });
    }
};
