<?php

declare(strict_types=1);

namespace App\Manga\Infrastructure\Console;

use App\Manga\Application\Jobs\ImportMangaCollecSeriesJob;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\Services\MangaCollecScraperService;
use Illuminate\Console\Command;

class SyncMangaCollecSeriesCommand extends Command
{
    protected $signature = 'app:sync-series {--rps=3 : Requests per second} {--debug : Print detailed import steps}';

    protected $description = 'Sync (re-scrape) used series and import new (non-registered) series from MangaCollec';

    public function __construct(
        private readonly MangaCollecScraperService $scraperService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Starting MangaCollec series synchronization...');

        if (! $this->scraperService->login()) {
            $this->error('Failed to login to MangaCollec');

            return 1;
        }

        $this->info('Fetching series from MangaCollec API...');
        /** @var array<int, array<string, mixed>> $apiSeriesList */
        $apiSeriesList = $this->scraperService->getSeriesList();
        $apiIdsFromList = collect($apiSeriesList)->pluck('id')->filter()->all();

        $this->info('Fetching registered and used series from local database...');
        $usedApiIds = $this->resolveUsedSeriesApiIds();
        $allRegisteredApiIds = EloquentSeries::query()->whereNotNull('api_id')->pluck('api_id')->all();

        // New series are those in the API list but not yet in our database
        /** @var array<int, string> $newApiIds */
        $newApiIds = array_diff($apiIdsFromList, $allRegisteredApiIds);

        // Combine used (to keep them fresh) and new (to discover them)
        /** @var array<int, string> $syncList */
        $syncList = array_unique(array_merge($usedApiIds, $newApiIds));

        if (empty($syncList)) {
            $this->info('No series to sync found.');

            return 0;
        }

        $this->info(sprintf(
            'Sync plan: %d used series to refresh, %d new series to import (Total unique: %d)',
            count($usedApiIds),
            count($newApiIds),
            count($syncList)
        ));

        foreach ($syncList as $seriesUuid) {
            $this->info("Dispatching import job for series: {$seriesUuid}");

            ImportMangaCollecSeriesJob::dispatch($seriesUuid);
        }

        $this->info(sprintf('Successfully dispatched %d series sync jobs.', count($syncList)));

        return 0;
    }

    /**
     * Return the api_ids of all "used" series:
     * series that have at least one volume or box owned by any user,
     * or at least one edition or box wishlisted by any user.
     *
     * @return array<int, string>
     */
    private function resolveUsedSeriesApiIds(): array
    {
        /** @var array<int, string> $apiIds */
        $apiIds = EloquentSeries::query()
            ->whereNotNull('api_id')
            ->where(function ($query): void {
                $query
                    ->orWhereHas('editions.volumes.users')
                    ->orWhereHas('boxSets.boxes.users')
                    ->orWhereHas('editions.wishlistedBy')
                    ->orWhereHas('boxSets.boxes.wishlistedBy');
            })
            ->pluck('api_id')
            ->all();

        return $apiIds;
    }
}
