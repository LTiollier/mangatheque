<?php

declare(strict_types=1);

namespace App\Manga\Infrastructure\Console;

use App\Manga\Application\Jobs\ImportMangaCollecSeriesJob;
use Illuminate\Console\Command;

class SyncMangaCollecSeriesByUuidCommand extends Command
{
    protected $signature = 'app:sync-series-uuid {uuid : The MangaCollec series UUID}';

    protected $description = 'Sync (re-scrape) a specific series from MangaCollec by its UUID';

    public function handle(): int
    {
        /** @var string $uuid */
        $uuid = $this->argument('uuid');

        $this->info("Dispatching import job for series UUID: {$uuid}");

        ImportMangaCollecSeriesJob::dispatch($uuid);

        $this->info('Job dispatched successfully.');

        return 0;
    }
}
