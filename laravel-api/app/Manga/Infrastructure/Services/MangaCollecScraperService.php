<?php

namespace App\Manga\Infrastructure\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MangaCollecScraperService
{
    private const BASE_URL = 'https://api.mangacollec.com';

    private ?string $accessToken = null;

    public function login(): bool
    {
        $response = Http::withHeaders([
            'x-app-version' => '2.15.0',
            'x-system-name' => 'Web',
            'x-app-build-number' => '110',
            'Accept' => 'application/json',
        ])->post(self::BASE_URL.'/oauth/token', [
            'client_id' => config('services.mangacollec.client_id'),
            'client_secret' => config('services.mangacollec.client_secret'),
            'grant_type' => 'password',
            'username' => config('services.mangacollec.username'),
            'password' => config('services.mangacollec.password'),
            'scope' => '',
        ]);

        if ($response->failed()) {
            Log::error('MangaCollec Login Failed', ['body' => $response->body()]);

            return false;
        }

        /** @var mixed $token */
        $token = $response->json('access_token');
        $this->accessToken = is_string($token) ? $token : null;

        return true;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getSeriesList(): array
    {
        if (! $this->accessToken && ! $this->login()) {
            return [];
        }

        $response = Http::withToken((string) $this->accessToken)
            ->withHeaders([
                'x-app-version' => '2.15.0',
                'x-system-name' => 'Web',
                'x-app-build-number' => '110',
                'Accept' => 'application/json',
            ])->get(self::BASE_URL.'/v2/series');

        if ($response->failed()) {
            Log::error('MangaCollec Fetch Series Failed', ['body' => $response->body()]);

            return [];
        }

        /** @var mixed $series */
        $series = $response->json('series');
        /** @var array<int, array<string, mixed>> $seriesArray */
        $seriesArray = is_array($series) ? $series : [];

        return $seriesArray;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getSeriesDetail(string $uuid): ?array
    {
        if (! $this->accessToken && ! $this->login()) {
            return null;
        }

        $response = Http::withToken((string) $this->accessToken)
            ->withHeaders([
                'x-app-version' => '2.15.0',
                'x-system-name' => 'Web',
                'x-app-build-number' => '110',
                'Accept' => 'application/json',
            ])->get(self::BASE_URL."/v2/series/{$uuid}");

        if ($response->failed()) {
            Log::error("MangaCollec Fetch Series Detail Failed for {$uuid}", ['body' => $response->body()]);

            return null;
        }

        /** @var mixed $json */
        $json = $response->json();
        /** @var array<string, mixed>|null $detail */
        $detail = is_array($json) ? $json : null;

        return $detail;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getUserCollection(string $username): ?array
    {
        if (! $this->accessToken && ! $this->login()) {
            return null;
        }

        $response = Http::withToken((string) $this->accessToken)
            ->withHeaders([
                'x-app-version' => '2.15.0',
                'x-system-name' => 'Web',
                'x-app-build-number' => '110',
                'Accept' => 'application/json',
            ])->get(self::BASE_URL."/v2/user/{$username}/collection");

        if ($response->failed()) {
            Log::error("MangaCollec Fetch Collection Failed for user {$username}", ['body' => $response->body()]);

            return null;
        }

        /** @var mixed $json */
        $json = $response->json();
        /** @var array<string, mixed>|null $collection */
        $collection = is_array($json) ? $json : null;

        return $collection;
    }
}
