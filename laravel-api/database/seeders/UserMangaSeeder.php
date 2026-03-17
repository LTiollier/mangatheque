<?php

namespace Database\Seeders;

use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserMangaSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'test@example.com')->first();
        if (! $user) {
            return;
        }

        // Add some One Piece (series 1, edition 1) volumes to the user
        $volumes = Volume::where('edition_id', 1)->limit(10)->get();
        foreach ($volumes as $volume) {
            DB::table('user_volumes')->updateOrInsert(
                ['user_id' => $user->id, 'volume_id' => $volume->id],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
