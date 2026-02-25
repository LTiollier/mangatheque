<?php

use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

test('can add manga with a very long cover url', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $longUrl = 'https://books.google.com/books/content?id=long_id&'.str_repeat('a', 500);
    $apiId = '9781234567890';

    Http::fake([
        "www.googleapis.com/books/v1/volumes/$apiId" => Http::response([
            'id' => $apiId,
            'volumeInfo' => [
                'title' => 'LongUrlSeries - Tome 23',
                'authors' => ['Author Name'],
                'publishedDate' => '2023',
                'imageLinks' => ['thumbnail' => str_replace('https://', 'http://', $longUrl)],
            ],
        ], 200),
    ]);

    $response = postJson('/api/mangas', [
        'api_id' => $apiId,
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('series', [
        'title' => 'LongUrlSeries',
    ]);

    assertDatabaseHas('volumes', [
        'api_id' => $apiId,
        'cover_url' => $longUrl,
    ]);
});
