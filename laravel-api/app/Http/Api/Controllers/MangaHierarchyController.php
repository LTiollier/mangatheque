<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Resources\EditionResource;
use App\Http\Api\Resources\MangaResource;
use App\Http\Api\Resources\SeriesResource;
use App\Manga\Application\Actions\GetSeriesAction;
use App\Manga\Application\Actions\ListEditionsAction;
use App\Manga\Application\Actions\ListVolumesByEditionAction;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MangaHierarchyController
{
    public function showSeries(GetSeriesAction $action, int $id): SeriesResource
    {
        $series = $action->execute($id);

        if (!$series) {
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
}
