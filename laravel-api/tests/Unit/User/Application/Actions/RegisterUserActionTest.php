<?php

use App\User\Application\Actions\RegisterUserAction;
use App\User\Application\DTOs\RegisterUserDTO;
use App\User\Domain\Models\User;
use App\User\Domain\Repositories\UserRepositoryInterface;

test('it registers a user', function () {
    $repository = Mockery::mock(UserRepositoryInterface::class);
    $dto = new RegisterUserDTO(
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
    );

    $repository->shouldReceive('create')
        ->once()
        ->with(Mockery::on(function (User $user) use ($dto) {
            return $user->getName() === $dto->name
                && $user->getEmail() === $dto->email;
        }))
        ->andReturn(new User(
            name: $dto->name,
            email: $dto->email,
            password: 'hashed_password',
            id: 1
        ));

    $repository->shouldReceive('createToken')
        ->once()
        ->andReturn('test_token');

    $action = new RegisterUserAction($repository);
    $result = $action->execute($dto);

    expect($result)->toBeArray()
        ->and($result['user'])->toBeInstanceOf(User::class)
        ->and($result['user']->getId())->toBe(1)
        ->and($result['token'])->toBe('test_token');
});
