<?php

namespace App\Http\Controllers;

use App\Models\Escenario;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class EscenarioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $escenarios = Escenario::with(['actividadesProgramadas.actividad', 'partidos'])->get();
            return response()->json([
                'success' => true,
                'data' => $escenarios
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los escenarios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:200|unique:escenarios,nombre',
            'slug' => 'required|string|max:200|unique:escenarios,slug',
            'tipo' => 'required|string|max:100',
            'capacidad' => 'required|integer|min:1',
            'descripcion' => 'nullable|string',
            'direccion' => 'required|string',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'servicios' => 'nullable|array',
            'estado' => 'nullable|in:disponible,mantenimiento,ocupado,cerrado'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $request->all();
            
            // Manejar subida de imagen
            if ($request->hasFile('imagen')) {
                $imagen = $request->file('imagen');
                $imagenPath = $imagen->store('escenarios', 'public');
                $data['imagen'] = $imagenPath;
            }

            // Convertir servicios a JSON si se proporcionan
            if ($request->has('servicios')) {
                $data['servicios'] = json_encode($request->servicios);
            }

            $escenario = Escenario::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Escenario creado exitosamente',
                'data' => $escenario
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el escenario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $escenario = Escenario::with([
                'actividadesProgramadas.actividad',
                'partidos.campeonato',
                'partidos.clubLocal',
                'partidos.clubVisitante'
            ])->find($id);
            
            if (!$escenario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Escenario no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $escenario
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el escenario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'string|max:200|unique:escenarios,nombre,' . $id . ',id_escenario',
            'slug' => 'string|max:200|unique:escenarios,slug,' . $id . ',id_escenario',
            'tipo' => 'string|max:100',
            'capacidad' => 'integer|min:1',
            'descripcion' => 'nullable|string',
            'direccion' => 'string',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'servicios' => 'nullable|array',
            'estado' => 'nullable|in:disponible,mantenimiento,ocupado,cerrado'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $escenario = Escenario::find($id);
            
            if (!$escenario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Escenario no encontrado'
                ], 404);
            }

            $data = $request->all();
            
            // Manejar subida de nueva imagen
            if ($request->hasFile('imagen')) {
                // Eliminar imagen anterior si existe
                if ($escenario->imagen && Storage::disk('public')->exists($escenario->imagen)) {
                    Storage::disk('public')->delete($escenario->imagen);
                }
                
                $imagen = $request->file('imagen');
                $imagenPath = $imagen->store('escenarios', 'public');
                $data['imagen'] = $imagenPath;
            }

            // Convertir servicios a JSON si se proporcionan
            if ($request->has('servicios')) {
                $data['servicios'] = json_encode($request->servicios);
            }

            $escenario->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Escenario actualizado exitosamente',
                'data' => $escenario
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el escenario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $escenario = Escenario::find($id);
            
            if (!$escenario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Escenario no encontrado'
                ], 404);
            }

            // Verificar si hay actividades programadas o partidos asociados
            if ($escenario->actividadesProgramadas()->count() > 0 ||
                $escenario->partidos()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el escenario porque tiene actividades o partidos asociados'
                ], 400);
            }

            // Eliminar imagen si existe
            if ($escenario->imagen && Storage::disk('public')->exists($escenario->imagen)) {
                Storage::disk('public')->delete($escenario->imagen);
            }

            $escenario->delete();

            return response()->json([
                'success' => true,
                'message' => 'Escenario eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el escenario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un escenario eliminado.
     */
    public function restore(string $id)
    {
        try {
            $escenario = Escenario::withTrashed()->find($id);
            
            if (!$escenario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Escenario no encontrado'
                ], 404);
            }

            if (!$escenario->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El escenario no está eliminado'
                ], 400);
            }

            $escenario->restore();

            return response()->json([
                'success' => true,
                'message' => 'Escenario restaurado exitosamente',
                'data' => $escenario
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar el escenario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener escenarios disponibles.
     */
    public function disponibles()
    {
        try {
            $escenarios = Escenario::where('estado', 'disponible')
                ->with(['actividadesProgramadas.actividad'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $escenarios
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener escenarios disponibles: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener escenarios por tipo.
     */
    public function porTipo(string $tipo)
    {
        try {
            $escenarios = Escenario::where('tipo', $tipo)
                ->where('estado', '!=', 'cerrado')
                ->with(['actividadesProgramadas.actividad'])
                ->get();

            if ($escenarios->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron escenarios del tipo especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $escenarios
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener escenarios por tipo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener actividades programadas en un escenario.
     */
    public function actividades(string $id, Request $request)
    {
        try {
            $escenario = Escenario::find($id);
            
            if (!$escenario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Escenario no encontrado'
                ], 404);
            }

            $query = $escenario->actividadesProgramadas()->with('actividad');
            
            // Filtrar por fecha si se proporciona
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereHas('actividad', function($q) use ($request) {
                    $q->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
                });
            }

            $actividades = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'escenario' => $escenario->nombre,
                    'actividades' => $actividades
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener actividades del escenario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener partidos en un escenario.
     */
    public function partidos(string $id, Request $request)
    {
        try {
            $escenario = Escenario::find($id);
            
            if (!$escenario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Escenario no encontrado'
                ], 404);
            }

            $query = $escenario->partidos()->with(['campeonato', 'clubLocal', 'clubVisitante']);
            
            // Filtrar por fecha si se proporciona
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
            }
            
            // Filtrar por estado si se proporciona
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            $partidos = $query->orderBy('fecha', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'escenario' => $escenario->nombre,
                    'partidos' => $partidos
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener partidos del escenario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar escenarios.
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
            
            $escenarios = Escenario::where('nombre', 'like', "%{$busqueda}%")
                ->orWhere('tipo', 'like', "%{$busqueda}%")
                ->orWhere('direccion', 'like', "%{$busqueda}%")
                ->orWhere('descripcion', 'like', "%{$busqueda}%")
                ->with(['actividadesProgramadas.actividad'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $escenarios
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar escenarios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener disponibilidad de un escenario.
     */
    public function disponibilidad(string $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fecha' => 'required|date',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin' => 'required|date_format:H:i|after:hora_inicio'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $escenario = Escenario::find($id);
            
            if (!$escenario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Escenario no encontrado'
                ], 404);
            }

            // Verificar estado del escenario
            if ($escenario->estado !== 'disponible') {
                return response()->json([
                    'success' => false,
                    'message' => 'El escenario no está disponible. Estado actual: ' . $escenario->estado
                ], 400);
            }

            // Verificar si hay actividades programadas en ese horario
            $actividadesConflictivas = $escenario->actividadesProgramadas()
                ->whereHas('actividad', function($query) use ($request) {
                    $query->where('fecha', $request->fecha)
                          ->where(function($q) use ($request) {
                              $q->whereBetween('hora_inicio', [$request->hora_inicio, $request->hora_fin])
                                ->orWhereBetween('hora_fin', [$request->hora_inicio, $request->hora_fin])
                                ->orWhere(function($sub) use ($request) {
                                    $sub->where('hora_inicio', '<=', $request->hora_inicio)
                                        ->where('hora_fin', '>=', $request->hora_fin);
                                });
                          });
                })
                ->exists();

            // Verificar si hay partidos programados en ese horario
            $partidosConflictivos = $escenario->partidos()
                ->where('fecha', $request->fecha)
                ->where('estado', '!=', 'cancelado')
                ->where(function($query) use ($request) {
                    // Simplificado: asumiendo que los partidos tienen hora específica
                    // En realidad necesitarías ajustar según cómo manejes los horarios de partidos
                    $query->whereTime('hora', '>=', $request->hora_inicio)
                          ->whereTime('hora', '<=', $request->hora_fin);
                })
                ->exists();

            $disponible = !$actividadesConflictivas && !$partidosConflictivos;

            return response()->json([
                'success' => true,
                'data' => [
                    'escenario' => $escenario->nombre,
                    'fecha' => $request->fecha,
                    'hora_inicio' => $request->hora_inicio,
                    'hora_fin' => $request->hora_fin,
                    'disponible' => $disponible,
                    'conflictos_actividades' => $actividadesConflictivas,
                    'conflictos_partidos' => $partidosConflictivos,
                    'mensaje' => $disponible 
                        ? 'El escenario está disponible en el horario solicitado' 
                        : 'El escenario no está disponible en el horario solicitado'
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
     * Cambiar estado de un escenario.
     */
    public function cambiarEstado(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'required|in:disponible,mantenimiento,ocupado,cerrado',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $escenario = Escenario::find($id);
            
            if (!$escenario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Escenario no encontrado'
                ], 404);
            }

            $escenario->update(['estado' => $request->estado]);

            // Si se marca como en mantenimiento o cerrado, notificar sobre actividades programadas
            if (in_array($request->estado, ['mantenimiento', 'cerrado'])) {
                // Aquí podrías agregar lógica para notificar a los usuarios
                // sobre actividades afectadas
            }

            return response()->json([
                'success' => true,
                'message' => 'Estado del escenario actualizado exitosamente',
                'data' => $escenario
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar estado del escenario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de uso del escenario.
     */
    public function estadisticasUso(string $id, Request $request)
    {
        try {
            $escenario = Escenario::find($id);
            
            if (!$escenario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Escenario no encontrado'
                ], 404);
            }

            // Actividades en el último mes
            $fechaInicio = $request->fecha_inicio ?? now()->subMonth();
            $fechaFin = $request->fecha_fin ?? now();

            $totalActividades = $escenario->actividadesProgramadas()
                ->whereHas('actividad', function($query) use ($fechaInicio, $fechaFin) {
                    $query->whereBetween('fecha', [$fechaInicio, $fechaFin]);
                })
                ->count();

            $totalPartidos = $escenario->partidos()
                ->whereBetween('fecha', [$fechaInicio, $fechaFin])
                ->count();

            $horasUsoEstimadas = ($totalActividades * 2) + ($totalPartidos * 2); // Estimado: 2 horas por actividad/partido

            // Distribución por tipo de actividad
            $actividadesPorTipo = $escenario->actividadesProgramadas()
                ->selectRaw('actividades.tipo, COUNT(*) as total')
                ->join('actividades', 'programa_actividades.id_actividad', '=', 'actividades.id_actividad')
                ->whereHas('actividad', function($query) use ($fechaInicio, $fechaFin) {
                    $query->whereBetween('fecha', [$fechaInicio, $fechaFin]);
                })
                ->groupBy('actividades.tipo')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'escenario' => $escenario->nombre,
                    'periodo' => [
                        'fecha_inicio' => $fechaInicio,
                        'fecha_fin' => $fechaFin
                    ],
                    'total_actividades' => $totalActividades,
                    'total_partidos' => $totalPartidos,
                    'horas_uso_estimadas' => $horasUsoEstimadas,
                    'actividades_por_tipo' => $actividadesPorTipo,
                    'tasa_ocupacion' => round(($horasUsoEstimadas / (24 * 30)) * 100, 2) // Porcentaje del mes
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas de uso: ' . $e->getMessage()
            ], 500);
        }
    }
}