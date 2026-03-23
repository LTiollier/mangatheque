<?php

declare(strict_types=1);

namespace App\Manga\Infrastructure\Console;

use App\Manga\Application\Jobs\ImportMangaCollecSeriesJob;
use App\Manga\Infrastructure\Services\MangaCollecScraperService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SyncAllMangaCollecSeriesCommand extends Command
{
    protected $signature = 'app:sync-all-series {--limit= : The number of series to sync (default: all)} {--rps=3 : Requests per second} {--reset : Clear progress and start sync from scratch}';

    protected $description = 'Sync (re-scrape) all series from MangaCollec API';

    public function __construct(
        private readonly MangaCollecScraperService $scraperService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Starting full MangaCollec synchronization...');

        if ($this->option('reset')) {
            $this->resetProgress();
            $this->info('Sync progress cleared.');
        }

        if (! $this->scraperService->login()) {
            $this->error('Failed to login to MangaCollec');

            return 1;
        }

        $this->info('Fetching series list from MangaCollec API...');
        /** @var array<int, array<string, mixed>> $seriesList */
        $seriesList = $this->scraperService->getSeriesList();
        $limitOption = $this->option('limit');
        $limit = $limitOption !== null ? (int) $limitOption : null;
        $count = 0;

        $this->info(sprintf('Total series found in API: %d', count($seriesList)));

        foreach ($seriesList as $seriesData) {
            if ($limit !== null && $count >= $limit) {
                break;
            }

            /** @var string $seriesUuid */
            $seriesUuid = $seriesData['id'] ?? '';
            /** @var string $title */
            $title = $seriesData['title'] ?? '';

            if ($this->isSeriesSynced($seriesUuid)) {
                $this->line("Skipping (already synced): {$title}");

                continue;
            }

            $this->info("Dispatching sync job for series: {$title} ({$seriesUuid})");

            ImportMangaCollecSeriesJob::dispatch($seriesUuid);

            $this->markSeriesSynced($seriesUuid);
            $count++;
        }

        $this->info("Successfully dispatched {$count} series sync jobs. Full synchronization process initiated!");

        return 0;
    }

    private function resetProgress(): void
    {
        Cache::forget('sync_all_mangacollec_progress');
    }

    private function isSeriesSynced(string $uuid): bool
    {
        /** @var array<string, string> $progress */
        $progress = Cache::get('sync_all_mangacollec_progress', []);

        return ($progress[$uuid] ?? '') === 'ok';
    }

    private function markSeriesSynced(string $uuid): void
    {
        /** @var array<string, string> $progress */
        $progress = Cache::get('sync_all_mangacollec_progress', []);
        $progress[$uuid] = 'ok';
        Cache::put('sync_all_mangacollec_progress', $progress, now()->addWeeks(2));
    }
}
