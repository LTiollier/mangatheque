<?php

declare(strict_types=1);

namespace App\ReadingProgress\Infrastructure\Repositories;

use App\ReadingProgress\Domain\Models\ReadingProgress as DomainReadingProgress;
use App\ReadingProgress\Domain\Repositories\ReadingProgressRepositoryInterface;
use App\ReadingProgress\Infrastructure\EloquentModels\UserVolume as EloquentReadingProgress;
use Carbon\Carbon;
use DateTimeImmutable;

final class EloquentReadingProgressRepository implements ReadingProgressRepositoryInterface
{
    public function save(DomainReadingProgress $readingProgress): DomainReadingProgress
    {
        $eloquent = new EloquentReadingProgress;
        $eloquent->fill([
            'user_id' => $readingProgress->getUserId(),
            'volume_id' => $readingProgress->getVolumeId(),
            'read_at' => $readingProgress->getReadAt()->format('Y-m-d H:i:s'),
        ]);
        $eloquent->save();

        return $this->toDomain($eloquent);
    }

    public function deleteByUserIdAndVolumeId(int $userId, int $volumeId): void
    {
        EloquentReadingProgress::where('user_id', $userId)
            ->where('volume_id', $volumeId)
            ->delete();
    }

    public function findByUserIdAndVolumeId(int $userId, int $volumeId): ?DomainReadingProgress
    {
        $eloquent = EloquentReadingProgress::where('user_id', $userId)
            ->where('volume_id', $volumeId)
            ->first();

        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    public function findAllByUserId(int $userId): array
    {
        /** @var DomainReadingProgress[] $items */
        $items = EloquentReadingProgress::where('user_id', $userId)
            ->get()
            ->map(fn (EloquentReadingProgress $item): DomainReadingProgress => $this->toDomain($item))
            ->all();

        return $items;
    }

    private function toDomain(EloquentReadingProgress $eloquent): DomainReadingProgress
    {
        /** @var Carbon $readAt */
        $readAt = $eloquent->read_at;

        return new DomainReadingProgress(
            id: $eloquent->id,
            userId: $eloquent->user_id,
            volumeId: $eloquent->volume_id,
            readAt: new DateTimeImmutable($readAt->toIso8601String()),
        );
    }
}
