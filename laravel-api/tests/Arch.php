<?php



// Architecture rules
arch('domain models should not depend on infrastructure')
    ->expect('App\Manga\Domain\Models')
    ->toOnlyDependOn('App\Manga\Domain\Models');

arch('domain repositories should be interfaces')
    ->expect('App\Manga\Domain\Repositories')
    ->toBeInterfaces();
