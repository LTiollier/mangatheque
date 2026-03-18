<?php

namespace Tests\Feature;

use App\Manga\Infrastructure\EloquentModels\Volume;
use App\ReadingProgress\Infrastructure\EloquentModels\ReadingProgress;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

test('it can mark multiple volumes as read', function () {
    $user = User::factory()->create();
    $volume1 = Volume::factory()->create();
    $volume2 = Volume::factory()->create();
    $user->volumes()->attach([$volume1->id, $volume2->id]);

    actingAs($user);

    $response = postJson('/api/reading-progress/toggle/bulk', [
        'volume_ids' => [$volume1->id, $volume2->id],
    ]);

    $response->assertStatus(200)
        ->assertJsonCount(2, 'toggled')
        ->assertJsonPath('removed', []);

    assertDatabaseHas('reading_progress', ['user_id' => $user->id, 'volume_id' => $volume1->id]);
    assertDatabaseHas('reading_progress', ['user_id' => $user->id, 'volume_id' => $volume2->id]);
});

test('it unmarks a volume already marked as read', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    ReadingProgress::create([
        'user_id' => $user->id,
        'volume_id' => $volume->id,
        'read_at' => now(),
    ]);

    actingAs($user);

    $response = postJson('/api/reading-progress/toggle/bulk', [
        'volume_ids' => [$volume->id],
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('toggled', [])
        ->assertJsonPath('removed', [$volume->id]);

    assertDatabaseMissing('reading_progress', ['user_id' => $user->id, 'volume_id' => $volume->id]);
});

test('it skips volumes not in collection when toggling', function () {
    $user = User::factory()->create();
    $volumeOwned = Volume::factory()->create();
    $volumeNotOwned = Volume::factory()->create();
    $user->volumes()->attach($volumeOwned->id);

    actingAs($user);

    $response = postJson('/api/reading-progress/toggle/bulk', [
        'volume_ids' => [$volumeOwned->id, $volumeNotOwned->id],
    ]);

    $response->assertStatus(200)
        ->assertJsonCount(1, 'toggled');

    assertDatabaseHas('reading_progress', ['user_id' => $user->id, 'volume_id' => $volumeOwned->id]);
    assertDatabaseMissing('reading_progress', ['user_id' => $user->id, 'volume_id' => $volumeNotOwned->id]);
});

test('it can list reading progress', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    ReadingProgress::create([
        'user_id' => $user->id,
        'volume_id' => $volume->id,
        'read_at' => now(),
    ]);

    actingAs($user);

    $response = getJson('/api/reading-progress');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.volume_id', $volume->id);
});

test('it returns 403 when volume_ids is missing', function () {
    $user = User::factory()->create();
    actingAs($user);

    $response = postJson('/api/reading-progress/toggle/bulk', []);

    $response->assertStatus(403);
});
