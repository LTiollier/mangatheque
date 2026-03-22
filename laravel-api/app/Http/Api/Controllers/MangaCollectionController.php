<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\AddLocalVolumesRequest;
use App\Http\Api\Requests\AddMangaRequest;
use App\Http\Api\Requests\BulkRemoveVolumesRequest;
use App\Http\Api\Requests\RemoveSeriesRequest;
use App\Http\Api\Requests\ScanBulkMangaRequest;
use App\Http\Api\Resources\MangaResource;
use App\Manga\Application\Actions\AddBulkScannedMangasAction;
use App\Manga\Application\Actions\AddLocalVolumesToEditionAction;
use App\Manga\Application\Actions\AddMangaAction;
use App\Manga\Application\Actions\BulkRemoveVolumesFromCollectionAction;
use App\Manga\Application\Actions\ListUserMangasAction;
use App\Manga\Application\Actions\RemoveSeriesFromCollectionAction;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MangaCollectionController
{
    public function index(Request $request, ListUserMangasAction $action): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $mangas = $action->execute((int) $user->id);

        return MangaResource::collection(collect($mangas));
    }

    public function store(AddMangaRequest $request, AddMangaAction $action): JsonResponse
    {
        $dto = $request->toDTO();

        $manga = $action->execute($dto);

        return (new MangaResource($manga))->response()->setStatusCode(201);
    }

    public function scanBulk(ScanBulkMangaRequest $request, AddBulkScannedMangasAction $action): JsonResponse
    {
        $dto = $request->toDTO();

        $mangas = $action->execute($dto);

        return MangaResource::collection(collect($mangas))->response()->setStatusCode(201);
    }

    public function bulkAdd(AddLocalVolumesRequest $request, AddLocalVolumesToEditionAction $action): JsonResponse
    {
        $dto = $request->toDTO();

        $mangas = $action->execute($dto);

        return MangaResource::collection(collect($mangas))->response()->setStatusCode(201);
    }

    public function bulkRemove(BulkRemoveVolumesRequest $request, BulkRemoveVolumesFromCollectionAction $action): JsonResponse
    {
        $dto = $request->toDTO();

        $action->execute($dto);

        return response()->json(['message' => 'Volumes removed from collection'], 200);
    }

    public function removeSeries(RemoveSeriesRequest $request, RemoveSeriesFromCollectionAction $action, int $seriesId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $action->execute($seriesId, (int) $user->id);

        return response()->json(['message' => 'Series removed from collection'], 200);
    }
}
