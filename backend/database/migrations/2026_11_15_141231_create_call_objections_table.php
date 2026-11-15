<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('call_objections', function (Blueprint $t) {
            $t->id();
            $t->foreignId('call_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('objection_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('closer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->boolean('resolved')->default(false);
            $t->boolean('sale_happened')->default(false);
            $t->text('notes')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('call_objections'); }
};
