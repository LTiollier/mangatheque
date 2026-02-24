<?php

use App\Http\Api\Controllers\AuthController;
use App\Http\Api\Controllers\MangaSearchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::put('/user/settings', [\App\Http\Api\Controllers\UserSettingsController::class, 'update']);

    Route::get('/mangas', [\App\Http\Api\Controllers\MangaCollectionController::class, 'index']);
    Route::post('/mangas', [\App\Http\Api\Controllers\MangaCollectionController::class, 'store']);
    Route::post('/mangas/scan', [\App\Http\Api\Controllers\MangaCollectionController::class, 'scan']);
    Route::post('/mangas/scan-bulk', [\App\Http\Api\Controllers\MangaCollectionController::class, 'scanBulk']);
    Route::post('/mangas/bulk', [\App\Http\Api\Controllers\MangaCollectionController::class, 'bulkAdd']);
    Route::delete('/mangas/{id}', [\App\Http\Api\Controllers\MangaCollectionController::class, 'removeVolume']);
    Route::delete('/series/{seriesId}', [\App\Http\Api\Controllers\MangaCollectionController::class, 'removeSeries']);

    Route::get('/series/{id}', [\App\Http\Api\Controllers\MangaHierarchyController::class, 'showSeries']);
    Route::get('/series/{seriesId}/editions', [\App\Http\Api\Controllers\MangaHierarchyController::class, 'listEditions']);
    Route::get('/editions/{editionId}/volumes', [\App\Http\Api\Controllers\MangaHierarchyController::class, 'listVolumes']);

    Route::get('/loans', [\App\Http\Api\Controllers\LoanController::class, 'index']);
    Route::post('/loans', [\App\Http\Api\Controllers\LoanController::class, 'store']);
    Route::post('/loans/return', [\App\Http\Api\Controllers\LoanController::class, 'return']);

    Route::get('/wishlist', [\App\Http\Api\Controllers\WishlistController::class, 'index']);
    Route::post('/wishlist/scan', [\App\Http\Api\Controllers\WishlistController::class, 'scan']);
    Route::post('/wishlist', [\App\Http\Api\Controllers\WishlistController::class, 'store']);
    Route::delete('/wishlist/{id}', [\App\Http\Api\Controllers\WishlistController::class, 'destroy']);
});

Route::get('/mangas/search', [MangaSearchController::class, 'search']);

Route::get('/users/{username}', [\App\Http\Api\Controllers\PublicProfileController::class, 'showProfile']);
Route::get('/users/{username}/collection', [\App\Http\Api\Controllers\PublicProfileController::class, 'showCollection']);
