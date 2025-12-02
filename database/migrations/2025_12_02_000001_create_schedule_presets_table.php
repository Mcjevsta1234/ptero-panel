<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_presets', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('cron_day_of_week')->default('*');
            $table->string('cron_month')->default('*');
            $table->string('cron_day_of_month')->default('*');
            $table->string('cron_hour')->default('*');
            $table->string('cron_minute')->default('*');
            $table->boolean('only_when_online')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_presets');
    }
};
