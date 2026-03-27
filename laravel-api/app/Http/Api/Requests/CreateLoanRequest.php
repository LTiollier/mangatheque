<?php

declare(strict_types=1);

namespace App\Http\Api\Requests;

use App\Borrowing\Application\DTOs\CreateLoanDTO;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var array<int, array<string, mixed>>|null $items */
        $items = $this->input('items');
        if (! is_array($items)) {
            return false;
        }

        foreach ($items as $item) {
            if (! isset($item['type'], $item['id'])) {
                return false;
            }

            $type = $item['type'];
            $id = $item['id'];

            if ($type === 'volume') {
                $volume = Volume::find($id);
                if (! $volume || ! ($this->user()?->can('loan', $volume) ?? false)) {
                    return false;
                }
            } elseif ($type === 'box') {
                if (! $this->user()?->boxes()->where('box_id', $id)->exists()) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'borrower_name' => ['required', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.type' => ['required', Rule::in(['volume', 'box'])],
            'items.*.id' => ['required', 'integer'],
        ];
    }

    public function toDTO(): CreateLoanDTO
    {
        $userId = $this->user()?->getAuthIdentifier();

        /** @var array<array{type: string, id: int}> $items */
        $items = $this->input('items');

        return new CreateLoanDTO(
            userId: is_numeric($userId) ? (int) $userId : 0,
            borrowerName: $this->string('borrower_name')->toString(),
            items: $items,
        );
    }
}
