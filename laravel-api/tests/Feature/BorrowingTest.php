<?php

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

test('it can loan a manga', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);
    Sanctum::actingAs($user);

    $response = postJson('/api/loans', [
        'volume_id' => $volume->id,
        'borrower_name' => 'Jean Dupont',
        'notes' => 'Some notes',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.borrower_name', 'Jean Dupont');

    assertDatabaseHas('manga_loans', [
        'user_id' => $user->id,
        'volume_id' => $volume->id,
        'borrower_name' => 'Jean Dupont',
        'returned_at' => null,
    ]);
});

test('it cannot loan a manga already loaned', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);
    Sanctum::actingAs($user);

    Loan::create([
        'user_id' => $user->id,
        'volume_id' => $volume->id,
        'borrower_name' => 'First Person',
        'loaned_at' => now(),
    ]);

    $response = postJson('/api/loans', [
        'volume_id' => $volume->id,
        'borrower_name' => 'Second Person',
    ]);

    $response->assertStatus(400);
});

test('it can return a loaned manga', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);
    Sanctum::actingAs($user);

    Loan::create([
        'user_id' => $user->id,
        'volume_id' => $volume->id,
        'borrower_name' => 'Jean Dupont',
        'loaned_at' => now(),
    ]);

    $response = postJson('/api/loans/return', [
        'volume_id' => $volume->id,
    ]);

    $response->assertStatus(200);

    $loan = Loan::first();
    expect($loan->returned_at)->not->toBeNull();
});

test('it can list user loans', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);
    Sanctum::actingAs($user);

    Loan::create([
        'user_id' => $user->id,
        'volume_id' => $volume->id,
        'borrower_name' => 'Jean Dupont',
        'loaned_at' => now(),
    ]);

    $response = getJson('/api/loans');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

test('it cannot loan a manga not in collection', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $otherVolume = Volume::factory()->create();

    $response = postJson('/api/loans', [
        'volume_id' => $otherVolume->id,
        'borrower_name' => 'Jean Dupont',
    ]);

    $response->assertStatus(404);
});

test('loan model relationships', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();

    $loan = Loan::create([
        'user_id' => $user->id,
        'volume_id' => $volume->id,
        'borrower_name' => 'Relationship Test',
        'loaned_at' => now(),
    ]);

    expect($loan->user)->toBeInstanceOf(User::class);
    expect($loan->volume)->toBeInstanceOf(Volume::class);
});
