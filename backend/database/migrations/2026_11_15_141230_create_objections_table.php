<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('objections', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('category')->nullable();
            $t->text('suggested_response')->nullable();
            $t->decimal('reference_conversion',5,2)->nullable();
            $t->timestamp('archived_at')->nullable();
            $t->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('objections'); }
};
