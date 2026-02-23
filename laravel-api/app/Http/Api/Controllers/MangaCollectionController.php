<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\AddMangaRequest;
use App\Http\Api\Requests\ScanMangaRequest;
use App\Http\Api\Resources\MangaResource;
use App\Manga\Application\Actions\AddMangaAction;
use App\Manga\Application\Actions\AddScannedMangaAction;
use App\Manga\Application\Actions\ListUserMangasAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MangaCollectionController
{
    public function index(Request $request, ListUserMangasAction $action): AnonymousResourceCollection
    {
        /** @var \App\User\Infrastructure\EloquentModels\User $user */
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

    public function scan(ScanMangaRequest $request, AddScannedMangaAction $action): JsonResponse
    {
        $dto = $request->toDTO();

        $manga = $action->execute($dto);

        return (new MangaResource($manga))->response()->setStatusCode(201);
    }

    public function bulkAdd(\App\Http\Api\Requests\AddLocalVolumesRequest $request, \App\Manga\Application\Actions\AddLocalVolumesToEditionAction $action): JsonResponse
    {
        $dto = $request->toDTO();

        $mangas = $action->execute($dto);

        return MangaResource::collection(collect($mangas))->response()->setStatusCode(201);
    }
}
