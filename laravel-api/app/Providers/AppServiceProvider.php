<?php

namespace App\Providers;

use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Borrowing\Infrastructure\Repositories\EloquentLoanRepository;
use App\Manga\Domain\Policies\SeriesPolicy;
use App\Manga\Domain\Policies\VolumePolicy;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\BoxSetRepositoryInterface;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;
use App\Manga\Domain\Services\MangaLookupServiceInterface;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\Manga\Infrastructure\Repositories\EloquentBoxRepository;
use App\Manga\Infrastructure\Repositories\EloquentBoxSetRepository;
use App\Manga\Infrastructure\Repositories\EloquentEditionRepository;
use App\Manga\Infrastructure\Repositories\EloquentSeriesRepository;
use App\Manga\Infrastructure\Repositories\EloquentVolumeRepository;
use App\Manga\Infrastructure\Repositories\EloquentWishlistRepository;
use App\Manga\Infrastructure\Services\MangaLookupService;
use App\User\Domain\Repositories\UserRepositoryInterface;
use App\User\Infrastructure\Repositories\EloquentUserRepository;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
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
            MangaLookupService::class
        );

        $this->app->bind(
            LoanRepositoryInterface::class,
            EloquentLoanRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(
            Volume::class,
            VolumePolicy::class
        );

        Gate::policy(
            Series::class,
            SeriesPolicy::class
        );

        Factory::guessFactoryNamesUsing(function (string $modelName) {
            $className = class_basename($modelName);

            /** @var class-string<Factory<Model>> $factoryName */
            $factoryName = "Database\\Factories\\{$className}Factory";

            return $factoryName;
        });
    }
}
