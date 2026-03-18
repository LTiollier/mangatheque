<?php

namespace App\ReadingProgress\Application\Actions;

use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\ReadingProgress\Application\DTOs\BulkToggleReadingProgressDTO;
use App\ReadingProgress\Domain\Models\ReadingProgress;
use App\ReadingProgress\Domain\Repositories\ReadingProgressRepositoryInterface;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;

class BulkToggleReadingProgressAction
{
    public function __construct(
        private readonly ReadingProgressRepositoryInterface $readingProgressRepository,
        private readonly VolumeRepositoryInterface $volumeRepository,
    ) {}

    /**
     * @return array{toggled: ReadingProgress[], removed: int[]}
     */
    public function execute(BulkToggleReadingProgressDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {
            $toggled = [];
            $removed = [];
            $now = new DateTimeImmutable;

            foreach ($dto->volumeIds as $volumeId) {
                if (! $this->volumeRepository->isOwnedByUser($volumeId, $dto->userId)) {
                    continue;
                }

                $existing = $this->readingProgressRepository->findByUserIdAndVolumeId($dto->userId, $volumeId);

                if ($existing) {
                    $this->readingProgressRepository->deleteByUserIdAndVolumeId($dto->userId, $volumeId);
                    $removed[] = $volumeId;
                } else {
                    $toggled[] = $this->readingProgressRepository->save(new ReadingProgress(
                        id: null,
                        userId: $dto->userId,
                        volumeId: $volumeId,
                        readAt: $now,
                    ));
                }
            }

            return ['toggled' => $toggled, 'removed' => $removed];
        });
    }
}
