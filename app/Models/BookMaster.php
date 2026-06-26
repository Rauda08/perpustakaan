<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookMaster extends Model
{
    protected $fillable = [
        'title',
        'author',
        'category',
        'shelf',
        'publish_year',
    ];

    protected $casts = [
        'publish_year' => 'integer',
    ];

    public function copies(): HasMany
    {
        return $this->hasMany(BookCopy::class, 'book_master_id');
    }

    public function bookCopies(): HasMany
    {
        return $this->hasMany(BookCopy::class, 'book_master_id');
    }

    public function availableCopies(): HasMany
    {
        return $this->hasMany(BookCopy::class, 'book_master_id')
            ->where('status', 'Tersedia');
    }

    public function borrowedCopies(): HasMany
    {
        return $this->hasMany(BookCopy::class, 'book_master_id')
            ->where('status', 'Dipinjam');
    }
}
