<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceCategory extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'base_price', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean', 'base_price' => 'decimal:2'];
    }

    public function workers()
    {
        return $this->hasMany(Worker::class);
    }
}
