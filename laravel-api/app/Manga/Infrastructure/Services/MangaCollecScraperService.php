<?php

declare(strict_types=1);

namespace App\Manga\Infrastructure\Services;

use Exception;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MangaCollecScraperService
{
    private const BASE_URL = 'https://api.mangacollec.com';

    private const CACHE_KEY = 'mangacollec_access_token';

    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Get a base HTTP request with common headers, retry, and timeout.
     */
    private function client(): PendingRequest
    {
        return Http::withHeaders([
            'x-app-version' => '2.15.0',
            'x-system-name' => 'Web',
            'x-app-build-number' => '110',
            'Accept' => 'application/json',
        ])
            ->timeout(15)
            ->retry(3, 100);
    }

    /**
     * Get an authenticated HTTP request.
     */
    private function authenticatedClient(): ?PendingRequest
    {
        $token = $this->getAccessToken();

        if (! $token) {
            return null;
        }

        return $this->client()->withToken($token);
    }

    /**
     * Get the access token from cache or by logging in.
     */
    private function getAccessToken(): ?string
    {
        $token = Cache::get(self::CACHE_KEY);

        if (is_string($token)) {
            return $token;
        }

        if ($this->login()) {
            /** @var string|null $token */
            $token = Cache::get(self::CACHE_KEY);

            return $token;
        }

        return null;
    }

    public function login(): bool
    {
        try {
            $response = $this->client()->post(self::BASE_URL.'/oauth/token', [
                'client_id' => config('services.mangacollec.client_id'),
                'client_secret' => config('services.mangacollec.client_secret'),
                'grant_type' => 'password',
                'username' => config('services.mangacollec.username'),
                'password' => config('services.mangacollec.password'),
                'scope' => '',
            ]);

            /** @var mixed $token */
            $token = $response->json('access_token');

            if (is_string($token)) {
                Cache::put(self::CACHE_KEY, $token, self::CACHE_TTL);

                return true;
            }

            return false;
        } catch (Exception $e) {
            Log::error('MangaCollec Login Failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getSeriesList(): array
    {
        try {
            $client = $this->authenticatedClient();

            if (! $client) {
                return [];
            }

            $response = $client->get(self::BASE_URL.'/v2/series');

            /** @var mixed $series */
            $series = $response->json('series');
            /** @var array<int, array<string, mixed>> $seriesArray */
            $seriesArray = is_array($series) ? $series : [];

            return $seriesArray;
        } catch (Exception $e) {
            Log::error('MangaCollec Fetch Series Failed', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getSeriesDetail(string $uuid): ?array
    {
        try {
            $client = $this->authenticatedClient();

            if (! $client) {
                return null;
            }

            $response = $client->get(self::BASE_URL."/v2/series/{$uuid}");

            /** @var mixed $json */
            $json = $response->json();
            /** @var array<string, mixed>|null $detail */
            $detail = is_array($json) ? $json : null;

            return $detail;
        } catch (Exception $e) {
            Log::error("MangaCollec Fetch Series Detail Failed for {$uuid}", ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getUserCollection(string $username): ?array
    {
        try {
            $client = $this->authenticatedClient();

            if (! $client) {
                return null;
            }

            $response = $client->get(self::BASE_URL."/v2/user/{$username}/collection");

            /** @var mixed $json */
            $json = $response->json();
            /** @var array<string, mixed>|null $collection */
            $collection = is_array($json) ? $json : null;

            return $collection;
        } catch (Exception $e) {
            Log::error("MangaCollec Fetch Collection Failed for user {$username}", ['error' => $e->getMessage()]);

            return null;
        }
    }
}
