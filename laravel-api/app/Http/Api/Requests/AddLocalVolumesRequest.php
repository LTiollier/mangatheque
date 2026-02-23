<?php

namespace App\Http\Api\Requests;

use App\Manga\Application\DTOs\AddLocalVolumesDTO;
use Illuminate\Foundation\Http\FormRequest;

class AddLocalVolumesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'edition_id' => ['required', 'integer', 'exists:editions,id'],
            'numbers' => ['required', 'array', 'min:1'],
            'numbers.*' => ['required', 'integer', 'min:1'],
        ];
    }

    public function toDTO(): AddLocalVolumesDTO
    {
        /** @var \App\User\Infrastructure\EloquentModels\User $user */
        $user = $this->user();

        /** @var array<int, int> $numbers */
        $numbers = $this->input('numbers', []);

        /** @var int $editionId */
        $editionId = $this->input('edition_id');

        return new AddLocalVolumesDTO(
            editionId: $editionId,
            numbers: $numbers,
            userId: (int) $user->id
        );
    }
}
