<?php

namespace App\Manga\Infrastructure\Console;

use App\Manga\Infrastructure\Services\MangaCollecScraperService;
use App\Manga\Infrastructure\Services\MangaCollecSeriesImportService;
use Illuminate\Console\Command;

class ScrapeMangaCollecCommand extends Command
{
    protected $signature = 'app:scrape-mangacollec {--limit= : The number of series to scrape (default: all)} {--rps=3 : Requests per second} {--reset : Clear progress file and start from scratch}';

    protected $description = 'Scrape manga data from MangaCollec API';

    private ?float $lastRequestTime = null;

    private string $progressFile = '';

    /** @var array<string, array<string, string>> */
    private array $progress = ['series' => []];

    public function __construct(
        private readonly MangaCollecScraperService $scraperService,
        private readonly MangaCollecSeriesImportService $importService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        ini_set('memory_limit', '512M');

        $this->info('Starting MangaCollec Scraper...');

        $this->progressFile = storage_path('app/scrape-progress.json');

        if ($this->option('reset')) {
            @unlink($this->progressFile);
            $this->info('Progress file cleared.');
        }

        $this->loadProgress();

        $this->throttle();
        if (! $this->scraperService->login()) {
            $this->error('Failed to login to MangaCollec');

            return 1;
        }

        $this->throttle();
        /** @var array<int, array<string, mixed>> $seriesList */
        $seriesList = $this->scraperService->getSeriesList();
        $limitOption = $this->option('limit');
        $limit = $limitOption !== null ? (int) $limitOption : null;
        $count = 0;

        foreach ($seriesList as $seriesData) {
            /** @var array<string, mixed> $seriesData */
            if ($limit !== null && $count >= $limit) {
                break;
            }

            /** @var string $seriesUuid */
            $seriesUuid = $seriesData['id'] ?? '';
            /** @var string $title */
            $title = $seriesData['title'] ?? '';

            if ($this->isSeriesComplete($seriesUuid)) {
                $this->line("Skipping (already imported): {$title}");

                continue;
            }

            $this->info("Scraping series: {$title} ({$seriesUuid})");

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

            $this->markSeriesComplete($seriesUuid);
            /** @var string $finishTitle */
            $finishTitle = $seriesData['title'] ?? '';
            $this->info("Finished series: {$finishTitle}");
            $count++;
        }

        $this->info('Scraping completed!');

        return 0;
    }

    private function loadProgress(): void
    {
        if (file_exists($this->progressFile)) {
            /** @var mixed $decoded */
            $decoded = json_decode((string) file_get_contents($this->progressFile), true);
            $this->progress = is_array($decoded) ? $decoded : ['series' => []]; // @phpstan-ignore-line
        }
    }

    private function isSeriesComplete(string $uuid): bool
    {
        return ($this->progress['series'][$uuid] ?? '') === 'ok';
    }

    private function markSeriesComplete(string $uuid): void
    {
        $this->progress['series'][$uuid] = 'ok';
        file_put_contents($this->progressFile, json_encode($this->progress, JSON_PRETTY_PRINT));
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
                // Sleep using microseconds
                $sleepTime = (int) (($intervalSeconds - $elapsed) * 1000000);
                usleep($sleepTime);
            }
        }

        $this->lastRequestTime = microtime(true);
    }
}
