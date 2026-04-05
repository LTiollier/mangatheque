<?php

declare(strict_types=1);

namespace App\Manga\Infrastructure\Console;

use App\Manga\Application\Actions\ListPlanningAction;
use App\Manga\Application\DTOs\PlanningFiltersDTO;
use App\Manga\Infrastructure\Mail\PlanningReleasesMail;
use App\Providers\AppServiceProvider;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

final class SendDailyReleasesCommand extends Command
{
    protected $signature = 'planning:send-daily-releases
                            {--dry-run : Log without sending emails}';

    protected $description = 'Send today\'s planning release notifications to subscribed users';

    public function handle(ListPlanningAction $listPlanningAction): int
    {
        $isDryRun = $this->option('dry-run');
        $today = now()->toDateString();

        $users = User::where('notify_planning_releases', true)
            ->whereNotNull('email_verified_at')
            ->cursor();

        $sent = 0;
        $skipped = 0;

        foreach ($users as $user) {
            $result = $listPlanningAction->execute(new PlanningFiltersDTO(
                userId: $user->id,
                from: $today,
                to: $today,
                perPage: 50,
                cursor: null,
            ));

            if ($result->getItems() === []) {
                $skipped++;

                continue;
            }

            if ($isDryRun) {
                $this->line("  [dry-run] Would send {$user->email} — {$result->getTotal()} release(s)");
                $sent++;

                continue;
            }

            $accentColor = AppServiceProvider::paletteHex($user->palette ?? 'oni');

            /** @var string $frontendUrl */
            $frontendUrl = config('app.frontend_url');

            Mail::to($user->email)->send(new PlanningReleasesMail(
                userName: $user->name,
                releases: $result->getItems(),
                accentColor: $accentColor,
                unsubscribeUrl: $frontendUrl.'/settings',
            ));

            $sent++;
        }

        $this->info("planning:send-daily-releases — sent: {$sent}, skipped (no releases): {$skipped}");

        return self::SUCCESS;
    }
}
