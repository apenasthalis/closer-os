<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('lead_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $t->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('type');
            $t->string('from_stage')->nullable();
            $t->string('to_stage')->nullable();
            $t->json('payload')->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->index(['lead_id','created_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('lead_events'); }
};
