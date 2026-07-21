<?php

namespace Tests\Feature;

use App\Models\Customer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class CustomerProfileTest extends TestCase
{
    public function test_customer_can_update_email_and_profile_preferences(): void
    {
        $customer = Customer::create([
            'full_name' => 'Test Customer',
            'email' => 'customer-profile-test-'.Str::random(6).'@example.com',
            'phone' => '+91 98765 00000',
            'password' => Hash::make('password123'),
            'address' => 'Old address',
            'booking_notifications' => true,
            'email_notifications' => true,
            'theme_preference' => 'dark',
        ]);

        $token = $customer->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/me', [
                'full_name' => 'Updated Name',
                'email' => 'updated-'.Str::random(6).'@example.com',
                'phone' => '+91 98765 11111',
                'address' => 'New address',
                'booking_notifications' => false,
                'email_notifications' => false,
                'theme_preference' => 'light',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('customers', ['id' => $customer->id, 'booking_notifications' => 0, 'email_notifications' => 0, 'theme_preference' => 'light']);
    }

    public function test_customer_can_upload_profile_photo_with_profile_update(): void
    {
        Storage::fake('public');

        $customer = Customer::create([
            'full_name' => 'Photo Customer',
            'email' => 'customer-photo-'.Str::random(6).'@example.com',
            'phone' => '+91 98765 22222',
            'password' => Hash::make('password123'),
            'address' => 'Old address',
        ]);

        $file = new UploadedFile(
            tempnam(sys_get_temp_dir(), 'avatar'),
            'avatar.png',
            'image/png',
            null,
            true,
        );
        file_put_contents($file->getPathname(), base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQABAAEAAQx+0wAAAABJRU5ErkJggg=='));

        $response = $this->actingAs($customer, 'sanctum')->call('PUT', '/api/me', [
            'full_name' => 'Photo Customer',
            'email' => 'customer-photo-'.Str::random(6).'@example.com',
            'phone' => '+91 98765 22222',
            'address' => 'Updated address',
        ], [], ['profile_photo' => $file]);

        $response->assertOk();
        $response->assertJsonPath('user.address', 'Updated address');
        $this->assertNotNull($customer->fresh()->profile_photo);
        $this->assertStringContainsString('avatar', $customer->fresh()->profile_photo);
    }
}
