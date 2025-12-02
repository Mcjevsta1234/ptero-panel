<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('server_mods', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('server_id');
            $table->string('mod_id'); // CurseForge project ID
            $table->string('file_id'); // CurseForge file ID
            $table->string('name');
            $table->string('version');
            $table->string('filename');
            $table->enum('type', ['mod', 'plugin'])->default('mod');
            $table->enum('status', ['pending', 'downloading', 'installed', 'failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->index(['server_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('server_mods');
    }
};
