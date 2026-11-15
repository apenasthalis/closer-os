<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('refunds', function (Blueprint $t) {
            $t->id();
            $t->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('closer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->bigInteger('amount_cents');
            $t->date('refunded_at');
            $t->string('reason')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('refunds'); }
};
