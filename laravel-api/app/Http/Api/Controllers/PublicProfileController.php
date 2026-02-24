<?php

namespace App\Http\Api\Controllers;

use App\Http\Api\Resources\MangaResource;
use App\Http\Api\Resources\UserResource;
use App\Manga\Application\Actions\ListUserMangasAction;
use App\User\Domain\Repositories\UserRepositoryInterface;
use Illuminate\Http\JsonResponse;

class PublicProfileController
{
    public function showProfile(string $username, UserRepositoryInterface $userRepository): JsonResponse
    {
        $user = $userRepository->findByUsername($username);

        if (! $user || ! $user->isPublic()) {
            return response()->json(['message' => 'Profile not found or is private.'], 404);
        }

        return (new UserResource($user))->response()->setStatusCode(200);
    }

    public function showCollection(string $username, UserRepositoryInterface $userRepository, ListUserMangasAction $action): JsonResponse
    {
        $user = $userRepository->findByUsername($username);

        if (! $user || ! $user->isPublic()) {
            return response()->json(['message' => 'Profile not found or is private.'], 404);
        }

        $userId = $user->getId();
        if ($userId === null) {
            return response()->json(['message' => 'Profile not found or is private.'], 404);
        }

        $mangas = $action->execute($userId);

        return MangaResource::collection(collect($mangas))->response()->setStatusCode(200);
    }
}
