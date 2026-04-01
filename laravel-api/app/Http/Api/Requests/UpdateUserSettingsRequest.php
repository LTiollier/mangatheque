<?php

declare(strict_types=1);

namespace App\Http\Api\Requests;

use App\User\Application\DTOs\UpdateUserSettingsDTO;
use App\User\Infrastructure\EloquentModels\User;
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
        /** @var User $user */
        $user = $this->user();

        return [
            'username' => ['nullable', 'string', 'max:50', 'alpha_dash', 'unique:users,username,'.$user->id],
            'is_public' => ['required', 'boolean'],
            'theme' => ['required', 'string', 'in:void,light,iro'],
            'palette' => ['required', 'string', 'in:oni,kitsune,kaminari,matcha,sakura,katana,mangaka'],
            'notify_planning_releases' => ['required', 'boolean'],
            'view_mode_mobile' => ['required', 'string', 'in:cover,list'],
            'view_mode_desktop' => ['required', 'string', 'in:cover,list'],
        ];
    }

    public function toDTO(): UpdateUserSettingsDTO
    {
        /** @var User $user */
        $user = $this->user();

        $username = $this->input('username');

        return new UpdateUserSettingsDTO(
            userId: (int) $user->id,
            username: is_string($username) ? $username : null,
            isPublic: $this->boolean('is_public'),
            theme: $this->string('theme')->toString(),
            palette: $this->string('palette')->toString(),
            notifyPlanningReleases: $this->boolean('notify_planning_releases'),
            viewModeMobile: $this->string('view_mode_mobile')->toString(),
            viewModeDesktop: $this->string('view_mode_desktop')->toString(),
        );
    }
}
