<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sale_payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $t->string('method'); // pix|card|boleto
            $t->bigInteger('amount_cents');
            $t->unsignedInteger('installments')->default(1);
            $t->bigInteger('gateway_fee_cents')->default(0);
            $t->string('status')->default('pending'); // paid|pending
            $t->date('received_at')->nullable();
            $t->timestamps();
            $t->index('received_at');
        });
    }
    public function down(): void { Schema::dropIfExists('sale_payments'); }
};
