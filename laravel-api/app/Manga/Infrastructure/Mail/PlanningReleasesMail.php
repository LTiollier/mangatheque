<?php

declare(strict_types=1);

namespace App\Manga\Infrastructure\Mail;

use App\Manga\Domain\Models\PlanningItem;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class PlanningReleasesMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  PlanningItem[]  $releases
     * @param  array<string, string>  $themeColors
     */
    public function __construct(
        public readonly string $userName,
        public readonly array $releases,
        public readonly string $accentColor,
        public readonly string $accentForeground,
        public readonly string $unsubscribeUrl,
        public readonly array $themeColors,
    ) {}

    public function envelope(): Envelope
    {
        /** @var string $address */
        $address = config('mail.from.address');
        /** @var string $name */
        $name = config('mail.from.name');

        return new Envelope(
            subject: 'Vos sorties manga du jour — Atsume',
            from: new Address($address, $name),
        );
    }

    public function content(): Content
    {
        /** @var string $appUrl */
        $appUrl = config('app.frontend_url');

        return new Content(
            view: 'emails.planning-releases',
            with: [
                'userName' => $this->userName,
                'releases' => $this->releases,
                'accentColor' => $this->accentColor,
                'accentForeground' => $this->accentForeground,
                'appUrl' => $appUrl,
                'unsubscribeUrl' => $this->unsubscribeUrl,
                'theme' => $this->themeColors,
            ],
        );
    }
}
