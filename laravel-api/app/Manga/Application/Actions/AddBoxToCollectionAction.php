<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\DB;

class AddBoxToCollectionAction
{
    public function __construct(
        private readonly BoxRepositoryInterface $boxRepository,
        private readonly VolumeRepositoryInterface $volumeRepository,
    ) {}

    public function execute(int $boxId, int $userId): void
    {
        DB::transaction(function () use ($boxId, $userId) {
            $box = $this->boxRepository->findById($boxId);
            if (! $box) {
                return;
            }

            $this->boxRepository->attachToUser($boxId, $userId);

            if (! $box->isEmpty()) {
                foreach ($box->getVolumes() as $volume) {
                    $this->volumeRepository->attachToUser($volume->getId(), $userId);
                }
            }
        });
    }
}
