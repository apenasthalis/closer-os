<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('refunds', function (Blueprint $t) {
            $t->id();
            $t->foreignId('sale_id')->unique()->constrained()->cascadeOnDelete();
            $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('closer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->bigInteger('amount_cents');
            $t->bigInteger('cash_refunded_cents')->default(0);
            $t->bigInteger('commission_reversed_cents')->default(0);
            $t->json('payments_snapshot')->nullable();
            $t->date('refunded_at');
            $t->string('reason')->nullable();
            $t->timestamps();
            $t->index('refunded_at');
        });
    }
    public function down(): void { Schema::dropIfExists('refunds'); }
};
