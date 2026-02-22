<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\RegisterRequest;
use App\Http\Api\Resources\UserResource;
use App\User\Application\Actions\RegisterUserAction;
use App\User\Application\DTOs\RegisterUserDTO;

class AuthController
{
    public function register(RegisterRequest $request, RegisterUserAction $action): \Illuminate\Http\JsonResponse
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
}
