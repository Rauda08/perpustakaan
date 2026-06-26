<?php

namespace App\Http\Controllers\Api;

use App\Models\BookCopy;
use App\Models\Borrowing;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BorrowingController extends BaseApiController
{
    public function index(Request $request)
    {
        $this->refreshLateStatuses();

        $query = Borrowing::query()->with(['member', 'bookCopy.bookMaster', 'penalty']);

        if ($status = $request->query('status')) {
            if ($status === 'active') {
                $query->whereIn('status', ['Aktif', 'Terlambat']);
            } else {
                $query->where('status', $status);
            }
        }

        if ($loanType = $request->query('loanType')) {
            $query->where('loan_type', $loanType);
        }

        if ($memberId = $request->query('memberId')) {
            $query->where('member_id', $memberId);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('batch_id', 'like', "%{$search}%")
                    ->orWhereHas('member', fn ($m) => $m->where('name', 'like', "%{$search}%")->orWhere('class_nip', 'like', "%{$search}%"))
                    ->orWhereHas('bookCopy', fn ($c) => $c->where('number', 'like', "%{$search}%"))
                    ->orWhereHas('bookCopy.bookMaster', fn ($b) => $b->where('title', 'like', "%{$search}%"));
            });
        }

        if ($from = $request->query('from')) {
            $query->whereDate('borrow_date', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->whereDate('borrow_date', '<=', $to);
        }

        $items = $query->latest('id')->get()->map(fn (Borrowing $borrowing) => $this->borrowingResource($borrowing));

        return $this->ok($items);
    }

    public function active(Request $request)
    {
        $request->merge(['status' => 'active']);
        return $this->index($request);
    }

    public function history(Request $request)
    {
        $request->merge(['status' => 'Dikembalikan']);
        return $this->index($request);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'memberId' => ['required_without:member_id', 'integer', 'exists:members,id'],
            'member_id' => ['required_without:memberId', 'integer', 'exists:members,id'],
            'bookCopyId' => ['nullable', 'integer', 'exists:book_copies,id'],
            'book_copy_id' => ['nullable', 'integer', 'exists:book_copies,id'],
            'bookNumber' => ['nullable', 'string', 'exists:book_copies,number'],
            'book_number' => ['nullable', 'string', 'exists:book_copies,number'],
            'bookNumbers' => ['nullable', 'array'],
            'bookNumbers.*' => ['required', 'string', 'exists:book_copies,number'],
            'bookCopyIds' => ['nullable', 'array'],
            'bookCopyIds.*' => ['required', 'integer', 'exists:book_copies,id'],
            'borrowDate' => ['required_without:borrow_date', 'date'],
            'borrow_date' => ['required_without:borrowDate', 'date'],
            'dueDate' => ['required_without:due_date', 'date'],
            'due_date' => ['required_without:dueDate', 'date'],
            'returnTime' => ['nullable', 'string', 'max:20'],
            'return_time' => ['nullable', 'string', 'max:20'],
            'loanType' => ['required_without:loan_type', Rule::in(['Harian', 'Mingguan', 'Tahunan', 'Guru'])],
            'loan_type' => ['required_without:loanType', Rule::in(['Harian', 'Mingguan', 'Tahunan', 'Guru'])],
            'loanSubType' => ['nullable', 'string', 'max:100'],
            'loan_sub_type' => ['nullable', 'string', 'max:100'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'className' => ['nullable', 'string', 'max:100'],
            'class_name' => ['nullable', 'string', 'max:100'],
        ]);

        $memberId = $data['member_id'] ?? $data['memberId'];
        $copyIds = [];

        if (! empty($data['bookCopyIds'])) {
            $copyIds = $data['bookCopyIds'];
        }

        if (! empty($data['bookCopyId']) || ! empty($data['book_copy_id'])) {
            $copyIds[] = $data['book_copy_id'] ?? $data['bookCopyId'];
        }

        $bookNumbers = $data['bookNumbers'] ?? [];
        if (! empty($data['bookNumber']) || ! empty($data['book_number'])) {
            $bookNumbers[] = $data['book_number'] ?? $data['bookNumber'];
        }

        if (! empty($bookNumbers)) {
            $copyIds = array_merge($copyIds, BookCopy::whereIn('number', $bookNumbers)->pluck('id')->all());
        }

        $copyIds = array_values(array_unique(array_filter($copyIds)));

        if (empty($copyIds)) {
            return $this->fail('Pilih minimal satu eksemplar buku.', 422);
        }

        $borrowings = DB::transaction(function () use ($data, $memberId, $copyIds) {
            $copies = BookCopy::whereIn('id', $copyIds)->lockForUpdate()->get();

            if ($copies->count() !== count($copyIds)) {
                throw ValidationException::withMessages(['bookNumbers' => ['Sebagian eksemplar tidak ditemukan.']]);
            }

            $notAvailable = $copies->where('status', '!=', 'Tersedia')->pluck('number')->all();
            if (! empty($notAvailable)) {
                throw ValidationException::withMessages(['bookNumbers' => ['Eksemplar berikut tidak tersedia: '.implode(', ', $notAvailable)]]);
            }

            $latest = Borrowing::max('id') ?? 0;
            $batchId = 'BATCH'.str_pad((string) ($latest + 1), 3, '0', STR_PAD_LEFT);
            $borrowDate = $data['borrow_date'] ?? $data['borrowDate'];
            $dueDate = $data['due_date'] ?? $data['dueDate'];
            $loanType = $data['loan_type'] ?? $data['loanType'];
            $items = collect();

            foreach ($copies as $copy) {
                $borrowing = Borrowing::create([
                    'batch_id' => $batchId,
                    'member_id' => $memberId,
                    'book_copy_id' => $copy->id,
                    'borrow_date' => $borrowDate,
                    'due_date' => $dueDate,
                    'return_time' => $data['return_time'] ?? $data['returnTime'] ?? null,
                    'status' => Carbon::parse($dueDate)->lt(Carbon::today()) ? 'Terlambat' : 'Aktif',
                    'loan_type' => $loanType,
                    'loan_sub_type' => $data['loan_sub_type'] ?? $data['loanSubType'] ?? null,
                    'quantity' => $data['quantity'] ?? 1,
                    'class_name' => $data['class_name'] ?? $data['className'] ?? null,
                ]);

                $copy->update(['status' => 'Dipinjam']);
                $items->push($borrowing->load(['member', 'bookCopy.bookMaster', 'penalty']));
            }

            return $items;
        });

        return $this->ok($borrowings->map(fn (Borrowing $borrowing) => $this->borrowingResource($borrowing)), 'Peminjaman berhasil disimpan', 201);
    }

    public function show(Borrowing $borrowing)
    {
        return $this->ok($this->borrowingResource($borrowing->load(['member', 'bookCopy.bookMaster', 'penalty'])));
    }

    public function update(Request $request, Borrowing $borrowing)
    {
        if ($borrowing->status === 'Dikembalikan') {
            return $this->fail('Transaksi yang sudah dikembalikan tidak bisa diedit.', 409);
        }

        $data = $request->validate([
            'memberId' => ['sometimes', 'required', 'integer', 'exists:members,id'],
            'member_id' => ['sometimes', 'required', 'integer', 'exists:members,id'],
            'borrowDate' => ['sometimes', 'required', 'date'],
            'borrow_date' => ['sometimes', 'required', 'date'],
            'dueDate' => ['sometimes', 'required', 'date'],
            'due_date' => ['sometimes', 'required', 'date'],
            'returnTime' => ['nullable', 'string', 'max:20'],
            'return_time' => ['nullable', 'string', 'max:20'],
            'loanType' => ['sometimes', 'required', Rule::in(['Harian', 'Mingguan', 'Tahunan', 'Guru'])],
            'loan_type' => ['sometimes', 'required', Rule::in(['Harian', 'Mingguan', 'Tahunan', 'Guru'])],
            'loanSubType' => ['nullable', 'string', 'max:100'],
            'loan_sub_type' => ['nullable', 'string', 'max:100'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'className' => ['nullable', 'string', 'max:100'],
            'class_name' => ['nullable', 'string', 'max:100'],
        ]);

        $dueDate = $data['due_date'] ?? $data['dueDate'] ?? $borrowing->due_date;

        $borrowing->update([
            'member_id' => $data['member_id'] ?? $data['memberId'] ?? $borrowing->member_id,
            'borrow_date' => $data['borrow_date'] ?? $data['borrowDate'] ?? $borrowing->borrow_date,
            'due_date' => $dueDate,
            'return_time' => array_key_exists('return_time', $data) ? $data['return_time'] : (array_key_exists('returnTime', $data) ? $data['returnTime'] : $borrowing->return_time),
            'status' => Carbon::parse($dueDate)->lt(Carbon::today()) ? 'Terlambat' : 'Aktif',
            'loan_type' => $data['loan_type'] ?? $data['loanType'] ?? $borrowing->loan_type,
            'loan_sub_type' => array_key_exists('loan_sub_type', $data) ? $data['loan_sub_type'] : (array_key_exists('loanSubType', $data) ? $data['loanSubType'] : $borrowing->loan_sub_type),
            'quantity' => $data['quantity'] ?? $borrowing->quantity,
            'class_name' => array_key_exists('class_name', $data) ? $data['class_name'] : (array_key_exists('className', $data) ? $data['className'] : $borrowing->class_name),
        ]);

        return $this->ok($this->borrowingResource($borrowing->refresh()->load(['member', 'bookCopy.bookMaster', 'penalty'])), 'Peminjaman berhasil diperbarui');
    }

    public function returnBook(Request $request, Borrowing $borrowing)
    {
        if ($borrowing->status === 'Dikembalikan') {
            return $this->fail('Buku sudah dikembalikan sebelumnya.', 409);
        }

        $data = $request->validate([
            'returnDate' => ['nullable', 'date'],
            'return_date' => ['nullable', 'date'],
            'returnTime' => ['nullable', 'string', 'max:20'],
            'return_time' => ['nullable', 'string', 'max:20'],
            'withPenalty' => ['nullable', 'boolean'],
            'reason' => ['nullable', Rule::in(['Terlambat', 'Rusak', 'Hilang'])],
            'penaltyType' => ['nullable', Rule::in(['Buku Donasi', 'Buku Pengganti'])],
            'penalty_type' => ['nullable', Rule::in(['Buku Donasi', 'Buku Pengganti'])],
            'penaltyBookTitle' => ['nullable', 'string', 'max:255'],
            'penalty_book_title' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $borrowing = DB::transaction(function () use ($borrowing, $data) {
            $returnDate = $data['return_date'] ?? $data['returnDate'] ?? now()->toDateString();
            $borrowing->update([
                'return_date' => $returnDate,
                'return_time' => $data['return_time'] ?? $data['returnTime'] ?? $borrowing->return_time,
                'status' => 'Dikembalikan',
            ]);

            $borrowing->bookCopy()->update(['status' => 'Tersedia']);

            $hasPenalty = ($data['withPenalty'] ?? false) || ! empty($data['reason']);
            if ($hasPenalty) {
                $borrowing->penalty()->updateOrCreate(
                    ['borrowing_id' => $borrowing->id],
                    [
                        'member_id' => $borrowing->member_id,
                        'book_copy_id' => $borrowing->book_copy_id,
                        'loan_type' => $borrowing->loan_type,
                        'date' => $returnDate,
                        'reason' => $data['reason'] ?? 'Terlambat',
                        'penalty_type' => $data['penalty_type'] ?? $data['penaltyType'] ?? 'Buku Donasi',
                        'penalty_book_title' => $data['penalty_book_title'] ?? $data['penaltyBookTitle'] ?? '-',
                        'notes' => $data['notes'] ?? null,
                    ]
                );
            }

            return $borrowing->refresh()->load(['member', 'bookCopy.bookMaster', 'penalty']);
        });

        return $this->ok($this->borrowingResource($borrowing), 'Pengembalian berhasil diproses');
    }

    public function destroy(Borrowing $borrowing)
    {
        DB::transaction(function () use ($borrowing) {
            if ($borrowing->status !== 'Dikembalikan') {
                $borrowing->bookCopy()->update(['status' => 'Tersedia']);
            }
            $borrowing->penalty()->delete();
            $borrowing->delete();
        });

        return $this->ok(null, 'Transaksi berhasil dihapus');
    }

    private function refreshLateStatuses(): void
    {
        Borrowing::query()
            ->where('status', 'Aktif')
            ->whereDate('due_date', '<', Carbon::today())
            ->update(['status' => 'Terlambat']);
    }
}
