<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('call_scorecards', function (Blueprint $t) {
            $t->id();
            $t->foreignId('call_id')->unique()->constrained()->cascadeOnDelete();
            $t->json('criteria')->nullable();
            $t->unsignedInteger('talk_ratio')->default(0);
            $t->unsignedInteger('penalty')->default(0);
            $t->unsignedInteger('score')->default(0);
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('call_scorecards'); }
};
