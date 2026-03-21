<?php

namespace Tests\Unit\Manga\Infrastructure\Services;

use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;
use App\Manga\Infrastructure\Services\MangaCollecSeriesImportService;

function buildDetail(string $seriesUuid, string $title, array $overrides = []): array
{
    return array_merge([
        'authors' => [
            ['first_name' => 'Test', 'name' => 'Author'],
        ],
        'series' => [
            ['title' => $title],
        ],
        'title' => $title,
        'editions' => [
            [
                'id' => 'edition-uuid-1',
                'title' => 'Standard',
                'publisher_id' => 'pub-1',
                'volumes_count' => 3,
                'not_finished' => false,
            ],
        ],
        'publishers' => [
            ['id' => 'pub-1', 'title' => 'Kana'],
        ],
        'volumes' => [
            [
                'id' => 'vol-uuid-1',
                'edition_id' => 'edition-uuid-1',
                'number' => '1',
                'title' => $title.' Tome 1',
                'isbn' => '9781234567890',
                'image_url' => 'https://cdn.example.com/cover1.jpg',
                'release_date' => '2020-01-01',
            ],
        ],
        'box_editions' => [],
        'boxes' => [],
        'box_volumes' => [],
    ], $overrides);
}

test('import creates series, edition and volume when they do not exist', function () {
    $service = app(MangaCollecSeriesImportService::class);
    $uuid = 'series-uuid-new';
    $detail = buildDetail($uuid, 'Naruto');

    $service->import($uuid, $detail);

    $series = EloquentSeries::where('api_id', $uuid)->first();
    expect($series)->not->toBeNull();
    expect($series->title)->toBe('Naruto');
    expect($series->authors)->toBe('Test Author');
    expect($series->editions)->toHaveCount(1);

    $volume = EloquentVolume::where('api_id', 'vol-uuid-1')->first();
    expect($volume)->not->toBeNull();
    expect($volume->isbn)->toBe('9781234567890');
    expect($volume->cover_url)->toBe('https://cdn.example.com/cover1.jpg');
});

test('import updates series title and authors on re-import', function () {
    $service = app(MangaCollecSeriesImportService::class);
    $uuid = 'series-uuid-update';

    $service->import($uuid, buildDetail($uuid, 'Old Title'));

    $service->import($uuid, buildDetail($uuid, 'New Title', [
        'authors' => [['first_name' => 'New', 'name' => 'Author']],
    ]));

    $series = EloquentSeries::where('api_id', $uuid)->first();
    expect($series->title)->toBe('New Title');
    expect($series->authors)->toBe('New Author');
});

test('import updates volume cover_url when it arrives on re-import', function () {
    $service = app(MangaCollecSeriesImportService::class);
    $uuid = 'series-uuid-cover';

    $detailNoCover = buildDetail($uuid, 'Cover Test');
    $detailNoCover['volumes'][0]['image_url'] = null;
    $service->import($uuid, $detailNoCover);

    $volume = EloquentVolume::where('api_id', 'vol-uuid-1')->first();
    expect($volume->cover_url)->toBeNull();

    $detailWithCover = buildDetail($uuid, 'Cover Test');
    $service->import($uuid, $detailWithCover);

    $volume->refresh();
    expect($volume->cover_url)->toBe('https://cdn.example.com/cover1.jpg');
});

test('import skips volume with duplicate ISBN and logs warning', function () {
    $service = app(MangaCollecSeriesImportService::class);

    // First series owns the ISBN
    $uuid1 = 'series-uuid-isbn-1';
    $service->import($uuid1, buildDetail($uuid1, 'Series One'));

    // Second series tries to import a volume with the same ISBN but different api_id
    $uuid2 = 'series-uuid-isbn-2';
    $detail2 = buildDetail($uuid2, 'Series Two', [
        'editions' => [
            ['id' => 'edition-uuid-2', 'title' => 'Standard', 'publisher_id' => '', 'volumes_count' => 1, 'not_finished' => true],
        ],
        'volumes' => [
            [
                'id' => 'vol-uuid-clash',
                'edition_id' => 'edition-uuid-2',
                'number' => '1',
                'title' => 'Clash',
                'isbn' => '9781234567890', // same ISBN as first series
                'image_url' => null,
                'release_date' => null,
            ],
        ],
    ]);

    $service->import($uuid2, $detail2);

    expect(EloquentVolume::where('api_id', 'vol-uuid-clash')->exists())->toBeFalse();
});

test('import sets series cover_url from first volume when not already set', function () {
    $service = app(MangaCollecSeriesImportService::class);
    $uuid = 'series-uuid-series-cover';

    $service->import($uuid, buildDetail($uuid, 'Cover Series'));

    $series = EloquentSeries::where('api_id', $uuid)->first();
    expect($series->cover_url)->toBe('https://cdn.example.com/cover1.jpg');
});
