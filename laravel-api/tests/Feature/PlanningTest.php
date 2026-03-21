<?php

namespace Tests\Feature;

use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;
use App\Manga\Infrastructure\EloquentModels\BoxSet as EloquentBoxSet;
use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;

uses(RefreshDatabase::class);

test('returns 401 when unauthenticated', function () {
    getJson('/api/planning')->assertUnauthorized();
});

test('returns empty list when no releases in window', function () {
    $user = User::factory()->create();
    actingAs($user);

    getJson('/api/planning?from=2030-01-01&to=2030-12-31')
        ->assertOk()
        ->assertJsonCount(0, 'data')
        ->assertJsonPath('meta.total', 0)
        ->assertJsonPath('meta.has_more', false);
});

test('returns volumes in the temporal window', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create(['title' => 'Berserk']);
    $edition = Edition::factory()->create(['series_id' => $series->id, 'name' => 'Edition Originale']);
    Volume::factory()->create([
        'edition_id' => $edition->id,
        'title' => 'Berserk T42',
        'number' => '42',
        'published_date' => '2026-04-02',
    ]);

    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'volume')
        ->assertJsonPath('data.0.title', 'Berserk T42')
        ->assertJsonPath('data.0.number', '42')
        ->assertJsonPath('data.0.release_date', '2026-04-02')
        ->assertJsonPath('data.0.series.title', 'Berserk')
        ->assertJsonPath('data.0.edition.title', 'Edition Originale')
        ->assertJsonPath('data.0.is_owned', false)
        ->assertJsonPath('data.0.is_wishlisted', false);
});

test('returns boxes in the temporal window', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create(['title' => 'One Piece']);
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'One Piece Box Set']);
    EloquentBox::create([
        'box_set_id' => $boxSet->id,
        'title' => 'One Piece Box 4',
        'number' => '4',
        'release_date' => '2026-03-25',
        'cover_url' => null,
    ]);

    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'box')
        ->assertJsonPath('data.0.title', 'One Piece Box 4')
        ->assertJsonPath('data.0.series.title', 'One Piece')
        ->assertJsonPath('data.0.edition', null);
});

test('excludes releases outside the temporal window', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => '2025-01-01']);
    Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => '2028-01-01']);

    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

test('excludes volumes without published_date', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => null]);

    actingAs($user);

    getJson('/api/planning?from=2020-01-01&to=2030-12-31')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

test('filters by type volume', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => '2026-04-01']);
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Box Set']);
    EloquentBox::create(['box_set_id' => $boxSet->id, 'title' => 'Box 1', 'release_date' => '2026-04-02']);

    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31&type=volume')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'volume');
});

test('filters by type box', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => '2026-04-01']);
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Box Set']);
    EloquentBox::create(['box_set_id' => $boxSet->id, 'title' => 'Box 1', 'release_date' => '2026-04-02']);

    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31&type=box')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'box');
});

test('sorts volumes before boxes on same date', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume = Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => '2026-04-01', 'title' => 'Volume A']);
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Box Set']);
    EloquentBox::create(['box_set_id' => $boxSet->id, 'title' => 'Box A', 'release_date' => '2026-04-01']);

    actingAs($user);

    $response = getJson('/api/planning?from=2026-01-01&to=2026-12-31')
        ->assertOk()
        ->assertJsonCount(2, 'data');

    expect($response->json('data.0.type'))->toBe('volume');
    expect($response->json('data.1.type'))->toBe('box');
});

test('marks is_owned true when volume is in user collection', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume = Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => '2026-04-01']);
    $user->volumes()->attach($volume->id);

    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31')
        ->assertOk()
        ->assertJsonPath('data.0.is_owned', true);
});

test('marks is_owned true when box is in user collection', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Box Set']);
    $box = EloquentBox::create(['box_set_id' => $boxSet->id, 'title' => 'Box 1', 'release_date' => '2026-04-01']);
    $user->boxes()->attach($box->id);

    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31')
        ->assertOk()
        ->assertJsonPath('data.0.is_owned', true);
});

test('marks is_wishlisted true when edition is wishlisted for a volume', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => '2026-04-01']);
    $user->wishlistEditions()->attach($edition->id);

    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31')
        ->assertOk()
        ->assertJsonPath('data.0.is_wishlisted', true);
});

test('marks is_wishlisted true when box is wishlisted', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Box Set']);
    $box = EloquentBox::create(['box_set_id' => $boxSet->id, 'title' => 'Box 1', 'release_date' => '2026-04-01']);
    $user->wishlistBoxes()->attach($box->id);

    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31')
        ->assertOk()
        ->assertJsonPath('data.0.is_wishlisted', true);
});

test('my_series filter returns only series user owns volumes in', function () {
    $user = User::factory()->create();

    $mySeries = Series::factory()->create(['title' => 'My Series']);
    $myEdition = Edition::factory()->create(['series_id' => $mySeries->id]);
    $ownedVolume = Volume::factory()->create(['edition_id' => $myEdition->id, 'published_date' => '2020-01-01']);
    $user->volumes()->attach($ownedVolume->id);
    Volume::factory()->create(['edition_id' => $myEdition->id, 'title' => 'My Series Release', 'published_date' => '2026-04-01']);

    $otherSeries = Series::factory()->create(['title' => 'Other Series']);
    $otherEdition = Edition::factory()->create(['series_id' => $otherSeries->id]);
    Volume::factory()->create(['edition_id' => $otherEdition->id, 'title' => 'Other Release', 'published_date' => '2026-04-02']);

    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31&my_series=1')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.series.title', 'My Series');
});

test('cursor pagination returns next page', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);

    foreach (range(1, 5) as $i) {
        Volume::factory()->create([
            'edition_id' => $edition->id,
            'published_date' => "2026-0{$i}-01",
            'title' => "Volume {$i}",
            'number' => (string) $i,
        ]);
    }

    actingAs($user);

    $firstPage = getJson('/api/planning?from=2026-01-01&to=2026-12-31&per_page=2')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.has_more', true);

    $cursor = $firstPage->json('meta.next_cursor');
    expect($cursor)->not->toBeNull();

    $secondPage = getJson("/api/planning?from=2026-01-01&to=2026-12-31&per_page=2&cursor={$cursor}")
        ->assertOk()
        ->assertJsonCount(2, 'data');

    expect($secondPage->json('data.0.title'))->not->toBe($firstPage->json('data.0.title'));
});

test('last page has no next cursor', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => '2026-04-01']);

    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31&per_page=24')
        ->assertOk()
        ->assertJsonPath('meta.has_more', false)
        ->assertJsonPath('meta.next_cursor', null);
});

test('returns 422 for invalid type parameter', function () {
    $user = User::factory()->create();
    actingAs($user);

    getJson('/api/planning?type=invalid')->assertUnprocessable();
});

test('returns 422 for invalid date format', function () {
    $user = User::factory()->create();
    actingAs($user);

    getJson('/api/planning?from=not-a-date')->assertUnprocessable();
});

test('returns 422 when to is before from', function () {
    $user = User::factory()->create();
    actingAs($user);

    getJson('/api/planning?from=2026-06-01&to=2026-01-01')->assertUnprocessable();
});

test('meta contains expected fields', function () {
    $user = User::factory()->create();
    actingAs($user);

    getJson('/api/planning?from=2026-01-01&to=2026-12-31')
        ->assertOk()
        ->assertJsonStructure([
            'data',
            'meta' => ['per_page', 'total', 'next_cursor', 'has_more'],
        ]);
});
