<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_can_run_twice_without_errors(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertTrue(true);

        $this->seed(DatabaseSeeder::class);

        $this->assertTrue(true);
    }
}
