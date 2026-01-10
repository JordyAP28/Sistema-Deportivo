<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
*/

// Simple healthcheck for API
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

// Import controllers
use App\Http\Controllers\ActividadController;
use App\Http\Controllers\ArchivoController;
use App\Http\Controllers\AsistenciaController;
use App\Http\Controllers\CampeonatoController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\ClubCampeonatoController;
use App\Http\Controllers\ClubController;
use App\Http\Controllers\ConfiguracionController;
use App\Http\Controllers\CursoController;
use App\Http\Controllers\DeportistaController;
use App\Http\Controllers\DeportistaPosicionController;
use App\Http\Controllers\DetalleFacturaController;
use App\Http\Controllers\EscenarioController;
use App\Http\Controllers\EstadisticaJugadorController;
use App\Http\Controllers\FacturaController;
use App\Http\Controllers\InscripcionCursoController;
use App\Http\Controllers\JugadorClubController;
use App\Http\Controllers\LesionController;
use App\Http\Controllers\LogSistemaController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\PagoController;
use App\Http\Controllers\PartidoController;
use App\Http\Controllers\PermisoController;
use App\Http\Controllers\PosicionController;
use App\Http\Controllers\ProgramaActividadController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\RolPermisoController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\AuthController;

// Rutas públicas de autenticación
Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);

// Agrupar rutas API protegidas: requiere usuario autenticado por Sanctum
Route::middleware('auth:sanctum')->group(function () {
    // Perfil del usuario autenticado y logout
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    // Rutas generales para usuarios autenticados
    Route::apiResources([
        'inscripciones-curso' => InscripcionCursoController::class,
        'archivos' => ArchivoController::class,
        'jugador-clubes' => JugadorClubController::class,
        'lesiones' => LesionController::class,
        'estadisticas-jugador' => EstadisticaJugadorController::class,
    ]);

    // Notificaciones: propietarios y admin/secretaria pueden gestionarlas
    Route::apiResource('notificaciones', NotificacionController::class);
    Route::post('notificaciones/{id}/marcar-leida', [NotificacionController::class, 'marcarLeida']);
    Route::post('notificaciones/marcar-todas-leidas', [NotificacionController::class, 'marcarTodasLeidas']);
    Route::get('notificaciones-no-leidas', [NotificacionController::class, 'noLeidas']);

    // Rutas administrativas (admin o secretaria)
    Route::middleware('can:admin-o-secretaria')->group(function () {
        Route::apiResources([
            'usuarios' => UsuarioController::class,
            'roles' => RolController::class,
            'permisos' => PermisoController::class,
            'rol-permisos' => RolPermisoController::class,
            'configuraciones' => ConfiguracionController::class,
            'logs-sistema' => LogSistemaController::class,
            'categorias' => CategoriaController::class,
            'posiciones' => PosicionController::class,
            'deportista-posiciones' => DeportistaPosicionController::class,
            'clubes' => ClubController::class,
            'club-campeonatos' => ClubCampeonatoController::class,
            'escenarios' => EscenarioController::class,
            'actividades' => ActividadController::class,
            'programas-actividad' => ProgramaActividadController::class,
            'campeonatos' => CampeonatoController::class,
            'partidos' => PartidoController::class,
            'facturas' => FacturaController::class,
            'detalle-facturas' => DetalleFacturaController::class,
            'pagos' => PagoController::class,
            'cursos' => CursoController::class,
            'deportistas' => DeportistaController::class,
            'asistencias' => AsistenciaController::class,
        ]);
    });
});