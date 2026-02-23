<?php

use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

test('can add manga with a very long cover url', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    Cache::shouldReceive('remember')->andReturn('fake-token');
    Cache::shouldReceive('refreshEventDispatcher')->byDefault();

    $longUrl = 'http://example.com/cover?id='.str_repeat('a', 200);

    $xml = <<<XML
    <?xml version="1.0" encoding="UTF-8"?>
    <result>
        <item>
            <linkid>api_long_url</linkid>
            <productname>LongUrlSeries - Tome 23</productname>
            <imageurl>{$longUrl}</imageurl>
            <upccode>9781234567890</upccode>
        </item>
    </result>
    XML;

    Http::fake([
        'api.linksynergy.com/productsearch/1.0*' => Http::response($xml, 200),
    ]);

    $response = postJson('/api/mangas', [
        'api_id' => 'api_long_url',
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('series', [
        'title' => 'LongUrlSeries',
    ]);

    assertDatabaseHas('volumes', [
        'api_id' => 'api_long_url',
        'cover_url' => $longUrl,
    ]);
});
