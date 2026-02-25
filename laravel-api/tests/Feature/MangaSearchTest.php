<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MangaSearchTest extends TestCase
{
    public function test_can_search_mangas()
    {
        Http::fake([
            'www.googleapis.com/books/v1/volumes*' => Http::response([
                'items' => [
                    [
                        'id' => 'WddYEAAAQBAJ',
                        'volumeInfo' => [
                            'title' => 'Naruto Vol. 1',
                            'authors' => ['Masashi Kishimoto'],
                            'industryIdentifiers' => [
                                ['type' => 'ISBN_13', 'identifier' => '9781234567890'],
                            ],
                            'imageLinks' => [
                                'thumbnail' => 'http://books.google.com/books/content?id=WddYEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/mangas/search?query=naruto');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.api_id', 'WddYEAAAQBAJ')
            ->assertJsonPath('data.0.title', 'Naruto Vol. 1')
            ->assertJsonPath('data.0.isbn', '9781234567890')
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
        Http::fake([
            'www.googleapis.com/books/v1/volumes*' => Http::response(['items' => []], 200),
        ]);

        $response = $this->getJson('/api/mangas/search?query=unknownmanga');

        $response->assertStatus(200)
            ->assertJson(['data' => []]);
    }
}
