<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\SearchMangaRequest;
use App\Http\Api\Resources\MangaSearchResultResource;
use App\Manga\Application\Actions\SearchMangaAction;
use App\Manga\Application\DTOs\SearchMangaDTO;

class MangaSearchController
{
    public function search(SearchMangaRequest $request, SearchMangaAction $action): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $dto = $request->toDTO();

        $results = $action->execute($dto);

        return MangaSearchResultResource::collection(collect($results));
    }
}
