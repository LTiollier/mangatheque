<?php

namespace App\User\Infrastructure\Repositories;

use App\User\Domain\Models\User;
use App\User\Domain\Repositories\UserRepositoryInterface;
use App\User\Infrastructure\EloquentModels\User as EloquentUser;

class EloquentUserRepository implements UserRepositoryInterface
{
    public function create(User $user): User
    {
        $eloquentUser = EloquentUser::create([
            'name' => $user->getName(),
            'username' => $user->getUsername(),
            'is_public' => $user->isPublic(),
            'email' => $user->getEmail(),
            'password' => $user->getPassword(),
        ]);

        return new User(
            name: $eloquentUser->name,
            email: $eloquentUser->email,
            password: $eloquentUser->password,
            id: $eloquentUser->id,
            username: $eloquentUser->username,
            isPublic: $eloquentUser->is_public
        );
    }

    public function findByEmail(string $email): ?User
    {
        $eloquentUser = EloquentUser::where('email', $email)->first();

        if (! $eloquentUser) {
            return null;
        }

        return new User(
            name: $eloquentUser->name,
            email: $eloquentUser->email,
            password: $eloquentUser->password,
            id: $eloquentUser->id,
            username: $eloquentUser->username,
            isPublic: $eloquentUser->is_public
        );
    }

    public function findById(int $id): ?User
    {
        $eloquentUser = EloquentUser::find($id);

        if (! $eloquentUser) {
            return null;
        }

        return new User(
            name: $eloquentUser->name,
            email: $eloquentUser->email,
            password: $eloquentUser->password,
            id: $eloquentUser->id,
            username: $eloquentUser->username,
            isPublic: $eloquentUser->is_public
        );
    }

    public function findByUsername(string $username): ?User
    {
        $eloquentUser = EloquentUser::where('username', $username)->first();

        if (! $eloquentUser) {
            return null;
        }

        return new User(
            name: $eloquentUser->name,
            email: $eloquentUser->email,
            password: $eloquentUser->password,
            id: $eloquentUser->id,
            username: $eloquentUser->username,
            isPublic: $eloquentUser->is_public
        );
    }

    public function update(User $user): User
    {
        $eloquentUser = EloquentUser::findOrFail($user->getId());
        $eloquentUser->update([
            'name' => $user->getName(),
            'username' => $user->getUsername(),
            'is_public' => $user->isPublic(),
            'email' => $user->getEmail(),
            'password' => $user->getPassword(),
        ]);

        return new User(
            name: $eloquentUser->name,
            email: $eloquentUser->email,
            password: $eloquentUser->password,
            id: $eloquentUser->id,
            username: $eloquentUser->username,
            isPublic: $eloquentUser->is_public
        );
    }

    public function createToken(User $user, string $tokenName): string
    {
        $eloquentUser = EloquentUser::findOrFail($user->getId());

        return $eloquentUser->createToken($tokenName)->plainTextToken;
    }

    public function revokeTokens(User $user): void
    {
        $eloquentUser = EloquentUser::findOrFail($user->getId());
        $eloquentUser->tokens()->delete();
    }
}
