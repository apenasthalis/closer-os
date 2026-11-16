<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('calls', function (Blueprint $t) {
            if (!Schema::hasColumn('calls', 'lead_id')) $t->foreignId('lead_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            if (!Schema::hasColumn('calls', 'company_id')) $t->foreignId('company_id')->nullable()->after('lead_id')->constrained()->nullOnDelete();
            if (!Schema::hasColumn('calls', 'department_id')) $t->foreignId('department_id')->nullable()->after('company_id')->constrained()->nullOnDelete();
            if (!Schema::hasColumn('calls', 'call_at')) $t->timestamp('call_at')->nullable()->after('department_id');
            if (!Schema::hasColumn('calls', 'status')) $t->string('status')->default('held')->after('call_at');
            if (!Schema::hasColumn('calls', 'notes')) $t->text('notes')->nullable()->after('status');
        });
        Schema::table('call_scorecards', function (Blueprint $t) {
            if (!Schema::hasColumn('call_scorecards', 'criteria')) $t->json('criteria')->nullable()->after('call_id');
            if (!Schema::hasColumn('call_scorecards', 'talk_ratio')) $t->unsignedInteger('talk_ratio')->default(0)->after('criteria');
            if (!Schema::hasColumn('call_scorecards', 'penalty')) $t->unsignedInteger('penalty')->default(0)->after('talk_ratio');
            if (!Schema::hasColumn('call_scorecards', 'score')) $t->unsignedInteger('score')->default(0)->after('penalty');
        });
    }
    public function down(): void {}
};
