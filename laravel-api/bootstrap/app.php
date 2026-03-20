<?php

use App\Borrowing\Domain\Exceptions\AlreadyLoanedException;
use App\Borrowing\Domain\Exceptions\LoanNotFoundException;
use App\Borrowing\Domain\Exceptions\VolumeNotInCollectionException;
use App\Manga\Domain\Exceptions\EditionNotFoundException;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Exceptions\SeriesNotFoundException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\JsonResponse;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Illuminate\Foundation\Configuration\Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Map Domain not-found exceptions → 404 JSON
        $exceptions->render(function (MangaNotFoundException $e): JsonResponse {
            return response()->json(['message' => $e->getMessage()], 404);
        });

        $exceptions->render(function (EditionNotFoundException $e): JsonResponse {
            return response()->json(['message' => $e->getMessage()], 404);
        });

        $exceptions->render(function (SeriesNotFoundException $e): JsonResponse {
            return response()->json(['message' => $e->getMessage()], 404);
        });

        $exceptions->render(function (VolumeNotInCollectionException $e): JsonResponse {
            return response()->json(['message' => $e->getMessage()], 404);
        });

        // Map Domain business-rule violations → 422 JSON
        $exceptions->render(function (AlreadyLoanedException $e): JsonResponse {
            return response()->json(['message' => $e->getMessage()], 422);
        });

        $exceptions->render(function (LoanNotFoundException $e): JsonResponse {
            return response()->json(['message' => $e->getMessage()], 422);
        });

        // Wishlist policy violations → 403 JSON
        $exceptions->render(function (AuthorizationException $e): JsonResponse {
            return response()->json(['message' => $e->getMessage()], 403);
        });
    })->create();
