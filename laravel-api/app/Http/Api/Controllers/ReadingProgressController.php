<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\BulkToggleReadingProgressRequest;
use App\Http\Api\Resources\ReadingProgressResource;
use App\ReadingProgress\Application\Actions\BulkToggleReadingProgressAction;
use App\ReadingProgress\Application\Actions\ListReadingProgressAction;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReadingProgressController
{
    public function index(Request $request, ListReadingProgressAction $action): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();
        $items = $action->execute($user->id);

        return ReadingProgressResource::collection($items);
    }

    public function bulkToggle(BulkToggleReadingProgressRequest $request, BulkToggleReadingProgressAction $action): JsonResponse
    {
        $dto = $request->toDTO();
        $result = $action->execute($dto);

        return response()->json([
            'toggled' => ReadingProgressResource::collection($result['toggled']),
            'removed' => $result['removed'],
        ]);
    }
}
