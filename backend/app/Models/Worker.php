<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Worker extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'service_category_id', 'full_name', 'email', 'phone', 'password', 'profile_photo',
        'address', 'experience', 'skills', 'price', 'availability', 'verified', 'status', 'latitude', 'longitude',
    ];

    protected $hidden = ['password'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'skills' => 'array',
            'verified' => 'boolean',
            'price' => 'decimal:2',
            'rating' => 'float',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function category()
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
