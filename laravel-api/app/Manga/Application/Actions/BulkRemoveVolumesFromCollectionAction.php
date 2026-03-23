<?php

declare(strict_types=1);

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\BulkRemoveVolumesDTO;
use App\Manga\Domain\Exceptions\UnauthorizedVolumeAccessException;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\DB;

final class BulkRemoveVolumesFromCollectionAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository
    ) {}

    /**
     * @throws UnauthorizedVolumeAccessException
     */
    public function execute(BulkRemoveVolumesDTO $dto): void
    {
        if (! $this->volumeRepository->areAllOwnedByUser($dto->volumeIds, $dto->userId)) {
            throw UnauthorizedVolumeAccessException::forUser($dto->userId);
        }

        DB::transaction(function () use ($dto) {
            $this->volumeRepository->detachManyFromUser($dto->volumeIds, $dto->userId);
        });
    }
}
