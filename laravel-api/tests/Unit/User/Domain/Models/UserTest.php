<?php

use App\User\Domain\Models\User;

test('user model can be instantiated and returns correct values', function () {
    $user = new User(
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        id: 1
    );

    expect($user->getId())->toBe(1)
        ->and($user->getName())->toBe('John Doe')
        ->and($user->getEmail())->toBe('john@example.com')
        ->and($user->getPassword())->toBe('password123');
});

test('user model can be instantiated without id', function () {
    $user = new User(
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
    );

    expect($user->getId())->toBeNull();
});
