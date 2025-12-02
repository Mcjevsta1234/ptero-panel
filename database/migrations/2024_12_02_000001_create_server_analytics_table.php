<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('server_analytics', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('server_id');
            $table->float('cpu_usage')->default(0);
            $table->bigInteger('memory_usage')->default(0); // bytes
            $table->bigInteger('disk_usage')->default(0); // bytes
            $table->bigInteger('network_rx')->default(0); // bytes received
            $table->bigInteger('network_tx')->default(0); // bytes transmitted
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->index(['server_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('server_analytics');
    }
};
