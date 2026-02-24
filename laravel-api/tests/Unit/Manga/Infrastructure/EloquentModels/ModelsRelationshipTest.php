<?php

namespace Tests\Unit\Manga\Infrastructure\EloquentModels;

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ModelsRelationshipTest extends TestCase
{
    use DatabaseTransactions;

    public function test_relationships()
    {
        $series = Series::create(['title' => 'Test Series', 'authors' => []]);
        $edition = Edition::create(['series_id' => $series->id, 'name' => 'Std', 'language' => 'fr']);
        $volume = Volume::create(['title' => 'Vol', 'edition_id' => $edition->id, 'authors' => []]);

        // Series -> Editions
        $this->assertTrue($series->editions->contains($edition));
        $this->assertInstanceOf(Series::class, $edition->series);

        // Edition -> Volumes
        $this->assertTrue($edition->volumes->contains($volume));
        $this->assertInstanceOf(Edition::class, $volume->edition);

        // Series -> Volumes through Edition
        $this->assertEquals('Test Series', $volume->edition->series->title);

        // Volume -> Users
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Collection::class, $volume->users);
    }
}
