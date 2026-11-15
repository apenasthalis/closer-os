<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sales', function (Blueprint $t) {
            $t->id();
            $t->foreignId('lead_id')->unique()->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('operation_id')->nullable()->constrained('operations')->nullOnDelete();
            $t->text('description')->nullable();
            $t->date('closed_at');
            $t->decimal('commission_percent',5,2)->default(0);
            $t->string('receipt_path')->nullable();
            $t->timestamps();
            $t->index('closed_at');
        });
    }
    public function down(): void { Schema::dropIfExists('sales'); }
};
