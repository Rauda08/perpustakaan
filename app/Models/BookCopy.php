<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BookCopy extends Model
{
    protected $fillable = [
        'book_master_id',
        'number',
        'status',
        'acquisition_year',
    ];

    protected $casts = [
        'acquisition_year' => 'integer',
    ];

    public function bookMaster(): BelongsTo
    {
        return $this->belongsTo(BookMaster::class, 'book_master_id');
    }

    public function borrowings(): HasMany
    {
        return $this->hasMany(Borrowing::class, 'book_copy_id');
    }

    public function activeBorrowing(): HasOne
    {
        return $this->hasOne(Borrowing::class, 'book_copy_id')
            ->whereIn('status', ['Aktif', 'Terlambat']);
    }

    public function penalties(): HasMany
    {
        return $this->hasMany(Penalty::class, 'book_copy_id');
    }
}
