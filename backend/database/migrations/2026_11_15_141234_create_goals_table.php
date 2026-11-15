<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('goals', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('company_id')->constrained()->cascadeOnDelete();
            $t->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $t->date('month');
            $t->string('metric'); // calls_scheduled|calls_held|sales|revenue_cents|cash_cents|commission_cents
            $t->bigInteger('target_value')->default(0);
            $t->timestamps();
            $t->unique(['user_id','company_id','department_id','month','metric'], 'goals_unique');
        });
    }
    public function down(): void { Schema::dropIfExists('goals'); }
};
