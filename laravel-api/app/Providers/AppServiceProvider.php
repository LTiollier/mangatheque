<?php

namespace App\Providers;

use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Borrowing\Infrastructure\Repositories\EloquentLoanRepository;
use App\Manga\Application\Listeners\RemoveBoxFromWishlistOnCollection;
use App\Manga\Application\Listeners\RemoveEditionFromWishlistOnCollection;
use App\Manga\Domain\Events\BoxAddedToCollection;
use App\Manga\Domain\Events\EditionAddedToCollection;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\BoxSetRepositoryInterface;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\PlanningRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;
use App\Manga\Infrastructure\Console\ScrapeMangaCollecCommand;
use App\Manga\Infrastructure\Console\ScrapeUsedSeriesCommand;
use App\Manga\Infrastructure\EloquentModels\Box;
use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\Manga\Infrastructure\Policies\SeriesPolicy;
use App\Manga\Infrastructure\Policies\VolumePolicy;
use App\Manga\Infrastructure\Policies\WishlistPolicy;
use App\Manga\Infrastructure\Repositories\EloquentBoxRepository;
use App\Manga\Infrastructure\Repositories\EloquentBoxSetRepository;
use App\Manga\Infrastructure\Repositories\EloquentEditionRepository;
use App\Manga\Infrastructure\Repositories\EloquentPlanningRepository;
use App\Manga\Infrastructure\Repositories\EloquentSeriesRepository;
use App\Manga\Infrastructure\Repositories\EloquentVolumeRepository;
use App\Manga\Infrastructure\Repositories\EloquentWishlistRepository;
use App\Manga\Infrastructure\Services\EloquentMangaLookupService;
use App\Manga\Infrastructure\Services\MangaLookupServiceInterface;
use App\Providers\TelescopeServiceProvider as LocalTelescopeServiceProvider;
use App\ReadingProgress\Domain\Repositories\ReadingProgressRepositoryInterface;
use App\ReadingProgress\Infrastructure\Repositories\EloquentReadingProgressRepository;
use App\User\Domain\Repositories\UserRepositoryInterface;
use App\User\Infrastructure\Repositories\EloquentUserRepository;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Telescope\TelescopeServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if ($this->app->environment('local') && class_exists(TelescopeServiceProvider::class)) {
            $this->app->register(LocalTelescopeServiceProvider::class);
        }

        $this->app->bind(
            UserRepositoryInterface::class,
            EloquentUserRepository::class
        );

        $this->app->bind(
            WishlistRepositoryInterface::class,
            EloquentWishlistRepository::class
        );

        $this->app->bind(
            VolumeRepositoryInterface::class,
            EloquentVolumeRepository::class
        );

        $this->app->bind(
            SeriesRepositoryInterface::class,
            EloquentSeriesRepository::class
        );

        $this->app->bind(
            EditionRepositoryInterface::class,
            EloquentEditionRepository::class
        );

        $this->app->bind(
            BoxSetRepositoryInterface::class,
            EloquentBoxSetRepository::class
        );

        $this->app->bind(
            BoxRepositoryInterface::class,
            EloquentBoxRepository::class
        );

        $this->app->bind(
            MangaLookupServiceInterface::class,
            EloquentMangaLookupService::class
        );

        $this->app->bind(
            LoanRepositoryInterface::class,
            EloquentLoanRepository::class
        );

        $this->app->bind(
            ReadingProgressRepositoryInterface::class,
            EloquentReadingProgressRepository::class
        );

        $this->app->bind(
            PlanningRepositoryInterface::class,
            EloquentPlanningRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(BoxAddedToCollection::class, RemoveBoxFromWishlistOnCollection::class);
        Event::listen(EditionAddedToCollection::class, RemoveEditionFromWishlistOnCollection::class);

        Relation::morphMap([
            'volume' => Volume::class,
            'box' => Box::class,
            'edition' => Edition::class,
        ]);

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        if ($this->app->runningInConsole()) {
            $this->commands([
                ScrapeMangaCollecCommand::class,
                ScrapeUsedSeriesCommand::class,
            ]);
        }

        Gate::policy(Volume::class, VolumePolicy::class);
        Gate::policy(Series::class, SeriesPolicy::class);
        Gate::policy(Edition::class, WishlistPolicy::class);
        Gate::policy(Box::class, WishlistPolicy::class);

        Factory::guessFactoryNamesUsing(function (string $modelName) {
            $className = class_basename($modelName);

            /** @var class-string<Factory<Model>> $factoryName */
            $factoryName = "Database\\Factories\\{$className}Factory";

            return $factoryName;
        });
    }
}
