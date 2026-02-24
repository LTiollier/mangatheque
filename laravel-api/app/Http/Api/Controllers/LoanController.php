<?php

namespace App\Http\Api\Controllers;

use App\Borrowing\Application\Actions\LoanMangaAction;
use App\Borrowing\Application\Actions\ReturnMangaAction;
use App\Borrowing\Domain\Repositories\LoanRepositoryInterface;
use App\Http\Api\Requests\LoanMangaRequest;
use App\Http\Api\Requests\BulkLoanMangaRequest;
use App\Http\Api\Requests\ReturnMangaRequest;
use App\Http\Api\Requests\BulkReturnMangaRequest;
use App\Borrowing\Application\Actions\BulkLoanMangaAction;
use App\Borrowing\Application\Actions\BulkReturnMangaAction;
use App\Http\Api\Resources\LoanResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LoanController
{
    public function index(LoanRepositoryInterface $loanRepository): AnonymousResourceCollection
    {
        /** @var \App\User\Infrastructure\EloquentModels\User $user */
        $user = auth()->user();
        $loans = $loanRepository->findAllByUserId($user->id);

        return LoanResource::collection($loans);
    }

    public function store(LoanMangaRequest $request, LoanMangaAction $action): LoanResource
    {
        $dto = $request->toDTO();
        $loan = $action->execute($dto);

        return new LoanResource($loan);
    }

    public function bulkStore(BulkLoanMangaRequest $request, BulkLoanMangaAction $action): AnonymousResourceCollection
    {
        $dto = $request->toDTO();
        $loans = $action->execute($dto);

        return LoanResource::collection($loans);
    }

    public function return(ReturnMangaRequest $request, ReturnMangaAction $action): LoanResource
    {
        $dto = $request->toDTO();
        $loan = $action->execute($dto);

        return new LoanResource($loan);
    }

    public function bulkReturn(BulkReturnMangaRequest $request, BulkReturnMangaAction $action): AnonymousResourceCollection
    {
        $dto = $request->toDTO();
        $loans = $action->execute($dto);

        return LoanResource::collection($loans);
    }
}
