<?php

namespace App\Http\Controllers\Api;

use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MemberController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Member::query()->withCount(['borrowings', 'activeBorrowings', 'visitors']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('class_nip', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        $members = $query->latest('id')->get()->map(function (Member $member) {
            $data = $this->memberResource($member);
            $data['borrowingsCount'] = $member->borrowings_count ?? 0;
            $data['activeBorrowingsCount'] = $member->active_borrowings_count ?? 0;
            $data['visitorsCount'] = $member->visitors_count ?? 0;
            return $data;
        });

        return $this->ok($members);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'classNip' => ['required_without:class_nip', 'string', 'max:100', 'unique:members,class_nip'],
            'class_nip' => ['required_without:classNip', 'string', 'max:100', 'unique:members,class_nip'],
            'type' => ['required', Rule::in(['Siswa', 'Guru'])],
            'phone' => ['nullable', 'string', 'max:50'],
            'registeredDate' => ['nullable', 'date'],
            'registered_date' => ['nullable', 'date'],
        ]);

        $member = Member::create([
            'name' => $data['name'],
            'class_nip' => $data['class_nip'] ?? $data['classNip'],
            'type' => $data['type'],
            'phone' => $data['phone'] ?? null,
            'registered_date' => $data['registered_date'] ?? $data['registeredDate'] ?? now()->toDateString(),
        ]);

        return $this->ok($this->memberResource($member), 'Anggota berhasil ditambahkan', 201);
    }

    public function show(Member $member)
    {
        $member->load(['borrowings.bookCopy.bookMaster', 'visitors', 'penalties.bookCopy.bookMaster']);
        $data = $this->memberResource($member);
        $data['borrowings'] = $member->borrowings->map(fn ($b) => $this->borrowingResource($b));
        $data['visitors'] = $member->visitors->map(fn ($v) => $this->visitorResource($v));
        $data['penalties'] = $member->penalties->map(fn ($p) => $this->penaltyResource($p));

        return $this->ok($data);
    }

    public function update(Request $request, Member $member)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'classNip' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('members', 'class_nip')->ignore($member->id)],
            'class_nip' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('members', 'class_nip')->ignore($member->id)],
            'type' => ['sometimes', 'required', Rule::in(['Siswa', 'Guru'])],
            'phone' => ['nullable', 'string', 'max:50'],
            'registeredDate' => ['sometimes', 'required', 'date'],
            'registered_date' => ['sometimes', 'required', 'date'],
        ]);

        $member->update([
            'name' => $data['name'] ?? $member->name,
            'class_nip' => $data['class_nip'] ?? $data['classNip'] ?? $member->class_nip,
            'type' => $data['type'] ?? $member->type,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $member->phone,
            'registered_date' => $data['registered_date'] ?? $data['registeredDate'] ?? $member->registered_date,
        ]);

        return $this->ok($this->memberResource($member->refresh()), 'Anggota berhasil diperbarui');
    }

    public function destroy(Member $member)
    {
        if ($member->activeBorrowings()->exists()) {
            return $this->fail('Anggota masih memiliki peminjaman aktif dan tidak bisa dihapus.', 409);
        }

        $member->delete();

        return $this->ok(null, 'Anggota berhasil dihapus');
    }
}
