<?php

namespace Tests\Unit\Manga\Application\Actions;

use App\Manga\Application\Actions\SearchMangaAction;
use App\Manga\Application\DTOs\SearchMangaDTO;
use App\Manga\Infrastructure\Services\MangaLookupService;
use Mockery;

test('searches manga via external service', function () {
    $lookupService = Mockery::mock(MangaLookupService::class);

    $searchResult = [['title' => 'Naruto']];
    $lookupService->shouldReceive('search')->with('Naruto')->andReturn($searchResult);

    $action = new SearchMangaAction($lookupService);
    $dto = new SearchMangaDTO('Naruto');
    $result = $action->execute($dto);

    expect($result)->toBe($searchResult);
});
