<?php

use App\Manga\Infrastructure\EloquentModels\Volume;
use App\Manga\Infrastructure\Policies\VolumePolicy;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
    $policy = new VolumePolicy;
    $user = new User;
    $user->id = 1;

    $volume = Mockery::mock(Volume::class);

    // Ownership check
    $usersRelation = Mockery::mock(BelongsToMany::class);
    $volume->shouldReceive('users')->andReturn($usersRelation);
    $usersRelation->shouldReceive('where')->with('user_id', 1)->andReturnSelf();
    $usersRelation->shouldReceive('exists')->andReturn(true);

    // Loan check
    $loansRelation = Mockery::mock(HasMany::class);
    $volume->shouldReceive('loans')->andReturn($loansRelation);
    $loansRelation->shouldReceive('where')->with('user_id', 1)->andReturnSelf();
    $loansRelation->shouldReceive('whereNull')->with('returned_at')->andReturnSelf();
    $loansRelation->shouldReceive('exists')->andReturn(true);

    expect($policy->return($user, $volume))->toBeTrue();
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
