<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('compensation_rules', function (Blueprint $t) {
            $t->id();
            $t->foreignId('company_id')->constrained()->cascadeOnDelete();
            $t->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name');
            $t->bigInteger('monthly_cash_target_cents')->default(0);
            $t->bigInteger('full_fixed_cents')->default(0);
            $t->decimal('intermediate_percent',5,2)->default(70);
            $t->bigInteger('intermediate_fixed_cents')->default(0);
            $t->date('effective_from');
            $t->date('effective_to')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('compensation_rules'); }
};
