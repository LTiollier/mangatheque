<?php

use App\User\Application\Actions\LoginAction;
use App\User\Application\DTOs\LoginDTO;
use App\User\Domain\Exceptions\InvalidCredentialsException;
use App\User\Domain\Models\User;
use App\User\Domain\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;

test('it logs in a user with correct credentials', function () {
    $repository = Mockery::mock(UserRepositoryInterface::class);
    $dto = new LoginDTO(
        email: 'john@example.com',
        password: 'password123'
    );

    $user = new User(
        name: 'John Doe',
        email: $dto->email,
        password: Hash::make($dto->password),
        id: 1
    );

    $repository->shouldReceive('findByEmail')
        ->once()
        ->with($dto->email)
        ->andReturn($user);

    $repository->shouldReceive('createToken')
        ->once()
        ->with($user, 'login_token')
        ->andReturn('test_token');

    $action = new LoginAction($repository);
    $result = $action->execute($dto);

    expect($result)->toBeArray()
        ->and($result['user'])->toBeInstanceOf(User::class)
        ->and($result['token'])->toBe('test_token');
});

test('it throws exception for invalid email', function () {
    $repository = Mockery::mock(UserRepositoryInterface::class);
    $dto = new LoginDTO(
        email: 'notfound@example.com',
        password: 'password123'
    );

    $repository->shouldReceive('findByEmail')
        ->once()
        ->andReturn(null);

    $action = new LoginAction($repository);

    $action->execute($dto);
})->throws(InvalidCredentialsException::class);

test('it throws exception for invalid password', function () {
    $repository = Mockery::mock(UserRepositoryInterface::class);
    $dto = new LoginDTO(
        email: 'john@example.com',
        password: 'wrong_password'
    );

    $user = new User(
        name: 'John Doe',
        email: $dto->email,
        password: Hash::make('correct_password'),
        id: 1
    );

    $repository->shouldReceive('findByEmail')
        ->once()
        ->andReturn($user);

    $action = new LoginAction($repository);

    $action->execute($dto);
})->throws(InvalidCredentialsException::class);
