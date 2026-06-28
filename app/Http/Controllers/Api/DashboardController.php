<?php

namespace App\Http\Controllers\Api;

use App\Models\BookCopy;
use App\Models\BookMaster;
use App\Models\Borrowing;
use App\Models\Member;
use App\Models\Visitor;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends BaseApiController
{
    public function __invoke(Request $request)
    {
        $timezone = 'Asia/Jakarta';
        $now = Carbon::now($timezone);

        $today = $request->query('date', $now->toDateString());
        $todayCarbon = Carbon::parse($today, $timezone);

        $this->refreshLateStatuses();

        $dueToday = Borrowing::with(['member', 'bookCopy.bookMaster'])
            ->where('status', 'Aktif')
            ->where('loan_type', '!=', 'Guru')
            ->whereDate('due_date', $today)
            ->orderBy('return_time')
            ->get()
            ->map(fn (Borrowing $borrowing) => $this->borrowingResource($borrowing));

        $lateReturnsTimeline = Borrowing::with(['member', 'bookCopy.bookMaster'])
            ->where('status', 'Terlambat')
            ->orderBy('due_date')
            ->orderBy('return_time')
            ->limit(10)
            ->get()
            ->map(function (Borrowing $borrowing) use ($todayCarbon) {
                $data = $this->borrowingResource($borrowing);

                $daysLate = Carbon::parse($borrowing->due_date)
                    ->startOfDay()
                    ->diffInDays($todayCarbon->copy()->startOfDay());

                $data['daysLate'] = $daysLate;

                return $data;
            });

        $latestBorrowings = Borrowing::with(['member', 'bookCopy.bookMaster', 'penalty'])
            ->latest('id')
            ->limit(10)
            ->get()
            ->map(fn (Borrowing $borrowing) => $this->borrowingResource($borrowing));

        $data = [
            'date' => $today,
            'stats' => [
                'totalBookMasters' => BookMaster::count(),
                'totalBooks' => BookCopy::count(),
                'availableBooks' => BookCopy::where('status', 'Tersedia')->count(),
                'borrowedBooks' => BookCopy::where('status', 'Dipinjam')->count(),
                'totalMembers' => Member::count(),
                'studentMembers' => Member::where('type', 'Siswa')->count(),
                'teacherMembers' => Member::where('type', 'Guru')->count(),
                'activeBorrowings' => Borrowing::whereIn('status', ['Aktif', 'Terlambat'])->count(),
                'lateBorrowings' => Borrowing::where('status', 'Terlambat')->count(),
                'returnedBorrowings' => Borrowing::where('status', 'Dikembalikan')->count(),
                'visitorsToday' => Visitor::whereDate('visit_date', $today)->count(),
                'visitorsThisMonth' => Visitor::whereYear('visit_date', $todayCarbon->year)
                    ->whereMonth('visit_date', $todayCarbon->month)
                    ->count(),
            ],
            'dueToday' => $dueToday,
            'lateReturnsTimeline' => $lateReturnsTimeline,
            'latestBorrowings' => $latestBorrowings,
            'monthlyVisitors' => Visitor::query()
                ->whereDate('visit_date', '>=', $todayCarbon->copy()->startOfMonth()->toDateString())
                ->whereDate('visit_date', '<=', $todayCarbon->copy()->endOfMonth()->toDateString())
                ->orderBy('visit_date')
                ->get()
                ->groupBy(fn (Visitor $visitor) => optional($visitor->visit_date)->format('Y-m-d') ?? $visitor->visit_date)
                ->map(fn ($items, $date) => [
                    'visitDate' => $date,
                    'total' => $items->count(),
                ])
                ->values(),
        ];

        return $this->ok($data);
    }

    private function refreshLateStatuses(): void
    {
        $timezone = 'Asia/Jakarta';
        $now = Carbon::now($timezone);

        Borrowing::query()
            ->where('status', 'Aktif')
            ->where('loan_type', '!=', 'Guru')
            ->where(function ($query) use ($now) {
                $query
                    ->whereDate('due_date', '<', $now->toDateString())
                    ->orWhere(function ($dailyQuery) use ($now) {
                        $dailyQuery
                            ->where('loan_type', 'Harian')
                            ->whereDate('due_date', $now->toDateString())
                            ->whereNotNull('return_time')
                            ->where('return_time', '<', $now->format('H:i:s'));
                    });
            })
            ->update(['status' => 'Terlambat']);
    }
}
