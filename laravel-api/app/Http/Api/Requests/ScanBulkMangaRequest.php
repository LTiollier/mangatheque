<?php

namespace App\Http\Api\Requests;

use App\Manga\Application\DTOs\ScanBulkMangaDTO;
use Illuminate\Foundation\Http\FormRequest;

class ScanBulkMangaRequest extends FormRequest
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
            'isbns' => ['required', 'array', 'min:1'],
            'isbns.*' => ['required', 'string'],
        ];
    }

    public function toDTO(): ScanBulkMangaDTO
    {
        /** @var \App\User\Infrastructure\EloquentModels\User $user */
        $user = $this->user();

        /** @var array<string> $isbns */
        $isbns = $this->input('isbns', []);

        return new ScanBulkMangaDTO(
            isbns: $isbns,
            userId: (int) $user->id
        );
    }
}
