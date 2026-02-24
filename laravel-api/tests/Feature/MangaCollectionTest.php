<?php

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

test('can add manga to collection by api_id', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    Http::fake([
        'openlibrary.org/api/books*' => Http::response([
            'ISBN:9781234567890' => [
                'title' => 'Naruto Vol. 1',
                'authors' => [['name' => 'Masashi Kishimoto']],
                'publish_date' => '1999',
            ],
        ], 200),
    ]);

    Event::fake();

    $response = postJson('/api/mangas', [
        'api_id' => '9781234567890',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.api_id', '9781234567890')
        ->assertJsonPath('data.title', 'Naruto Vol. 1');

    Event::assertDispatched(\App\Manga\Domain\Events\VolumeAddedToCollection::class);

    assertDatabaseHas('volumes', [
        'api_id' => '9781234567890',
        'title' => 'Naruto Vol. 1',
    ]);
});

test('can add manga to collection by isbn', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    Http::fake([
        'openlibrary.org/api/books*' => Http::response([
            'ISBN:9781234567890' => [
                'title' => 'Naruto Vol. 1',
                'authors' => [['name' => 'Masashi Kishimoto']],
                'publish_date' => '1999',
            ],
        ], 200),
    ]);

    $response = postJson('/api/mangas/scan', [
        'isbn' => '9781234567890',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.isbn', '9781234567890');

    assertDatabaseHas('volumes', [
        'isbn' => '9781234567890',
    ]);
});

test('can list user mangas', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Naruto', 'authors' => []]);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume = Volume::create([
        'api_id' => 'api123',
        'title' => 'Naruto Vol. 1',
        'isbn' => '9781234567890',
        'edition_id' => $edition->id,
        'authors' => [],
    ]);

    $user->volumes()->attach($volume->id);

    $response = $this->getJson('/api/mangas');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Naruto Vol. 1');
});
