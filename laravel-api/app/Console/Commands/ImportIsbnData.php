<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportIsbnData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'isbn:import {file : The path to the CSV file} {--chunk=2000 : Number of rows to process at once}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import ISBN data from Open4Goods CSV dataset into MongoDB';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $filePath = $this->argument('file');

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }

        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            $this->error("Could not open file: {$filePath}");
            return 1;
        }

        // Read header
        $header = fgetcsv($handle);
        if ($header === false) {
            $this->error("Empty file: {$filePath}");
            fclose($handle);
            return 1;
        }

        // Get total rows for progress bar
        $this->info("Counting rows in file...");
        $rowCount = $this->countLines($filePath) - 1; // Subtract header
        $this->info("Found {$rowCount} rows to process.");

        $bar = $this->output->createProgressBar($rowCount);
        $bar->start();

        $chunkSize = (int) $this->option('chunk');
        $ops = [];
        $processed = 0;

        // Get the underlying MongoDB collection for maximum performance
        $collection = DB::connection('mongodb')->getCollection('isbn_data');

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) !== count($header)) {
                $this->warn("\nSkipping invalid row " . ($processed + 2) . ": Column count mismatch.");
                continue;
            }

            $data = array_combine($header, $row);
            
            // Remove unwanted fields
            unset($data['min_price'], $data['offers_count'], $data['url'], $data['currency']);

            // Prepare upsert operation for MongoDB bulkWrite
            $ops[] = [
                'replaceOne' => [
                    ['isbn' => $data['isbn']],
                    $data,
                    ['upsert' => true]
                ]
            ];

            if (count($ops) >= $chunkSize) {
                $collection->bulkWrite($ops);
                $bar->advance(count($ops));
                $processed += count($ops);
                $ops = [];
            }
        }

        if (!empty($ops)) {
            $collection->bulkWrite($ops);
            $bar->advance(count($ops));
            $processed += count($ops);
        }

        $bar->finish();
        fclose($handle);

        $this->newLine();
        $this->info("Ensuring index on 'isbn'...");
        $collection->createIndex(['isbn' => 1], ['unique' => true]);

        $this->info("Import completed: {$processed} records processed.");

        return 0;
    }

    /**
     * Fast line counting.
     */
    protected function countLines(string $filePath): int
    {
        $lineCount = 0;
        $handle = fopen($filePath, "r");
        while (!feof($handle)) {
            fgets($handle);
            $lineCount++;
        }
        fclose($handle);
        return $lineCount;
    }
}
