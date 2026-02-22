<?php

namespace Tests\Unit\Manga\Infrastructure\Services;

use App\Manga\Infrastructure\Services\MangaLookupService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MangaLookupServiceTest extends TestCase
{
    private MangaLookupService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new MangaLookupService();
    }

    public function test_search_handles_failed_api_response()
    {
        Http::fake([
            '*' => Http::response(null, 500)
        ]);

        $result = $this->service->search('naruto');

        $this->assertEmpty($result);
    }

    public function test_find_by_isbn_returns_manga_data()
    {
        Http::fake([
            '*' => Http::response([
                'items' => [
                    [
                        'id' => 'api123',
                        'volumeInfo' => [
                            'title' => 'Naruto Vol. 1',
                            'authors' => ['Masashi Kishimoto'],
                        ]
                    ]
                ]
            ], 200)
        ]);

        $result = $this->service->findByIsbn('9781234567890');

        $this->assertNotNull($result);
        $this->assertEquals('api123', $result['api_id']);
        $this->assertEquals('Naruto Vol. 1', $result['title']);
        $this->assertEquals('9781234567890', $result['isbn']);
        $this->assertEquals(['Masashi Kishimoto'], $result['authors']);
        $this->assertNull($result['description']);
        $this->assertNull($result['published_date']);
        $this->assertNull($result['page_count']);
        $this->assertNull($result['cover_url']);
    }

    public function test_find_by_isbn_handles_failed_api_response()
    {
        Http::fake([
            '*' => Http::response(null, 500)
        ]);

        $result = $this->service->findByIsbn('9781234567890');

        $this->assertNull($result);
    }

    public function test_find_by_isbn_handles_empty_results()
    {
        Http::fake([
            '*' => Http::response([
                'totalItems' => 0
            ], 200)
        ]);

        $result = $this->service->findByIsbn('9781234567890');

        $this->assertNull($result);
    }
}
