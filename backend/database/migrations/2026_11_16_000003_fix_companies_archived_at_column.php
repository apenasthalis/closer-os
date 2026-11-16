<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('companies', 'archived_at')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->timestamp('archived_at')->nullable()->after('name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('companies', 'archived_at')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->dropColumn('archived_at');
            });
        }
    }
};
