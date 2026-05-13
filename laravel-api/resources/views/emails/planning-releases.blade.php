<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
@php($isDark = ($theme['is_dark'] ?? '1') === '1')
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="{{ $isDark ? 'dark' : 'light' }}" />
    <meta name="supported-color-schemes" content="{{ $isDark ? 'dark' : 'light' }}" />
    <title>Vos sorties manga — Atsume</title>
    <style>
        @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 20px 12px !important; }
            .email-card { padding: 24px 16px !important; }
            .release-cover { display: none !important; }
            .release-date-col { width: 80px !important; }
            .cta-button { display: block !important; text-align: center !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: {{ $theme['bg'] }}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%;">

<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="{{ $theme['bg'] }}">
    <tr>
        <td class="email-wrapper" align="center" style="padding: 40px 20px;">

            <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">

                {{-- ── Logo / Header ── --}}
                <tr>
                    <td align="center" style="padding-bottom: 36px;">
                        <p style="margin: 0; font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: {{ $accentColor }}; font-weight: 600;">集める</p>
                        <p style="margin: 4px 0 0; font-size: 26px; letter-spacing: 6px; text-transform: uppercase; color: {{ $theme['fg'] }}; font-weight: 700; font-family: Georgia, 'Times New Roman', serif;">ATSUME</p>
                        <table border="0" cellspacing="0" cellpadding="0" style="margin: 10px auto 0;">
                            <tr>
                                <td style="width: 20px; height: 1px; background-color: {{ $theme['border'] }};"></td>
                                <td style="width: 32px; height: 1px; background-color: {{ $accentColor }};"></td>
                                <td style="width: 20px; height: 1px; background-color: {{ $theme['border'] }};"></td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- ── Main card ── --}}
                <tr>
                    <td class="email-card" style="background-color: {{ $theme['card'] }}; border: 1px solid {{ $theme['border'] }}; border-radius: 4px; padding: 36px 32px;">

                        {{-- Greeting --}}
                        <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: {{ $theme['muted_soft'] }};">Bonjour</p>
                        <p style="margin: 0 0 20px; font-size: 22px; font-weight: 700; color: {{ $theme['fg'] }}; line-height: 1.2;">{{ $userName }}</p>

                        <p style="margin: 0 0 28px; font-size: 14px; color: {{ $theme['muted'] }}; line-height: 1.7;">
                            {{ count($releases) }} sortie{{ count($releases) > 1 ? 's' : '' }} vous attende{{ count($releases) > 1 ? 'nt' : '' }} <span style="color: {{ $theme['fg_soft'] }}; font-weight: 600;">aujourd'hui</span>.
                        </p>

                        {{-- Divider --}}
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                            <tr>
                                <td style="height: 1px; background-color: {{ $theme['border_soft'] }};"></td>
                            </tr>
                        </table>

                        {{-- Releases list --}}
                        @foreach ($releases as $release)
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: {{ $loop->last ? '0' : '10px' }}; background-color: {{ $theme['card_alt'] }}; border: 1px solid {{ $theme['border_soft'] }}; border-radius: 4px;">
                            <tr>
                                {{-- Cover --}}
                                <td class="release-cover" width="68" valign="top" style="padding: 12px 8px 12px 12px;">
                                    @if ($release->getCoverUrl())
                                        <img src="{{ $release->getCoverUrl() }}" width="56" height="82" alt="{{ $release->getSeriesTitle() }}"
                                             style="display: block; width: 56px; height: 82px; object-fit: cover; border-radius: 2px; border: 1px solid {{ $theme['border'] }};" />
                                    @else
                                        <div style="width: 56px; height: 82px; background-color: {{ $theme['panel_bg'] }}; border-radius: 2px; border: 1px solid {{ $theme['border'] }};"></div>
                                    @endif
                                </td>

                                {{-- Info --}}
                                <td valign="middle" style="padding: 14px 8px;">
                                    {{-- Type badge --}}
                                    <p style="margin: 0 0 6px;">
                                        <span style="display: inline; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: {{ $accentColor }}; border: 1px solid {{ $accentColor }}; padding: 2px 6px; border-radius: 2px;">{{ $release->getType() === 'volume' ? 'Manga' : 'Coffret' }}</span>
                                    </p>
                                    {{-- Series title --}}
                                    <p style="margin: 0 0 3px; font-size: 14px; font-weight: 700; color: {{ $theme['fg_soft'] }}; line-height: 1.3;">{{ $release->getSeriesTitle() }}</p>
                                    {{-- Edition + volume number --}}
                                    <p style="margin: 0; font-size: 12px; color: {{ $theme['muted_soft'] }}; line-height: 1.4;">
                                        @if ($release->getEditionTitle())
                                            {{ $release->getEditionTitle() }}@if ($release->getNumber()) &nbsp;·&nbsp; Tome {{ $release->getNumber() }}@endif
                                        @elseif ($release->getNumber())
                                            Tome {{ $release->getNumber() }}
                                        @endif
                                        @if ($release->isLastVolume())
                                            &nbsp;<span style="color: {{ $accentColor }}; font-size: 10px; letter-spacing: 1px; text-transform: uppercase;">Dernier tome</span>
                                        @endif
                                    </p>
                                </td>

                                {{-- Date --}}
                                <td class="release-date-col" width="90" valign="middle" align="right" style="padding: 14px 14px 14px 8px;">
                                    <p style="margin: 0 0 3px; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: {{ $theme['muted_soft'] }};">Sortie</p>
                                    <p style="margin: 0; font-size: 16px; font-weight: 700; color: {{ $theme['fg_soft'] }}; line-height: 1.1;">
                                        {{ \Carbon\Carbon::parse($release->getReleaseDate())->locale('fr')->isoFormat('D') }}
                                    </p>
                                    <p style="margin: 0; font-size: 11px; color: {{ $theme['muted'] }}; text-transform: uppercase; letter-spacing: 1px;">
                                        {{ \Carbon\Carbon::parse($release->getReleaseDate())->locale('fr')->isoFormat('MMM') }}
                                    </p>
                                </td>
                            </tr>
                        </table>
                        @endforeach

                        {{-- Divider --}}
                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 28px;">
                            <tr>
                                <td style="height: 1px; background-color: {{ $theme['border_soft'] }};"></td>
                            </tr>
                        </table>

                        {{-- CTA --}}
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td align="center">
                                    <a href="{{ $appUrl }}/planning" class="cta-button"
                                       style="display: inline-block; padding: 14px 36px; background-color: {{ $accentColor }}; color: {{ $accentForeground }}; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; border-radius: 2px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                                        Voir mon planning
                                    </a>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                {{-- ── Footer ── --}}
                <tr>
                    <td align="center" style="padding: 28px 0 0;">
                        <p style="margin: 0 0 10px; font-size: 11px; color: {{ $theme['footer_fg'] }}; line-height: 1.6;">
                            Vous recevez cet email car vous avez activé les notifications de sorties sur Atsume.
                        </p>
                        <a href="{{ $unsubscribeUrl }}"
                           style="font-size: 11px; color: {{ $theme['footer_fg'] }}; text-decoration: underline; letter-spacing: 0.5px;">
                            Désactiver ces notifications
                        </a>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>
