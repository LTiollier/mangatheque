<?php

namespace App\Manga\Infrastructure\EloquentModels;

use App\Borrowing\Infrastructure\EloquentModels\Loan;
use App\User\Infrastructure\EloquentModels\User;
use Database\Factories\VolumeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'authors',
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
        return $this->belongsToMany(User::class, 'user_volumes');
    }

    /**
     * @return HasMany<Loan, $this>
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }
}
