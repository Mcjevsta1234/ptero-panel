<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_preset_tasks', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('preset_id');
            $table->unsignedInteger('sequence_id');
            $table->string('action');
            $table->text('payload')->nullable();
            $table->unsignedInteger('time_offset')->default(0);
            $table->boolean('continue_on_failure')->default(false);
            $table->timestamps();

            $table->foreign('preset_id')->references('id')->on('schedule_presets')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_preset_tasks');
    }
};
