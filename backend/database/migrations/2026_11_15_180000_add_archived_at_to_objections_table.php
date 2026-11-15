<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('objections', 'archived_at')) {
            Schema::table('objections', function (Blueprint $t) {
                $t->timestamp('archived_at')->nullable();
            });
        }
    }
    public function down(): void
    {
        if (Schema::hasColumn('objections', 'archived_at')) {
            Schema::table('objections', function (Blueprint $t) {
                $t->dropColumn('archived_at');
            });
        }
    }
};
