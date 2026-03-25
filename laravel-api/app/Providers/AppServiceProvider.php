<?php

declare(strict_types=1);

namespace App\Providers;

use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Borrowing\Infrastructure\Repositories\EloquentLoanRepository;
use App\Manga\Domain\Events\BoxAddedToCollection;
use App\Manga\Domain\Events\EditionAddedToCollection;
use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Domain\Listeners\RemoveBoxFromWishlistOnCollection;
use App\Manga\Domain\Listeners\RemoveEditionFromWishlistOnCollection;
use App\Manga\Domain\Listeners\RemoveEditionFromWishlistOnVolumeAdded;
use App\Manga\Domain\Repositories\BoxRepositoryInterface;
use App\Manga\Domain\Repositories\BoxSetRepositoryInterface;
use App\Manga\Domain\Repositories\EditionRepositoryInterface;
use App\Manga\Domain\Repositories\PlanningRepositoryInterface;
use App\Manga\Domain\Repositories\SeriesRepositoryInterface;
use App\Manga\Domain\Repositories\VolumeRepositoryInterface;
use App\Manga\Domain\Repositories\WishlistRepositoryInterface;
use App\Manga\Domain\Services\VolumeResolverServiceInterface;
use App\Manga\Infrastructure\Console\SyncAllMangaCollecSeriesCommand;
use App\Manga\Infrastructure\Console\SyncMangaCollecSeriesByUuidCommand;
use App\Manga\Infrastructure\Console\SyncMangaCollecSeriesCommand;
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
use App\Manga\Infrastructure\Services\EloquentVolumeLookupService;
use App\Manga\Infrastructure\Services\VolumeLookupServiceInterface;
use App\Manga\Infrastructure\Services\VolumeResolverService;
use App\Providers\TelescopeServiceProvider as LocalTelescopeServiceProvider;
use App\ReadingProgress\Domain\Repositories\ReadingProgressRepositoryInterface;
use App\ReadingProgress\Infrastructure\Repositories\EloquentReadingProgressRepository;
use App\User\Domain\Repositories\UserRepositoryInterface;
use App\User\Infrastructure\EloquentModels\User;
use App\User\Infrastructure\Repositories\EloquentUserRepository;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Laravel\Telescope\TelescopeServiceProvider;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoApiTransport;

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
            VolumeLookupServiceInterface::class,
            EloquentVolumeLookupService::class
        );

        $this->app->bind(
            VolumeResolverServiceInterface::class,
            VolumeResolverService::class
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
        Mail::extend('brevo', function () {
            /** @var string $key */
            $key = config('services.brevo.key');

            return new BrevoApiTransport($key);
        });

        Event::listen(BoxAddedToCollection::class, RemoveBoxFromWishlistOnCollection::class);
        Event::listen(EditionAddedToCollection::class, RemoveEditionFromWishlistOnCollection::class);
        Event::listen(VolumeAddedToCollection::class, RemoveEditionFromWishlistOnVolumeAdded::class);

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

        RateLimiter::for('mangacollec_import', function (Request $request) {
            return Limit::perMinutes(10, 2)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('mangacollec-api', fn () => Limit::perSecond(2));

        ResetPassword::toMailUsing(function (mixed $notifiable, string $token) {
            /** @var User $notifiable */
            /** @var string $frontendUrl */
            $frontendUrl = config('app.frontend_url');
            $url = $frontendUrl.'/reset-password?token='.$token.'&email='.$notifiable->getEmailForPasswordReset();

            /** @var string $passwordsBroker */
            $passwordsBroker = config('auth.defaults.passwords');
            /** @var int $expire */
            $expire = config('auth.passwords.'.$passwordsBroker.'.expire', 60);

            $mail = (new MailMessage)
                ->subject(__('Reset Password Notification'))
                ->line(__('You are receiving this email because we received a password reset request for your account.'))
                ->action(__('Reset Password'), $url)
                ->line(__('This password reset link will expire in :count minutes.', ['count' => $expire]))
                ->line(__('If you did not request a password reset, no further action is required.'));

            $mail->viewData['primaryColor'] = self::paletteHex($notifiable->palette ?? 'oni');

            return $mail;
        });

        VerifyEmail::createUrlUsing(function (User $notifiable) {
            $id = (string) $notifiable->id;
            $hash = sha1($notifiable->getEmailForVerification());

            /** @var string $frontendUrl */
            $frontendUrl = config('app.frontend_url');

            /** @var int $expire */
            $expire = config('auth.verification.expire', 60);

            $temporarySignedUrl = URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes($expire),
                ['id' => $id, 'hash' => $hash]
            );

            $urlParts = parse_url($temporarySignedUrl);
            $queryString = $urlParts['query'] ?? '';

            return $frontendUrl."/verify-email/{$id}/{$hash}?{$queryString}";
        });

        VerifyEmail::toMailUsing(function (mixed $notifiable, string $verificationUrl) {
            /** @var User $notifiable */
            $mail = (new MailMessage)
                ->subject(__('Verify Email Address'))
                ->line(__('Please click the button below to verify your email address.'))
                ->action(__('Verify Email Address'), $verificationUrl)
                ->line(__('If you did not create an account, no further action is required.'));

            $mail->viewData['primaryColor'] = self::paletteHex($notifiable->palette ?? 'oni');

            return $mail;
        });

        if ($this->app->runningInConsole()) {
            $this->commands([
                SyncAllMangaCollecSeriesCommand::class,
                SyncMangaCollecSeriesCommand::class,
                SyncMangaCollecSeriesByUuidCommand::class,
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

    /**
     * Returns the hex primary colour for a given palette slug.
     * Used to inject per-user palette overrides into transactional emails.
     */
    public static function paletteHex(string $palette): string
    {
        return match ($palette) {
            'kitsune' => '#cf7c17',  // Orange brûlé   oklch(68% 0.22 45°)
            'kaminari' => '#c2b214',  // Jaune or        oklch(82% 0.20 90°)
            'matcha' => '#76b030',  // Vert lime       oklch(76% 0.18 135°)
            'sakura' => '#d02874',  // Rose néon       oklch(65% 0.26 345°)
            'katana' => '#1a9ec0',  // Cyan acier      oklch(70% 0.22 200°)
            'mangaka' => '#e4e4f0',  // Argent          oklch(91% 0.005 250°)
            default => '#c8392b',  // Oni — rouge sang oklch(62% 0.24 18°)
        };
    }
}
