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
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Laravel\Telescope\TelescopeServiceProvider as LaravelTelescopeServiceProvider;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;

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
        Mail::extend('brevo', function (array $config) {
            return (new BrevoTransportFactory(null, HttpClient::create()))->create(
                new Dsn(
                    'brevo+api',
                    'default',
                    $config['key'] ?? config('services.brevo.key')
                )
            );
        });

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
            $mail->viewData['primaryForeground'] = self::paletteForegroundHex($notifiable->palette ?? 'oni');
            $mail->viewData['themeColors'] = self::themeColors($notifiable->theme ?? 'void');

            return $mail;
        });

        VerifyEmail::createUrlUsing(function (User $notifiable) {
            $id = (string) $notifiable->id;
            $hash = sha1($notifiable->getEmailForVerification());

            /** @var string $frontendUrl */
            $frontendUrl = config('app.frontend_url');

            /** @var int $expire */
            $expire = config('auth.verification.expire', 60);

            /** @var string $appUrl */
            $appUrl = config('app.url');
            URL::forceRootUrl($appUrl);

            $temporarySignedUrl = URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes($expire),
                ['id' => $id, 'hash' => $hash]
            );

            URL::forceRootUrl(null);

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
            $mail->viewData['primaryForeground'] = self::paletteForegroundHex($notifiable->palette ?? 'oni');
            $mail->viewData['themeColors'] = self::themeColors($notifiable->theme ?? 'void');

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
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('mangacollec_import', function (Request $request) {
            return Limit::perHour(2)->by($request->user()?->id ?: $request->ip());
        });
    }

    /**
     * Hex equivalent of each palette's --primary token.
     * Mirrors pwa-client-v2/src/app/globals.css and PaletteSwitcher.tsx.
     * Values pre-computed from the OKLCH definitions via sRGB rendering.
     */
    public static function paletteHex(string $palette): string
    {
        return match ($palette) {
            'oni' => '#f5184c',
            'kitsune' => '#ff5b00',
            'kaminari' => '#f6bb00',
            'matcha' => '#7cc948',
            'sakura' => '#f224b2',
            'katana' => '#00c2d4',
            'mangaka' => '#dfe2e4',
            default => '#f5184c',
        };
    }

    /**
     * Hex equivalent of each palette's --primary-foreground token.
     * The contrast text colour on a button filled with the palette --primary.
     * Always near-black — but slightly hue-tinted per palette to match the app.
     */
    public static function paletteForegroundHex(string $palette): string
    {
        return match ($palette) {
            'oni' => '#070202',
            'kitsune' => '#070201',
            'kaminari' => '#0e0b03',
            'matcha' => '#080d05',
            'sakura' => '#070204',
            'katana' => '#000505',
            'mangaka' => '#080c10',
            default => '#070202',
        };
    }

    /**
     * Hex tokens for the email surface theme.
     * Mirrors the PWA's .theme-void / .theme-light / .theme-iro tokens
     * (see pwa-client-v2/src/app/globals.css).
     *
     * Keys: bg, card, border, fg, muted, panel_bg, table_fg, footer_fg, button_fg.
     *
     * @return array<string, string>
     */
    public static function themeColors(string $theme): array
    {
        return match ($theme) {
            'light' => [
                'bg' => '#f6f5f0',
                'card' => '#ffffff',
                'card_alt' => '#fafaf6',
                'border' => '#e2e3e7',
                'border_soft' => '#ececef',
                'fg' => '#1a1c23',
                'fg_soft' => '#33363d',
                'muted' => '#6a6e76',
                'muted_soft' => '#9aa0a8',
                'panel_bg' => '#f0eee9',
                'table_fg' => '#3a3d44',
                'footer_fg' => '#888c93',
                'is_dark' => '0',
            ],
            'iro' => [
                'bg' => '#272a4e',
                'card' => '#34375a',
                'card_alt' => '#2d305a',
                'border' => '#42456b',
                'border_soft' => '#3a3d62',
                'fg' => '#ebe9e2',
                'fg_soft' => '#d8d6cf',
                'muted' => '#bcbdc7',
                'muted_soft' => '#8a8d9d',
                'panel_bg' => '#2d305a',
                'table_fg' => '#c2c3ce',
                'footer_fg' => '#7e8194',
                'is_dark' => '1',
            ],
            default => [
                'bg' => '#0d0d10',
                'card' => '#131318',
                'card_alt' => '#0d0d15',
                'border' => '#22222c',
                'border_soft' => '#1a1a24',
                'fg' => '#f0efeb',
                'fg_soft' => '#e8e8f0',
                'muted' => '#7e7d78',
                'muted_soft' => '#5a5a78',
                'panel_bg' => '#181820',
                'table_fg' => '#c8c7c2',
                'footer_fg' => '#636268',
                'is_dark' => '1',
            ],
        };
    }
}
