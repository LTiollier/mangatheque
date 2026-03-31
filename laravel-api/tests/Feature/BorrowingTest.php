<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\Borrowing\Infrastructure\EloquentModels\LoanItem;
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
        'borrower_name' => 'Jean Dupont',
        'items' => [['type' => 'volume', 'id' => $volume->id]],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.borrower_name', 'Jean Dupont');

    assertDatabaseHas('loans', [
        'user_id' => $user->id,
        'borrower_name' => 'Jean Dupont',
        'returned_at' => null,
    ]);

    assertDatabaseHas('loan_items', [
        'loanable_id' => $volume->id,
        'loanable_type' => 'volume',
    ]);
});

test('it cannot loan a manga already loaned', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    $loan = Loan::create([
        'user_id' => $user->id,
        'borrower_name' => 'First Person',
        'loaned_at' => now(),
    ]);
    LoanItem::create([
        'loan_id' => $loan->id,
        'loanable_type' => 'volume',
        'loanable_id' => $volume->id,
    ]);

    actingAs($user);

    $response = postJson('/api/loans', [
        'borrower_name' => 'Second Person',
        'items' => [['type' => 'volume', 'id' => $volume->id]],
    ]);

    $response->assertStatus(422);
});

test('it can return a loaned manga', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    $loan = Loan::create([
        'user_id' => $user->id,
        'borrower_name' => 'Jean Dupont',
        'loaned_at' => now(),
    ]);
    LoanItem::create([
        'loan_id' => $loan->id,
        'loanable_type' => 'volume',
        'loanable_id' => $volume->id,
    ]);

    actingAs($user);

    $response = postJson("/api/loans/{$loan->id}/return");

    $response->assertStatus(200);

    expect(Loan::find($loan->id)->returned_at)->not->toBeNull();
});

test('it can list user loans', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    $loan = Loan::create([
        'user_id' => $user->id,
        'borrower_name' => 'Jean Dupont',
        'loaned_at' => now(),
    ]);
    LoanItem::create([
        'loan_id' => $loan->id,
        'loanable_type' => 'volume',
        'loanable_id' => $volume->id,
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
        'borrower_name' => 'Jean Dupont',
        'items' => [['type' => 'volume', 'id' => $volume->id]],
    ]);

    $response->assertStatus(403);
});

test('it returns 403 when return request loan not found', function () {
    $user = User::factory()->create();
    actingAs($user);

    $response = postJson('/api/loans/999/return');

    $response->assertStatus(403);
});

test('it returns 403 when return request loan belongs to another user', function () {
    $otherUser = User::factory()->create();
    $user = User::factory()->create();

    $loan = Loan::create([
        'user_id' => $otherUser->id,
        'borrower_name' => 'Jean',
        'loaned_at' => now(),
    ]);

    actingAs($user);

    $response = postJson("/api/loans/{$loan->id}/return");

    $response->assertStatus(403);
});

test('loan model relationships', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();

    $loan = Loan::create([
        'user_id' => $user->id,
        'borrower_name' => 'Relationship Test',
        'loaned_at' => now(),
    ]);
    $item = LoanItem::create([
        'loan_id' => $loan->id,
        'loanable_type' => 'volume',
        'loanable_id' => $volume->id,
    ]);

    expect($loan->user->id)->toBe($user->id);
    expect($loan->loanItems->first()->id)->toBe($item->id);
    expect($item->loan->id)->toBe($loan->id);
});
