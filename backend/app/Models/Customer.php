<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['full_name', 'email', 'phone', 'password', 'address', 'profile_photo', 'latitude', 'longitude', 'booking_notifications', 'email_notifications', 'theme_preference'];
    protected $hidden = ['password'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
