<?php

declare(strict_types=1);

use App\Manga\Infrastructure\Console\SendDailyReleasesCommand;
use Illuminate\Support\Facades\Schedule;

Schedule::command(SendDailyReleasesCommand::class)
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->runInBackground();
