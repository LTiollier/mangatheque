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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Database\Eloquent\Factories\Factory::guessFactoryNamesUsing(function (string $modelName) {
            $className = class_basename($modelName);

            return "Database\\Factories\\{$className}Factory";
        });
    }
}
