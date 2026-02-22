<?php

namespace App\Http\Api\Requests;

use App\Manga\Application\DTOs\ScanMangaDTO;
use Illuminate\Foundation\Http\FormRequest;

class ScanMangaRequest extends FormRequest
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
            'isbn' => ['required', 'string'],
        ];
    }

    public function toDTO(): ScanMangaDTO
    {
        /** @var \App\User\Infrastructure\EloquentModels\User $user */
        $user = $this->user();

        return new ScanMangaDTO(
            isbn: $this->string('isbn')->toString(),
            userId: (int) $user->id
        );
    }
}
