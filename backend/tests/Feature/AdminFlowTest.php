<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminFlowTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_admin_can_fetch_customer_and_worker_management_payloads(): void
    {
        $admin = Admin::create([
            'name' => 'Test Admin',
            'username' => 'ops',
            'password' => bcrypt('secret123'),
        ]);

        $customer = Customer::create([
            'full_name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'phone' => '9999999999',
            'password' => bcrypt('secret123'),
            'address' => 'London',
        ]);

        $token = $admin->createToken('admin-token', ['admin'])->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/customers');

        $response->assertOk();
        $response->assertJsonFragment(['email' => 'ada@example.com']);
    }
}
