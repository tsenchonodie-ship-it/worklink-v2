<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->boolean('booking_notifications')->default(true)->after('address');
            $table->boolean('email_notifications')->default(true)->after('booking_notifications');
            $table->string('theme_preference')->default('dark')->after('email_notifications');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['booking_notifications', 'email_notifications', 'theme_preference']);
        });
    }
};
