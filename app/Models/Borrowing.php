<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Carbon\Carbon;

class Borrowing extends Model
{
    protected $fillable = [
        'batch_id', 'member_id', 'book_copy_id', 'borrow_date', 'due_date',
        'return_date', 'return_time', 'status', 'loan_type', 'loan_sub_type',
        'quantity', 'class_name'
    ];

    protected $casts = [
        'borrow_date' => 'date',
        'due_date' => 'date',
        'return_date' => 'date',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function bookCopy(): BelongsTo
    {
        return $this->belongsTo(BookCopy::class);
    }

    public function penalty(): HasOne
    {
        return $this->hasOne(Penalty::class);
    }

    /**
     * Update status terlambat berdasarkan tanggal sekarang
     */
    public function updateLateStatus(): void
    {
        if ($this->status === 'Aktif' && $this->due_date < Carbon::today()) {
            $this->update(['status' => 'Terlambat']);
        }
    }

    /**
     * Scope untuk peminjaman aktif
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['Aktif', 'Terlambat']);
    }

    /**
     * Scope untuk peminjaman yang sudah dikembalikan
     */
    public function scopeReturned($query)
    {
        return $query->where('status', 'Dikembalikan');
    }
}
