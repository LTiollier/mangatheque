<?php

namespace App\Http\Api\Requests;

use App\Borrowing\Application\DTOs\ReturnMangaDTO;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Foundation\Http\FormRequest;

class ReturnMangaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $volumeId = $this->input('volume_id');
        if (! $volumeId) {
            return false;
        }

        $volume = Volume::find($volumeId);
        if (! $volume) {
            return false;
        }

        return $this->user()?->can('return', $volume) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'volume_id' => 'required|integer|exists:volumes,id',
        ];
    }

    public function toDTO(): ReturnMangaDTO
    {
        $userId = $this->user()?->getAuthIdentifier();

        return new ReturnMangaDTO(
            userId: is_numeric($userId) ? (int) $userId : 0,
            volumeId: $this->integer('volume_id'),
        );
    }
}
