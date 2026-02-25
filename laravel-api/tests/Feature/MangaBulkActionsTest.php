<?php

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

test('can bulk scan mangas', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $isbn1 = '9781111111111';
    $isbn2 = '9782222222222';

    Http::fake([
        'www.googleapis.com/books/v1/volumes*' => function ($request) {
            $query = parse_url($request->url(), PHP_URL_QUERY);
            parse_str($query, $params);
            $q = $params['q'] ?? '';

            if (str_contains($q, 'isbn:9781111111111')) {
                return Http::response([
                    'items' => [
                        [
                            'id' => 'api_1',
                            'volumeInfo' => [
                                'title' => 'Manga 1',
                                'authors' => ['Author 1'],
                                'industryIdentifiers' => [['type' => 'ISBN_13', 'identifier' => '9781111111111']],
                            ],
                        ],
                    ],
                ], 200);
            }

            if (str_contains($q, 'isbn:9782222222222')) {
                return Http::response([
                    'items' => [
                        [
                            'id' => 'api_2',
                            'volumeInfo' => [
                                'title' => 'Manga 2',
                                'authors' => ['Author 2'],
                                'industryIdentifiers' => [['type' => 'ISBN_13', 'identifier' => '9782222222222']],
                            ],
                        ],
                    ],
                ], 200);
            }

            return Http::response(['items' => []], 200);
        },
    ]);

    $response = postJson('/api/mangas/scan-bulk', [
        'isbns' => [$isbn1, $isbn2],
    ]);

    $response->assertStatus(201)
        ->assertJsonCount(2, 'data');

    assertDatabaseHas('volumes', ['isbn' => $isbn1]);
    assertDatabaseHas('volumes', ['isbn' => $isbn2]);
});

test('can bulk add local volumes to an edition', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Test Series', 'authors' => []]);
    $edition = Edition::create([
        'series_id' => $series->id,
        'name' => 'Standard',
        'language' => 'fr',
    ]);

    $response = postJson('/api/mangas/bulk', [
        'edition_id' => $edition->id,
        'numbers' => [1, 5, 10],
    ]);

    $response->assertStatus(201)
        ->assertJsonCount(3, 'data');

    assertDatabaseHas('volumes', ['edition_id' => $edition->id, 'number' => 1]);
    assertDatabaseHas('volumes', ['edition_id' => $edition->id, 'number' => 5]);
    assertDatabaseHas('volumes', ['edition_id' => $edition->id, 'number' => 10]);
});
