<?php

use App\Manga\Domain\Events\EditionAddedToCollection;

test('EditionAddedToCollection holds editionId and userId', function () {
    $event = new EditionAddedToCollection(editionId: 10, userId: 3);

    expect($event->editionId)->toBe(10);
    expect($event->userId)->toBe(3);
});
