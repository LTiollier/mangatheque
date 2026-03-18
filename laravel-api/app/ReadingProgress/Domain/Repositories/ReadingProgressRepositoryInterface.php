<?php

namespace App\ReadingProgress\Domain\Repositories;

use App\ReadingProgress\Domain\Models\ReadingProgress;

interface ReadingProgressRepositoryInterface
{
    public function save(ReadingProgress $readingProgress): ReadingProgress;

    public function deleteByUserIdAndVolumeId(int $userId, int $volumeId): void;

    public function findByUserIdAndVolumeId(int $userId, int $volumeId): ?ReadingProgress;

    /** @return ReadingProgress[] */
    public function findAllByUserId(int $userId): array;
}
