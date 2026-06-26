<?php

namespace App\Http\Controllers\Api;

use App\Models\Borrowing;
use App\Models\Penalty;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PenaltyController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Penalty::query()->with(['member', 'bookCopy.bookMaster', 'borrowing']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('penalty_book_title', 'like', "%{$search}%")
                    ->orWhere('reason', 'like', "%{$search}%")
                    ->orWhereHas('member', fn ($m) => $m->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('bookCopy', fn ($c) => $c->where('number', 'like', "%{$search}%"))
                    ->orWhereHas('bookCopy.bookMaster', fn ($b) => $b->where('title', 'like', "%{$search}%"));
            });
        }

        if ($reason = $request->query('reason')) {
            $query->where('reason', $reason);
        }

        $penalties = $query->latest('id')->get()->map(fn (Penalty $penalty) => $this->penaltyResource($penalty));

        return $this->ok($penalties);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'borrowingId' => ['required_without:borrowing_id', 'integer', 'exists:borrowings,id'],
            'borrowing_id' => ['required_without:borrowingId', 'integer', 'exists:borrowings,id'],
            'date' => ['nullable', 'date'],
            'reason' => ['required', Rule::in(['Terlambat', 'Rusak', 'Hilang'])],
            'penaltyType' => ['required_without:penalty_type', Rule::in(['Buku Donasi', 'Buku Pengganti'])],
            'penalty_type' => ['required_without:penaltyType', Rule::in(['Buku Donasi', 'Buku Pengganti'])],
            'penaltyBookTitle' => ['required_without:penalty_book_title', 'string', 'max:255'],
            'penalty_book_title' => ['required_without:penaltyBookTitle', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $borrowing = Borrowing::with(['member', 'bookCopy.bookMaster'])->findOrFail($data['borrowing_id'] ?? $data['borrowingId']);

        $penalty = Penalty::updateOrCreate(
            ['borrowing_id' => $borrowing->id],
            [
                'member_id' => $borrowing->member_id,
                'book_copy_id' => $borrowing->book_copy_id,
                'loan_type' => $borrowing->loan_type,
                'date' => $data['date'] ?? now()->toDateString(),
                'reason' => $data['reason'],
                'penalty_type' => $data['penalty_type'] ?? $data['penaltyType'],
                'penalty_book_title' => $data['penalty_book_title'] ?? $data['penaltyBookTitle'],
                'notes' => $data['notes'] ?? null,
            ]
        );

        return $this->ok($this->penaltyResource($penalty), 'Sanksi berhasil disimpan', 201);
    }

    public function show(Penalty $penalty)
    {
        return $this->ok($this->penaltyResource($penalty));
    }

    public function update(Request $request, Penalty $penalty)
    {
        $data = $request->validate([
            'date' => ['sometimes', 'required', 'date'],
            'reason' => ['sometimes', 'required', Rule::in(['Terlambat', 'Rusak', 'Hilang'])],
            'penaltyType' => ['sometimes', 'required', Rule::in(['Buku Donasi', 'Buku Pengganti'])],
            'penalty_type' => ['sometimes', 'required', Rule::in(['Buku Donasi', 'Buku Pengganti'])],
            'penaltyBookTitle' => ['sometimes', 'required', 'string', 'max:255'],
            'penalty_book_title' => ['sometimes', 'required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $penalty->update([
            'date' => $data['date'] ?? $penalty->date,
            'reason' => $data['reason'] ?? $penalty->reason,
            'penalty_type' => $data['penalty_type'] ?? $data['penaltyType'] ?? $penalty->penalty_type,
            'penalty_book_title' => $data['penalty_book_title'] ?? $data['penaltyBookTitle'] ?? $penalty->penalty_book_title,
            'notes' => array_key_exists('notes', $data) ? $data['notes'] : $penalty->notes,
        ]);

        return $this->ok($this->penaltyResource($penalty->refresh()), 'Sanksi berhasil diperbarui');
    }

    public function destroy(Penalty $penalty)
    {
        $penalty->delete();

        return $this->ok(null, 'Sanksi berhasil dihapus');
    }
}
