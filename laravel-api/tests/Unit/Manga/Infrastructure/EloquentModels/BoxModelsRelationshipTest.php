<?php

namespace Tests\Unit\Manga\Infrastructure\EloquentModels;

use App\Manga\Infrastructure\EloquentModels\Box;
use App\Manga\Infrastructure\EloquentModels\BoxSet;
use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class BoxModelsRelationshipTest extends TestCase
{
    use DatabaseTransactions;

    public function test_box_belongs_to_box_set(): void
    {
        $series = Series::create(['title' => 'Test Series', 'authors' => 'Author']);
        $boxSet = BoxSet::create(['series_id' => $series->id, 'title' => 'Test BoxSet']);
        $box = Box::create(['box_set_id' => $boxSet->id, 'title' => 'Test Box', 'is_empty' => false]);

        $this->assertInstanceOf(BelongsTo::class, $box->boxSet());
        $this->assertInstanceOf(BoxSet::class, $box->boxSet);
        $this->assertEquals($boxSet->id, $box->boxSet->id);
    }

    public function test_box_has_volumes_relationship(): void
    {
        $series = Series::create(['title' => 'Test Series', 'authors' => 'Author']);
        $boxSet = BoxSet::create(['series_id' => $series->id, 'title' => 'Test BoxSet']);
        $box = Box::create(['box_set_id' => $boxSet->id, 'title' => 'Test Box', 'is_empty' => false]);

        $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
        $volume = Volume::create(['edition_id' => $edition->id, 'title' => 'Vol 1', 'number' => 1]);

        $box->volumes()->attach($volume->id);
        $box->refresh();

        $this->assertInstanceOf(BelongsToMany::class, $box->volumes());
        $this->assertInstanceOf(Collection::class, $box->volumes);
        $this->assertTrue($box->volumes->contains($volume));
    }

    public function test_box_volumes_returns_empty_collection_when_no_volumes(): void
    {
        $series = Series::create(['title' => 'Test Series', 'authors' => 'Author']);
        $boxSet = BoxSet::create(['series_id' => $series->id, 'title' => 'Test BoxSet']);
        $box = Box::create(['box_set_id' => $boxSet->id, 'title' => 'Empty Box', 'is_empty' => true]);

        $this->assertInstanceOf(Collection::class, $box->volumes);
        $this->assertCount(0, $box->volumes);
    }

    public function test_box_set_belongs_to_series(): void
    {
        $series = Series::create(['title' => 'Test Series', 'authors' => 'Author']);
        $boxSet = BoxSet::create(['series_id' => $series->id, 'title' => 'Test BoxSet']);

        $this->assertInstanceOf(BelongsTo::class, $boxSet->series());
        $this->assertInstanceOf(Series::class, $boxSet->series);
        $this->assertEquals($series->id, $boxSet->series->id);
    }

    public function test_box_set_has_many_boxes(): void
    {
        $series = Series::create(['title' => 'Test Series', 'authors' => 'Author']);
        $boxSet = BoxSet::create(['series_id' => $series->id, 'title' => 'Test BoxSet']);
        $box1 = Box::create(['box_set_id' => $boxSet->id, 'title' => 'Box 1', 'is_empty' => false]);
        $box2 = Box::create(['box_set_id' => $boxSet->id, 'title' => 'Box 2', 'is_empty' => false]);

        $boxSet->refresh();

        $this->assertInstanceOf(HasMany::class, $boxSet->boxes());
        $this->assertInstanceOf(Collection::class, $boxSet->boxes);
        $this->assertTrue($boxSet->boxes->contains($box1));
        $this->assertTrue($boxSet->boxes->contains($box2));
        $this->assertCount(2, $boxSet->boxes);
    }

    public function test_box_set_boxes_returns_empty_collection_when_no_boxes(): void
    {
        $series = Series::create(['title' => 'Test Series', 'authors' => 'Author']);
        $boxSet = BoxSet::create(['series_id' => $series->id, 'title' => 'Empty BoxSet']);

        $this->assertInstanceOf(Collection::class, $boxSet->boxes);
        $this->assertCount(0, $boxSet->boxes);
    }
}
