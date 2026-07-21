<?php

namespace Tests\Feature;

use App\Models\Admin;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    public function test_admin_login_creates_default_admin_when_database_is_unseeded(): void
    {
        Admin::query()->delete();

        $response = $this->postJson('/api/auth/admin/login', [
            'username' => 'admin',
            'password' => 'password123',
        ]);

        $response->assertOk();
        $response->assertJsonPath('user.role', 'admin');
        $this->assertDatabaseHas('admins', ['username' => 'admin']);
    }
}
