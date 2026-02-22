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

    Route::get('/mangas', [\App\Http\Api\Controllers\MangaCollectionController::class, 'index']);
    Route::post('/mangas', [\App\Http\Api\Controllers\MangaCollectionController::class, 'store']);
    Route::post('/mangas/scan', [\App\Http\Api\Controllers\MangaCollectionController::class, 'scan']);
});

Route::get('/mangas/search', [MangaSearchController::class, 'search']);
