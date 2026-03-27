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
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

test('it can loan multiple mangas in bulk', function () {
    $user = User::factory()->create();
    $v1 = Volume::factory()->create();
    $v2 = Volume::factory()->create();
    $user->volumes()->attach([$v1->id, $v2->id]);

    actingAs($user);

    $response = postJson('/api/loans', [
        'borrower_name' => 'Jean Bulk',
        'items' => [
            ['type' => 'volume', 'id' => $v1->id],
            ['type' => 'volume', 'id' => $v2->id],
        ],
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('loans', [
        'user_id' => $user->id,
        'borrower_name' => 'Jean Bulk',
        'returned_at' => null,
    ]);

    assertDatabaseHas('loan_items', ['loanable_id' => $v1->id, 'loanable_type' => 'volume']);
    assertDatabaseHas('loan_items', ['loanable_id' => $v2->id, 'loanable_type' => 'volume']);
});

test('it rolls back all loans if one fails', function () {
    $user = User::factory()->create();
    $v1 = Volume::factory()->create();
    $v2 = Volume::factory()->create();
    $user->volumes()->attach($v1->id); // only v1 owned

    actingAs($user);

    $response = postJson('/api/loans', [
        'borrower_name' => 'Fail Person',
        'items' => [
            ['type' => 'volume', 'id' => $v1->id],
            ['type' => 'volume', 'id' => $v2->id], // v2 not owned
        ],
    ]);

    $response->assertStatus(403);

    assertDatabaseMissing('loans', ['borrower_name' => 'Fail Person']);
});

test('it returns 403 when loan items is not an array', function () {
    $user = User::factory()->create();
    actingAs($user);

    $response = postJson('/api/loans', [
        'borrower_name' => 'Test',
        'items' => 'not-an-array',
    ]);

    $response->assertStatus(403);
});

test('it returns 403 when bulk return loan_ids is not an array', function () {
    $user = User::factory()->create();
    actingAs($user);

    $response = postJson('/api/loans/return/bulk', [
        'loan_ids' => 'not-an-array',
    ]);

    $response->assertStatus(403);
});

test('it returns 403 when bulk return loan belongs to another user', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $loan = Loan::create([
        'user_id' => $otherUser->id,
        'borrower_name' => 'Jean',
        'loaned_at' => now(),
    ]);

    actingAs($user);

    $response = postJson('/api/loans/return/bulk', [
        'loan_ids' => [$loan->id],
    ]);

    $response->assertStatus(403);
});

test('it can return multiple loans in bulk', function () {
    $user = User::factory()->create();
    $v1 = Volume::factory()->create();
    $v2 = Volume::factory()->create();
    $user->volumes()->attach([$v1->id, $v2->id]);

    $loan1 = Loan::create([
        'user_id' => $user->id,
        'borrower_name' => 'Jean Returner',
        'loaned_at' => now(),
    ]);
    LoanItem::create(['loan_id' => $loan1->id, 'loanable_type' => 'volume', 'loanable_id' => $v1->id]);

    $loan2 = Loan::create([
        'user_id' => $user->id,
        'borrower_name' => 'Jean Returner',
        'loaned_at' => now(),
    ]);
    LoanItem::create(['loan_id' => $loan2->id, 'loanable_type' => 'volume', 'loanable_id' => $v2->id]);

    actingAs($user);

    $response = postJson('/api/loans/return/bulk', [
        'loan_ids' => [$loan1->id, $loan2->id],
    ]);

    $response->assertStatus(200);

    expect(Loan::find($loan1->id)->returned_at)->not->toBeNull();
    expect(Loan::find($loan2->id)->returned_at)->not->toBeNull();
});
