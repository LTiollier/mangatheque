<?php

namespace App\Manga\Infrastructure\EloquentModels;

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Box extends Model
{
    /** @var array<string, string> */
    protected $casts = [
        'is_empty' => 'boolean',
    ];

    protected $fillable = [
        'box_set_id',
        'api_id',
        'title',
        'number',
        'isbn',
        'release_date',
        'cover_url',
        'is_empty',
    ];

    /** @return BelongsTo<BoxSet, $this> */
    public function boxSet(): BelongsTo
    {
        return $this->belongsTo(BoxSet::class);
    }

    /** @return BelongsToMany<Volume, $this> */
    public function volumes(): BelongsToMany
    {
        /** @var BelongsToMany<Volume, $this> $relation */
        $relation = $this->belongsToMany(Volume::class, 'box_volumes', 'box_id', 'volume_id')->withTimestamps();

        return $relation;
    }

    /** @return BelongsToMany<User, $this> */
    public function users(): BelongsToMany
    {
        /** @var BelongsToMany<User, $this> $relation */
        $relation = $this->belongsToMany(User::class, 'user_boxes', 'box_id', 'user_id')->withTimestamps();

        return $relation;
    }

    /**
     * @return MorphMany<Loan, $this>
     */
    public function loans(): MorphMany
    {
        return $this->morphMany(Loan::class, 'loanable');
    }
}
