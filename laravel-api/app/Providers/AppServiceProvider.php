<?php

declare(strict_types=1);

namespace App\Providers;

use App\Borrowing\Domain\Repositories\LoanItemRepositoryInterface;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Borrowing\Infrastructure\Repositories\EloquentLoanItemRepository;
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
use App\Manga\Infrastructure\Console\SendDailyReleasesCommand;
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
use App\Manga\Infrastructure\Services\VolumeResolverService;
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
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Laravel\Telescope\TelescopeServiceProvider as LaravelTelescopeServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        VolumeRepositoryInterface::class => EloquentVolumeRepository::class,
        SeriesRepositoryInterface::class => EloquentSeriesRepository::class,
        WishlistRepositoryInterface::class => EloquentWishlistRepository::class,
        EditionRepositoryInterface::class => EloquentEditionRepository::class,
        BoxRepositoryInterface::class => EloquentBoxRepository::class,
        BoxSetRepositoryInterface::class => EloquentBoxSetRepository::class,
        PlanningRepositoryInterface::class => EloquentPlanningRepository::class,
        LoanRepositoryInterface::class => EloquentLoanRepository::class,
        LoanItemRepositoryInterface::class => EloquentLoanItemRepository::class,
        UserRepositoryInterface::class => EloquentUserRepository::class,
        VolumeResolverServiceInterface::class => VolumeResolverService::class,
        ReadingProgressRepositoryInterface::class => EloquentReadingProgressRepository::class,
    ];

    public function register(): void
    {
        if ($this->app->environment('local')) {
            $this->app->register(LaravelTelescopeServiceProvider::class);
            $this->app->register(TelescopeServiceProvider::class);
        }
    }

    public function boot(): void
    {
        $this->configureRateLimiting();

        Relation::morphMap([
            'edition' => Edition::class,
            'box' => Box::class,
            'volume' => Volume::class,
        ]);

        Event::listen(
            VolumeAddedToCollection::class,
            RemoveEditionFromWishlistOnVolumeAdded::class,
        );

        Event::listen(
            EditionAddedToCollection::class,
            RemoveEditionFromWishlistOnCollection::class,
        );

        Event::listen(
            BoxAddedToCollection::class,
            RemoveBoxFromWishlistOnCollection::class,
        );

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

        VerifyEmail::toMailUsing(function (mixed $notifiable, string $verificationUrl): MailMessage {
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
                SendDailyReleasesCommand::class,
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

    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('mangacollec_import', function (Request $request) {
            return Limit::perHour(1)->by($request->user()?->id ?: $request->ip());
        });
    }

    public static function paletteHex(string $palette): string
    {
        return match ($palette) {
            'oni' => '#ef4444',
            'kitsune' => '#f97316',
            'miko' => '#ec4899',
            'katana' => '#8b5cf6',
            'sakura' => '#f43f5e',
            'bushi' => '#6366f1',
            'shinobi' => '#10b981',
            'ronin' => '#facc15',
            'kappa' => '#06b6d4',
            'shogun' => '#3b82f6',
            'sensei' => '#84cc16',
            'sudoku' => '#71717a',
            default => '#ef4444',
        };
    }
}
