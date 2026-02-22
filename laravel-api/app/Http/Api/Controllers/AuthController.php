<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\LoginRequest;
use App\Http\Api\Requests\RegisterRequest;
use App\Http\Api\Resources\UserResource;
use App\User\Application\Actions\LoginAction;
use App\User\Application\Actions\RegisterUserAction;
use App\User\Application\DTOs\LoginDTO;
use App\User\Application\DTOs\RegisterUserDTO;
use App\User\Domain\Exceptions\InvalidCredentialsException;
use Illuminate\Http\JsonResponse;

class AuthController
{
    public function register(RegisterRequest $request, RegisterUserAction $action): JsonResponse
    {
        $dto = new RegisterUserDTO(
            name: $request->validated('name'),
            email: $request->validated('email'),
            password: $request->validated('password'),
        );

        $user = $action->execute($dto);

        return (new UserResource($user))
            ->response()
            ->setStatusCode(201);
    }

    public function login(LoginRequest $request, LoginAction $action): JsonResponse
    {
        try {
            $dto = new LoginDTO(
                email: $request->validated('email'),
                password: $request->validated('password'),
            );

            $result = $action->execute($dto);

            return response()->json([
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
            ]);
        } catch (InvalidCredentialsException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 401);
        }
    }
}
