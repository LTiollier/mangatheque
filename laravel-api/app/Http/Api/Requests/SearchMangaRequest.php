<?php

namespace App\Http\Api\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchMangaRequest extends FormRequest
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
            'query' => ['required', 'string', 'min:3'],
        ];
    }

    public function toDTO(): \App\Manga\Application\DTOs\SearchMangaDTO
    {
        return new \App\Manga\Application\DTOs\SearchMangaDTO(
            query: $this->string('query')->toString()
        );
    }
}
