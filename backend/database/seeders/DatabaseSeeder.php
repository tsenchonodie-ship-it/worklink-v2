<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\AppNotification;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Review;
use App\Models\ServiceCategory;
use App\Models\Worker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $categories = collect([
            ['House Cleaning', 'Routine home cleaning for apartments and villas.', 599],
            ['Deep Cleaning', 'Detailed cleaning for kitchens, bathrooms, and full homes.', 1299],
            ['Electrician', 'Certified electrical repairs, fixtures, and wiring checks.', 499],
            ['Plumber', 'Leak repairs, fittings, blockage clearing, and inspections.', 499],
            ['Carpenter', 'Furniture repair, installation, and custom woodwork.', 699],
            ['Painter', 'Wall painting, touch-ups, and waterproof coating.', 999],
            ['Gardener', 'Garden maintenance, pruning, and balcony plant care.', 449],
            ['AC Repair', 'AC service, diagnostics, gas refill, and seasonal maintenance.', 799],
            ['Appliance Repair', 'Repair support for common home appliances.', 649],
            ['Pest Control', 'Safe pest treatment for homes and offices.', 899],
            ['Home Shifting', 'Packing, loading, and local relocation support.', 2499],
            ['Babysitting', 'Verified short-term and recurring childcare support.', 799],
            ['Elder Care', 'Compassionate home assistance for seniors.', 899],
        ])->map(function ($item) {
            return ServiceCategory::firstOrCreate(
                ['name' => $item[0]],
                [
                    'slug' => Str::slug($item[0]),
                    'description' => $item[1],
                    'base_price' => $item[2],
                    'active' => true,
                ]
            );
        });

        Admin::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'TunaTuna Admin',
                'password' => Hash::make('password123'),
            ]
        );

        $customers = collect([
            ['Aarav Mehta', 'customer@tunatuna.test', '+91 98765 10001', 'Connaught Place, New Delhi'],
            ['Nisha Rao', 'nisha@tunatuna.test', '+91 98765 10002', 'Indiranagar, Bengaluru'],
            ['Kabir Khan', 'kabir@tunatuna.test', '+91 98765 10003', 'Bandra West, Mumbai'],
        ])->map(function ($item) {
            return Customer::firstOrCreate(
                ['email' => $item[1]],
                [
                    'full_name' => $item[0],
                    'phone' => $item[2],
                    'password' => 'password123',
                    'address' => $item[3],
                    'latitude' => 28.6139 + random_int(-70, 70) / 1000,
                    'longitude' => 77.2090 + random_int(-70, 70) / 1000,
                ]
            );
        });

        $workerNames = ['Ravi Sharma', 'Meera Iyer', 'Imran Sheikh', 'Pooja Saini', 'Dev Patel', 'Ananya Roy', 'Sahil Verma', 'Fatima Ali', 'Karan Gill', 'Lata Nair', 'Om Prakash', 'Rhea Sen', 'Vikram Joshi'];

        $workers = $categories->values()->map(function (ServiceCategory $category, int $index) use ($workerNames) {
            $email = 'worker'.($index + 1).'@tunatuna.test';

            return Worker::firstOrCreate(
                ['email' => $email],
                [
                    'service_category_id' => $category->id,
                    'full_name' => $workerNames[$index],
                    'phone' => '+91 90000 '.str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT),
                    'password' => 'password123',
                    'profile_photo' => null,
                    'address' => ['Karol Bagh', 'Jayanagar', 'Andheri', 'Salt Lake', 'Adyar'][$index % 5].', India',
                    'experience' => 2 + ($index % 9),
                    'skills' => [$category->name, 'On-time service', 'Customer-friendly'],
                    'price' => $category->base_price + ($index % 4) * 150,
                    'availability' => ['Available today', 'Available tomorrow', 'Weekends only'][$index % 3],
                    'rating' => round(4.45 + (($index % 6) * .08), 2),
                    'verified' => $index < 11,
                    'latitude' => 28.6139 + random_int(-80, 80) / 1000,
                    'longitude' => 77.2090 + random_int(-80, 80) / 1000,
                ]
            );
        });

        $bookings = collect([
            ['pending', 0, 0, 1],
            ['accepted', 1, 1, 2],
            ['in_progress', 2, 2, 3],
            ['completed', 0, 3, -4],
            ['reviewed', 1, 4, -12],
            ['cancelled', 2, 5, -3],
        ])->map(function ($item) use ($customers, $workers) {
            [$status, $customerIndex, $workerIndex, $dayOffset] = $item;
            $worker = $workers[$workerIndex];

            return Booking::firstOrCreate(
                [
                    'customer_id' => $customers[$customerIndex]->id,
                    'worker_id' => $worker->id,
                    'booking_date' => now()->addDays($dayOffset)->toDateString(),
                    'booking_time' => ['09:30', '11:00', '15:30'][$customerIndex],
                ],
                [
                    'service_category_id' => $worker->service_category_id,
                    'address' => $customers[$customerIndex]->address,
                    'notes' => 'Please call before arriving.',
                    'price' => $worker->price,
                    'status' => $status,
                    'started_at' => in_array($status, ['in_progress', 'completed', 'reviewed'], true) ? now()->subHours(3) : null,
                    'completed_at' => in_array($status, ['completed', 'reviewed'], true) ? now()->subHours(1) : null,
                ]
            );
        });

        if (!Review::where('booking_id', $bookings[4]->id)->exists()) {
            Review::create([
                'booking_id' => $bookings[4]->id,
                'customer_id' => $bookings[4]->customer_id,
                'worker_id' => $bookings[4]->worker_id,
                'rating' => 5,
                'comment' => 'Professional, punctual, and very neat work. I would book again.',
            ]);
        }

        foreach ($customers as $customer) {
            AppNotification::create([
                'notifiable_type' => Customer::class,
                'notifiable_id' => $customer->id,
                'title' => 'Welcome to TunaTuna',
                'message' => 'Browse trusted workers near you and book services in minutes.',
                'type' => 'announcement',
            ]);
        }

        foreach ($workers as $worker) {
            AppNotification::create([
                'notifiable_type' => Worker::class,
                'notifiable_id' => $worker->id,
                'title' => $worker->verified ? 'Profile verified' : 'Verification pending',
                'message' => $worker->verified ? 'You can now receive booking requests.' : 'Admin will review your profile shortly.',
                'type' => 'announcement',
            ]);
        }
    }
}
