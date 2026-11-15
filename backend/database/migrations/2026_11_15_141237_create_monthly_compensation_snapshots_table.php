<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('monthly_compensation_snapshots', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('company_id')->constrained()->cascadeOnDelete();
            $t->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $t->date('month');
            $t->bigInteger('cash_received_cents')->default(0);
            $t->bigInteger('target_cents')->default(0);
            $t->bigInteger('fixed_cents')->default(0);
            $t->bigInteger('commission_cents')->default(0);
            $t->bigInteger('total_cents')->default(0);
            $t->foreignId('rule_id')->nullable()->constrained('compensation_rules')->nullOnDelete();
            $t->timestamps();
            $t->unique(['user_id','company_id','department_id','month']);
        });
    }
    public function down(): void { Schema::dropIfExists('monthly_compensation_snapshots'); }
};
