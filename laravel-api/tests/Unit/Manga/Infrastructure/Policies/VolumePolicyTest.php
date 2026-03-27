<?php

declare(strict_types=1);

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\Borrowing\Infrastructure\EloquentModels\LoanItem;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\Manga\Infrastructure\Policies\VolumePolicy;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it allows loaning a volume if the user owns it', function () {
    $policy = new VolumePolicy;
    $user = new User;
    $user->id = 1;

    $volume = Mockery::mock(Volume::class);
    $relation = Mockery::mock(BelongsToMany::class);

    $volume->shouldReceive('users')->andReturn($relation);
    $relation->shouldReceive('where')->with('user_id', 1)->andReturnSelf();
    $relation->shouldReceive('exists')->andReturn(true);

    expect($policy->loan($user, $volume))->toBeTrue();
});

test('it denies loaning a volume if the user does not own it', function () {
    $policy = new VolumePolicy;
    $user = new User;
    $user->id = 1;

    $volume = Mockery::mock(Volume::class);
    $relation = Mockery::mock(BelongsToMany::class);

    $volume->shouldReceive('users')->andReturn($relation);
    $relation->shouldReceive('where')->with('user_id', 1)->andReturnSelf();
    $relation->shouldReceive('exists')->andReturn(false);

    expect($policy->loan($user, $volume))->toBeFalse();
});

test('it allows returning a volume if the user owns it and it is loaned', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    $loan = Loan::create([
        'user_id' => $user->id,
        'borrower_name' => 'Test Borrower',
        'loaned_at' => now(),
    ]);
    LoanItem::create([
        'loan_id' => $loan->id,
        'loanable_type' => 'volume',
        'loanable_id' => $volume->id,
    ]);

    $policy = new VolumePolicy;

    expect($policy->return($user, $volume))->toBeTrue();
});

test('it denies returning a volume if there is no active loan', function () {
    $user = User::factory()->create();
    $volume = Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    $policy = new VolumePolicy;

    expect($policy->return($user, $volume))->toBeFalse();
});

test('it allows deleting a volume if the user owns it', function () {
    $policy = new VolumePolicy;
    $user = new User;
    $user->id = 1;

    $volume = Mockery::mock(Volume::class);
    $relation = Mockery::mock(BelongsToMany::class);

    $volume->shouldReceive('users')->andReturn($relation);
    $relation->shouldReceive('where')->with('user_id', 1)->andReturnSelf();
    $relation->shouldReceive('exists')->andReturn(true);

    expect($policy->delete($user, $volume))->toBeTrue();
});
