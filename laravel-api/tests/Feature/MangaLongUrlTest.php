<?php

use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

test('can add manga with a very long cover url', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $longUrl = 'http://books.google.com/books/publisher/content?id=JTouAgAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&imgtk=' . str_repeat('a', 200);

    Http::fake([
        'googleapis.com/books/v1/volumes/api_long_url' => Http::response([
            'id' => 'api_long_url',
            'volumeInfo' => [
                'title' => 'Naruto - Tome 23',
                'authors' => ['Masashi Kishimoto'],
                'imageLinks' => [
                    'thumbnail' => $longUrl
                ],
                'industryIdentifiers' => [
                    ['type' => 'ISBN_13', 'identifier' => '9781234567890'],
                ],
            ],
        ], 200),
    ]);

    $response = postJson('/api/mangas', [
        'api_id' => 'api_long_url',
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('series', [
        'title' => 'Naruto',
        'cover_url' => $longUrl,
    ]);

    assertDatabaseHas('volumes', [
        'title' => 'Naruto - Tome 23',
        'number' => '23',
        'cover_url' => $longUrl,
    ]);
});
