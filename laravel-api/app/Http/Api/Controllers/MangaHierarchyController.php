<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Resources\EditionResource;
use App\Http\Api\Resources\MangaResource;
use App\Http\Api\Resources\SeriesResource;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MangaHierarchyController
{
    public function __construct(
        private readonly SeriesRepositoryInterface $seriesRepository,
        private readonly EditionRepositoryInterface $editionRepository,
        private readonly VolumeRepositoryInterface $volumeRepository
    ) {
    }

    public function showSeries(int $id): SeriesResource
    {
        $series = $this->seriesRepository->findById($id);

        if (!$series) {
            abort(404, 'Series not found');
        }

        return new SeriesResource($series);
    }

    public function listEditions(int $seriesId): AnonymousResourceCollection
    {
        $editions = $this->editionRepository->findBySeriesId($seriesId);

        return EditionResource::collection($editions);
    }

    public function listVolumes(int $editionId): AnonymousResourceCollection
    {
        $volumes = $this->volumeRepository->findByEditionId($editionId);

        return MangaResource::collection($volumes);
    }
}
