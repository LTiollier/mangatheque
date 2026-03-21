<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Requests\PlanningRequest;
use App\Http\Api\Resources\PlanningItemResource;
use App\Manga\Application\Actions\ListPlanningAction;
use Illuminate\Http\JsonResponse;

class PlanningController
{
    public function index(PlanningRequest $request, ListPlanningAction $action): JsonResponse
    {
        $dto = $request->toDTO();
        $result = $action->execute($dto);

        return response()->json([
            'data' => PlanningItemResource::collection($result->getItems()),
            'meta' => [
                'per_page' => $result->getPerPage(),
                'total' => $result->getTotal(),
                'next_cursor' => $result->getNextCursor(),
                'has_more' => $result->hasMore(),
            ],
        ]);
    }
}
