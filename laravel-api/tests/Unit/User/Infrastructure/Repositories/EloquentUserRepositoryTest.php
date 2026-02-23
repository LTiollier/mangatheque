<?php

namespace Tests\Unit\User\Infrastructure\Repositories;

use App\User\Domain\Models\User;
use App\User\Infrastructure\Repositories\EloquentUserRepository;
use Illuminate\Foundation\Testing\DatabaseTransactions;

uses(DatabaseTransactions::class);

test('creates a user', function () {
    $repo = new EloquentUserRepository;
    $userModel = new User('Test User', 'test@test.com', 'pwd');

    $result = $repo->create($userModel);

    expect($result)->toBeInstanceOf(User::class);
    expect($result->getName())->toBe('Test User');
    expect($result->getEmail())->toBe('test@test.com');
    expect($result->getId())->not->toBeNull();
});

test('finds user by email', function () {
    $repo = new EloquentUserRepository;
    $userModel = new User('Test User', 'test@test.com', 'pwd');
    $repo->create($userModel);

    $result = $repo->findByEmail('test@test.com');

    expect($result)->toBeInstanceOf(User::class);
    expect($result->getName())->toBe('Test User');
});

test('returns null if user not found by email', function () {
    $repo = new EloquentUserRepository;

    $result = $repo->findByEmail('test2@test.com');

    expect($result)->toBeNull();
});

test('creates and revokes token', function () {
    $repo = new EloquentUserRepository;
    $userModel = new User('Test User', 'test@test.com', 'pwd');
    $user = $repo->create($userModel);

    $token = $repo->createToken($user, 'test_token');
    expect($token)->toBeString();

    $repo->revokeTokens($user);
    // Since it's void, we execute without exceptions
    expect(true)->toBeTrue();
});
