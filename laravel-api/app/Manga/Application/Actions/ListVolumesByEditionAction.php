<?php

declare(strict_types=1);

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Models\Volume;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;

final class ListVolumesByEditionAction
{
    public function __construct(
        private readonly VolumeRepositoryInterface $volumeRepository
    ) {}

    /**
     * @return Volume[]
     */
    public function execute(int $editionId, ?int $userId = null): array
    {
        return $this->volumeRepository->findByEditionId($editionId, $userId);
    }
}
