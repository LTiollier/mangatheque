<?php

namespace App\Manga\Infrastructure\EloquentModels;

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\User\Infrastructure\EloquentModels\User;
use Database\Factories\VolumeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Volume extends Model
{
    /** @use HasFactory<VolumeFactory> */
    use HasFactory;

    protected $fillable = [
        'edition_id',
        'api_id',
        'isbn',
        'number',
        'title',
        'published_date',
        'cover_url',
    ];

    /**
     * @return BelongsTo<Edition, $this>
     */
    public function edition(): BelongsTo
    {
        return $this->belongsTo(Edition::class);
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_volumes')->withTimestamps();
    }

    /**
     * @return BelongsToMany<Box, $this>
     */
    public function boxes(): BelongsToMany
    {
        return $this->belongsToMany(Box::class, 'box_volumes', 'volume_id', 'box_id')->withTimestamps();
    }

    /**
     * @return MorphMany<Loan, $this>
     */
    public function loans(): MorphMany
    {
        return $this->morphMany(Loan::class, 'loanable');
    }
}
