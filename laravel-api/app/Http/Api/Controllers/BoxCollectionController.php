<?php

namespace App\Http\Api\Controllers;

use App\Manga\Application\Actions\AddBoxToCollectionAction;
use App\Manga\Application\Actions\RemoveBoxFromCollectionAction;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BoxCollectionController
{
    public function store(Request $request, AddBoxToCollectionAction $action, int $boxId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $action->execute($boxId, (int) $user->id);

        return response()->json(['message' => 'Box added to collection'], 201);
    }

    public function destroy(Request $request, RemoveBoxFromCollectionAction $action, int $boxId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $action->execute($boxId, (int) $user->id);

        return response()->json(['message' => 'Box removed from collection']);
    }
}
