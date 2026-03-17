<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Resources\BoxResource;
use App\Http\Api\Resources\BoxSetResource;
use App\Http\Api\Resources\EditionResource;
use App\Http\Api\Resources\MangaResource;
use App\Http\Api\Resources\SeriesResource;
use App\Manga\Application\Actions\GetBoxAction;
use App\Manga\Application\Actions\GetBoxSetAction;
use App\Manga\Application\Actions\GetEditionAction;
use App\Manga\Application\Actions\GetSeriesAction;
use App\Manga\Application\Actions\ListEditionsAction;
use App\Manga\Application\Actions\ListVolumesByEditionAction;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MangaHierarchyController
{
    public function showSeries(Request $request, GetSeriesAction $action, int $id): SeriesResource
    {
        /** @var User|null $user */
        $user = $request->user();

        $series = $action->execute($id, $user ? (int) $user->id : null);

        if (! $series) {
            abort(404, 'Series not found');
        }

        return new SeriesResource($series);
    }

    public function listEditions(ListEditionsAction $action, int $seriesId): AnonymousResourceCollection
    {
        $editions = $action->execute($seriesId);

        return EditionResource::collection($editions);
    }

    public function listVolumes(ListVolumesByEditionAction $action, int $editionId): AnonymousResourceCollection
    {
        $volumes = $action->execute($editionId);

        return MangaResource::collection($volumes);
    }

    public function showEdition(Request $request, GetEditionAction $action, int $editionId): EditionResource
    {
        /** @var User|null $user */
        $user = $request->user();

        $edition = $action->execute($editionId, $user ? (int) $user->id : null);

        if (! $edition) {
            abort(404, 'Edition not found');
        }

        return new EditionResource($edition);
    }

    public function showBoxSet(Request $request, GetBoxSetAction $action, int $boxSetId): BoxSetResource
    {
        /** @var User|null $user */
        $user = $request->user();

        $boxSet = $action->execute($boxSetId, $user ? (int) $user->id : null);

        if (! $boxSet) {
            abort(404, 'Box Set not found');
        }

        return new BoxSetResource($boxSet);
    }

    public function showBox(Request $request, GetBoxAction $action, int $boxId): BoxResource
    {
        /** @var User|null $user */
        $user = $request->user();

        $box = $action->execute($boxId, $user ? (int) $user->id : null);

        if (! $box) {
            abort(404, 'Box not found');
        }

        return new BoxResource($box);
    }
}
