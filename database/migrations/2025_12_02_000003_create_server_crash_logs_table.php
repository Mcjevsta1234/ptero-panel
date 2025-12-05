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
        Schema::create('server_crash_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('server_id');
            $table->string('filename');
            $table->string('log_type'); // 'latest' or 'crash'
            $table->string('mclo_url');
            $table->timestamp('uploaded_at');
            $table->timestamps();

            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->index(['server_id', 'uploaded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('server_crash_logs');
    }
};
