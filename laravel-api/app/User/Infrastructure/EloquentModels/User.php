<?php

declare(strict_types=1);

namespace App\User\Infrastructure\EloquentModels;

use App\Manga\Infrastructure\EloquentModels\Box;
use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\ReadingProgress\Infrastructure\EloquentModels\UserVolume;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string $name
 * @property string|null $username
 * @property bool $is_public
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string $theme
 * @property string $palette
 * @property bool $notify_planning_releases
 * @property string $view_mode_mobile
 * @property string $view_mode_desktop
 */
class User extends Authenticatable implements MustVerifyEmail
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
        'theme',
        'palette',
        'notify_planning_releases',
        'view_mode_mobile',
        'view_mode_desktop',
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
            'notify_planning_releases' => 'boolean',
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
     * @return BelongsToMany<Volume, $this, UserVolume>
     */
    public function readVolumes(): BelongsToMany
    {
        return $this->belongsToMany(Volume::class, 'reading_progress', 'user_id', 'volume_id')
            ->using(UserVolume::class)
            ->withPivot('read_at');
    }

    /**
     * @return BelongsToMany<Box, $this>
     */
    public function boxes(): BelongsToMany
    {
        return $this->belongsToMany(Box::class, 'user_boxes', 'user_id', 'box_id')->withTimestamps();
    }

    /**
     * @return MorphToMany<Edition, $this>
     */
    public function wishlistEditions(): MorphToMany
    {
        return $this->morphedByMany(Edition::class, 'wishlistable', 'wishlist_items')->withTimestamps();
    }

    /**
     * @return MorphToMany<Box, $this>
     */
    public function wishlistBoxes(): MorphToMany
    {
        return $this->morphedByMany(Box::class, 'wishlistable', 'wishlist_items')->withTimestamps();
    }
}
