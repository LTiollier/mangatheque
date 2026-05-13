@props(['primaryColor' => null, 'primaryForeground' => '#160403', 'themeColors' => null])

<x-mail::layout>
{{-- Per-user theme + palette overrides injected in <head> --}}
@if($themeColors || $primaryColor)
<x-slot:head>
<style>
@if($themeColors)
body,.wrapper,.body{background-color:{{ $themeColors['bg'] }}!important;color:{{ $themeColors['fg'] }}!important;}
.body{border-top-color:{{ $themeColors['bg'] }}!important;border-bottom-color:{{ $themeColors['bg'] }}!important;}
.inner-body{background-color:{{ $themeColors['card'] }}!important;border-color:{{ $themeColors['border'] }}!important;}
.header a{color:{{ $themeColors['fg'] }}!important;}
h1,h2,h3,h4,h5,h6,p,.inner-body p,.panel-content,.panel-content p{color:{{ $themeColors['fg'] }}!important;}
.subcopy{border-top-color:{{ $themeColors['border'] }}!important;}
.subcopy p{color:{{ $themeColors['muted'] }}!important;}
.footer p,.footer a{color:{{ $themeColors['footer_fg'] }}!important;}
.panel-content{background-color:{{ $themeColors['panel_bg'] }}!important;}
.panel-content p{color:{{ $themeColors['table_fg'] }}!important;}
.table th{color:{{ $themeColors['fg'] }}!important;border-bottom-color:{{ $themeColors['border'] }}!important;}
.table td{color:{{ $themeColors['table_fg'] }}!important;}
@endif
@if($primaryColor)
a:not(.button){color:{{ $primaryColor }}!important;}
.button-blue,.button-primary{background-color:{{ $primaryColor }}!important;border-bottom-color:{{ $primaryColor }}!important;border-left-color:{{ $primaryColor }}!important;border-right-color:{{ $primaryColor }}!important;border-top-color:{{ $primaryColor }}!important;color:{{ $primaryForeground }}!important;}
.panel{border-left-color:{{ $primaryColor }}!important;}
@endif
</style>
</x-slot:head>
@endif

{{-- Header --}}
<x-slot:header>
<x-mail::header :url="config('app.url')">
{{ config('app.name') }}
</x-mail::header>
</x-slot:header>

{{-- Body --}}
{!! $slot !!}

{{-- Subcopy --}}
@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{!! $subcopy !!}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

{{-- Footer --}}
<x-slot:footer>
<x-mail::footer>
© {{ date('Y') }} {{ config('app.name') }}. @lang('All rights reserved.')
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
