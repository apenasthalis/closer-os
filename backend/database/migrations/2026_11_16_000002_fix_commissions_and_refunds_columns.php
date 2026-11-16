<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('commissions', function (Blueprint $t) {
            if (!Schema::hasColumn('commissions', 'base_cents')) $t->bigInteger('base_cents')->default(0)->after('period_month');
            if (!Schema::hasColumn('commissions', 'percent')) $t->decimal('percent', 5, 2)->default(0)->after('base_cents');
            if (!Schema::hasColumn('commissions', 'reversed_cents')) $t->bigInteger('reversed_cents')->default(0)->after('amount_cents');
        });
        Schema::table('refunds', function (Blueprint $t) {
            if (!Schema::hasColumn('refunds', 'cash_refunded_cents')) $t->bigInteger('cash_refunded_cents')->default(0)->after('amount_cents');
            if (!Schema::hasColumn('refunds', 'commission_reversed_cents')) $t->bigInteger('commission_reversed_cents')->default(0)->after('cash_refunded_cents');
            if (!Schema::hasColumn('refunds', 'payments_snapshot')) $t->json('payments_snapshot')->nullable()->after('commission_reversed_cents');
        });
    }
    public function down(): void {}
};
