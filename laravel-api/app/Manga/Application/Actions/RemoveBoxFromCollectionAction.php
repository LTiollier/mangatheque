<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use Illuminate\Support\Facades\DB;

class RemoveBoxFromCollectionAction
{
    public function __construct(
        private readonly BoxRepositoryInterface $boxRepository,
        private readonly VolumeRepositoryInterface $volumeRepository,
    ) {}

    public function execute(int $boxId, int $userId): void
    {
        DB::transaction(function () use ($boxId, $userId) {
            $box = $this->boxRepository->findById($boxId, $userId);
            if (! $box) {
                return;
            }

            $this->boxRepository->detachFromUser($boxId, $userId);

            // Do we also detach the volumes?
            // In some cases, the user might have the volumes but not the box.
            // But if they "remove the box", they probably mean removing everything in it.
            // Let's ask ourselves: if I remove a series, I remove all its volumes.
            // If I remove a box, I should probably remove all its volumes.
            if (! $box->isEmpty()) {
                foreach ($box->getVolumes() as $volume) {
                    $this->volumeRepository->detachFromUser($volume->getId(), $userId);
                }
            }
        });
    }
}
