<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\ForgotPasswordRequest;
use App\Http\Api\Requests\LoginRequest;
use App\Http\Api\Requests\RegisterRequest;
use App\Http\Api\Requests\ResetPasswordRequest;
use App\Http\Api\Resources\UserResource;
use App\User\Application\Actions\LoginAction;
use App\User\Application\Actions\LogoutAction;
use App\User\Application\Actions\RegisterUserAction;
use App\User\Domain\Exceptions\InvalidCredentialsException;
use App\User\Domain\Models\User;
use App\User\Infrastructure\EloquentModels\User as EloquentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie as SymfonyCookie;

class AuthController
{
    public function register(RegisterRequest $request, RegisterUserAction $action): JsonResponse
    {
        $dto = $request->toDTO();

        $result = $action->execute($dto);

        return response()->json([
            'user' => new UserResource($result['user']),
        ], 201)
        ->withCookie($this->makeTokenCookie($result['token']))
        ->withCookie($this->makeCheckCookie());
    }

    public function login(LoginRequest $request, LoginAction $action): JsonResponse
    {
        try {
            $dto = $request->toDTO();

            $result = $action->execute($dto);

            return response()->json([
                'user' => new UserResource($result['user']),
            ])
            ->withCookie($this->makeTokenCookie($result['token']))
            ->withCookie($this->makeCheckCookie());
        } catch (InvalidCredentialsException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 401);
        }
    }

    public function logout(Request $request, LogoutAction $action): JsonResponse
    {
        /** @var EloquentUser $eloquentUser */
        $eloquentUser = $request->user();

        $domainUser = new User(
            name: $eloquentUser->name,
            email: $eloquentUser->email,
            password: $eloquentUser->password,
            id: $eloquentUser->id
        );

        $action->execute($domainUser);

        return response()->json([
            'message' => 'Successfully logged out.',
        ])
        ->withCookie(Cookie::forget('auth_token'))
        ->withCookie(Cookie::forget('auth_check'));
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink(
            $request->only('email')
        );

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => __($status)])
            : response()->json(['message' => __($status)], 400);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        /** @var string $status */
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => __($status)])
            : response()->json(['message' => __($status)], 400);
    }

    /**
     * Crée un cookie httpOnly sécurisé contenant le token Sanctum.
     * - httpOnly : inaccessible depuis JavaScript (protection XSS)
     * - secure : HTTPS uniquement en production
     * - sameSite : 'Lax' pour autoriser les requêtes cross-origin du SPA
     */
    private function makeTokenCookie(string $token): SymfonyCookie
    {
        /** @var int $expiration */
        $expiration = config('sanctum.expiration', 60 * 24 * 7);

        /** @var string|null $domain */
        $domain = config('session.domain');

        return Cookie::make(
            name: 'auth_token',
            value: $token,
            minutes: $expiration,
            path: '/',
            domain: $domain,
            secure: (bool) config('session.secure'),
            httpOnly: true,
            raw: false,
            sameSite: 'Lax',
        );
    }

    /**
     * Crée un cookie non-httpOnly (lisible par JS) servant d'indicateur de session
     * pour le middleware Next.js (AuthGuard). Ne contient pas de données sensibles.
     */
    private function makeCheckCookie(): SymfonyCookie
    {
        /** @var int $expiration */
        $expiration = (int) config('sanctum.expiration', 60 * 24 * 7);

        /** @var string|null $domain */
        $domain = config('session.domain');

        return Cookie::make(
            name: 'auth_check',
            value: 'true',
            minutes: $expiration,
            path: '/',
            domain: $domain,
            secure: (bool) config('session.secure'),
            httpOnly: false, // Lisible par le middleware Next.js / JS
            raw: false,
            sameSite: 'Lax',
        );
    }
}
