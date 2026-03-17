<?php

use App\Http\Api\Controllers\AuthController;
use App\Http\Api\Controllers\LoanController;
use App\Http\Api\Controllers\MangaCollectionController;
use App\Http\Api\Controllers\MangaHierarchyController;
use App\Http\Api\Controllers\MangaSearchController;
use App\Http\Api\Controllers\PublicProfileController;
use App\Http\Api\Controllers\UserSettingsController;
use App\Http\Api\Controllers\WishlistController;
use App\Http\Api\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return new UserResource($request->user());
})->middleware(['auth:sanctum', 'throttle:api']);

Route::middleware('throttle:auth')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
});

Route::get('/reset-password/{token}', function () {
    return response()->json(['message' => 'Please use the PWA to reset your password.']);
})->name('password.reset');

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::put('/user/settings', [UserSettingsController::class, 'update']);

    Route::get('/mangas', [MangaCollectionController::class, 'index']);
    Route::post('/mangas', [MangaCollectionController::class, 'store']);
    Route::post('/mangas/scan', [MangaCollectionController::class, 'scan']);
    Route::post('/mangas/scan-bulk', [MangaCollectionController::class, 'scanBulk']);
    Route::post('/mangas/bulk', [MangaCollectionController::class, 'bulkAdd']);
    Route::delete('/mangas/{id}', [MangaCollectionController::class, 'removeVolume']);
    Route::delete('/series/{seriesId}', [MangaCollectionController::class, 'removeSeries']);

    Route::get('/series/{id}', [MangaHierarchyController::class, 'showSeries']);
    Route::get('/series/{seriesId}/editions', [MangaHierarchyController::class, 'listEditions']);
    Route::get('/editions/{editionId}', [MangaHierarchyController::class, 'showEdition']);
    Route::get('/editions/{editionId}/volumes', [MangaHierarchyController::class, 'listVolumes']);
    Route::get('/box-sets/{boxSetId}', [MangaHierarchyController::class, 'showBoxSet']);
    Route::get('/boxes/{boxId}', [MangaHierarchyController::class, 'showBox']);

    Route::get('/loans', [LoanController::class, 'index']);
    Route::post('/loans', [LoanController::class, 'store']);
    Route::post('/loans/bulk', [LoanController::class, 'bulkStore']);
    Route::post('/loans/return', [LoanController::class, 'return']);
    Route::post('/loans/return/bulk', [LoanController::class, 'bulkReturn']);

    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/scan', [WishlistController::class, 'scan']);
    Route::post('/wishlist', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{id}', [WishlistController::class, 'destroy']);
});

Route::middleware('throttle:api')->group(function () {
    Route::get('/mangas/search', [MangaSearchController::class, 'search']);

    Route::get('/users/{username}', [PublicProfileController::class, 'showProfile']);
    Route::get('/users/{username}/collection', [PublicProfileController::class, 'showCollection']);
});
