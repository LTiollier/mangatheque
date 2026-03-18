<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\RemoveFromWishlistRequest;
use App\Http\Api\Requests\ScanMangaRequest;
use App\Http\Api\Resources\WishlistItemResource;
use App\Manga\Application\Actions\AddScannedMangaToWishlistAction;
use App\Manga\Application\Actions\AddToWishlistAction;
use App\Manga\Application\Actions\ListWishlistAction;
use App\Manga\Application\Actions\RemoveVolumeFromWishlistAction;
use App\Manga\Application\DTOs\AddToWishlistDTO;
use App\Manga\Infrastructure\Services\WishlistAuthorizationService;
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

        return WishlistItemResource::collection($wishlist);
    }

    public function store(
        Request $request,
        AddToWishlistAction $action,
        WishlistAuthorizationService $authService,
    ): JsonResponse {
        $request->validate([
            'api_id'     => ['sometimes', 'string'],
            'edition_id' => ['sometimes', 'integer'],
        ]);

        if (! $request->has('api_id') && ! $request->has('edition_id')) {
            return response()->json(['message' => 'api_id or edition_id is required'], 422);
        }

        /** @var User $user */
        $user = $request->user();

        if ($request->has('edition_id')) {
            $editionId = (int) $request->input('edition_id');
            $authService->authorizeAddEdition($editionId);
            $dto = new AddToWishlistDTO(userId: (int) $user->id, editionId: $editionId);
        } else {
            $apiId = $request->string('api_id')->toString();
            $authService->authorizeAddByApiId($apiId);
            $dto = new AddToWishlistDTO(userId: (int) $user->id, apiId: $apiId);
        }

        $item = $action->execute($dto);

        return (new WishlistItemResource($item))->response()->setStatusCode(201);
    }

    public function scan(ScanMangaRequest $request, AddScannedMangaToWishlistAction $action): JsonResponse
    {
        $dto = $request->toDTO();
        $edition = $action->execute($dto);

        return (new WishlistItemResource($edition))->response()->setStatusCode(201);
    }

    public function destroy(RemoveFromWishlistRequest $request, RemoveVolumeFromWishlistAction $action, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $type = $request->input('type', 'edition');
        $action->execute($id, $type, (int) $user->id);

        return response()->json(['message' => 'Item removed from wishlist'], 200);
    }
}
