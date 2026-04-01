<?php

declare(strict_types=1);

namespace App\Http\Api\Resources;

use App\User\Domain\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property User $resource
 */
final class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'name' => $this->resource->getName(),
            'username' => $this->resource->getUsername(),
            'email' => $this->resource->getEmail(),
            'is_public' => $this->resource->isPublic(),
            'email_verified_at' => $this->resource->getEmailVerifiedAt(),
            'theme' => $this->resource->getTheme(),
            'palette' => $this->resource->getPalette(),
            'notify_planning_releases' => $this->resource->getNotifyPlanningReleases(),
            'view_mode_mobile' => $this->resource->getViewModeMobile(),
            'view_mode_desktop' => $this->resource->getViewModeDesktop(),
        ];
    }
}
