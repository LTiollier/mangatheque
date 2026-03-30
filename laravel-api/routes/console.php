<?php

declare(strict_types=1);

use App\Console\Commands\SendPlanningReleasesCommand;
use Illuminate\Support\Facades\Schedule;

Schedule::command(SendPlanningReleasesCommand::class)
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->runInBackground();
