<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// La route GET /sanctum/csrf-cookie est enregistrée automatiquement par
// Laravel\Sanctum\SanctumServiceProvider — initialisée côté client avant le login SPA.
