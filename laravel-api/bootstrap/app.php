<?php

use App\Http\Middleware\ReadBearerTokenFromCookie;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Désactive le chiffrement pour le cookie auth_token afin que le middleware
        // puisse le lire directement sans dépendre de EncryptCookies (parfois absent ou tardif dans le cycle API)
        $middleware->encryptCookies(except: [
            'auth_token',
        ]);

        // Sanctum SPA cookie authentication — traite les requêtes du frontend
        // comme des requêtes stateful (session-based) si elles viennent d'un domaine stateful
        $middleware->statefulApi();

        // Lit le token Bearer depuis le cookie httpOnly `auth_token` dès le début
        // et l'injecte dans le header Authorization pour que Sanctum l'utilise
        $middleware->prependToGroup('api', ReadBearerTokenFromCookie::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
