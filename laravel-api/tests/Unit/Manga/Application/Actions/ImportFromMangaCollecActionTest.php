<?php

use App\Manga\Application\Actions\ImportFromMangaCollecAction;

test('action class exists', function () {
    expect(class_exists(ImportFromMangaCollecAction::class))->toBeTrue();
});
