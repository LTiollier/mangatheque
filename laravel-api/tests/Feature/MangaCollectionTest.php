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

test('can add manga to collection by api_id', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    Cache::shouldReceive('remember')->andReturn('fake-token');
    Cache::shouldReceive('refreshEventDispatcher')->byDefault();

    $xml = <<<'XML'
    <?xml version="1.0" encoding="UTF-8"?>
    <result>
        <item>
            <linkid>api123</linkid>
            <productname>Naruto Vol. 1</productname>
            <upccode>9781234567890</upccode>
        </item>
    </result>
    XML;

    Http::fake([
        'api.linksynergy.com/productsearch/1.0*' => Http::response($xml, 200),
    ]);

    Event::fake();

    $response = $this->postJson('/api/mangas', [
        'api_id' => 'api123',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.api_id', 'api123')
        ->assertJsonPath('data.title', 'Naruto Vol. 1');

    Event::assertDispatched(\App\Manga\Domain\Events\VolumeAddedToCollection::class);

    $this->assertDatabaseHas('volumes', [
        'api_id' => 'api123',
        'title' => 'Naruto Vol. 1',
    ]);
});

test('can add manga to collection by isbn', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    Cache::shouldReceive('remember')->andReturn('fake-token');
    Cache::shouldReceive('refreshEventDispatcher')->byDefault();

    $xml = <<<'XML'
    <?xml version="1.0" encoding="UTF-8"?>
    <result>
        <item>
            <linkid>api123</linkid>
            <productname>Naruto Vol. 1</productname>
            <upccode>9781234567890</upccode>
        </item>
    </result>
    XML;

    Http::fake([
        'api.linksynergy.com/productsearch/1.0*' => Http::response($xml, 200),
    ]);

    $response = $this->postJson('/api/mangas/scan', [
        'isbn' => '9781234567890',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.isbn', '9781234567890');

    $this->assertDatabaseHas('volumes', [
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
