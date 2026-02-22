<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MangaSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_search_mangas()
    {
        Http::fake([
            'googleapis.com/books/v1/volumes*' => Http::response([
                'items' => [
                    [
                        'id' => 'api123',
                        'volumeInfo' => [
                            'title' => 'Naruto Vol. 1',
                            'authors' => ['Masashi Kishimoto'],
                            'description' => 'Ninja story',
                            'publishedDate' => '1999',
                            'pageCount' => 200,
                            'industryIdentifiers' => [
                                ['type' => 'ISBN_13', 'identifier' => '9781234567890'],
                            ],
                            'imageLinks' => [
                                'thumbnail' => 'http://example.com/cover.jpg',
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/mangas/search?query=naruto');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.api_id', 'api123')
            ->assertJsonPath('data.0.title', 'Naruto Vol. 1')
            ->assertJsonPath('data.0.authors.0', 'Masashi Kishimoto')
            ->assertJsonPath('data.0.description', 'Ninja story')
            ->assertJsonPath('data.0.published_date', '1999')
            ->assertJsonPath('data.0.page_count', 200)
            ->assertJsonPath('data.0.isbn', '9781234567890')
            ->assertJsonPath('data.0.cover_url', 'http://example.com/cover.jpg');
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
            'googleapis.com/books/v1/volumes*' => Http::response([
                'totalItems' => 0,
            ], 200),
        ]);

        $response = $this->getJson('/api/mangas/search?query=unknownmanga');

        $response->assertStatus(200)
            ->assertJson(['data' => []]);
    }
}
