<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('calls', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $t->timestamp('call_at')->nullable();
            $t->string('status')->default('held'); // held|no_show|scheduled
            $t->text('notes')->nullable();
            $t->timestamps();
            $t->index(['user_id','call_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('calls'); }
};
