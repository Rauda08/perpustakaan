<?php

namespace App\Http\Controllers\Api;

use App\Models\BookCopy;
use App\Models\BookMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BookController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = BookCopy::query()->with('bookMaster');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhereHas('bookMaster', function ($bm) use ($search) {
                        $bm->where('title', 'like', "%{$search}%")
                            ->orWhere('author', 'like', "%{$search}%")
                            ->orWhere('category', 'like', "%{$search}%")
                            ->orWhere('shelf', 'like', "%{$search}%");
                    });
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($category = $request->query('category')) {
            $query->whereHas('bookMaster', fn ($q) => $q->where('category', $category));
        }

        $books = $query->orderBy('id')->get()->map(fn (BookCopy $copy) => $this->bookCopyResource($copy));

        return $this->ok($books);
    }

    public function masters(Request $request)
    {
        $query = BookMaster::query()->with('copies');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('shelf', 'like', "%{$search}%");
            });
        }

        $masters = $query->orderBy('title')->get()->map(fn (BookMaster $master) => $this->bookMasterResource($master));

        return $this->ok($masters);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'shelf' => ['required', 'string', 'max:100'],
            'publishYear' => ['required_without:publish_year', 'string', 'max:10'],
            'publish_year' => ['required_without:publishYear', 'string', 'max:10'],
            'copies' => ['nullable', 'array'],
            'copies.*.number' => ['required_with:copies', 'string', 'max:100', 'distinct', 'unique:book_copies,number'],
            'copies.*.acquisitionYear' => ['nullable', 'string', 'max:10'],
            'copies.*.acquisition_year' => ['nullable', 'string', 'max:10'],
            'copies.*.status' => ['nullable', Rule::in(['Tersedia', 'Dipinjam'])],
            'number' => ['nullable', 'string', 'max:100', 'unique:book_copies,number'],
            'acquisitionYear' => ['nullable', 'string', 'max:10'],
            'acquisition_year' => ['nullable', 'string', 'max:10'],
        ]);

        $master = DB::transaction(function () use ($data) {
            $master = BookMaster::create([
                'title' => $data['title'],
                'author' => $data['author'],
                'category' => $data['category'],
                'shelf' => $data['shelf'],
                'publish_year' => $data['publish_year'] ?? $data['publishYear'],
            ]);

            $copies = $data['copies'] ?? [];
            if (empty($copies) && ! empty($data['number'])) {
                $copies[] = [
                    'number' => $data['number'],
                    'acquisitionYear' => $data['acquisitionYear'] ?? $data['acquisition_year'] ?? now()->year,
                    'status' => 'Tersedia',
                ];
            }

            foreach ($copies as $copy) {
                $master->copies()->create([
                    'number' => $copy['number'],
                    'status' => $copy['status'] ?? 'Tersedia',
                    'acquisition_year' => $copy['acquisition_year'] ?? $copy['acquisitionYear'] ?? now()->year,
                ]);
            }

            return $master->load('copies');
        });

        return $this->ok($this->bookMasterResource($master), 'Buku berhasil ditambahkan', 201);
    }

    public function showMaster(BookMaster $bookMaster)
    {
        return $this->ok($this->bookMasterResource($bookMaster->load('copies')));
    }

    public function updateMaster(Request $request, BookMaster $bookMaster)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'author' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['sometimes', 'required', 'string', 'max:100'],
            'shelf' => ['sometimes', 'required', 'string', 'max:100'],
            'publishYear' => ['sometimes', 'required', 'string', 'max:10'],
            'publish_year' => ['sometimes', 'required', 'string', 'max:10'],
        ]);

        $bookMaster->update([
            'title' => $data['title'] ?? $bookMaster->title,
            'author' => $data['author'] ?? $bookMaster->author,
            'category' => $data['category'] ?? $bookMaster->category,
            'shelf' => $data['shelf'] ?? $bookMaster->shelf,
            'publish_year' => $data['publish_year'] ?? $data['publishYear'] ?? $bookMaster->publish_year,
        ]);

        return $this->ok($this->bookMasterResource($bookMaster->refresh()->load('copies')), 'Data buku berhasil diperbarui');
    }

    public function destroyMaster(BookMaster $bookMaster)
    {
        if ($bookMaster->copies()->where('status', 'Dipinjam')->exists()) {
            return $this->fail('Buku masih memiliki eksemplar yang sedang dipinjam.', 409);
        }

        DB::transaction(function () use ($bookMaster) {
            $bookMaster->copies()->delete();
            $bookMaster->delete();
        });

        return $this->ok(null, 'Buku berhasil dihapus');
    }

    public function storeCopy(Request $request, BookMaster $bookMaster)
    {
        $data = $request->validate([
            'number' => ['required', 'string', 'max:100', 'unique:book_copies,number'],
            'status' => ['nullable', Rule::in(['Tersedia', 'Dipinjam'])],
            'acquisitionYear' => ['nullable', 'string', 'max:10'],
            'acquisition_year' => ['nullable', 'string', 'max:10'],
        ]);

        $copy = $bookMaster->copies()->create([
            'number' => $data['number'],
            'status' => $data['status'] ?? 'Tersedia',
            'acquisition_year' => $data['acquisition_year'] ?? $data['acquisitionYear'] ?? now()->year,
        ]);

        return $this->ok($this->bookCopyResource($copy), 'Eksemplar berhasil ditambahkan', 201);
    }

    public function showCopy(BookCopy $bookCopy)
    {
        return $this->ok($this->bookCopyResource($bookCopy->load('bookMaster')));
    }

    public function updateCopy(Request $request, BookCopy $bookCopy)
    {
        $data = $request->validate([
            'number' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('book_copies', 'number')->ignore($bookCopy->id)],
            'status' => ['sometimes', 'required', Rule::in(['Tersedia', 'Dipinjam'])],
            'acquisitionYear' => ['sometimes', 'required', 'string', 'max:10'],
            'acquisition_year' => ['sometimes', 'required', 'string', 'max:10'],
        ]);

        $bookCopy->update([
            'number' => $data['number'] ?? $bookCopy->number,
            'status' => $data['status'] ?? $bookCopy->status,
            'acquisition_year' => $data['acquisition_year'] ?? $data['acquisitionYear'] ?? $bookCopy->acquisition_year,
        ]);

        return $this->ok($this->bookCopyResource($bookCopy->refresh()->load('bookMaster')), 'Eksemplar berhasil diperbarui');
    }

    public function destroyCopy(BookCopy $bookCopy)
    {
        if ($bookCopy->borrowings()->whereIn('status', ['Aktif', 'Terlambat'])->exists()) {
            return $this->fail('Eksemplar masih sedang dipinjam dan tidak bisa dihapus.', 409);
        }

        $bookCopy->delete();

        return $this->ok(null, 'Eksemplar berhasil dihapus');
    }
}
