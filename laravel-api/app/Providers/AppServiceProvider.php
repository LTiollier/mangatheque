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
            \App\Manga\Domain\Repositories\MangaRepositoryInterface::class,
            \App\Manga\Infrastructure\Repositories\EloquentMangaRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
