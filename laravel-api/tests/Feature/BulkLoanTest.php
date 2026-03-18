<?php

namespace Tests\Feature;

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

test('it can loan multiple mangas in bulk', function () {
    $user = User::factory()->create();
    $v1 = Volume::factory()->create();
    $v2 = Volume::factory()->create();
    $user->volumes()->attach([$v1->id, $v2->id]);

    actingAs($user);

    $response = postJson('/api/loans/bulk', [
        'volume_ids' => [$v1->id, $v2->id],
        'borrower_name' => 'Jean Bulk',
    ]);

    $response->assertStatus(200);

    assertDatabaseHas('loans', [
        'user_id' => $user->id,
        'loanable_id' => $v1->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Jean Bulk',
        'returned_at' => null,
    ]);

    assertDatabaseHas('loans', [
        'user_id' => $user->id,
        'loanable_id' => $v2->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Jean Bulk',
        'returned_at' => null,
    ]);
});

test('it rolls back all loans if one fails', function () {
    $user = User::factory()->create();
    $v1 = Volume::factory()->create();
    $v2 = Volume::factory()->create();
    $user->volumes()->attach($v1->id); // only v1 owned

    actingAs($user);

    $response = postJson('/api/loans/bulk', [
        'volume_ids' => [$v1->id, $v2->id], // v2 not owned should fail
        'borrower_name' => 'Fail Person',
    ]);

    $response->assertStatus(403);

    assertDatabaseMissing('loans', [
        'borrower_name' => 'Fail Person',
    ]);
});

test('it returns 403 when bulk loan volume_ids is not an array', function () {
    $user = User::factory()->create();
    actingAs($user);

    $response = postJson('/api/loans/bulk', [
        'volume_ids' => 'not-an-array',
        'borrower_name' => 'Test',
    ]);

    $response->assertStatus(403);
});

test('it returns 403 when bulk return items is not an array', function () {
    $user = User::factory()->create();
    actingAs($user);

    $response = postJson('/api/loans/return/bulk', [
        'items' => 'not-an-array',
    ]);

    $response->assertStatus(403);
});

test('it returns 403 when bulk return volume not owned by user', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $volume = Volume::factory()->create();
    $otherUser->volumes()->attach($volume->id);

    actingAs($user);

    $response = postJson('/api/loans/return/bulk', [
        'items' => [['id' => $volume->id, 'type' => 'volume']],
    ]);

    $response->assertStatus(403);
});

test('it can return multiple loans in bulk', function () {
    $user = User::factory()->create();
    $v1 = Volume::factory()->create();
    $v2 = Volume::factory()->create();
    $user->volumes()->attach([$v1->id, $v2->id]);

    Loan::create([
        'user_id' => $user->id,
        'loanable_id' => $v1->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Jean Returner',
        'loaned_at' => now(),
    ]);

    Loan::create([
        'user_id' => $user->id,
        'loanable_id' => $v2->id,
        'loanable_type' => 'volume',
        'borrower_name' => 'Jean Returner',
        'loaned_at' => now(),
    ]);

    actingAs($user);

    $response = postJson('/api/loans/return/bulk', [
        'items' => [
            ['id' => $v1->id, 'type' => 'volume'],
            ['id' => $v2->id, 'type' => 'volume'],
        ],
    ]);

    $response->assertStatus(200);

    expect(Loan::where('loanable_id', $v1->id)->first()->returned_at)->not->toBeNull();
    expect(Loan::where('loanable_id', $v2->id)->first()->returned_at)->not->toBeNull();
});
