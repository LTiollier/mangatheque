<?php

namespace App\User\Infrastructure\EloquentModels;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'is_public',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_public' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<\App\Manga\Infrastructure\EloquentModels\Volume, $this>
     */
    public function volumes(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(\App\Manga\Infrastructure\EloquentModels\Volume::class, 'user_volumes', 'user_id', 'volume_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<\App\Manga\Infrastructure\EloquentModels\Volume, $this>
     */
    public function wishlistVolumes(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(\App\Manga\Infrastructure\EloquentModels\Volume::class, 'wishlist_volumes', 'user_id', 'volume_id')->withTimestamps();
    }
}
