<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\LoginRequest;
use App\Http\Api\Requests\RegisterRequest;
use App\Http\Api\Resources\UserResource;
use App\User\Application\Actions\LoginAction;
use App\User\Application\Actions\LogoutAction;
use App\User\Application\Actions\RegisterUserAction;
use App\User\Domain\Exceptions\InvalidCredentialsException;
use App\User\Domain\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;

class AuthController
{
    public function register(RegisterRequest $request, RegisterUserAction $action): JsonResponse
    {
        $dto = $request->toDTO();

        $result = $action->execute($dto);

        return response()->json([
            'user' => new UserResource($result['user']),
            'token' => $result['token'],
        ], 201)->withCookie($this->makeTokenCookie($result['token']));
    }

    public function login(LoginRequest $request, LoginAction $action): JsonResponse
    {
        try {
            $dto = $request->toDTO();

            $result = $action->execute($dto);

            return response()->json([
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ])->withCookie($this->makeTokenCookie($result['token']));
        } catch (InvalidCredentialsException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 401);
        }
    }

    public function logout(Request $request, LogoutAction $action): JsonResponse
    {
        /** @var \App\User\Infrastructure\EloquentModels\User $eloquentUser */
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
        ])->withCookie(Cookie::forget('auth_token'));
    }

    /**
     * Crée un cookie httpOnly sécurisé contenant le token Sanctum.
     * - httpOnly : inaccessible depuis JavaScript (protection XSS)
     * - secure : HTTPS uniquement en production
     * - sameSite : 'Lax' pour autoriser les requêtes cross-origin du SPA
     */
    private function makeTokenCookie(string $token): \Symfony\Component\HttpFoundation\Cookie
    {
        return Cookie::make(
            name: 'auth_token',
            value: $token,
            minutes: (int) config('sanctum.expiration', 60 * 24 * 7), // 7 jours
            path: '/',
            domain: config('session.domain'),
            secure: (bool) config('session.secure'),
            httpOnly: true,
            raw: false,
            sameSite: 'Lax',
        );
    }
}
