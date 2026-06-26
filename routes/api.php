<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\BorrowingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\PenaltyController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\VisitorController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Sistem Perpustakaan SMAN Bernas
|--------------------------------------------------------------------------
| Semua endpoint mengembalikan JSON. Response data dibuat camelCase supaya
| mudah dipakai langsung oleh tampilan React yang sudah ada.
*/

Route::get('/health', fn () => response()->json(['success' => true, 'message' => 'API OK']));

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/me', [AuthController::class, 'me']);

Route::get('/dashboard', DashboardController::class);

Route::apiResource('members', MemberController::class);

Route::get('/books', [BookController::class, 'index']);
Route::post('/books', [BookController::class, 'store']);

Route::get('/book-masters', [BookController::class, 'masters']);
Route::post('/book-masters', [BookController::class, 'store']);
Route::get('/book-masters/{bookMaster}', [BookController::class, 'showMaster']);
Route::match(['put', 'patch'], '/book-masters/{bookMaster}', [BookController::class, 'updateMaster']);
Route::delete('/book-masters/{bookMaster}', [BookController::class, 'destroyMaster']);
Route::post('/book-masters/{bookMaster}/copies', [BookController::class, 'storeCopy']);

Route::get('/book-copies/{bookCopy}', [BookController::class, 'showCopy']);
Route::match(['put', 'patch'], '/book-copies/{bookCopy}', [BookController::class, 'updateCopy']);
Route::delete('/book-copies/{bookCopy}', [BookController::class, 'destroyCopy']);

Route::get('/borrowings/active', [BorrowingController::class, 'active']);
Route::get('/borrowings/history', [BorrowingController::class, 'history']);
Route::post('/borrowings/{borrowing}/return', [BorrowingController::class, 'returnBook']);
Route::apiResource('borrowings', BorrowingController::class);

Route::apiResource('visitors', VisitorController::class);
Route::apiResource('penalties', PenaltyController::class);

Route::get('/reports/summary', [ReportController::class, 'summary']);
Route::get('/reports/monthly', [ReportController::class, 'monthly']);
