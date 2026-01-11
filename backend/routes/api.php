<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

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

// ============================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ============================================

// Healthcheck
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'service' => 'Sistema Deportivo API'
    ]);
});

// Autenticación
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ============================================
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
// ============================================

Route::middleware('auth:sanctum')->group(function () {
    
    // ==========================================
    // AUTENTICACIÓN
    // ==========================================
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // ==========================================
    // PERFIL DE USUARIO (Cualquier usuario autenticado)
    // ==========================================
    Route::put('/perfil', [UsuarioController::class, 'actualizarPerfil']);
    
    // ==========================================
    // USUARIOS (Lectura para todos, escritura solo admin)
    // ==========================================
    // Rutas de lectura (cualquier usuario autenticado puede ver)
    Route::get('/usuarios', [UsuarioController::class, 'index']);
    Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);
    Route::get('/usuarios/rol/{idRol}', [UsuarioController::class, 'porRol']);
    Route::get('/usuarios/estado/{estado}', [UsuarioController::class, 'porEstado']);
    Route::post('/usuarios/buscar', [UsuarioController::class, 'buscar']);
    Route::get('/usuarios/estadisticas/general', [UsuarioController::class, 'estadisticas']);
    
    // ==========================================
    // RECURSOS GENERALES (Todos los usuarios autenticados)
    // ==========================================
    Route::apiResources([
        'inscripciones-curso' => InscripcionCursoController::class,
        'archivos' => ArchivoController::class,
        'jugador-clubes' => JugadorClubController::class,
        'lesiones' => LesionController::class,
        'estadisticas-jugador' => EstadisticaJugadorController::class,
    ]);

    // ==========================================
    // NOTIFICACIONES
    // ==========================================
    Route::apiResource('notificaciones', NotificacionController::class);
    Route::post('notificaciones/{id}/marcar-leida', [NotificacionController::class, 'marcarLeida']);
    Route::post('notificaciones/marcar-todas-leidas', [NotificacionController::class, 'marcarTodasLeidas']);
    Route::get('notificaciones-no-leidas', [NotificacionController::class, 'noLeidas']);

    // ==========================================
    // RUTAS ADMINISTRATIVAS (Solo Admin/Secretaria)
    // ==========================================
    Route::middleware('can:admin-o-secretaria')->group(function () {
        
        // Escritura de Usuarios (solo admin)
        Route::post('/usuarios', [UsuarioController::class, 'store']);
        Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);
        Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy']);
        Route::post('/usuarios/{id}/restore', [UsuarioController::class, 'restore']);
        
        // Otros recursos administrativos
        Route::apiResources([
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

// ============================================
// RUTA DE FALLBACK (404)
// ============================================
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'Ruta no encontrada. Verifica el endpoint.',
        'available_endpoints' => [
            'POST /api/register',
            'POST /api/login',
            'GET /api/me (requiere auth)',
            'GET /api/usuarios (requiere auth)',
        ]
    ], 404);
});