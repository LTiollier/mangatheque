<?php

namespace App\Http\Api\Requests;

use App\Manga\Infrastructure\EloquentModels\Series;
use Illuminate\Foundation\Http\FormRequest;

class RemoveSeriesRequest extends FormRequest
{
    public function authorize(): bool
    {
        $seriesId = $this->route('seriesId');
        if (! $seriesId) {
            return false;
        }

        $series = Series::find($seriesId);
        if (! $series instanceof Series) {
            return false;
        }

        return $this->user()?->can('delete', $series) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
