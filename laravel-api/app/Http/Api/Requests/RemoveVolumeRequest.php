<?php

namespace App\Http\Api\Requests;

use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Foundation\Http\FormRequest;

class RemoveVolumeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $volumeId = $this->route('id');
        if (! $volumeId) {
            return false;
        }

        $volume = Volume::find($volumeId);
        if (! $volume instanceof Volume) {
            return false;
        }

        return $this->user()?->can('delete', $volume) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
