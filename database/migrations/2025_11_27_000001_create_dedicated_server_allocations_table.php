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
        Schema::create('dedicated_server_allocations', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('node_id');
            $table->string('name')->nullable(); // Friendly name for the allocation (e.g., "Production Server")
            
            // Resource limits
            $table->unsignedBigInteger('memory')->comment('Memory in MB');
            $table->unsignedInteger('disk')->comment('Disk space in MB');
            $table->unsignedInteger('cpu')->comment('CPU limit in percentage');
            $table->integer('swap')->default(0)->comment('Swap in MB, -1 for unlimited');
            $table->integer('io')->default(500)->comment('IO performance');
            
            // Overallocation settings
            $table->boolean('allow_memory_overallocation')->default(false);
            $table->boolean('allow_disk_overallocation')->default(false);
            
            // Port range allocation
            $table->unsignedInteger('port_range_start')->nullable();
            $table->unsignedInteger('port_range_end')->nullable();
            
            // Database limits
            $table->integer('database_limit')->default(0)->comment('0 = none, -1 = unlimited');
            $table->integer('allocation_limit')->default(0)->comment('0 = none, -1 = unlimited');
            $table->integer('backup_limit')->default(0)->comment('0 = none, -1 = unlimited');
            
            // Allowed nests/eggs (JSON array of IDs)
            $table->json('allowed_nests')->nullable()->comment('Array of nest IDs user can access');
            $table->json('allowed_eggs')->nullable()->comment('Array of egg IDs user can access, null = all from allowed nests');
            
            // Status
            $table->boolean('active')->default(true);
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('node_id')->references('id')->on('nodes')->onDelete('cascade');
            
            // Indexes
            $table->index(['user_id', 'active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dedicated_server_allocations');
    }
};
