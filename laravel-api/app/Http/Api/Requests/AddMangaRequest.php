<?php

namespace App\Http\Api\Requests;

use App\Manga\Application\DTOs\AddMangaDTO;
use Illuminate\Foundation\Http\FormRequest;

class AddMangaRequest extends FormRequest
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
        return [
            'api_id' => ['required', 'string'],
        ];
    }

    public function toDTO(): AddMangaDTO
    {
        /** @var \App\User\Infrastructure\EloquentModels\User $user */
        $user = $this->user();

        return new AddMangaDTO(
            api_id: $this->string('api_id')->toString(),
            userId: (int) $user->id
        );
    }
}
