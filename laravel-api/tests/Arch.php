<?php

declare(strict_types=1);

// 0. Global Standards
arch('strictly typed')
    ->expect(['App', 'Tests'])
    ->toUseStrictTypes();

arch('globals')
    ->expect('App')
    ->not->toUse(['env', 'dd', 'dump', 'var_dump', 'ray']);

// 1. Domain Layer Isolation
arch('domain models should be pure POPOs')
    ->expect('App\*\Domain\Models')
    ->classes()
    ->not->toUse(['Illuminate', 'App\*\Infrastructure', 'App\*\Application', 'Illuminate\Support\Facades']);

// 2. Repository Contracts & Implementations
arch('domain repositories should be interfaces')
    ->expect('App\*\Domain\Repositories')
    ->toBeInterfaces();

arch('repositories implementations should have suffix')
    ->expect('App\*\Infrastructure\Repositories')
    ->classes()
    ->toHaveSuffix('Repository');

// 3. Application decoupling
arch('application actions should be decoupled from infrastructure')
    ->expect('App\*\Application\Actions')
    ->classes()
    ->not->toUse('App\*\Infrastructure\EloquentModels')
    ->toHaveMethod('execute')
    ->toHaveSuffix('Action');

// 4. DTOs should be immutable and standard
arch('dtos should be readonly and have suffix')
    ->expect('App\*\Application\DTOs')
    ->classes()
    ->toBeReadonly()
    ->toHaveSuffix('DTO');

// 5. Controllers decoupling & standards
arch('controllers should delegate validation to form requests')
    ->expect('App\Http\Api\Controllers')
    ->not->toUse([
        'Illuminate\Support\Facades\Validator',
        'Illuminate\Validation\Validator',
    ]);

arch('controllers should not use eloquent models directly')
    ->expect('App\Http\Api\Controllers')
    ->classes()
    ->not->toUse('App\*\Infrastructure\EloquentModels');

arch('controllers should not use repositories directly')
    ->expect('App\Http\Api\Controllers')
    ->classes()
    ->not->toUse([
        'App\*\Domain\Repositories',
        'App\*\Infrastructure\Repositories',
    ]);

// 6. Infrastructure Isolation
arch('infrastructure services should have suffix')
    ->expect('App\*\Infrastructure\Services')
    ->classes()
    ->toHaveSuffix('Service');

arch('infrastructure services should not be used in domain layer')
    ->expect('App\*\Infrastructure\Services')
    ->classes()
    ->not->toBeUsedIn('App\*\Domain');
