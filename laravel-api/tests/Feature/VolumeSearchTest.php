<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VolumeSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_search_mangas(): void
    {
        Series::create([
            'api_id' => 'WddYEAAAQBAJ',
            'title' => 'Naruto Vol. 1',
            'authors' => 'Masashi Kishimoto',
            'cover_url' => 'https://books.google.com/books/content?id=WddYEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
        ]);

        $this->getJson('/api/volumes/search?query=naruto')
            ->assertSuccessful()
            ->assertJsonPath('data.0.api_id', 'WddYEAAAQBAJ')
            ->assertJsonPath('data.0.title', 'Naruto Vol. 1')
            ->assertJsonPath('data.0.authors', ['Masashi Kishimoto'])
            ->assertJsonPath('data.0.cover_url', 'https://books.google.com/books/content?id=WddYEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonStructure(['data', 'links', 'meta'])
            ->assertJsonStructure(['data' => [['editions', 'box_sets']]]);
    }

    public function test_search_requires_query(): void
    {
        $this->getJson('/api/volumes/search')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['query']);
    }

    public function test_search_handles_empty_results(): void
    {
        $this->getJson('/api/volumes/search?query=unknownmanga')
            ->assertSuccessful()
            ->assertJson(['data' => []])
            ->assertJsonPath('meta.total', 0);
    }

    public function test_search_supports_pagination(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            Series::create([
                'api_id' => "api_id_{$i}",
                'title' => "Naruto Vol. {$i}",
                'authors' => 'Masashi Kishimoto',
                'cover_url' => null,
            ]);
        }

        $this->getJson('/api/volumes/search?query=naruto&per_page=2&page=2')
            ->assertSuccessful()
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonCount(2, 'data');
    }

    public function test_unauthenticated_search_returns_editions_and_box_sets(): void
    {
        $series = Series::create([
            'api_id' => 'api123',
            'title' => 'One Piece',
            'authors' => 'Eiichiro Oda',
            'cover_url' => null,
        ]);

        Edition::create([
            'series_id' => $series->id,
            'name' => 'Édition Standard',
            'publisher' => 'Glénat',
            'total_volumes' => 107,
        ]);

        $this->getJson('/api/volumes/search?query=one+piece')
            ->assertSuccessful()
            ->assertJsonPath('data.0.title', 'One Piece')
            ->assertJsonPath('data.0.editions.0.name', 'Édition Standard')
            ->assertJsonPath('data.0.editions.0.publisher', 'Glénat')
            ->assertJsonPath('data.0.editions.0.total_volumes', 107)
            ->assertJsonPath('data.0.editions.0.possessed_count', null)
            ->assertJsonPath('data.0.box_sets', []);
    }

    public function test_authenticated_search_returns_possessed_count_in_editions(): void
    {
        $user = User::factory()->create();

        $series = Series::create([
            'api_id' => 'api456',
            'title' => 'Dragon Ball',
            'authors' => 'Akira Toriyama',
            'cover_url' => null,
        ]);

        $edition = Edition::create([
            'series_id' => $series->id,
            'name' => 'Édition Originale',
            'publisher' => 'Glénat',
            'total_volumes' => 42,
        ]);

        $volumes = [];
        for ($i = 1; $i <= 3; $i++) {
            $volumes[] = Volume::create([
                'edition_id' => $edition->id,
                'api_id' => "vol_api_{$i}",
                'title' => "Dragon Ball T{$i}",
                'number' => (string) $i,
                'isbn' => null,
                'cover_url' => null,
                'published_date' => null,
            ]);
        }

        // User owns volumes 1 and 2
        $user->volumes()->attach([$volumes[0]->id, $volumes[1]->id]);

        $this->actingAs($user)->getJson('/api/volumes/search?query=dragon+ball')
            ->assertSuccessful()
            ->assertJsonPath('data.0.title', 'Dragon Ball')
            ->assertJsonPath('data.0.editions.0.name', 'Édition Originale')
            ->assertJsonPath('data.0.editions.0.total_volumes', 42)
            ->assertJsonPath('data.0.editions.0.possessed_count', 2);
    }

    public function test_search_result_structure(): void
    {
        Series::create([
            'api_id' => 'api789',
            'title' => 'Bleach',
            'authors' => 'Tite Kubo',
            'cover_url' => null,
        ]);

        $this->getJson('/api/volumes/search?query=bleach')
            ->assertSuccessful()
            ->assertJsonStructure([
                'data' => [[
                    'id',
                    'api_id',
                    'title',
                    'authors',
                    'cover_url',
                    'editions',
                    'box_sets',
                ]],
                'meta',
                'links',
            ]);
    }
}
