<?php

namespace Tests\Unit\Manga\Infrastructure\Repositories;

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\Manga\Infrastructure\Repositories\EloquentVolumeRepository;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EloquentVolumeRepositoryTest extends TestCase
{
    use DatabaseTransactions;

    private EloquentVolumeRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new EloquentVolumeRepository;
    }

    public function test_it_can_check_if_volume_is_wishlisted_by_user()
    {
        $user = User::factory()->create();
        $series = Series::create(['title' => 'Test', 'authors' => []]);
        $edition = Edition::create(['series_id' => $series->id, 'name' => 'Std', 'language' => 'fr']);
        $volume = Volume::create(['title' => 'Vol', 'edition_id' => $edition->id, 'authors' => []]);

        $this->assertFalse($this->repository->isWishlistedByUser($volume->id, $user->id));

        $user->wishlistVolumes()->attach($volume->id);

        $this->assertTrue($this->repository->isWishlistedByUser($volume->id, $user->id));
    }

    public function test_it_can_check_if_volume_is_owned_by_user()
    {
        $user = User::factory()->create();
        $series = Series::create(['title' => 'Test', 'authors' => []]);
        $edition = Edition::create(['series_id' => $series->id, 'name' => 'Std', 'language' => 'fr']);
        $volume = Volume::create(['title' => 'Vol', 'edition_id' => $edition->id, 'authors' => []]);

        $this->assertFalse($this->repository->isOwnedByUser($volume->id, $user->id));

        $user->volumes()->attach($volume->id);

        $this->assertTrue($this->repository->isOwnedByUser($volume->id, $user->id));
    }
}
