<?php

namespace App\Manga\Application\Actions;

use App\Manga\Application\DTOs\AddMangaDTO;
use App\Manga\Domain\Models\Manga;
use App\Manga\Domain\Repositories\MangaRepositoryInterface;
use App\Manga\Infrastructure\Services\MangaLookupService;
use Illuminate\Support\Facades\DB;

class AddMangaAction
{
    public function __construct(
        private readonly MangaLookupService $lookupService,
        private readonly MangaRepositoryInterface $mangaRepository
    ) {}

    public function execute(AddMangaDTO $dto): Manga
    {
        return DB::transaction(function () use ($dto) {
            // 1. Check if exists in DB
            $manga = $this->mangaRepository->findByApiId($dto->api_id);

            if (! $manga) {
                // 2. Fetch from external service
                $mangaData = $this->lookupService->findByApiId($dto->api_id);

                if (! $mangaData) {
                    throw new \Exception('Manga not found in external API with ID: '.$dto->api_id);
                }

                // 3. Create in DB
                $manga = $this->mangaRepository->create($mangaData);
            }

            // 4. Attach to user
            $this->mangaRepository->attachToUser($manga->getId(), $dto->userId);

            // 5. Dispatch Event
            event(new \App\Manga\Domain\Events\MangaAddedToCollection($manga, $dto->userId));

            return $manga;
        });
    }
}
