<?php

declare(strict_types=1);

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
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MangaHierarchyController
{
    public function showSeries(Request $request, GetSeriesAction $action, int $seriesId): SeriesResource
    {
        $userId = auth()->id() ? (int) auth()->id() : null;
        $series = $action->execute($seriesId, $userId);

        if (! $series) {
            abort(404, 'Series not found');
        }

        return new SeriesResource($series);
    }

    public function listEditions(Request $request, ListEditionsAction $action, int $seriesId): AnonymousResourceCollection
    {
        $userId = auth()->id() ? (int) auth()->id() : null;
        $editions = $action->execute($seriesId, $userId);

        return EditionResource::collection($editions);
    }

    public function listVolumes(Request $request, ListVolumesByEditionAction $action, int $editionId): AnonymousResourceCollection
    {
        $userId = auth()->id() ? (int) auth()->id() : null;
        $volumes = $action->execute($editionId, $userId);

        return MangaResource::collection($volumes);
    }

    public function showEdition(Request $request, GetEditionAction $action, int $editionId): EditionResource
    {
        $userId = auth()->id() ? (int) auth()->id() : null;
        $edition = $action->execute($editionId, $userId);

        if (! $edition) {
            abort(404, 'Edition not found');
        }

        return new EditionResource($edition);
    }

    public function showBoxSet(Request $request, GetBoxSetAction $action, int $boxSetId): BoxSetResource
    {
        $userId = auth()->id() ? (int) auth()->id() : null;
        $boxSet = $action->execute($boxSetId, $userId);

        if (! $boxSet) {
            abort(404, 'Box Set not found');
        }

        return new BoxSetResource($boxSet);
    }

    public function showBox(Request $request, GetBoxAction $action, int $boxId): BoxResource
    {
        $userId = auth()->id() ? (int) auth()->id() : null;
        $box = $action->execute($boxId, $userId);

        if (! $box) {
            abort(404, 'Box not found');
        }

        return new BoxResource($box);
    }
}
