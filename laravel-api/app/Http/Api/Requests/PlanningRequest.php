<?php

namespace App\Http\Api\Requests;

use App\Manga\Application\DTOs\PlanningFiltersDTO;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Http\FormRequest;

class PlanningRequest extends FormRequest
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
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:from'],
            'type' => ['sometimes', 'string', 'in:volume,box,all'],
            'my_series' => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'cursor' => ['sometimes', 'string'],
        ];
    }

    public function toDTO(): PlanningFiltersDTO
    {
        /** @var User $user */
        $user = $this->user();

        $defaultFrom = now()->subMonth()->format('Y-m-d');
        $defaultTo = now()->addYear()->format('Y-m-d');

        return new PlanningFiltersDTO(
            userId: (int) $user->id,
            from: $this->string('from')->toString() ?: $defaultFrom,
            to: $this->string('to')->toString() ?: $defaultTo,
            type: $this->string('type')->toString() ?: 'all',
            mySeries: $this->boolean('my_series'),
            perPage: $this->integer('per_page') ?: 24,
            cursor: $this->has('cursor') ? $this->string('cursor')->toString() : null,
        );
    }
}
