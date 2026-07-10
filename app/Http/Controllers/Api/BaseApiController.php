<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BookCopy;
use App\Models\BookMaster;
use App\Models\Borrowing;
use App\Models\Member;
use App\Models\Penalty;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;

class BaseApiController extends Controller
{
    protected function ok(mixed $data = null, string $message = 'OK', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function fail(string $message, int $status = 422, mixed $errors = null): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }

    protected function memberResource(Member $member): array
    {
        return [
            'id' => $member->id,
            'name' => $member->name,
            'classNip' => $member->class_nip,
            'type' => $member->type,
            'phone' => $member->phone ?? '',
            'registeredDate' => optional($member->registered_date)->format('Y-m-d') ?? $member->registered_date,
            'createdAt' => optional($member->created_at)->toISOString(),
            'updatedAt' => optional($member->updated_at)->toISOString(),
        ];
    }

    protected function bookMasterResource(BookMaster $master): array
    {
        $master->loadMissing('copies');

        return [
            'id' => $master->id,
            'indukNumber' => $master->induk_number,
            'induk_number' => $master->induk_number,
            'title' => $master->title,
            'author' => $master->author,
            'category' => $master->category,
            'shelf' => $master->shelf,
            'publishYear' => $master->publish_year,
            'totalCopies' => $master->copies->count(),
            'availableCopies' => $master->copies->where('status', 'Tersedia')->count(),
            'borrowedCopies' => $master->copies->where('status', 'Dipinjam')->count(),
            'copies' => $master->copies->map(fn (BookCopy $copy) => $this->bookCopyResource($copy))->values(),
            'createdAt' => optional($master->created_at)->toISOString(),
            'updatedAt' => optional($master->updated_at)->toISOString(),
        ];
    }

    protected function bookCopyResource(BookCopy $copy): array
    {
        $copy->loadMissing('bookMaster');
        $master = $copy->bookMaster;

        return [
            'id' => $copy->id,
            'indukNumber' => $master?->induk_number,
            'induk_number' => $master?->induk_number,
            'bookId' => $copy->book_master_id,
            'bookMasterId' => $copy->book_master_id,
            'title' => $master?->title,
            'author' => $master?->author,
            'category' => $master?->category,
            'number' => $copy->number,
            'shelf' => $master?->shelf,
            'status' => $copy->status,
            'publishYear' => $master?->publish_year,
            'acquisitionYear' => $copy->acquisition_year,
            'createdAt' => optional($copy->created_at)->toISOString(),
            'updatedAt' => optional($copy->updated_at)->toISOString(),
        ];
    }

    protected function borrowingResource(Borrowing $borrowing): array
    {
        $borrowing->loadMissing(['member', 'bookCopy.bookMaster', 'penalty']);
        $member = $borrowing->member;
        $copy = $borrowing->bookCopy;
        $master = $copy?->bookMaster;

        return [
            'id' => $borrowing->id,
            'batchId' => $borrowing->batch_id,
            'memberId' => $borrowing->member_id,
            'memberName' => $member?->name,
            'member' => $member ? $this->memberResource($member) : null,
            'bookCopyId' => $borrowing->book_copy_id,
            'bookTitle' => $master?->title,
            'bookNumber' => $copy?->number,
            'book' => $copy ? $this->bookCopyResource($copy) : null,
            'borrowDate' => optional($borrowing->borrow_date)->format('Y-m-d') ?? $borrowing->borrow_date,
            'dueDate' => optional($borrowing->due_date)->format('Y-m-d') ?? $borrowing->due_date,
            'returnDate' => optional($borrowing->return_date)->format('Y-m-d') ?? $borrowing->return_date,
            'returnTime' => $borrowing->return_time,
            'status' => $borrowing->status,
            'loanType' => $borrowing->loan_type,
            'loanSubType' => $borrowing->loan_sub_type,
            'quantity' => $borrowing->quantity,
            'className' => $borrowing->class_name,
            'penalty' => $borrowing->penalty ? $this->penaltyResource($borrowing->penalty) : null,
            'createdAt' => optional($borrowing->created_at)->toISOString(),
            'updatedAt' => optional($borrowing->updated_at)->toISOString(),
        ];
    }

    protected function visitorResource(Visitor $visitor): array
    {
        return [
            'id' => $visitor->id,
            'memberId' => $visitor->member_id,
            'name' => $visitor->name,
            'type' => $visitor->type,
            'classNip' => $visitor->class_nip,
            'purpose' => $visitor->purpose,
            'visitDate' => optional($visitor->visit_date)->format('Y-m-d') ?? $visitor->visit_date,
            'visitTime' => $visitor->visit_time,
            'createdAt' => optional($visitor->created_at)->toISOString(),
            'updatedAt' => optional($visitor->updated_at)->toISOString(),
        ];
    }

    protected function penaltyResource(Penalty $penalty): array
    {
        $penalty->loadMissing(['member', 'bookCopy.bookMaster', 'borrowing']);
        $copy = $penalty->bookCopy;
        $master = $copy?->bookMaster;

        return [
            'id' => $penalty->id,
            'borrowingId' => $penalty->borrowing_id,
            'memberId' => $penalty->member_id,
            'memberName' => $penalty->member?->name,
            'bookCopyId' => $penalty->book_copy_id,
            'bookNumber' => $copy?->number,
            'bookTitle' => $master?->title,
            'loanType' => $penalty->loan_type,
            'date' => optional($penalty->date)->format('Y-m-d') ?? $penalty->date,
            'reason' => $penalty->reason,
            'penaltyType' => $penalty->penalty_type,
            'penaltyBookTitle' => $penalty->penalty_book_title,
            'notes' => $penalty->notes ?? '',
            'createdAt' => optional($penalty->created_at)->toISOString(),
            'updatedAt' => optional($penalty->updated_at)->toISOString(),
        ];
    }
}
