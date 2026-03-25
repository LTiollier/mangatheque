<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

test('it can loan a manga', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    actingAs($user);

    $response = postJson('/api/loans', [
        'loanable_id' => $volume->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Jean Dupont',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.borrower_name', 'Jean Dupont');

    assertDatabaseHas('loans', [
        'user_id' => $user->id,
        'loanable_id' => $volume->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Jean Dupont',
        'returned_at' => null,
    ]);
});

test('it cannot loan a manga already loaned', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    Loan::create([
        'user_id' => $user->id,
        'loanable_id' => $volume->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'First Person',
        'loaned_at' => now(),
    ]);

    actingAs($user);

    $response = postJson('/api/loans', [
        'loanable_id' => $volume->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Second Person',
    ]);

    $response->assertStatus(422);
});

test('it can return a loaned manga', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    Loan::create([
        'user_id' => $user->id,
        'loanable_id' => $volume->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Jean Dupont',
        'loaned_at' => now(),
    ]);

    actingAs($user);

    $response = postJson('/api/loans/return', [
        'loanable_id' => $volume->id,
        'loanable_type' => 'volume',
    ]);

    $response->assertStatus(200);

    $loan = Loan::where('loanable_id', $volume->id)->first();
    expect($loan->returned_at)->not->toBeNull();
});

test('it can list user loans', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    Loan::create([
        'user_id' => $user->id,
        'loanable_id' => $volume->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Jean Dupont',
        'loaned_at' => now(),
    ]);

    actingAs($user);

    $response = getJson('/api/loans');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.borrower_name', 'Jean Dupont');
});

test('it cannot loan a manga not in collection', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();

    actingAs($user);

    $response = postJson('/api/loans', [
        'loanable_id' => $volume->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Jean Dupont',
    ]);

    $response->assertStatus(403);
});

test('it returns 403 when return request has no loanable_id', function () {
    $user = User::factory()->create();
    actingAs($user);

    $response = postJson('/api/loans/return', []);

    $response->assertStatus(403);
});

test('it returns 403 when return request volume does not exist', function () {
    $user = User::factory()->create();
    actingAs($user);

    $response = postJson('/api/loans/return', [
        'loanable_id' => 999,
        'loanable_type' => 'volume',
    ]);

    $response->assertStatus(403);
});

test('loan model relationships', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();

    $loan = Loan::create([
        'user_id' => $user->id,
        'loanable_id' => $volume->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Relationship Test',
        'loaned_at' => now(),
    ]);

    expect($loan->user->id)->toBe($user->id);
    expect($loan->loanable->id)->toBe($volume->id);
});
