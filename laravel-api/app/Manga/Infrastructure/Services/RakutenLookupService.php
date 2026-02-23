<?php

namespace App\Manga\Infrastructure\Services;

use App\Manga\Domain\Repositories\MangaLookupServiceInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RakutenLookupService implements MangaLookupServiceInterface
{
    private const API_URL = 'https://api.linksynergy.com/productsearch/1.0';

    private const TOKEN_URL = 'https://api.linksynergy.com/token';

    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(string $query): array
    {
        return $this->performSearch(['keyword' => $query, 'max' => 20]);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByIsbn(string $isbn): ?array
    {
        // Rakuten often uses EAN/UPC or exact match.
        // Appending sort to standard behavior
        $results = $this->performSearch(['keyword' => $isbn, 'exact' => 'true', 'max' => 1]);

        return $results[0] ?? null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByApiId(string $apiId): ?array
    {
        return $this->findByIsbn($apiId);
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array<int, array<string, mixed>>
     */
    private function performSearch(array $params): array
    {
        $token = $this->getToken();

        if (! $token) {
            Log::error('RakutenLookupService: Could not retrieve an access token.');

            return [];
        }

        // According to Rakuten documentation, the API returns XML.
        $response = Http::withToken($token)
            ->withHeaders(['Accept' => 'application/json']) // Try to ask for JSON, but Rakuten might ignore it
            ->get(self::API_URL, $params);

        if ($response->failed()) {
            Log::error('RakutenLookupService: API request failed.', ['status' => $response->status(), 'body' => $response->body()]);

            return [];
        }

        return $this->parseResponse($response->body());
    }

    private function getToken(): ?string
    {
        return Cache::remember('rakuten_api_token', 3500, function () { // Token usually lives 3600s
            $clientId = config('services.rakuten.client_id');
            $clientSecret = config('services.rakuten.client_secret');

            if (! $clientId || ! $clientSecret) {
                return null;
            }

            // The Rakuten Advertising token API requires Basic Auth.
            // Note: some developer accounts require grant_type=password with username/password instead of client_credentials.
            // If this fails, the user must generate a token manually from the dashboard or provide username/password.
            $response = Http::asForm()
                ->withBasicAuth(is_scalar($clientId) ? (string) $clientId : '', is_scalar($clientSecret) ? (string) $clientSecret : '')
                ->post(self::TOKEN_URL, [
                    'grant_type' => 'client_credentials',
                    'scope' => '1',
                ]);

            if ($response->successful()) {
                $data = $response->json();
                if (is_array($data) && isset($data['access_token']) && is_string($data['access_token'])) {
                    return $data['access_token'];
                }
            }

            Log::error('RakutenLookupService: Failed to fetch token.', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseResponse(string $body): array
    {
        // Check if JSON
        $data = json_decode($body, true);
        if (is_array($data) && isset($data['result'])) {
            return $this->mapJsonToModels($data);
        }

        // If not JSON, parse XML. Rakuten default is XML.
        try {
            $xml = simplexml_load_string($body);
            if (! $xml) {
                return [];
            }

            $json = json_encode($xml);
            if (! is_string($json)) {
                return [];
            }

            /** @var array<string, mixed> $arrayData */
            $arrayData = json_decode($json, true);

            return $this->mapXmlToModels($arrayData);
        } catch (\Exception $e) {
            Log::error('RakutenLookupService: XML parsing failed.', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int, array<string, mixed>>
     */
    private function mapXmlToModels(array $data): array
    {
        $items = $data['item'] ?? [];
        if (! is_array($items)) {
            return [];
        }

        // If only one item, simplexml wraps it strangely so we normalize
        if (isset($items['mid']) || isset($items['productname'])) {
            $items = [$items];
        }

        /** @var array<int, array<string, mixed>> $items */

        return array_map(function (array $item) {
            $upc = $item['upccode'] ?? null;
            $title = $item['productname'] ?? 'Unknown Title';
            $imageurl = $item['imageurl'] ?? null;

            $descriptionData = $item['description'] ?? null;
            $description = is_array($descriptionData)
                ? ($descriptionData['short'] ?? $descriptionData['long'] ?? null)
                : null;

            // Description often comes back as an array if empty from SimpleXML -> JSON
            if (is_array($description)) {
                $description = null;
            }

            // We fallback the API ID to the UPC/EAN if present
            $apiId = $item['linkid'] ?? $upc;

            return [
                'api_id' => is_string($apiId) ? $apiId : null,
                'title' => is_string($title) ? $title : 'Unknown Title',
                'authors' => [], // Rakuten Product Search API rarely provides dedicated author fields, usually in title or description
                'description' => is_string($description) ? $description : null,
                'published_date' => null,
                'page_count' => null,
                'cover_url' => is_string($imageurl) ? $imageurl : null,
                'isbn' => is_string($upc) ? $upc : null, // UPC is usually EAN-13 in France
            ];
        }, $items);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int, array<string, mixed>>
     */
    private function mapJsonToModels(array $data): array
    {
        // Similar to the XML but if they respect standard JSON formats
        // Rakuten isn't explicitly known for stable JSON here, fallback implementation
        return [];
    }
}
