<?php

namespace App\Http\Api\Requests;

use App\User\Application\DTOs\UpdateUserSettingsDTO;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        /** @var \App\User\Infrastructure\EloquentModels\User $user */
        $user = $this->user();

        return [
            'username' => ['nullable', 'string', 'max:50', 'alpha_dash', 'unique:users,username,'.$user->id],
            'is_public' => ['required', 'boolean'],
        ];
    }

    public function toDTO(): UpdateUserSettingsDTO
    {
        /** @var \App\User\Infrastructure\EloquentModels\User $user */
        $user = $this->user();

        $username = $this->input('username');

        return new UpdateUserSettingsDTO(
            userId: $user->id,
            username: is_string($username) ? $username : null,
            isPublic: $this->boolean('is_public')
        );
    }
}
