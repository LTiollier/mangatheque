<?php

declare(strict_types=1);

namespace Tests\Feature\Manga;

use App\Manga\Application\DTOs\PlanningFiltersDTO;
use App\Manga\Domain\Models\PlanningItem;
use App\Manga\Domain\Models\PlanningResult;
use App\Manga\Domain\Repositories\PlanningRepositoryInterface;
use App\Manga\Infrastructure\Mail\PlanningReleasesMail;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Mail;
use Mockery\MockInterface;

// ─── Command Tests ───────────────────────────────────────────────────────────

it('sends daily releases emails only for today', function () {
    Mail::fake();

    $user = User::factory()->create([
        'notify_planning_releases' => true,
        'email_verified_at' => now(),
    ]);

    $today = now()->toDateString();

    $item = new PlanningItem(
        id: 1,
        type: 'volume',
        title: 'One Piece 101',
        number: '101',
        coverUrl: 'https://example.com/cover.jpg',
        releaseDate: $today,
        seriesId: 1,
        seriesTitle: 'One Piece',
        editionId: null,
        editionTitle: null,
        isOwned: false,
        isWishlisted: true,
        isLastVolume: false,
    );

    $result = new PlanningResult(
        items: [$item],
        total: 1,
        perPage: 50,
        nextCursor: null,
        hasMore: false,
    );

    $this->mock(PlanningRepositoryInterface::class, function (MockInterface $mock) use ($user, $today, $result) {
        $mock->shouldReceive('findPlanning')
            ->once()
            ->withArgs(fn (PlanningFiltersDTO $dto) => $dto->userId === $user->id &&
                $dto->from === $today &&
                $dto->to === $today
            )
            ->andReturn($result);
    });

    $this->artisan('planning:send-daily-releases')
        ->assertSuccessful()
        ->expectsOutputToContain('planning:send-daily-releases — sent: 1, skipped (no releases): 0');

    Mail::assertQueued(PlanningReleasesMail::class, function (PlanningReleasesMail $mail) use ($user, $item) {
        return $mail->hasTo($user->email) &&
               $mail->releases[0] === $item;
    });
});

it('skips users with no releases for today', function () {
    Mail::fake();

    $user = User::factory()->create([
        'notify_planning_releases' => true,
        'email_verified_at' => now(),
    ]);

    $emptyResult = new PlanningResult(
        items: [],
        total: 0,
        perPage: 50,
        nextCursor: null,
        hasMore: false,
    );

    $this->mock(PlanningRepositoryInterface::class, function (MockInterface $mock) use ($emptyResult) {
        $mock->shouldReceive('findPlanning')->andReturn($emptyResult);
    });

    $this->artisan('planning:send-daily-releases')
        ->assertSuccessful()
        ->expectsOutputToContain('planning:send-daily-releases — sent: 0, skipped (no releases): 1');

    Mail::assertNothingOutgoing();
});

// ─── Mail Rendering Tests ────────────────────────────────────────────────────

it('renders the planning releases mail correctly', function () {
    $item = new PlanningItem(
        id: 1,
        type: 'volume',
        title: 'One Piece 101',
        number: '101',
        coverUrl: 'https://example.com/cover.jpg',
        releaseDate: '2026-04-05',
        seriesId: 1,
        seriesTitle: 'One Piece',
        editionId: null,
        editionTitle: null,
        isOwned: false,
        isWishlisted: true,
        isLastVolume: false,
    );

    $mail = new PlanningReleasesMail(
        userName: 'Leo',
        releases: [$item],
        accentColor: '#FF0000',
        unsubscribeUrl: 'https://example.com/unsubscribe',
    );

    $mail->assertHasSubject('Vos sorties manga du jour — Atsume');
    $mail->assertSeeInHtml('One Piece');
    $mail->assertSeeInHtml('https://example.com/cover.jpg');
    $mail->assertSeeInHtml('Tome 101');
    $mail->assertSeeInHtml('aujourd');
});
