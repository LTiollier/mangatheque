<?php

namespace App\User\Domain\Models;

class User
{
    private ?int $id;

    private string $name;

    private ?string $username;

    private string $email;

    private string $password;

    private bool $isPublic;

    public function __construct(
        string $name,
        string $email,
        string $password,
        ?int $id = null,
        ?string $username = null,
        bool $isPublic = false
    ) {
        $this->name = $name;
        $this->email = $email;
        $this->password = $password;
        $this->id = $id;
        $this->username = $username;
        $this->isPublic = $isPublic;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function isPublic(): bool
    {
        return $this->isPublic;
    }
}
