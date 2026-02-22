<?php

namespace App\Http\Api\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchMangaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'query' => ['required', 'string', 'min:3'],
        ];
    }
}
