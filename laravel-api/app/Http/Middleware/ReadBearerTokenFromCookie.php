<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lit le token Sanctum depuis le cookie httpOnly `auth_token`
 * et l'injecte comme header `Authorization: Bearer` si absent.
 *
 * Cela permet à Sanctum (`auth:sanctum`) de continuer à fonctionner
 * sans changement, tout en n'exposant plus le token à JavaScript.
 */
class ReadBearerTokenFromCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->bearerToken() && $request->hasCookie('auth_token')) {
            /** @var string $token */
            $token = $request->cookie('auth_token');
            $request->headers->set('Authorization', 'Bearer ' . $token);
        }

        return $next($request);
    }
}

