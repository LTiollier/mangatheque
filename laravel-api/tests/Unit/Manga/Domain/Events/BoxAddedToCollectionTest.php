<?php

use App\Manga\Domain\Events\BoxAddedToCollection;

test('BoxAddedToCollection holds boxId and userId', function () {
    $event = new BoxAddedToCollection(boxId: 42, userId: 7);

    expect($event->boxId)->toBe(42);
    expect($event->userId)->toBe(7);
});
