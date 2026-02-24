<?php

use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

test('can add manga with a very long cover url', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $longUrl = 'https://covers.openlibrary.org/b/id/'.str_repeat('9', 200).'-L.jpg';
    $apiId = '/works/OL_LONG_URL';

    Http::fake([
        'openlibrary.org/api/books*' => Http::response([
            'ISBN:9781234567890' => [
                'title' => 'LongUrlSeries - Tome 23',
                'authors' => [['name' => 'Author Name']],
                'publish_date' => '2023',
                'cover' => ['large' => $longUrl],
            ],
        ], 200),
    ]);

    $response = postJson('/api/mangas', [
        'api_id' => '9781234567890',
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('series', [
        'title' => 'LongUrlSeries',
    ]);

    assertDatabaseHas('volumes', [
        'api_id' => '9781234567890',
        'cover_url' => $longUrl,
    ]);
});
