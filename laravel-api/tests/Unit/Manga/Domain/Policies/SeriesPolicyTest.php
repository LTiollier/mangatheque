<?php

use App\Manga\Domain\Policies\SeriesPolicy;
use App\User\Infrastructure\EloquentModels\User;
use App\Manga\Infrastructure\EloquentModels\Series;
use Illuminate\Database\Eloquent\Relations\HasMany;

test('it allows deleting a series if the user owns at least one volume', function () {
    $policy = new SeriesPolicy();
    $user = Mockery::mock(User::class);
    $user->id = 1;
    
    $series = Mockery::mock(Series::class);
    $editionsRelation = Mockery::mock(HasMany::class);
    
    $series->shouldReceive('editions')->andReturn($editionsRelation);
    $editionsRelation->shouldReceive('whereHas')->with('volumes', Mockery::any())->andReturnSelf();
    $editionsRelation->shouldReceive('exists')->andReturn(true);

    expect($policy->delete($user, $series))->toBeTrue();
});
