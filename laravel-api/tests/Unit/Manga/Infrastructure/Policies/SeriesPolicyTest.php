<?php

use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\Policies\SeriesPolicy;
use App\User\Infrastructure\EloquentModels\User;

test('it allows deleting a series if the user owns at least one volume', function () {
    $policy = new SeriesPolicy;
    $user = new User;
    $user->id = 1;

    $series = new Series;
    $series->id = 10;

    expect($policy->delete($user, $series))->toBeFalse();
});
