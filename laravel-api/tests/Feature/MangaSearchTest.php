<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MangaSearchTest extends TestCase
{
    public function test_can_search_mangas()
    {
        Http::fake([
            'openlibrary.org/search.json*' => Http::response([
                'docs' => [
                    [
                        'key' => '9781234567890',
                        'title' => 'Naruto Vol. 1',
                        'author_name' => ['Masashi Kishimoto'],
                        'isbn' => ['9781234567890'],
                        'cover_i' => 12345,
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/mangas/search?query=naruto');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.api_id', '9781234567890')
            ->assertJsonPath('data.0.title', 'Naruto Vol. 1')
            ->assertJsonPath('data.0.isbn', '9781234567890')
            ->assertJsonPath('data.0.cover_url', 'https://covers.openlibrary.org/b/id/12345-L.jpg');
    }

    public function test_search_requires_query()
    {
        $response = $this->getJson('/api/mangas/search');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['query']);
    }

    public function test_search_handles_empty_results()
    {
        Http::fake([
            'openlibrary.org/search.json*' => Http::response(['docs' => []], 200),
        ]);

        $response = $this->getJson('/api/mangas/search?query=unknownmanga');

        $response->assertStatus(200)
            ->assertJson(['data' => []]);
    }
}
