<?php

namespace App\Http\Api\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportMangaCollecRequest extends FormRequest
{
    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'url' => ['required', 'string', 'url', 'regex:/^https?:\/\/(www\.)?mangacollec\.com\/user\/([a-zA-Z0-9_\-]+)\/collection\/?$/'],
        ];
    }

    public function getUsername(): string
    {
        $url = $this->input('url');
        $urlString = is_string($url) ? $url : '';
        preg_match('/mangacollec\.com\/user\/([a-zA-Z0-9_\-]+)\/collection/', $urlString, $matches);

        return $matches[1] ?? '';
    }
}
