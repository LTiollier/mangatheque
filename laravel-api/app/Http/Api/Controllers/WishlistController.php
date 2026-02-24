<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\AddMangaRequest;
use App\Http\Api\Requests\ScanMangaRequest;
use App\Http\Api\Resources\MangaResource;
use App\Manga\Application\Actions\AddMangaToWishlistAction;
use App\Manga\Application\Actions\AddScannedMangaToWishlistAction;
use App\Manga\Application\Actions\ListWishlistAction;
use App\Manga\Application\Actions\RemoveVolumeFromWishlistAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WishlistController
{
    public function index(Request $request, ListWishlistAction $action): AnonymousResourceCollection
    {
        /** @var \App\User\Infrastructure\EloquentModels\User $user */
        $user = $request->user();

        $mangas = $action->execute((int) $user->id);

        return MangaResource::collection(collect($mangas));
    }

    public function store(AddMangaRequest $request, AddMangaToWishlistAction $action): JsonResponse
    {
        $dto = $request->toDTO();

        $manga = $action->execute($dto);

        return (new MangaResource($manga))->response()->setStatusCode(201);
    }

    public function scan(ScanMangaRequest $request, AddScannedMangaToWishlistAction $action): JsonResponse
    {
        $dto = $request->toDTO();

        $manga = $action->execute($dto);

        return (new MangaResource($manga))->response()->setStatusCode(201);
    }

    public function destroy(Request $request, RemoveVolumeFromWishlistAction $action, int $id): JsonResponse
    {
        /** @var \App\User\Infrastructure\EloquentModels\User $user */
        $user = $request->user();

        $action->execute($id, (int) $user->id);

        return response()->json(['message' => 'Volume removed from wishlist'], 200);
    }
}
