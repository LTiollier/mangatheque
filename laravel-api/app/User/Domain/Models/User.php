<?php

declare(strict_types=1);

namespace App\User\Domain\Models;

final class User
{
    private ?int $id;

    private string $name;

    private ?string $username;

    private string $email;

    private ?string $emailVerifiedAt;

    private string $password;

    private bool $isPublic;

    private string $theme;

    private string $palette;

    private bool $notifyPlanningReleases;

    private string $viewModeMobile;

    private string $viewModeDesktop;

    public function __construct(
        string $name,
        string $email,
        string $password,
        ?int $id = null,
        ?string $username = null,
        bool $isPublic = false,
        string $theme = 'void',
        string $palette = 'ember',
        ?string $emailVerifiedAt = null,
        bool $notifyPlanningReleases = false,
        string $viewModeMobile = 'cover',
        string $viewModeDesktop = 'cover',
    ) {
        $this->name = $name;
        $this->email = $email;
        $this->password = $password;
        $this->id = $id;
        $this->username = $username;
        $this->isPublic = $isPublic;
        $this->theme = $theme;
        $this->palette = $palette;
        $this->emailVerifiedAt = $emailVerifiedAt;
        $this->notifyPlanningReleases = $notifyPlanningReleases;
        $this->viewModeMobile = $viewModeMobile;
        $this->viewModeDesktop = $viewModeDesktop;
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

    public function getEmailVerifiedAt(): ?string
    {
        return $this->emailVerifiedAt;
    }

    public function isEmailVerified(): bool
    {
        return $this->emailVerifiedAt !== null;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function isPublic(): bool
    {
        return $this->isPublic;
    }

    public function getTheme(): string
    {
        return $this->theme;
    }

    public function getPalette(): string
    {
        return $this->palette;
    }

    public function getNotifyPlanningReleases(): bool
    {
        return $this->notifyPlanningReleases;
    }

    public function getViewModeMobile(): string
    {
        return $this->viewModeMobile;
    }

    public function getViewModeDesktop(): string
    {
        return $this->viewModeDesktop;
    }
}
