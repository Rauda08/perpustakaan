<?php

namespace App\Http\Controllers\Api;

use App\Models\Member;
use App\Models\Visitor;
use Illuminate\Http\Request;

class VisitorController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Visitor::query()->with('member');

        if ($date = $request->query('date')) {
            $query->whereDate('visit_date', $date);
        }

        if ($month = $request->query('month')) {
            [$year, $monthNumber] = explode('-', $month) + [null, null];
            if ($year && $monthNumber) {
                $query->whereYear('visit_date', $year)->whereMonth('visit_date', $monthNumber);
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('class_nip', 'like', "%{$search}%")
                    ->orWhere('purpose', 'like', "%{$search}%");
            });
        }

        $visitors = $query->latest('visit_date')->latest('visit_time')->get()
            ->map(fn (Visitor $visitor) => $this->visitorResource($visitor));

        return $this->ok($visitors);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'memberId' => ['nullable', 'integer', 'exists:members,id'],
            'member_id' => ['nullable', 'integer', 'exists:members,id'],
            'name' => ['required_without:memberId,member_id', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:50'],
            'classNip' => ['nullable', 'string', 'max:100'],
            'class_nip' => ['nullable', 'string', 'max:100'],
            'purpose' => ['required', 'string', 'max:255'],
            'visitDate' => ['nullable', 'date'],
            'visit_date' => ['nullable', 'date'],
            'visitTime' => ['nullable', 'string', 'max:20'],
            'visit_time' => ['nullable', 'string', 'max:20'],
        ]);

        $member = null;
        $memberId = $data['member_id'] ?? $data['memberId'] ?? null;
        if ($memberId) {
            $member = Member::find($memberId);
        }

        $visitor = Visitor::create([
            'member_id' => $member?->id,
            'name' => $data['name'] ?? $member?->name,
            'type' => $data['type'] ?? $member?->type ?? 'Tamu',
            'class_nip' => $data['class_nip'] ?? $data['classNip'] ?? $member?->class_nip ?? '-',
            'purpose' => $data['purpose'],
            'visit_date' => $data['visit_date'] ?? $data['visitDate'] ?? now()->toDateString(),
            'visit_time' => $data['visit_time'] ?? $data['visitTime'] ?? now()->format('H:i'),
        ]);

        return $this->ok($this->visitorResource($visitor), 'Kunjungan berhasil dicatat', 201);
    }

    public function show(Visitor $visitor)
    {
        return $this->ok($this->visitorResource($visitor));
    }

    public function update(Request $request, Visitor $visitor)
    {
        $data = $request->validate([
            'memberId' => ['nullable', 'integer', 'exists:members,id'],
            'member_id' => ['nullable', 'integer', 'exists:members,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'string', 'max:50'],
            'classNip' => ['sometimes', 'required', 'string', 'max:100'],
            'class_nip' => ['sometimes', 'required', 'string', 'max:100'],
            'purpose' => ['sometimes', 'required', 'string', 'max:255'],
            'visitDate' => ['sometimes', 'required', 'date'],
            'visit_date' => ['sometimes', 'required', 'date'],
            'visitTime' => ['sometimes', 'required', 'string', 'max:20'],
            'visit_time' => ['sometimes', 'required', 'string', 'max:20'],
        ]);

        $visitor->update([
            'member_id' => $data['member_id'] ?? $data['memberId'] ?? $visitor->member_id,
            'name' => $data['name'] ?? $visitor->name,
            'type' => $data['type'] ?? $visitor->type,
            'class_nip' => $data['class_nip'] ?? $data['classNip'] ?? $visitor->class_nip,
            'purpose' => $data['purpose'] ?? $visitor->purpose,
            'visit_date' => $data['visit_date'] ?? $data['visitDate'] ?? $visitor->visit_date,
            'visit_time' => $data['visit_time'] ?? $data['visitTime'] ?? $visitor->visit_time,
        ]);

        return $this->ok($this->visitorResource($visitor->refresh()), 'Kunjungan berhasil diperbarui');
    }

    public function destroy(Visitor $visitor)
    {
        $visitor->delete();

        return $this->ok(null, 'Kunjungan berhasil dihapus');
    }
}
