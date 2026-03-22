<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\BulkRemoveVolumesDTO;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\DB;

class BulkRemoveVolumesFromCollectionAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository
    ) {}

    public function execute(BulkRemoveVolumesDTO $dto): void
    {
        DB::transaction(function () use ($dto) {
            $this->volumeRepository->detachManyFromUser($dto->volumeIds, $dto->userId);
        });
    }
}
