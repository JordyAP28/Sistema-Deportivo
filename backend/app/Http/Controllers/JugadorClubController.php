<?php

namespace App\Http\Controllers;

use App\Models\JugadorClub;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class JugadorClubController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $jugadorClubes = JugadorClub::with(['deportista.usuario', 'club'])->get();
            return response()->json([
                'success' => true,
                'data' => $jugadorClubes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las relaciones jugador-club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'id_club' => 'required|exists:clubes,id_club',
            'fecha_ingreso' => 'required|date',
            'fecha_salida' => 'nullable|date|after:fecha_ingreso',
            'estado' => 'required|in:activo,inactivo,transferido,retirado',
            'numero_camiseta' => 'nullable|integer|min:1|max:99',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si ya existe una relación activa para este deportista en cualquier club
            if ($request->estado === 'activo') {
                $relacionActiva = JugadorClub::where('id_deportista', $request->id_deportista)
                    ->where('estado', 'activo')
                    ->exists();

                if ($relacionActiva) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El deportista ya tiene una relación activa con otro club'
                    ], 409);
                }
            }

            $jugadorClub = JugadorClub::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Relación jugador-club creada exitosamente',
                'data' => $jugadorClub->load(['deportista.usuario', 'club'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la relación jugador-club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $jugadorClub = JugadorClub::with(['deportista.usuario', 'deportista.categoria', 'deportista.posiciones', 'club'])->find($id);
            
            if (!$jugadorClub) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación jugador-club no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $jugadorClub
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la relación jugador-club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'id_deportista' => 'exists:deportistas,id_deportista',
            'id_club' => 'exists:clubes,id_club',
            'fecha_ingreso' => 'date',
            'fecha_salida' => 'nullable|date|after:fecha_ingreso',
            'estado' => 'in:activo,inactivo,transferido,retirado',
            'numero_camiseta' => 'nullable|integer|min:1|max:99',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $jugadorClub = JugadorClub::find($id);
            
            if (!$jugadorClub) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación jugador-club no encontrada'
                ], 404);
            }

            // Si se va a cambiar a activo, verificar que no haya otra relación activa para el mismo deportista
            if ($request->has('estado') && $request->estado === 'activo' && $jugadorClub->estado !== 'activo') {
                $relacionActiva = JugadorClub::where('id_deportista', $jugadorClub->id_deportista)
                    ->where('estado', 'activo')
                    ->where('id_jugador_club', '!=', $id)
                    ->exists();

                if ($relacionActiva) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El deportista ya tiene una relación activa con otro club'
                    ], 409);
                }
            }

            $jugadorClub->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Relación jugador-club actualizada exitosamente',
                'data' => $jugadorClub->load(['deportista.usuario', 'club'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la relación jugador-club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $jugadorClub = JugadorClub::find($id);
            
            if (!$jugadorClub) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación jugador-club no encontrada'
                ], 404);
            }

            $jugadorClub->delete();

            return response()->json([
                'success' => true,
                'message' => 'Relación jugador-club eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la relación jugador-club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar una relación jugador-club eliminada.
     */
    public function restore(string $id)
    {
        try {
            $jugadorClub = JugadorClub::withTrashed()->find($id);
            
            if (!$jugadorClub) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación jugador-club no encontrada'
                ], 404);
            }

            if (!$jugadorClub->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La relación jugador-club no está eliminada'
                ], 400);
            }

            $jugadorClub->restore();

            return response()->json([
                'success' => true,
                'message' => 'Relación jugador-club restaurada exitosamente',
                'data' => $jugadorClub
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar la relación jugador-club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener relaciones por deportista.
     */
    public function porDeportista(string $idDeportista)
    {
        try {
            $jugadorClubes = JugadorClub::where('id_deportista', $idDeportista)
                ->with(['deportista.usuario', 'club'])
                ->orderBy('fecha_ingreso', 'desc')
                ->get();

            if ($jugadorClubes->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron relaciones para el deportista especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $jugadorClubes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener relaciones por deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener relaciones por club.
     */
    public function porClub(string $idClub)
    {
        try {
            $jugadorClubes = JugadorClub::where('id_club', $idClub)
                ->with(['deportista.usuario', 'deportista.categoria', 'deportista.posiciones'])
                ->orderBy('estado')
                ->orderBy('fecha_ingreso', 'desc')
                ->get();

            if ($jugadorClubes->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron relaciones para el club especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $jugadorClubes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener relaciones por club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener jugadores activos por club.
     */
    public function activosPorClub(string $idClub)
    {
        try {
            $jugadorClubes = JugadorClub::where('id_club', $idClub)
                ->where('estado', 'activo')
                ->with(['deportista.usuario', 'deportista.categoria', 'deportista.posiciones'])
                ->orderBy('numero_camiseta')
                ->get();

            if ($jugadorClubes->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron jugadores activos para el club especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $jugadorClubes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener jugadores activos por club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener historial de clubes de un deportista.
     */
    public function historialDeportista(string $idDeportista)
    {
        try {
            $historial = JugadorClub::where('id_deportista', $idDeportista)
                ->with(['club'])
                ->orderBy('fecha_ingreso', 'desc')
                ->get();

            if ($historial->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró historial para el deportista especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $historial
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener historial del deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar relaciones jugador-club.
     */
    public function buscar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'busqueda' => 'required|string|min:2'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $busqueda = $request->busqueda;
            
            $jugadorClubes = JugadorClub::whereHas('deportista', function($query) use ($busqueda) {
                    $query->where('nombres', 'like', "%{$busqueda}%")
                          ->orWhere('apellidos', 'like', "%{$busqueda}%")
                          ->orWhere('numero_documento', 'like', "%{$busqueda}%");
                })
                ->orWhereHas('club', function($query) use ($busqueda) {
                    $query->where('nombre', 'like', "%{$busqueda}%");
                })
                ->with(['deportista.usuario', 'club'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $jugadorClubes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar relaciones jugador-club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de jugadores por club.
     */
    public function estadisticasPorClub(string $idClub)
    {
        try {
            $totalJugadores = JugadorClub::where('id_club', $idClub)->count();
            $activos = JugadorClub::where('id_club', $idClub)->where('estado', 'activo')->count();
            $inactivos = JugadorClub::where('id_club', $idClub)->where('estado', 'inactivo')->count();
            $transferidos = JugadorClub::where('id_club', $idClub)->where('estado', 'transferido')->count();
            $retirados = JugadorClub::where('id_club', $idClub)->where('estado', 'retirado')->count();
            
            $jugadoresRecientes = JugadorClub::where('id_club', $idClub)
                ->where('estado', 'activo')
                ->orderBy('fecha_ingreso', 'desc')
                ->limit(5)
                ->with(['deportista.usuario'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_jugadores' => $totalJugadores,
                    'activos' => $activos,
                    'inactivos' => $inactivos,
                    'transferidos' => $transferidos,
                    'retirados' => $retirados,
                    'jugadores_recientes' => $jugadoresRecientes
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }
}