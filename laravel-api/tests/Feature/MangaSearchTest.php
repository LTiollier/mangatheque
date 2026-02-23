<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MangaSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_search_mangas()
    {
        Cache::shouldReceive('remember')->andReturn('fake-token');
        Cache::shouldReceive('refreshEventDispatcher')->byDefault();

        $xml = <<<'XML'
        <?xml version="1.0" encoding="UTF-8"?>
        <result>
            <item>
                <linkid>api123</linkid>
                <productname>Naruto Vol. 1</productname>
                <imageurl>http://example.com/cover.jpg</imageurl>
                <description>
                    <short>Ninja story</short>
                </description>
                <upccode>9781234567890</upccode>
            </item>
        </result>
        XML;

        Http::fake([
            'api.linksynergy.com/productsearch/1.0*' => Http::response($xml, 200),
        ]);

        $response = $this->getJson('/api/mangas/search?query=naruto');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.api_id', 'api123')
            ->assertJsonPath('data.0.title', 'Naruto Vol. 1')
            ->assertJsonPath('data.0.description', 'Ninja story')
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
        Cache::shouldReceive('remember')->andReturn('fake-token');
        Cache::shouldReceive('refreshEventDispatcher')->byDefault();

        $xml = '<?xml version="1.0" encoding="UTF-8"?><result></result>';

        Http::fake([
            'api.linksynergy.com/productsearch/1.0*' => Http::response($xml, 200),
        ]);

        $response = $this->getJson('/api/mangas/search?query=unknownmanga');

        $response->assertStatus(200)
            ->assertJson(['data' => []]);
    }
}
