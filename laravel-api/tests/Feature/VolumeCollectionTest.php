<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\Borrowing\Infrastructure\EloquentModels\LoanItem;
use App\Manga\Domain\Exceptions\VolumeNotFoundException;
use App\Manga\Domain\Models\Volume as DomainVolume;
use App\Manga\Domain\Services\VolumeResolverServiceInterface;
use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Mockery\MockInterface;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

test('can add manga to collection by api_id', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create(['api_id' => 'manga-123']);
    actingAs($user);

    $response = postJson('/api/volumes', [
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

    $response = postJson('/api/volumes/scan-bulk', [
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
            ->andThrow(new VolumeNotFoundException('Not found'));
    });

    actingAs($user);

    $response = postJson('/api/volumes/scan-bulk', [
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

    $loan = Loan::create([
        'user_id' => $user->id,
        'borrower_name' => 'Alice',
        'loaned_at' => now(),
    ]);
    LoanItem::create([
        'loan_id' => $loan->id,
        'loanable_type' => 'volume',
        'loanable_id' => $volume->id,
    ]);

    actingAs($user);

    $response = getJson('/api/volumes');

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

    $response = postJson('/api/volumes/scan-bulk', [
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

    $response = deleteJson('/api/volumes/bulk', [
        'volume_ids' => $volumes->pluck('id')->toArray(),
    ]);

    $response->assertSuccessful();
    expect($user->volumes()->whereIn('volume_id', $volumes->pluck('id')->toArray())->exists())->toBeFalse();
});

test('cannot remove volumes from collection that user does not own', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $volumes = Volume::factory()->count(2)->create();

    // Attach volumes to another user
    $otherUser->volumes()->attach($volumes->pluck('id')->toArray());

    actingAs($user);

    // Try to remove volumes owned by otherUser
    $response = deleteJson('/api/volumes/bulk', [
        'volume_ids' => $volumes->pluck('id')->toArray(),
    ]);

    $response->assertStatus(403);

    // Verify volumes are still attached to otherUser
    expect($otherUser->volumes()->whereIn('volume_id', $volumes->pluck('id')->toArray())->count())->toBe(2);
});

test('cannot remove volumes if at least one is not owned by user', function () {
    $user = User::factory()->create();
    $ownedVolume = Volume::factory()->create();
    $notOwnedVolume = Volume::factory()->create();

    $user->volumes()->attach($ownedVolume->id);

    actingAs($user);

    $response = deleteJson('/api/volumes/bulk', [
        'volume_ids' => [$ownedVolume->id, $notOwnedVolume->id],
    ]);

    $response->assertStatus(403);

    // Verify owned volume is still attached (all or nothing due to authorize check)
    expect($user->volumes()->where('volume_id', $ownedVolume->id)->exists())->toBeTrue();
});

test('edition in collection includes released_volumes count', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id, 'total_volumes' => 3]);

    $released1 = Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => now()->subMonths(6)->toDateString()]);
    $released2 = Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => now()->subDays(1)->toDateString()]);
    Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => now()->addMonths(3)->toDateString()]);

    $user->volumes()->attach($released1->id);

    actingAs($user);

    getJson('/api/volumes')
        ->assertSuccessful()
        ->assertJsonPath('data.0.edition.released_volumes', 2);
});

test('edition released_volumes counts null published_date as released', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id, 'total_volumes' => 2]);

    $withDate = Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => now()->subMonth()->toDateString()]);
    Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => null]);

    $user->volumes()->attach($withDate->id);

    actingAs($user);

    getJson('/api/volumes')
        ->assertSuccessful()
        ->assertJsonPath('data.0.edition.released_volumes', 2);
});

test('edition released_volumes equals total_volumes when all are released', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id, 'total_volumes' => 3]);

    $volumes = Volume::factory()->count(3)->create([
        'edition_id' => $edition->id,
        'published_date' => now()->subWeek()->toDateString(),
    ]);

    $user->volumes()->attach($volumes->first()->id);

    actingAs($user);

    getJson('/api/volumes')
        ->assertSuccessful()
        ->assertJsonPath('data.0.edition.released_volumes', 3);
});

test('edition released_volumes is zero when all volumes are future', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id, 'total_volumes' => 2]);

    $futureVolume = Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => now()->addYear()->toDateString()]);
    Volume::factory()->create(['edition_id' => $edition->id, 'published_date' => now()->addMonths(6)->toDateString()]);

    $user->volumes()->attach($futureVolume->id);

    actingAs($user);

    getJson('/api/volumes')
        ->assertSuccessful()
        ->assertJsonPath('data.0.edition.released_volumes', 0);
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
