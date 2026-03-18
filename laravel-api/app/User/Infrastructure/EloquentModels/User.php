<?php

namespace App\User\Infrastructure\EloquentModels;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Manga\Infrastructure\EloquentModels\Box;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    /** @use HasFactory<UserFactory> */
    use HasFactory;

    use Notifiable;

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
     * @return BelongsToMany<Volume, $this>
     */
    public function volumes(): BelongsToMany
    {
        return $this->belongsToMany(Volume::class, 'user_volumes', 'user_id', 'volume_id')->withTimestamps();
    }

    /**
     * @return BelongsToMany<Box, $this>
     */
    public function boxes(): BelongsToMany
    {
        return $this->belongsToMany(Box::class, 'user_boxes', 'user_id', 'box_id')->withTimestamps();
    }

    /**
     * @return MorphToMany<Volume, $this>
     */
    public function wishlistVolumes(): MorphToMany
    {
        return $this->morphedByMany(Volume::class, 'wishlistable', 'wishlist_items')->withTimestamps();
    }

    /**
     * @return MorphToMany<Box, $this>
     */
    public function wishlistBoxes(): MorphToMany
    {
        return $this->morphedByMany(Box::class, 'wishlistable', 'wishlist_items')->withTimestamps();
    }
}
