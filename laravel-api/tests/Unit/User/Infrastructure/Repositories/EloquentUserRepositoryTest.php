<?php

namespace Tests\Unit\User\Infrastructure\Repositories;

use App\User\Domain\Models\User as DomainUser;
use App\User\Infrastructure\EloquentModels\User as EloquentUser;
use App\User\Infrastructure\Repositories\EloquentUserRepository;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EloquentUserRepositoryTest extends TestCase
{
    use DatabaseTransactions;

    private EloquentUserRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new EloquentUserRepository;
    }

    public function test_it_returns_null_when_user_not_found_by_id()
    {
        $this->assertNull($this->repository->findById(99999));
    }

    public function test_it_returns_null_when_user_not_found_by_email()
    {
        $this->assertNull($this->repository->findByEmail('nonexistent@example.com'));
    }

    public function test_it_returns_null_when_user_not_found_by_username()
    {
        $this->assertNull($this->repository->findByUsername('nonexistent'));
    }

    public function test_it_updates_user()
    {
        $eloquentUser = EloquentUser::factory()->create([
            'name' => 'Old Name',
            'username' => 'olduser',
            'is_public' => false,
        ]);

        $domainUser = new DomainUser(
            name: 'New Name',
            email: $eloquentUser->email,
            password: 'password',
            id: $eloquentUser->id,
            username: 'newuser',
            isPublic: true
        );

        $updatedUser = $this->repository->update($domainUser);

        $this->assertEquals('New Name', $updatedUser->getName());
        $this->assertEquals('newuser', $updatedUser->getUsername());
        $this->assertTrue($updatedUser->isPublic());

        $this->assertDatabaseHas('users', [
            'id' => $eloquentUser->id,
            'name' => 'New Name',
            'username' => 'newuser',
            'is_public' => true,
        ]);
    }
}
