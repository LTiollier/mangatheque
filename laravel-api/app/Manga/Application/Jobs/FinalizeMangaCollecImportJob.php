<?php

declare(strict_types=1);

namespace App\Manga\Application\Jobs;

use App\Manga\Infrastructure\EloquentModels\Box;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class FinalizeMangaCollecImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    /**
     * @param  array<int, string>  $volumeApiIds
     * @param  array<int, string>  $boxApiIds
     */
    public function __construct(
        private readonly int $userId,
        private readonly array $volumeApiIds,
        private readonly array $boxApiIds,
    ) {}

    public function handle(): void
    {
        try {
            // 1. Map Volume API IDs to Local IDs
            /** @var array<int, int> $volumeLocalIds */
            $volumeLocalIds = Volume::whereIn('api_id', $this->volumeApiIds)->pluck('id')->toArray();

            // 2. Attach Volumes with Optimization (Point 5.5)
            $this->attachItemsToUser('user_volumes', 'volume_id', $volumeLocalIds);

            // 3. Map Box API IDs to Local IDs
            /** @var array<int, int> $boxLocalIds */
            $boxLocalIds = Box::whereIn('api_id', $this->boxApiIds)->pluck('id')->toArray();

            // 4. Attach Boxes with Optimization (Point 5.5)
            $this->attachItemsToUser('user_boxes', 'box_id', $boxLocalIds);

            Log::info("MangaCollec import finalized for user #{$this->userId}", [
                'volumes_attached' => count($volumeLocalIds),
                'boxes_attached' => count($boxLocalIds),
            ]);

        } catch (Exception $e) {
            Log::error('FinalizeMangaCollecImportJob failed', [
                'user_id' => $this->userId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * @param  array<int, int>  $ids
     */
    private function attachItemsToUser(string $table, string $idColumn, array $ids): void
    {
        if (empty($ids)) {
            return;
        }

        $now = now();
        $records = array_map(fn (int $id) => [
            'user_id' => $this->userId,
            $idColumn => $id,
            'created_at' => $now,
            'updated_at' => $now,
        ], $ids);

        // Chunking for performance (Point 5.5)
        foreach (array_chunk($records, 500) as $chunk) {
            DB::table($table)->insertOrIgnore($chunk);
        }
    }
}
