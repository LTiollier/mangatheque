<?php

namespace Database\Seeders;

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MangaSeeder extends Seeder
{
    public function run(): void
    {
        // ------------- NARUTO -------------
        $narutoSeries = Series::factory()->naruto()->create();
        $narutoEdition = Edition::factory()->kana()->for($narutoSeries)->create();

        $narutoIsbns = [
            1 => '9782871294146',
            2 => '9782871294153',
            3 => '9782871294276',
            4 => '9782871294337',
            5 => '9782871294351',
        ];

        foreach ($narutoIsbns as $number => $isbn) {
            Volume::factory()->for($narutoEdition)->create([
                'number' => $number,
                'title' => "Tome $number",
                'isbn' => $isbn,
                'api_id' => Str::orderedUuid()->toString(),
                'authors' => ['Masashi Kishimoto'],
            ]);
        }

        // ------------- DRAGON BALL -------------
        $dbSeries = Series::factory()->dragonBall()->create();
        $dbEdition = Edition::factory()->glenat()->for($dbSeries)->create();

        $dbIsbns = [
            1 => '9782723434621',
            2 => '9782723434638',
            3 => '9782723434645',
            4 => '9782723434652',
            5 => '9782723434669',
        ];

        foreach ($dbIsbns as $number => $isbn) {
            Volume::factory()->for($dbEdition)->create([
                'number' => $number,
                'title' => "Tome $number",
                'isbn' => $isbn,
                'api_id' => Str::orderedUuid()->toString(),
                'authors' => ['Akira Toriyama'],
            ]);
        }

        // Create some random series just to populate the DB more
        $randomSeries = Series::factory()->count(3)->create();
        foreach ($randomSeries as $series) {
            $edition = Edition::factory()->for($series)->create();
            Volume::factory()->count(5)->for($edition)->create();
        }
    }
}
