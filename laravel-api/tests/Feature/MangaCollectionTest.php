<?php

use App\Manga\Infrastructure\EloquentModels\Manga;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

test('can add manga to collection by api_id', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    Http::fake([
        'googleapis.com/books/v1/volumes/api123' => Http::response([
            'id' => 'api123',
            'volumeInfo' => [
                'title' => 'Naruto Vol. 1',
                'authors' => ['Masashi Kishimoto'],
                'industryIdentifiers' => [
                    ['type' => 'ISBN_13', 'identifier' => '9781234567890'],
                ],
            ],
        ], 200),
    ]);

    Event::fake();

    $response = $this->postJson('/api/mangas', [
        'api_id' => 'api123',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.api_id', 'api123')
        ->assertJsonPath('data.title', 'Naruto Vol. 1');

    Event::assertDispatched(\App\Manga\Domain\Events\MangaAddedToCollection::class, function ($event) use ($user) {
        return $event->manga->getApiId() === 'api123' && $event->userId === $user->id;
    });

    $this->assertDatabaseHas('mangas', [
        'api_id' => 'api123',
        'title' => 'Naruto Vol. 1',
    ]);

    $this->assertDatabaseHas('user_manga', [
        'user_id' => $user->id,
    ]);
});

test('can add manga to collection by isbn', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    Http::fake([
        'googleapis.com/books/v1/volumes?q=isbn%3A9781234567890&maxResults=1' => Http::response([
            'items' => [
                [
                    'id' => 'api123',
                    'volumeInfo' => [
                        'title' => 'Naruto Vol. 1',
                        'authors' => ['Masashi Kishimoto'],
                        'industryIdentifiers' => [
                            ['type' => 'ISBN_13', 'identifier' => '9781234567890'],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = $this->postJson('/api/mangas/scan', [
        'isbn' => '9781234567890',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.isbn', '9781234567890');

    $this->assertDatabaseHas('mangas', [
        'isbn' => '9781234567890',
    ]);

    $this->assertDatabaseHas('user_manga', [
        'user_id' => $user->id,
    ]);
});

test('can list user mangas', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $manga = Manga::create([
        'api_id' => 'api123',
        'title' => 'Naruto Vol. 1',
        'isbn' => '9781234567890',
    ]);

    $user->mangas()->attach($manga->id);

    $response = $this->getJson('/api/mangas');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Naruto Vol. 1');
});
