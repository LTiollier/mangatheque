<?php

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->volume = Volume::factory()->create();

    // Attach volume to user
    $this->user->volumes()->attach($this->volume->id);

    Sanctum::actingAs($this->user);
});

test('it can loan a manga', function () {
    $response = $this->postJson('/api/loans', [
        'volume_id' => $this->volume->id,
        'borrower_name' => 'Jean Dupont',
        'notes' => 'Some notes',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.borrower_name', 'Jean Dupont');

    $this->assertDatabaseHas('manga_loans', [
        'user_id' => $this->user->id,
        'volume_id' => $this->volume->id,
        'borrower_name' => 'Jean Dupont',
        'returned_at' => null,
    ]);
});

test('it cannot loan a manga already loaned', function () {
    Loan::create([
        'user_id' => $this->user->id,
        'volume_id' => $this->volume->id,
        'borrower_name' => 'First Person',
        'loaned_at' => now(),
    ]);

    $response = $this->postJson('/api/loans', [
        'volume_id' => $this->volume->id,
        'borrower_name' => 'Second Person',
    ]);

    $response->assertStatus(400);
});

test('it can return a loaned manga', function () {
    Loan::create([
        'user_id' => $this->user->id,
        'volume_id' => $this->volume->id,
        'borrower_name' => 'Jean Dupont',
        'loaned_at' => now(),
    ]);

    $response = $this->postJson('/api/loans/return', [
        'volume_id' => $this->volume->id,
    ]);

    $response->assertStatus(200);

    $loan = Loan::first();
    $this->assertNotNull($loan->returned_at);
});

test('it can list user loans', function () {
    Loan::create([
        'user_id' => $this->user->id,
        'volume_id' => $this->volume->id,
        'borrower_name' => 'Jean Dupont',
        'loaned_at' => now(),
    ]);

    $response = $this->getJson('/api/loans');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data');
});
