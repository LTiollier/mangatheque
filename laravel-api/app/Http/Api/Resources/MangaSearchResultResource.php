<?php

namespace App\Http\Api\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MangaSearchResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'api_id' => $this->resource['api_id'],
            'title' => $this->resource['title'],
            'authors' => $this->resource['authors'],
            'description' => $this->resource['description'],
            'published_date' => $this->resource['published_date'],
            'page_count' => $this->resource['page_count'],
            'cover_url' => $this->resource['cover_url'],
            'isbn' => $this->resource['isbn'],
        ];
    }
}
