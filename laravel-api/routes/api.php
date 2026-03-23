<?php

declare(strict_types=1);

use App\Http\Api\Controllers\AuthController;
use App\Http\Api\Controllers\BoxCollectionController;
use App\Http\Api\Controllers\LoanController;
use App\Http\Api\Controllers\MangaCollecImportController;
use App\Http\Api\Controllers\MangaCollectionController;
use App\Http\Api\Controllers\MangaHierarchyController;
use App\Http\Api\Controllers\MangaSearchController;
use App\Http\Api\Controllers\PlanningController;
use App\Http\Api\Controllers\PublicProfileController;
use App\Http\Api\Controllers\ReadingProgressController;
use App\Http\Api\Controllers\UserSettingsController;
use App\Http\Api\Controllers\WishlistController;
use App\Http\Api\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Auth (public, rate-limited)
Route::middleware('throttle:auth')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

    // Email Verification
    Route::get('/auth/verify-email/{id}/{hash}', [AuthController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('/auth/email/verification-notification', [AuthController::class, 'sendVerificationNotification'])
        ->middleware(['auth:sanctum', 'throttle:6,1'])
        ->name('verification.send');
});

// Public catalog & profiles (unauthenticated)
Route::middleware('throttle:api')->group(function () {
    Route::get('/mangas/search', [MangaSearchController::class, 'search']);
    Route::get('/mangas/search/isbn', [MangaSearchController::class, 'searchByIsbn']);

    Route::prefix('/users/{username}')->group(function () {
        Route::get('/', [PublicProfileController::class, 'showProfile']);
        Route::get('/collection', [PublicProfileController::class, 'showCollection']);
    });
});

// Authenticated routes
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // User
    Route::get('/user', fn (Request $request) => new UserResource($request->user()));
    Route::prefix('/user/settings')->group(function () {
        Route::patch('/', [UserSettingsController::class, 'update']);
        Route::patch('/email', [UserSettingsController::class, 'updateEmail']);
        Route::patch('/password', [UserSettingsController::class, 'updatePassword']);

        Route::middleware('throttle:mangacollec_import')->group(function () {
            Route::post('/import/mangacollec', [MangaCollecImportController::class, 'store']);
        });
    });

    // Catalog (hierarchy)
    Route::prefix('/series/{seriesId}')->group(function () {
        Route::get('/', [MangaHierarchyController::class, 'showSeries']);
        Route::get('/editions', [MangaHierarchyController::class, 'listEditions']);
        Route::delete('/', [MangaCollectionController::class, 'removeSeries']);
    });

    Route::prefix('/editions/{editionId}')->group(function () {
        Route::get('/', [MangaHierarchyController::class, 'showEdition']);
        Route::get('/volumes', [MangaHierarchyController::class, 'listVolumes']);
    });

    Route::get('/box-sets/{boxSetId}', [MangaHierarchyController::class, 'showBoxSet']);
    Route::get('/boxes/{boxId}', [MangaHierarchyController::class, 'showBox']);

    // Collection
    Route::prefix('/mangas')->group(function () {
        Route::get('/', [MangaCollectionController::class, 'index']);
        Route::post('/', [MangaCollectionController::class, 'store']);
        Route::post('/scan-bulk', [MangaCollectionController::class, 'scanBulk']);
        Route::post('/bulk', [MangaCollectionController::class, 'bulkAdd']);
        Route::delete('/bulk', [MangaCollectionController::class, 'bulkRemove']);
    });

    // Boxes
    Route::prefix('/boxes/{boxId}')->group(function () {
        Route::post('/', [BoxCollectionController::class, 'store']);
        Route::delete('/', [BoxCollectionController::class, 'destroy']);
    });

    // Loans
    Route::prefix('/loans')->group(function () {
        Route::get('/', [LoanController::class, 'index']);
        Route::post('/', [LoanController::class, 'store']);
        Route::post('/bulk', [LoanController::class, 'bulkStore']);
        Route::post('/return', [LoanController::class, 'return']);
        Route::post('/return/bulk', [LoanController::class, 'bulkReturn']);
    });

    // Reading Progress
    Route::prefix('/reading-progress')->group(function () {
        Route::get('/', [ReadingProgressController::class, 'index']);
        Route::post('/toggle/bulk', [ReadingProgressController::class, 'bulkToggle']);
    });

    // Planning
    Route::get('/planning', [PlanningController::class, 'index']);

    // Wishlist
    Route::prefix('/wishlist')->group(function () {
        Route::get('/', [WishlistController::class, 'index']);
        Route::post('/', [WishlistController::class, 'store']);
        Route::delete('/{id}', [WishlistController::class, 'destroy']);
    });
});
