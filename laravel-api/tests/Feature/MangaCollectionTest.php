<?php

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

use function Pest\Laravel\postJson;

test('can add manga to collection by api_id', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Seed local database as the action only resolves locally
    $series = Series::create(['title' => 'Naruto', 'authors' => 'Masashi Kishimoto', 'api_id' => 's1']);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume = Volume::create([
        'api_id' => '9781234567890',
        'title' => 'Naruto Vol. 1',
        'isbn' => '9781234567890',
        'edition_id' => $edition->id,
        'authors' => null,
    ]);

    Event::fake();

    $response = postJson('/api/mangas', [
        'api_id' => '9781234567890',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.api_id', '9781234567890')
        ->assertJsonPath('data.title', 'Naruto Vol. 1');

    Event::assertDispatched(VolumeAddedToCollection::class);

    expect($user->volumes()->where('volumes.id', $volume->id)->exists())->toBeTrue();
});

test('can add manga to collection by isbn', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Seed local database as the action only resolves locally
    $series = Series::create(['title' => 'Naruto', 'authors' => 'Masashi Kishimoto', 'api_id' => 's1']);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume = Volume::create([
        'api_id' => 'api_id_123',
        'title' => 'Naruto Vol. 1',
        'isbn' => '9781234567890',
        'edition_id' => $edition->id,
        'authors' => null,
    ]);

    $response = postJson('/api/mangas/scan', [
        'isbn' => '9781234567890',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.isbn', '9781234567890');

    expect($user->volumes()->where('volumes.id', $volume->id)->exists())->toBeTrue();
});

test('can list user mangas with ownership and loan flags', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Naruto', 'authors' => null]);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume = Volume::create([
        'api_id' => 'api123',
        'title' => 'Naruto Vol. 1',
        'isbn' => '9781234567890',
        'edition_id' => $edition->id,
        'authors' => null,
    ]);

    $user->volumes()->attach($volume->id);

    Loan::create([
        'user_id' => $user->id,
        'volume_id' => $volume->id,
        'borrower_name' => 'Alice',
        'loaned_at' => now(),
    ]);

    $response = $this->getJson('/api/mangas');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Naruto Vol. 1')
        ->assertJsonPath('data.0.is_owned', true)
        ->assertJsonPath('data.0.is_loaned', true)
        ->assertJsonPath('data.0.loaned_to', 'Alice');
});

test('it handles adding a manga that already exists in DB by ISBN', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Existing Series', 'authors' => null]);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume = Volume::create([
        'api_id' => 'existing_api',
        'title' => 'Existing Volume',
        'isbn' => '9781111111111',
        'edition_id' => $edition->id,
        'authors' => null,
    ]);

    $response = postJson('/api/mangas/scan', [
        'isbn' => '9781111111111',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.title', 'Existing Volume');

    expect($user->volumes()->where('volumes.id', $volume->id)->exists())->toBeTrue();
});

test('can remove volume from collection', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Naruto', 'authors' => null]);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume = Volume::create([
        'api_id' => 'api123',
        'title' => 'Naruto Vol. 1',
        'edition_id' => $edition->id,
        'authors' => null,
    ]);

    $user->volumes()->attach($volume->id);

    $response = $this->deleteJson("/api/mangas/{$volume->id}");

    $response->assertStatus(200);

    expect($user->volumes()->where('volumes.id', $volume->id)->exists())->toBeFalse();
});

test('can remove series from collection', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Naruto', 'authors' => null]);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume1 = Volume::create([
        'api_id' => 'api1',
        'title' => 'Naruto Vol. 1',
        'edition_id' => $edition->id,
        'authors' => null,
    ]);
    $volume2 = Volume::create([
        'api_id' => 'api2',
        'title' => 'Naruto Vol. 2',
        'edition_id' => $edition->id,
        'authors' => null,
    ]);

    $user->volumes()->attach([$volume1->id, $volume2->id]);

    $response = $this->deleteJson("/api/series/{$series->id}");

    $response->assertStatus(200);

    expect($user->volumes()->whereIn('volumes.id', [$volume1->id, $volume2->id])->exists())->toBeFalse();
});
