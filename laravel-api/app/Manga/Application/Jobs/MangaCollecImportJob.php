<?php

declare(strict_types=1);

namespace App\Manga\Application\Jobs;

use App\Manga\Application\DTOs\ImportMangaCollecDTO;
use App\Manga\Infrastructure\Services\MangaCollecScraperService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;

final class MangaCollecImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(
        public readonly ImportMangaCollecDTO $dto,
    ) {}

    public function handle(MangaCollecScraperService $scraperService): void
    {
        try {
            $collection = $scraperService->getUserCollection($this->dto->username);

            if ($collection === null) {
                Log::error("MangaCollec import failed: Profile private or invalid for {$this->dto->username}");

                return;
            }

            /** @var array<int, array<string, mixed>> $editions */
            $editions = is_array($collection['editions'] ?? null) ? $collection['editions'] : [];
            /** @var array<int, array<string, mixed>> $possessions */
            $possessions = is_array($collection['possessions'] ?? null) ? $collection['possessions'] : [];
            /** @var array<int, array<string, mixed>> $boxPossessions */
            $boxPossessions = is_array($collection['box_possessions'] ?? null) ? $collection['box_possessions'] : [];

            // 1. Extract unique series IDs
            $seriesApiIds = [];
            foreach ($editions as $editionData) {
                $seriesApiId = $editionData['series_id'] ?? null;
                if (is_string($seriesApiId) && $seriesApiId !== '' && ! in_array($seriesApiId, $seriesApiIds, true)) {
                    $seriesApiIds[] = $seriesApiId;
                }
            }

            // 2. Extract volume and box API IDs for finalization
            $volumeApiIds = [];
            foreach ($possessions as $volData) {
                $volApiId = $volData['volume_id'] ?? null;
                if (is_string($volApiId) && $volApiId !== '') {
                    $volumeApiIds[] = $volApiId;
                }
            }

            $boxApiIds = [];
            foreach ($boxPossessions as $boxData) {
                $boxApiId = $boxData['box_id'] ?? null;
                if (is_string($boxApiId) && $boxApiId !== '') {
                    $boxApiIds[] = $boxApiId;
                }
            }

            // 3. Create a batch of jobs to import each series
            $seriesJobs = array_map(
                fn (string $id) => new ImportMangaCollecSeriesJob($id),
                $seriesApiIds
            );

            if (empty($seriesJobs)) {
                // If no series, finalize immediately
                FinalizeMangaCollecImportJob::dispatch($this->dto->userId, $volumeApiIds, $boxApiIds);

                return;
            }

            $userId = $this->dto->userId;
            Bus::batch($seriesJobs)
                ->then(function () use ($userId, $volumeApiIds, $boxApiIds) {
                    FinalizeMangaCollecImportJob::dispatch($userId, $volumeApiIds, $boxApiIds);
                })
                ->name("MangaCollec Import for User #{$userId}")
                ->dispatch();

        } catch (Exception $e) {
            Log::error('MangaCollecImportJob failed', [
                'username' => $this->dto->username,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
