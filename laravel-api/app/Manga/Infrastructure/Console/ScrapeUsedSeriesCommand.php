<?php

declare(strict_types=1);

namespace App\Manga\Infrastructure\Console;

use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\Services\MangaCollecScraperService;
use Illuminate\Console\Command;

class ScrapeUsedSeriesCommand extends Command
{
    protected $signature = 'app:scrape-used-series {--rps=3 : Requests per second} {--debug : Print detailed import steps} {--series= : Only process this specific series API UUID}';

    protected $description = 'Re-scrape and upsert series that are actively used (owned volumes/boxes or wishlisted editions/boxes)';

    public function __construct(
        private readonly MangaCollecScraperService $scraperService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Fetching used series from database...');

        $seriesFilter = $this->option('series');
        $apiIds = $seriesFilter
            ? [$seriesFilter]
            : $this->resolveUsedSeriesApiIds();

        if (empty($apiIds)) {
            $this->info('No used series found.');

            return 0;
        }

        $this->info(sprintf('Found %d used series to re-scrape.', count($apiIds)));

        if (! $this->scraperService->login()) {
            $this->error('Failed to login to MangaCollec');

            return 1;
        }

        foreach ($apiIds as $seriesUuid) {
            $this->info("Dispatching import job for series: {$seriesUuid}");

            \App\Manga\Application\Jobs\ImportMangaCollecSeriesJob::dispatch($seriesUuid);

            $this->info("Dispatched: {$seriesUuid}");
        }

        $this->info(sprintf('Dispatched %d series import jobs. Re-scrape process initiated!', count($apiIds)));

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
