<?php

namespace App\Manga\Infrastructure\Console;

use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\Services\MangaCollecScraperService;
use App\Manga\Infrastructure\Services\MangaCollecSeriesImportService;
use Illuminate\Console\Command;

class ScrapeUsedSeriesCommand extends Command
{
    protected $signature = 'app:scrape-used-series {--rps=3 : Requests per second}';

    protected $description = 'Re-scrape and upsert series that are actively used (owned volumes/boxes or wishlisted editions/boxes)';

    private ?float $lastRequestTime = null;

    public function __construct(
        private readonly MangaCollecScraperService $scraperService,
        private readonly MangaCollecSeriesImportService $importService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        ini_set('memory_limit', '512M');

        $this->info('Fetching used series from database...');

        $apiIds = $this->resolveUsedSeriesApiIds();

        if (empty($apiIds)) {
            $this->info('No used series found.');

            return 0;
        }

        $this->info(sprintf('Found %d used series to re-scrape.', count($apiIds)));

        $this->throttle();
        if (! $this->scraperService->login()) {
            $this->error('Failed to login to MangaCollec');

            return 1;
        }

        foreach ($apiIds as $seriesUuid) {
            $this->info("Scraping series: {$seriesUuid}");

            $this->throttle();
            /** @var array<string, mixed>|null $detail */
            $detail = $this->scraperService->getSeriesDetail($seriesUuid);
            if (! $detail) {
                $this->warn("Could not get details for series {$seriesUuid}");

                continue;
            }

            $this->importService->import($seriesUuid, $detail);

            unset($detail);
            gc_collect_cycles();

            $this->info("Done: {$seriesUuid}");
        }

        $this->info('Re-scrape completed!');

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

    private function throttle(): void
    {
        $rpsOption = $this->option('rps');
        /** @var float $rps */
        $rps = is_numeric($rpsOption) ? (float) $rpsOption : 2.0;

        if ($rps <= 0) {
            return;
        }

        $intervalSeconds = 1.0 / $rps;

        if ($this->lastRequestTime !== null) {
            $elapsed = microtime(true) - $this->lastRequestTime;
            if ($elapsed < $intervalSeconds) {
                $sleepTime = (int) (($intervalSeconds - $elapsed) * 1000000);
                usleep($sleepTime);
            }
        }

        $this->lastRequestTime = microtime(true);
    }
}
