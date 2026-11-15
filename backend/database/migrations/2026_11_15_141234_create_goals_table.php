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
            $t->string('metric');
            $t->decimal('target',15,2)->default(0);
            $t->timestamps();
            $t->unique(['user_id','company_id','department_id','month','metric']);
        });
    }
    public function down(): void { Schema::dropIfExists('goals'); }
};
