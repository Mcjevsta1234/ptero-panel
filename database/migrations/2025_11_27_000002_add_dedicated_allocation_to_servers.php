<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->unsignedBigInteger('dedicated_allocation_id')->nullable()->after('owner_id');
            $table->foreign('dedicated_allocation_id')
                  ->references('id')
                  ->on('dedicated_server_allocations')
                  ->onDelete('restrict'); // Prevent deletion if servers exist
            
            $table->index('dedicated_allocation_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('servers', function (Blueprint $table) {
            $table->dropForeign(['dedicated_allocation_id']);
            $table->dropColumn('dedicated_allocation_id');
        });
    }
};
