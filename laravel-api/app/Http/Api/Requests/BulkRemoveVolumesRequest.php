<?php

declare(strict_types=1);

namespace App\Http\Api\Requests;

use App\Manga\Application\DTOs\BulkRemoveVolumesDTO;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Http\FormRequest;

class BulkRemoveVolumesRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var array<int, int> $volumeIds */
        $volumeIds = $this->input('volume_ids', []);

        return $this->user()->can('deleteMany', [Volume::class, $volumeIds]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'volume_ids' => ['required', 'array', 'min:1'],
            'volume_ids.*' => ['required', 'integer', 'exists:volumes,id'],
        ];
    }

    public function toDTO(): BulkRemoveVolumesDTO
    {
        /** @var User $user */
        $user = $this->user();

        /** @var array<int, int> $volumeIds */
        $volumeIds = $this->input('volume_ids', []);

        return new BulkRemoveVolumesDTO(
            volumeIds: $volumeIds,
            userId: (int) $user->id
        );
    }
}
