<?php

namespace App\Http\Controllers;

use App\Models\ProgramaActividad;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class ProgramaActividadController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $programaActividades = ProgramaActividad::with(['escenario', 'actividad'])->get();
            return response()->json([
                'success' => true,
                'data' => $programaActividades
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las programaciones de actividades: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_escenario' => 'required|exists:escenarios,id_escenario',
            'id_actividad' => 'required|exists:actividades,id_actividad',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si ya existe la programación
            $existente = ProgramaActividad::where('id_escenario', $request->id_escenario)
                ->where('id_actividad', $request->id_actividad)
                ->first();

            if ($existente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta actividad ya está programada en este escenario'
                ], 409);
            }

            // Verificar disponibilidad del escenario para la fecha y hora de la actividad
            $actividad = \App\Models\Actividad::find($request->id_actividad);
            $escenario = \App\Models\Escenario::find($request->id_escenario);
            
            // Verificar si el escenario está disponible
            if ($escenario->estado !== 'disponible') {
                return response()->json([
                    'success' => false,
                    'message' => 'El escenario no está disponible. Estado actual: ' . $escenario->estado
                ], 400);
            }

            // Verificar conflictos de horario
            $conflictos = ProgramaActividad::where('id_escenario', $request->id_escenario)
                ->whereHas('actividad', function($query) use ($actividad) {
                    $query->where('fecha', $actividad->fecha)
                          ->where(function($q) use ($actividad) {
                              $q->whereBetween('hora_inicio', [$actividad->hora_inicio, $actividad->hora_fin])
                                ->orWhereBetween('hora_fin', [$actividad->hora_inicio, $actividad->hora_fin])
                                ->orWhere(function($sub) use ($actividad) {
                                    $sub->where('hora_inicio', '<=', $actividad->hora_inicio)
                                        ->where('hora_fin', '>=', $actividad->hora_fin);
                                });
                          })
                          ->where('estado', '!=', 'cancelado');
                })
                ->exists();

            if ($conflictos) {
                return response()->json([
                    'success' => false,
                    'message' => 'El escenario ya tiene actividades programadas en ese horario'
                ], 409);
            }

            $programaActividad = ProgramaActividad::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Actividad programada exitosamente',
                'data' => $programaActividad->load(['escenario', 'actividad'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al programar la actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $programaActividad = ProgramaActividad::with(['escenario', 'actividad'])->find($id);
            
            if (!$programaActividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Programación de actividad no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $programaActividad
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la programación de actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'id_escenario' => 'exists:escenarios,id_escenario',
            'id_actividad' => 'exists:actividades,id_actividad',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $programaActividad = ProgramaActividad::find($id);
            
            if (!$programaActividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Programación de actividad no encontrada'
                ], 404);
            }

            // Si se cambia el escenario o la actividad, verificar disponibilidad
            if (($request->has('id_escenario') && $request->id_escenario != $programaActividad->id_escenario) ||
                ($request->has('id_actividad') && $request->id_actividad != $programaActividad->id_actividad)) {
                
                $idEscenario = $request->id_escenario ?? $programaActividad->id_escenario;
                $idActividad = $request->id_actividad ?? $programaActividad->id_actividad;
                
                // Verificar si ya existe la nueva combinación
                $existente = ProgramaActividad::where('id_escenario', $idEscenario)
                    ->where('id_actividad', $idActividad)
                    ->where('id_programa', '!=', $id)
                    ->first();

                if ($existente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Esta actividad ya está programada en este escenario'
                    ], 409);
                }

                // Verificar disponibilidad del escenario
                $escenario = \App\Models\Escenario::find($idEscenario);
                if ($escenario->estado !== 'disponible') {
                    return response()->json([
                        'success' => false,
                        'message' => 'El escenario no está disponible. Estado actual: ' . $escenario->estado
                    ], 400);
                }

                // Verificar conflictos de horario
                $actividad = \App\Models\Actividad::find($idActividad);
                $conflictos = ProgramaActividad::where('id_escenario', $idEscenario)
                    ->where('id_programa', '!=', $id)
                    ->whereHas('actividad', function($query) use ($actividad) {
                        $query->where('fecha', $actividad->fecha)
                              ->where(function($q) use ($actividad) {
                                  $q->whereBetween('hora_inicio', [$actividad->hora_inicio, $actividad->hora_fin])
                                    ->orWhereBetween('hora_fin', [$actividad->hora_inicio, $actividad->hora_fin])
                                    ->orWhere(function($sub) use ($actividad) {
                                        $sub->where('hora_inicio', '<=', $actividad->hora_inicio)
                                            ->where('hora_fin', '>=', $actividad->hora_fin);
                                    });
                              })
                              ->where('estado', '!=', 'cancelado');
                    })
                    ->exists();

                if ($conflictos) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El escenario ya tiene actividades programadas en ese horario'
                    ], 409);
                }
            }

            $programaActividad->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Programación de actividad actualizada exitosamente',
                'data' => $programaActividad->load(['escenario', 'actividad'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la programación de actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $programaActividad = ProgramaActividad::find($id);
            
            if (!$programaActividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Programación de actividad no encontrada'
                ], 404);
            }

            $programaActividad->delete();

            return response()->json([
                'success' => true,
                'message' => 'Programación de actividad eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la programación de actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar una programación de actividad eliminada.
     */
    public function restore(string $id)
    {
        try {
            $programaActividad = ProgramaActividad::withTrashed()->find($id);
            
            if (!$programaActividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Programación de actividad no encontrada'
                ], 404);
            }

            if (!$programaActividad->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La programación de actividad no está eliminada'
                ], 400);
            }

            $programaActividad->restore();

            return response()->json([
                'success' => true,
                'message' => 'Programación de actividad restaurada exitosamente',
                'data' => $programaActividad
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar la programación de actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener programaciones por escenario.
     */
    public function porEscenario(string $idEscenario)
    {
        try {
            $programaActividades = ProgramaActividad::where('id_escenario', $idEscenario)
                ->with(['escenario', 'actividad'])
                ->orderBy('created_at', 'desc')
                ->get();

            if ($programaActividades->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron programaciones para el escenario especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $programaActividades
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener programaciones por escenario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener programaciones por actividad.
     */
    public function porActividad(string $idActividad)
    {
        try {
            $programaActividades = ProgramaActividad::where('id_actividad', $idActividad)
                ->with(['escenario', 'actividad'])
                ->orderBy('created_at', 'desc')
                ->get();

            if ($programaActividades->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron programaciones para la actividad especificada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $programaActividades
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener programaciones por actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener programaciones por rango de fechas.
     */
    public function porRangoFechas(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $programaActividades = ProgramaActividad::whereHas('actividad', function($query) use ($request) {
                    $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
                })
                ->with(['escenario', 'actividad'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $programaActividades
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener programaciones por rango de fechas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar programaciones de actividades.
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
            
            $programaActividades = ProgramaActividad::whereHas('escenario', function($query) use ($busqueda) {
                    $query->where('nombre', 'like', "%{$busqueda}%");
                })
                ->orWhereHas('actividad', function($query) use ($busqueda) {
                    $query->where('nombre_actividad', 'like', "%{$busqueda}%")
                          ->orWhere('descripcion', 'like', "%{$busqueda}%");
                })
                ->orWhere('observaciones', 'like', "%{$busqueda}%")
                ->with(['escenario', 'actividad'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $programaActividades
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar programaciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener programaciones del día actual.
     */
public function programacionHoy()
{
        try {
            $hoy = now()->format('Y-m-d');
            
            $programaActividades = ProgramaActividad::whereHas('actividad', function($query) use ($hoy) {
                    $query->where('fecha', $hoy)
                          ->where('estado', '!=', 'cancelado');
                })
                ->with(['escenario', 'actividad'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'fecha' => $hoy,
                    'programaciones' => $programaActividades
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener programaciones del día: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar disponibilidad de escenario para una actividad.
     */
    public function verificarDisponibilidad(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_escenario' => 'required|exists:escenarios,id_escenario',
            'id_actividad' => 'required|exists:actividades,id_actividad'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $actividad = \App\Models\Actividad::find($request->id_actividad);
            $escenario = \App\Models\Escenario::find($request->id_escenario);
            
            // Verificar estado del escenario
            if ($escenario->estado !== 'disponible') {
                return response()->json([
                    'success' => false,
                    'message' => 'El escenario no está disponible. Estado actual: ' . $escenario->estado
                ], 400);
            }

            // Verificar conflictos de horario
            $conflictos = ProgramaActividad::where('id_escenario', $request->id_escenario)
                ->whereHas('actividad', function($query) use ($actividad) {
                    $query->where('fecha', $actividad->fecha)
                          ->where(function($q) use ($actividad) {
                              $q->whereBetween('hora_inicio', [$actividad->hora_inicio, $actividad->hora_fin])
                                ->orWhereBetween('hora_fin', [$actividad->hora_inicio, $actividad->hora_fin])
                                ->orWhere(function($sub) use ($actividad) {
                                    $sub->where('hora_inicio', '<=', $actividad->hora_inicio)
                                        ->where('hora_fin', '>=', $actividad->hora_fin);
                                });
                          })
                          ->where('estado', '!=', 'cancelado');
                })
                ->exists();

            $disponible = !$conflictos;

            return response()->json([
                'success' => true,
                'data' => [
                    'escenario' => $escenario->nombre,
                    'actividad' => $actividad->nombre_actividad,
                    'fecha' => $actividad->fecha,
                    'hora_inicio' => $actividad->hora_inicio,
                    'hora_fin' => $actividad->hora_fin,
                    'disponible' => $disponible,
                    'conflictos' => $conflictos,
                    'mensaje' => $disponible 
                        ? 'El escenario está disponible para la actividad' 
                        : 'El escenario tiene conflictos de horario'
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar disponibilidad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de programación.
     */
    public function estadisticas()
    {
        try {
            $total = ProgramaActividad::count();
            
            $programacionesPorEscenario = ProgramaActividad::selectRaw('id_escenario, COUNT(*) as total')
                ->groupBy('id_escenario')
                ->with('escenario')
                ->get();
            
            $programacionesPorTipo = ProgramaActividad::selectRaw('actividades.tipo, COUNT(*) as total')
                ->join('actividades', 'programa_actividades.id_actividad', '=', 'actividades.id_actividad')
                ->groupBy('actividades.tipo')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_programaciones' => $total,
                    'programaciones_por_escenario' => $programacionesPorEscenario,
                    'programaciones_por_tipo' => $programacionesPorTipo
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