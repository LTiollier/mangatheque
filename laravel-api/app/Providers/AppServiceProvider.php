<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\User\Domain\Repositories\UserRepositoryInterface::class,
            \App\User\Infrastructure\Repositories\EloquentUserRepository::class
        );

        $this->app->bind(
            \App\Manga\Domain\Repositories\VolumeRepositoryInterface::class,
            \App\Manga\Infrastructure\Repositories\EloquentVolumeRepository::class
        );

        $this->app->bind(
            \App\Manga\Domain\Repositories\SeriesRepositoryInterface::class,
            \App\Manga\Infrastructure\Repositories\EloquentSeriesRepository::class
        );

        $this->app->bind(
            \App\Manga\Domain\Repositories\EditionRepositoryInterface::class,
            \App\Manga\Infrastructure\Repositories\EloquentEditionRepository::class
        );

        $this->app->bind(
            \App\Manga\Domain\Repositories\MangaLookupServiceInterface::class,
            \App\Manga\Infrastructure\Services\RakutenLookupService::class
        );

        $this->app->bind(
            \App\Borrowing\Domain\Repositories\LoanRepositoryInterface::class,
            \App\Borrowing\Infrastructure\Repositories\EloquentLoanRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Database\Eloquent\Factories\Factory::guessFactoryNamesUsing(function (string $modelName) {
            $className = class_basename($modelName);

            /** @var class-string<\Illuminate\Database\Eloquent\Factories\Factory<\Illuminate\Database\Eloquent\Model>> $factoryName */
            $factoryName = "Database\\Factories\\{$className}Factory";

            return $factoryName;
        });
    }
}
