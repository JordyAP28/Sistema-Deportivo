<?php

namespace App\Http\Controllers;

use App\Models\ClubCampeonato;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class ClubCampeonatoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $clubCampeonatos = ClubCampeonato::with(['club', 'campeonato'])->get();
            return response()->json([
                'success' => true,
                'data' => $clubCampeonatos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las relaciones club-campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_club' => 'required|exists:clubes,id_club',
            'id_campeonato' => 'required|exists:campeonatos,id_campeonato',
            'fecha_inscripcion' => 'required|date',
            'estado' => 'required|in:inscrito,activo,descalificado,retirado',
            'puntos' => 'integer|min:0',
            'partidos_jugados' => 'integer|min:0',
            'partidos_ganados' => 'integer|min:0',
            'partidos_empatados' => 'integer|min:0',
            'partidos_perdidos' => 'integer|min:0',
            'goles_favor' => 'integer|min:0',
            'goles_contra' => 'integer|min:0',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si ya existe la relación
            $existente = ClubCampeonato::where('id_club', $request->id_club)
                ->where('id_campeonato', $request->id_campeonato)
                ->first();

            if ($existente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta relación club-campeonato ya existe'
                ], 409);
            }

            $clubCampeonato = ClubCampeonato::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Relación club-campeonato creada exitosamente',
                'data' => $clubCampeonato->load(['club', 'campeonato'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la relación club-campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $clubCampeonato = ClubCampeonato::with(['club', 'campeonato'])->find($id);
            
            if (!$clubCampeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación club-campeonato no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $clubCampeonato
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la relación club-campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'id_club' => 'exists:clubes,id_club',
            'id_campeonato' => 'exists:campeonatos,id_campeonato',
            'fecha_inscripcion' => 'date',
            'estado' => 'in:inscrito,activo,descalificado,retirado',
            'puntos' => 'integer|min:0',
            'partidos_jugados' => 'integer|min:0',
            'partidos_ganados' => 'integer|min:0',
            'partidos_empatados' => 'integer|min:0',
            'partidos_perdidos' => 'integer|min:0',
            'goles_favor' => 'integer|min:0',
            'goles_contra' => 'integer|min:0',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $clubCampeonato = ClubCampeonato::find($id);
            
            if (!$clubCampeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación club-campeonato no encontrada'
                ], 404);
            }

            // Verificar si la nueva combinación ya existe (si se están cambiando ambos)
            if ($request->has('id_club') && $request->has('id_campeonato')) {
                $existente = ClubCampeonato::where('id_club', $request->id_club)
                    ->where('id_campeonato', $request->id_campeonato)
                    ->where('id_club_campeonato', '!=', $id)
                    ->first();

                if ($existente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Esta relación club-campeonato ya existe'
                    ], 409);
                }
            }

            $clubCampeonato->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Relación club-campeonato actualizada exitosamente',
                'data' => $clubCampeonato->load(['club', 'campeonato'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la relación club-campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $clubCampeonato = ClubCampeonato::find($id);
            
            if (!$clubCampeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación club-campeonato no encontrada'
                ], 404);
            }

            $clubCampeonato->delete();

            return response()->json([
                'success' => true,
                'message' => 'Relación club-campeonato eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la relación club-campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar una relación club-campeonato eliminada.
     */
    public function restore(string $id)
    {
        try {
            $clubCampeonato = ClubCampeonato::withTrashed()->find($id);
            
            if (!$clubCampeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación club-campeonato no encontrada'
                ], 404);
            }

            if (!$clubCampeonato->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La relación club-campeonato no está eliminada'
                ], 400);
            }

            $clubCampeonato->restore();

            return response()->json([
                'success' => true,
                'message' => 'Relación club-campeonato restaurada exitosamente',
                'data' => $clubCampeonato
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar la relación club-campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener relaciones por club.
     */
    public function porClub(string $idClub)
    {
        try {
            $clubCampeonatos = ClubCampeonato::where('id_club', $idClub)
                ->with(['club', 'campeonato'])
                ->orderBy('fecha_inscripcion', 'desc')
                ->get();

            if ($clubCampeonatos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron relaciones para el club especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $clubCampeonatos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener relaciones por club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener relaciones por campeonato.
     */
    public function porCampeonato(string $idCampeonato)
    {
        try {
            $clubCampeonatos = ClubCampeonato::where('id_campeonato', $idCampeonato)
                ->with(['club', 'campeonato'])
                ->orderBy('puntos', 'desc')
                ->orderBy('goles_favor', 'desc')
                ->get();

            if ($clubCampeonatos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron relaciones para el campeonato especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $clubCampeonatos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener relaciones por campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar estadísticas de un club en un campeonato.
     */
    public function actualizarEstadisticas(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'puntos' => 'integer|min:0',
            'partidos_jugados' => 'integer|min:0',
            'partidos_ganados' => 'integer|min:0',
            'partidos_empatados' => 'integer|min:0',
            'partidos_perdidos' => 'integer|min:0',
            'goles_favor' => 'integer|min:0',
            'goles_contra' => 'integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $clubCampeonato = ClubCampeonato::find($id);
            
            if (!$clubCampeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación club-campeonato no encontrada'
                ], 404);
            }

            $clubCampeonato->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Estadísticas actualizadas exitosamente',
                'data' => $clubCampeonato->load(['club', 'campeonato'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener clubes activos en un campeonato.
     */
    public function clubesActivos(string $idCampeonato)
    {
        try {
            $clubCampeonatos = ClubCampeonato::where('id_campeonato', $idCampeonato)
                ->where('estado', 'activo')
                ->with(['club'])
                ->orderBy('puntos', 'desc')
                ->get();

            if ($clubCampeonatos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron clubes activos en el campeonato especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $clubCampeonatos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener clubes activos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar estado de un club en un campeonato.
     */
    public function cambiarEstado(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'required|in:inscrito,activo,descalificado,retirado',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $clubCampeonato = ClubCampeonato::find($id);
            
            if (!$clubCampeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación club-campeonato no encontrada'
                ], 404);
            }

            $clubCampeonato->update([
                'estado' => $request->estado,
                'observaciones' => $request->observaciones ?? $clubCampeonato->observaciones
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado actualizado exitosamente',
                'data' => $clubCampeonato->load(['club', 'campeonato'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar relaciones club-campeonato.
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
            
            $clubCampeonatos = ClubCampeonato::whereHas('club', function($query) use ($busqueda) {
                    $query->where('nombre', 'like', "%{$busqueda}%");
                })
                ->orWhereHas('campeonato', function($query) use ($busqueda) {
                    $query->where('nombre', 'like', "%{$busqueda}%");
                })
                ->orWhere('estado', 'like', "%{$busqueda}%")
                ->with(['club', 'campeonato'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $clubCampeonatos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar relaciones club-campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de rendimiento.
     */
    public function estadisticasRendimiento(string $idClub, string $idCampeonato)
    {
        try {
            $clubCampeonato = ClubCampeonato::where('id_club', $idClub)
                ->where('id_campeonato', $idCampeonato)
                ->with(['club', 'campeonato'])
                ->first();
            
            if (!$clubCampeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontró la relación club-campeonato'
                ], 404);
            }

            // Calcular porcentajes
            $porcentajeVictorias = $clubCampeonato->partidos_jugados > 0 
                ? ($clubCampeonato->partidos_ganados / $clubCampeonato->partidos_jugados) * 100 
                : 0;
            
            $porcentajeEmpates = $clubCampeonato->partidos_jugados > 0 
                ? ($clubCampeonato->partidos_empatados / $clubCampeonato->partidos_jugados) * 100 
                : 0;
            
            $porcentajeDerrotas = $clubCampeonato->partidos_jugados > 0 
                ? ($clubCampeonato->partidos_perdidos / $clubCampeonato->partidos_jugados) * 100 
                : 0;

            $estadisticas = [
                'club' => $clubCampeonato->club->nombre,
                'campeonato' => $clubCampeonato->campeonato->nombre,
                'puntos' => $clubCampeonato->puntos,
                'partidos_jugados' => $clubCampeonato->partidos_jugados,
                'partidos_ganados' => $clubCampeonato->partidos_ganados,
                'partidos_empatados' => $clubCampeonato->partidos_empatados,
                'partidos_perdidos' => $clubCampeonato->partidos_perdidos,
                'goles_favor' => $clubCampeonato->goles_favor,
                'goles_contra' => $clubCampeonato->goles_contra,
                'diferencia_goles' => $clubCampeonato->goles_favor - $clubCampeonato->goles_contra,
                'porcentaje_victorias' => round($porcentajeVictorias, 2),
                'porcentaje_empates' => round($porcentajeEmpates, 2),
                'porcentaje_derrotas' => round($porcentajeDerrotas, 2),
                'estado' => $clubCampeonato->estado
            ];

            return response()->json([
                'success' => true,
                'data' => $estadisticas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas de rendimiento: ' . $e->getMessage()
            ], 500);
        }
    }
}