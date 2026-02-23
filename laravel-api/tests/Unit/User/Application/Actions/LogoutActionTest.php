<?php

use App\User\Application\Actions\LogoutAction;
use App\User\Domain\Models\User;
use App\User\Domain\Repositories\UserRepositoryInterface;

test('it revokes tokens for logout', function () {
    $repository = Mockery::mock(UserRepositoryInterface::class);
    $user = new User(
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashed_password',
        id: 1
    );

    $repository->shouldReceive('revokeTokens')
        ->once()
        ->with($user);

    $action = new LogoutAction($repository);
    $action->execute($user);

    // If no exception, test passed
    expect(true)->toBeTrue();
});
