<?php

declare(strict_types=1);

namespace App\User\Infrastructure\Repositories;

use App\User\Domain\Models\User;
use App\User\Domain\Repositories\UserRepositoryInterface;
use App\User\Infrastructure\EloquentModels\User as EloquentUser;
use Illuminate\Auth\Events\Registered;

final class EloquentUserRepository implements UserRepositoryInterface
{
    public function create(User $user): User
    {
        $eloquentUser = EloquentUser::create([
            'name' => $user->getName(),
            'username' => $user->getUsername(),
            'is_public' => $user->isPublic(),
            'email' => $user->getEmail(),
            'password' => $user->getPassword(),
            'theme' => $user->getTheme(),
            'palette' => $user->getPalette(),
            'notify_planning_releases' => $user->getNotifyPlanningReleases(),
            'view_mode_mobile' => $user->getViewModeMobile(),
            'view_mode_desktop' => $user->getViewModeDesktop(),
        ]);

        return new User(
            name: $eloquentUser->name,
            email: $eloquentUser->email,
            password: $eloquentUser->password,
            id: $eloquentUser->id,
            username: $eloquentUser->username,
            isPublic: $eloquentUser->is_public,
            theme: $eloquentUser->theme,
            palette: $eloquentUser->palette,
            emailVerifiedAt: $eloquentUser->email_verified_at?->toIso8601String(),
            notifyPlanningReleases: $eloquentUser->notify_planning_releases,
            viewModeMobile: $eloquentUser->view_mode_mobile,
            viewModeDesktop: $eloquentUser->view_mode_desktop,
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
            isPublic: $eloquentUser->is_public,
            theme: $eloquentUser->theme,
            palette: $eloquentUser->palette,
            emailVerifiedAt: $eloquentUser->email_verified_at?->toIso8601String(),
            notifyPlanningReleases: $eloquentUser->notify_planning_releases,
            viewModeMobile: $eloquentUser->view_mode_mobile,
            viewModeDesktop: $eloquentUser->view_mode_desktop,
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
            isPublic: $eloquentUser->is_public,
            theme: $eloquentUser->theme,
            palette: $eloquentUser->palette,
            emailVerifiedAt: $eloquentUser->email_verified_at?->toIso8601String(),
            notifyPlanningReleases: $eloquentUser->notify_planning_releases,
            viewModeMobile: $eloquentUser->view_mode_mobile,
            viewModeDesktop: $eloquentUser->view_mode_desktop,
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
            isPublic: $eloquentUser->is_public,
            theme: $eloquentUser->theme,
            palette: $eloquentUser->palette,
            emailVerifiedAt: $eloquentUser->email_verified_at?->toIso8601String(),
            notifyPlanningReleases: $eloquentUser->notify_planning_releases,
            viewModeMobile: $eloquentUser->view_mode_mobile,
            viewModeDesktop: $eloquentUser->view_mode_desktop,
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
            'email_verified_at' => $user->getEmailVerifiedAt(),
            'password' => $user->getPassword(),
            'theme' => $user->getTheme(),
            'palette' => $user->getPalette(),
            'notify_planning_releases' => $user->getNotifyPlanningReleases(),
            'view_mode_mobile' => $user->getViewModeMobile(),
            'view_mode_desktop' => $user->getViewModeDesktop(),
        ]);

        return new User(
            name: $eloquentUser->name,
            email: $eloquentUser->email,
            password: $eloquentUser->password,
            id: $eloquentUser->id,
            username: $eloquentUser->username,
            isPublic: $eloquentUser->is_public,
            theme: $eloquentUser->theme,
            palette: $eloquentUser->palette,
            emailVerifiedAt: $eloquentUser->email_verified_at?->toIso8601String(),
            notifyPlanningReleases: $eloquentUser->notify_planning_releases,
            viewModeMobile: $eloquentUser->view_mode_mobile,
            viewModeDesktop: $eloquentUser->view_mode_desktop,
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

    public function sendEmailVerification(User $user): void
    {
        $eloquentUser = EloquentUser::findOrFail($user->getId());
        event(new Registered($eloquentUser));
    }

    public function markAsVerified(User $user): User
    {
        /** @var EloquentUser $eloquentUser */
        $eloquentUser = EloquentUser::findOrFail($user->getId());
        $eloquentUser->markEmailAsVerified();

        return new User(
            name: $eloquentUser->name,
            email: $eloquentUser->email,
            password: $eloquentUser->password,
            id: $eloquentUser->id,
            username: $eloquentUser->username,
            isPublic: $eloquentUser->is_public,
            theme: $eloquentUser->theme,
            palette: $eloquentUser->palette,
            emailVerifiedAt: $eloquentUser->email_verified_at?->toIso8601String(),
            notifyPlanningReleases: $eloquentUser->notify_planning_releases,
            viewModeMobile: $eloquentUser->view_mode_mobile,
            viewModeDesktop: $eloquentUser->view_mode_desktop,
        );
    }
}
