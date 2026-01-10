<?php

namespace App\Http\Controllers;

use App\Models\Actividad;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class ActividadController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $actividades = Actividad::with(['escenariosProgramados.escenario', 'asistencias.deportista'])->get();
            return response()->json([
                'success' => true,
                'data' => $actividades
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las actividades: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre_actividad' => 'required|string|max:200',
            'descripcion' => 'nullable|string',
            'fecha' => 'required|date',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio',
            'tipo' => 'required|in:entrenamiento,partido,clase,evento,reunion',
            'estado' => 'nullable|in:planificado,confirmado,en_curso,finalizado,cancelado',
            'cupo_maximo' => 'nullable|integer|min:1',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $actividad = Actividad::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Actividad creada exitosamente',
                'data' => $actividad
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $actividad = Actividad::with([
                'escenariosProgramados.escenario',
                'asistencias.deportista.usuario',
                'asistencias.deportista.categoria'
            ])->find($id);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $actividad
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre_actividad' => 'string|max:200',
            'descripcion' => 'nullable|string',
            'fecha' => 'date',
            'hora_inicio' => 'date_format:H:i',
            'hora_fin' => 'date_format:H:i|after:hora_inicio',
            'tipo' => 'in:entrenamiento,partido,clase,evento,reunion',
            'estado' => 'in:planificado,confirmado,en_curso,finalizado,cancelado',
            'cupo_maximo' => 'nullable|integer|min:1',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $actividad = Actividad::find($id);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada'
                ], 404);
            }

            $actividad->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Actividad actualizada exitosamente',
                'data' => $actividad
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $actividad = Actividad::find($id);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada'
                ], 404);
            }

            // Verificar si hay asistencias o escenarios programados asociados
            if ($actividad->asistencias()->count() > 0 ||
                $actividad->escenariosProgramados()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar la actividad porque tiene asistencias o escenarios programados asociados'
                ], 400);
            }

            $actividad->delete();

            return response()->json([
                'success' => true,
                'message' => 'Actividad eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar una actividad eliminada.
     */
    public function restore(string $id)
    {
        try {
            $actividad = Actividad::withTrashed()->find($id);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada'
                ], 404);
            }

            if (!$actividad->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La actividad no está eliminada'
                ], 400);
            }

            $actividad->restore();

            return response()->json([
                'success' => true,
                'message' => 'Actividad restaurada exitosamente',
                'data' => $actividad
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar la actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener actividades por tipo.
     */
    public function porTipo(string $tipo)
    {
        try {
            $actividades = Actividad::where('tipo', $tipo)
                ->where('estado', '!=', 'cancelado')
                ->with(['escenariosProgramados.escenario', 'asistencias'])
                ->orderBy('fecha', 'asc')
                ->orderBy('hora_inicio', 'asc')
                ->get();

            if ($actividades->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron actividades del tipo especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $actividades
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener actividades por tipo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener actividades por estado.
     */
    public function porEstado(string $estado)
    {
        try {
            $actividades = Actividad::where('estado', $estado)
                ->with(['escenariosProgramados.escenario', 'asistencias'])
                ->orderBy('fecha', 'asc')
                ->orderBy('hora_inicio', 'asc')
                ->get();

            if ($actividades->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron actividades con el estado especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $actividades
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener actividades por estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener actividades por rango de fechas.
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
            $actividades = Actividad::whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin])
                ->with(['escenariosProgramados.escenario', 'asistencias'])
                ->orderBy('fecha', 'asc')
                ->orderBy('hora_inicio', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $actividades
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener actividades por rango de fechas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener asistencias de una actividad.
     */
    public function asistencias(string $id)
    {
        try {
            $actividad = Actividad::with(['asistencias.deportista.usuario', 'asistencias.deportista.categoria'])->find($id);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'actividad' => $actividad->nombre_actividad,
                    'asistencias' => $actividad->asistencias
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener asistencias de la actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener escenarios programados para una actividad.
     */
    public function escenarios(string $id)
    {
        try {
            $actividad = Actividad::with(['escenariosProgramados.escenario'])->find($id);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'actividad' => $actividad->nombre_actividad,
                    'escenarios' => $actividad->escenariosProgramados
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener escenarios de la actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar actividades.
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
            
            $actividades = Actividad::where('nombre_actividad', 'like', "%{$busqueda}%")
                ->orWhere('descripcion', 'like', "%{$busqueda}%")
                ->orWhere('observaciones', 'like', "%{$busqueda}%")
                ->with(['escenariosProgramados.escenario', 'asistencias'])
                ->orderBy('fecha', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $actividades
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar actividades: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar estado de una actividad.
     */
    public function cambiarEstado(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'required|in:planificado,confirmado,en_curso,finalizado,cancelado'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $actividad = Actividad::find($id);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada'
                ], 404);
            }

            $actividad->update(['estado' => $request->estado]);

            return response()->json([
                'success' => true,
                'message' => 'Estado de la actividad actualizado exitosamente',
                'data' => $actividad
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar estado de la actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar disponibilidad de cupos.
     */
    public function verificarCupos(string $id)
    {
        try {
            $actividad = Actividad::withCount('asistencias')->find($id);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada'
                ], 404);
            }

            $cupos = [
                'actividad' => $actividad->nombre_actividad,
                'cupo_maximo' => $actividad->cupo_maximo,
                'inscritos_actuales' => $actividad->asistencias_count,
                'cupos_disponibles' => $actividad->cupo_maximo ? 
                    $actividad->cupo_maximo - $actividad->asistencias_count : 
                    null,
                'disponible' => $actividad->cupo_maximo ? 
                    $actividad->asistencias_count < $actividad->cupo_maximo : 
                    true,
                'porcentaje_ocupacion' => $actividad->cupo_maximo ? 
                    round(($actividad->asistencias_count / $actividad->cupo_maximo) * 100, 2) : 
                    0
            ];

            return response()->json([
                'success' => true,
                'data' => $cupos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar cupos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de actividades.
     */
    public function estadisticas(Request $request)
    {
        try {
            $fechaInicio = $request->fecha_inicio ?? now()->subMonth();
            $fechaFin = $request->fecha_fin ?? now();

            $total = Actividad::whereBetween('fecha', [$fechaInicio, $fechaFin])->count();
            $planificadas = Actividad::whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->where('estado', 'planificado')->count();
            $confirmadas = Actividad::whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->where('estado', 'confirmado')->count();
            $enCurso = Actividad::whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->where('estado', 'en_curso')->count();
            $finalizadas = Actividad::whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->where('estado', 'finalizado')->count();
            $canceladas = Actividad::whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->where('estado', 'cancelado')->count();
            
            $porTipo = Actividad::selectRaw('tipo, COUNT(*) as total')
                ->whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->groupBy('tipo')
                ->get();

            $promedioAsistencia = Actividad::whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->withCount('asistencias')
                ->get()
                ->avg('asistencias_count');

            return response()->json([
                'success' => true,
                'data' => [
                    'periodo' => [
                        'fecha_inicio' => $fechaInicio,
                        'fecha_fin' => $fechaFin
                    ],
                    'total' => $total,
                    'planificadas' => $planificadas,
                    'confirmadas' => $confirmadas,
                    'en_curso' => $enCurso,
                    'finalizadas' => $finalizadas,
                    'canceladas' => $canceladas,
                    'por_tipo' => $porTipo,
                    'promedio_asistencia' => round($promedioAsistencia, 2)
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener calendario de actividades.
     */
    public function calendario(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mes' => 'required|integer|min:1|max:12',
            'anio' => 'required|integer|min:2000|max:2100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $fechaInicio = "{$request->anio}-{$request->mes}-01";
            $fechaFin = date('Y-m-t', strtotime($fechaInicio));

            $actividades = Actividad::whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->where('estado', '!=', 'cancelado')
                ->with(['escenariosProgramados.escenario'])
                ->orderBy('fecha', 'asc')
                ->orderBy('hora_inicio', 'asc')
                ->get()
                ->groupBy('fecha');

            $calendario = [];
            foreach ($actividades as $fecha => $actividadesDia) {
                $calendario[] = [
                    'fecha' => $fecha,
                    'total_actividades' => $actividadesDia->count(),
                    'actividades' => $actividadesDia
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'mes' => $request->mes,
                    'anio' => $request->anio,
                    'calendario' => $calendario
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener calendario: ' . $e->getMessage()
            ], 500);
        }
    }
}