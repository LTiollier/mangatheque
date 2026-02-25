<?php

namespace App\Http\Api\Requests;

use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Foundation\Http\FormRequest;

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
        /** @var \App\User\Infrastructure\EloquentModels\User $user */
        $user = $this->user();

        return \Illuminate\Support\Facades\DB::table('wishlist_volumes')
            ->where('user_id', $user->id)
            ->where('volume_id', $volume->id)
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
