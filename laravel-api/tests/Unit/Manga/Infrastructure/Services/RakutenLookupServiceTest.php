<?php

namespace Tests\Unit\Manga\Infrastructure\Services;

use App\Manga\Infrastructure\Services\RakutenLookupService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

test('it handles Rakuten XML search responses', function () {
    Cache::shouldReceive('remember')->andReturn('fake-token');

    $xml = <<<'XML'
    <?xml version="1.0" encoding="UTF-8"?>
    <result>
        <item>
            <linkid>12345</linkid>
            <productname>Manga Title</productname>
            <imageurl>https://example.com/image.jpg</imageurl>
            <description>
                <short>Short desc</short>
            </description>
            <upccode>9781234567890</upccode>
        </item>
    </result>
    XML;

    Http::fake([
        'https://api.linksynergy.com/productsearch/1.0*' => Http::response($xml, 200),
    ]);

    $service = new RakutenLookupService;
    $results = $service->search('Manga');

    expect($results)->toHaveCount(1)
        ->and($results[0]['api_id'])->toBe('12345')
        ->and($results[0]['title'])->toBe('Manga Title')
        ->and($results[0]['description'])->toBe('Short desc')
        ->and($results[0]['isbn'])->toBe('9781234567890');
});

test('it returns empty array on Rakuten API failure', function () {
    Cache::shouldReceive('remember')->andReturn('fake-token');

    Http::fake([
        'https://api.linksynergy.com/productsearch/1.0*' => Http::response('Server Error', 500),
    ]);

    $service = new RakutenLookupService;
    $results = $service->search('Manga');

    expect($results)->toBeArray()->toBeEmpty();
});
