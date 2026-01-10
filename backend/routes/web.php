<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Simple healthcheck for web
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// Example dashboard route placeholder (requiere sesión web)
// Redirección al login para usuarios no autenticados (el middleware 'auth' redirige a route('login'))
Route::get('/login', function () {
    // En el futuro servir una vista blade de login o redirigir al frontend React
    return redirect('/'); // placeholder, ajusta a la ruta del frontend de login si aplica
})->name('login');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return view('welcome'); // replace with actual dashboard when ready
    })->name('dashboard');

    // Zona restringida para admin y secretaria usando Gates
    Route::middleware('can:admin-o-secretaria')->group(function () {
        // Ejemplo: rutas de administración del panel
        // Route::get('/admin/usuarios', [App\Http\Controllers\UsuarioController::class, 'index'])->name('admin.usuarios');
    });
});

// Fallback to welcome for non-API front-end routes
Route::fallback(function () {
    return view('welcome');
});
