<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('leads', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name');
            $t->string('phone')->nullable();
            $t->string('email')->nullable();
            $t->text('description')->nullable();
            $t->timestamp('call_at')->nullable();
            $t->string('stage')->default('lead_agendado');
            $t->timestamp('stage_changed_at')->nullable();
            $t->unsignedInteger('no_show_count')->default(0);
            $t->string('loss_reason')->nullable();
            $t->text('loss_note')->nullable();
            $t->json('qualification')->nullable();
            $t->timestamps();
            $t->index(['user_id','stage']);
            $t->index('call_at');
        });
    }
    public function down(): void { Schema::dropIfExists('leads'); }
};
