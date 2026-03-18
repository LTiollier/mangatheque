<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\AddMangaRequest;
use App\Http\Api\Requests\RemoveFromWishlistRequest;
use App\Http\Api\Requests\ScanMangaRequest;
use App\Http\Api\Resources\MangaResource;
use App\Manga\Application\Actions\AddScannedMangaToWishlistAction;
use App\Manga\Application\Actions\AddWishlistItemAction;
use App\Manga\Application\Actions\ListWishlistAction;
use App\Manga\Application\Actions\RemoveVolumeFromWishlistAction;
use App\Manga\Application\DTOs\AddWishlistItemDTO;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WishlistController
{
    public function index(Request $request, ListWishlistAction $action): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();
        $wishlist = $action->execute((int) $user->id);

        return MangaResource::collection($wishlist);
    }

    public function store(AddMangaRequest $request, AddWishlistItemAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $dto = new AddWishlistItemDTO(
            api_id: $request->string('api_id')->toString(),
            userId: (int) $user->id
        );

        $item = $action->execute($dto);

        return response()->json([
            'message' => 'Item added to wishlist',
            'data' => $item instanceof \App\Manga\Domain\Models\Volume ? new MangaResource($item) : $item,
        ], 201);
    }

    public function scan(ScanMangaRequest $request, AddScannedMangaToWishlistAction $action): MangaResource
    {
        $dto = $request->toDTO();
        $volume = $action->execute($dto);

        return new MangaResource($volume);
    }

    public function destroy(RemoveFromWishlistRequest $request, RemoveVolumeFromWishlistAction $action, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $action->execute($id, (int) $user->id);

        return response()->json(['message' => 'Volume removed from wishlist'], 200);
    }
}
