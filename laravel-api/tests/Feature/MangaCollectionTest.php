<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\Manga\Domain\Exceptions\MangaNotFoundException;
use App\Manga\Domain\Models\Volume as DomainVolume;
use App\Manga\Domain\Services\VolumeResolverServiceInterface;
use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

test('can add manga to collection by api_id', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create(['api_id' => 'manga-123']);
    actingAs($user);

    $response = postJson('/api/mangas', [
        'api_id' => 'manga-123',
    ]);

    $response->assertStatus(201);
    expect($user->volumes()->where('volume_id', $volume->id)->exists())->toBeTrue();
});

test('can add manga to collection by isbn', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create(['isbn' => '9782012101531']);

    // Convert to domain model for the mock
    $domainVolume = new DomainVolume(
        id: $volume->id,
        editionId: $volume->edition_id,
        apiId: $volume->api_id,
        isbn: $volume->isbn,
        number: (string) $volume->number,
        title: $volume->title,
        publishedDate: $volume->published_date,
        coverUrl: $volume->cover_url
    );

    $this->mock(VolumeResolverServiceInterface::class, function (MockInterface $mock) use ($domainVolume) {
        $mock->shouldReceive('resolveByIsbn')
            ->with('9782012101531')
            ->once()
            ->andReturn($domainVolume);
    });

    actingAs($user);

    $response = postJson('/api/mangas/scan-bulk', [
        'isbns' => ['9782012101531'],
    ]);

    $response->assertStatus(201);
    expect($user->volumes()->where('volume_id', $volume->id)->exists())->toBeTrue();
});

test('it returns an empty list when isbn is not found during bulk scan', function () {
    $user = User::factory()->create();

    $this->mock(VolumeResolverServiceInterface::class, function (MockInterface $mock) {
        $mock->shouldReceive('resolveByIsbn')
            ->with('9780000000000')
            ->once()
            ->andThrow(new MangaNotFoundException('Not found'));
    });

    actingAs($user);

    $response = postJson('/api/mangas/scan-bulk', [
        'isbns' => ['9780000000000'],
    ]);

    $response->assertStatus(201)
        ->assertJsonCount(0, 'data');
});

test('can list user mangas with ownership and loan flags', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create(['title' => 'One Piece']);
    $edition = Edition::factory()->create(['series_id' => $series->id, 'name' => 'Standard']);
    $volume = Volume::factory()->create([
        'edition_id' => $edition->id,
        'title' => 'One Piece #1',
        'number' => '1',
    ]);

    $user->volumes()->attach($volume->id);

    Loan::create([
        'user_id' => $user->id,
        'loanable_id' => $volume->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Alice',
        'loaned_at' => now(),
    ]);

    actingAs($user);

    $response = getJson('/api/mangas');

    $response->assertStatus(200)
        ->assertJsonFragment([
            'id' => $volume->id,
            'is_owned' => true,
            'is_loaned' => true,
            'loaned_to' => 'Alice',
            'is_wishlisted' => false,
        ]);
});

test('it handles adding a manga that already exists in DB by ISBN', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume = Volume::factory()->create([
        'edition_id' => $edition->id,
        'isbn' => '9782012101531',
    ]);

    actingAs($user);

    $response = postJson('/api/mangas/scan-bulk', [
        'isbns' => ['9782012101531'],
    ]);

    $response->assertStatus(201);
    expect($user->volumes()->where('volume_id', $volume->id)->exists())->toBeTrue();
});

test('can remove volumes from collection in bulk', function () {
    $user = User::factory()->create();
    $volumes = Volume::factory()->count(2)->create();
    $user->volumes()->attach($volumes->pluck('id')->toArray());

    actingAs($user);

    $response = postJson('/api/mangas/bulk-remove', [
        'volume_ids' => $volumes->pluck('id')->toArray(),
    ]);

    $response->assertSuccessful();
    expect($user->volumes()->whereIn('volume_id', $volumes->pluck('id')->toArray())->exists())->toBeFalse();
});

test('can remove series from collection', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume = Volume::factory()->create(['edition_id' => $edition->id]);
    $user->volumes()->attach($volume->id);

    actingAs($user);

    $response = deleteJson("/api/series/{$series->id}");

    $response->assertStatus(200);
    expect($user->volumes()->where('volume_id', $volume->id)->exists())->toBeFalse();
});
