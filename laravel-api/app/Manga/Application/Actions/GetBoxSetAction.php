<?php

namespace App\Manga\Application\Actions;

use App\Manga\Domain\Models\BoxSet;
use App\Manga\Domain\Repositories\BoxSetRepositoryInterface;

class GetBoxSetAction
{
    public function __construct(
        private readonly BoxSetRepositoryInterface $boxSetRepository
    ) {}

    public function execute(int $id, ?int $userId = null): ?BoxSet
    {
        return $this->boxSetRepository->findById($id, $userId);
    }
}
