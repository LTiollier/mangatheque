<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\ImportMangaCollecRequest;
use App\Http\Api\Resources\ImportSummaryResource;
use App\Manga\Application\Actions\ImportFromMangaCollecAction;
use App\Manga\Application\DTOs\ImportMangaCollecDTO;
use App\Manga\Domain\Exceptions\MangaCollecProfilePrivateException;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Http\JsonResponse;

class MangaCollecImportController
{
    public function store(ImportMangaCollecRequest $request, ImportFromMangaCollecAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $username = $request->getUsername();

        if (empty($username)) {
            return response()->json(['message' => 'Invalid MangaCollec URL'], 422);
        }

        $dto = new ImportMangaCollecDTO(
            username: $username,
            userId: $user->id,
        );

        try {
            $result = $action->execute($dto);

            return response()->json(new ImportSummaryResource($result));
        } catch (MangaCollecProfilePrivateException $e) {
            return response()->json(['message' => $e->getMessage()], 403);
        }
    }
}
