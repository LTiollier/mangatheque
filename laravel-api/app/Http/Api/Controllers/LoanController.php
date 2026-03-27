<?php

declare(strict_types=1);

namespace App\Http\Api\Controllers;

use App\Borrowing\Application\Actions\BulkReturnLoanAction;
use App\Borrowing\Application\Actions\CreateLoanAction;
use App\Borrowing\Application\Actions\ListLoansAction;
use App\Borrowing\Application\Actions\ReturnLoanAction;
use App\Http\Api\Requests\BulkReturnLoanRequest;
use App\Http\Api\Requests\CreateLoanRequest;
use App\Http\Api\Requests\ReturnLoanRequest;
use App\Http\Api\Resources\LoanResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LoanController
{
    public function index(Request $request, ListLoansAction $action): AnonymousResourceCollection
    {
        $loans = $action->execute((int) auth()->id());

        return LoanResource::collection($loans);
    }

    public function store(CreateLoanRequest $request, CreateLoanAction $action): JsonResponse
    {
        $dto = $request->toDTO();
        $loan = $action->execute($dto);

        return (new LoanResource($loan))->response()->setStatusCode(201);
    }

    public function return(ReturnLoanRequest $request, int $loan, ReturnLoanAction $action): LoanResource
    {
        $dto = $request->toDTO();
        $returnedLoan = $action->execute($dto);

        return new LoanResource($returnedLoan);
    }

    public function bulkReturn(BulkReturnLoanRequest $request, BulkReturnLoanAction $action): AnonymousResourceCollection
    {
        $dto = $request->toDTO();
        $loans = $action->execute($dto);

        return LoanResource::collection($loans);
    }
}
