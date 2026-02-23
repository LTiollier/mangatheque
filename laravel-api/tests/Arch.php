<?php

// 1. Domain Layer Isolation
arch('domain models should be isolated')
    ->expect('App\*\Domain\Models')
    ->toOnlyUse(['App\*\Domain\Models', 'App\*\Domain\Events']);

// 2. Repository Contracts
arch('domain repositories should be interfaces')
    ->expect('App\*\Domain\Repositories')
    ->toBeInterfaces();

// 3. Application decoupling
arch('application actions should be decoupled from infrastructure')
    ->expect('App\*\Application\Actions')
    ->not->toUse('App\*\Infrastructure\EloquentModels');
