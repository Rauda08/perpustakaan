<?php

namespace App\Http\Controllers\Api;

use App\Models\BookCopy;
use App\Models\Borrowing;
use App\Models\Member;
use App\Models\Penalty;
use App\Models\Visitor;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends BaseApiController
{
    public function summary(Request $request)
    {
        $from = $request->query('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->query('to', Carbon::now()->toDateString());

        $borrowings = Borrowing::with(['member', 'bookCopy.bookMaster', 'penalty'])
            ->whereBetween('borrow_date', [$from, $to])
            ->get();

        $returns = Borrowing::with(['member', 'bookCopy.bookMaster', 'penalty'])
            ->whereNotNull('return_date')
            ->whereBetween('return_date', [$from, $to])
            ->get();

        $visitors = Visitor::whereBetween('visit_date', [$from, $to])->get();
        $penalties = Penalty::with(['member', 'bookCopy.bookMaster'])
            ->whereBetween('date', [$from, $to])
            ->get();

        return $this->ok([
            'period' => ['from' => $from, 'to' => $to],
            'stats' => [
                'totalBooks' => BookCopy::count(),
                'availableBooks' => BookCopy::where('status', 'Tersedia')->count(),
                'borrowedBooks' => BookCopy::where('status', 'Dipinjam')->count(),
                'totalMembers' => Member::count(),
                'borrowings' => $borrowings->count(),
                'returns' => $returns->count(),
                'activeBorrowings' => Borrowing::whereIn('status', ['Aktif', 'Terlambat'])->count(),
                'lateBorrowings' => Borrowing::where('status', 'Terlambat')->count(),
                'visitors' => $visitors->count(),
                'penalties' => $penalties->count(),
            ],
            'borrowings' => $borrowings->map(fn (Borrowing $borrowing) => $this->borrowingResource($borrowing))->values(),
            'returns' => $returns->map(fn (Borrowing $borrowing) => $this->borrowingResource($borrowing))->values(),
            'visitors' => $visitors->map(fn (Visitor $visitor) => $this->visitorResource($visitor))->values(),
            'penalties' => $penalties->map(fn (Penalty $penalty) => $this->penaltyResource($penalty))->values(),
        ]);
    }

    public function monthly(Request $request)
    {
        $year = (int) $request->query('year', now()->year);

        $borrowings = Borrowing::whereYear('borrow_date', $year)
            ->get()
            ->groupBy(fn (Borrowing $borrowing) => (int) $borrowing->borrow_date->format('n'));

        $returns = Borrowing::whereYear('return_date', $year)
            ->whereNotNull('return_date')
            ->get()
            ->groupBy(fn (Borrowing $borrowing) => (int) $borrowing->return_date->format('n'));

        $visitors = Visitor::whereYear('visit_date', $year)
            ->get()
            ->groupBy(fn (Visitor $visitor) => (int) $visitor->visit_date->format('n'));

        $data = collect(range(1, 12))->map(fn ($month) => [
            'month' => $month,
            'borrowings' => isset($borrowings[$month]) ? $borrowings[$month]->count() : 0,
            'returns' => isset($returns[$month]) ? $returns[$month]->count() : 0,
            'visitors' => isset($visitors[$month]) ? $visitors[$month]->count() : 0,
        ]);

        return $this->ok([
            'year' => $year,
            'items' => $data,
        ]);
    }
}
