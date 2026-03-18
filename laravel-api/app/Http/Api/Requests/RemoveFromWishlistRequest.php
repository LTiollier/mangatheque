<?php

namespace App\Http\Api\Requests;

use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;

class RemoveFromWishlistRequest extends FormRequest
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

        // Check if the user has this volume in their wishlist
        /** @var User $user */
        $user = $this->user();

        return DB::table('wishlist_items')
            ->where('user_id', $user->id)
            ->where('wishlistable_id', $volume->id)
            ->where('wishlistable_type', 'volume')
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
