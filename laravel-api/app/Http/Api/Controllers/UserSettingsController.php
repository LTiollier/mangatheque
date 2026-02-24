<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\UpdateUserSettingsRequest;
use App\Http\Api\Resources\UserResource;
use App\User\Application\Actions\UpdateUserSettingsAction;

class UserSettingsController
{
    public function update(UpdateUserSettingsRequest $request, UpdateUserSettingsAction $action): UserResource
    {
        $dto = $request->toDTO();

        $updatedUser = $action->execute($dto);

        return new UserResource($updatedUser);
    }
}
