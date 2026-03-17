<?php

namespace Tests\Feature;

use App\Manga\Infrastructure\EloquentModels\Series;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MangaSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_search_mangas()
    {
        Series::create([
            'api_id' => 'WddYEAAAQBAJ',
            'title' => 'Naruto Vol. 1',
            'authors' => 'Masashi Kishimoto',
            'cover_url' => 'https://books.google.com/books/content?id=WddYEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
        ]);

        $response = $this->getJson('/api/mangas/search?query=naruto');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.api_id', 'WddYEAAAQBAJ')
            ->assertJsonPath('data.0.title', 'Naruto Vol. 1')
            ->assertJsonPath('data.0.authors', ['Masashi Kishimoto'])
            ->assertJsonPath('data.0.cover_url', 'https://books.google.com/books/content?id=WddYEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api');
    }

    public function test_search_requires_query()
    {
        $response = $this->getJson('/api/mangas/search');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['query']);
    }

    public function test_search_handles_empty_results()
    {
        $response = $this->getJson('/api/mangas/search?query=unknownmanga');

        $response->assertStatus(200)
            ->assertJson(['data' => []]);
    }
}
