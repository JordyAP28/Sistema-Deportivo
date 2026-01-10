<?php

namespace App\Http\Controllers;

use App\Models\Asistencia;
use App\Models\Deportista;
use App\Models\Actividad;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class AsistenciaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $asistencias = Asistencia::with(['deportista.usuario', 'deportista.categoria', 'actividad'])->get();
            return response()->json([
                'success' => true,
                'data' => $asistencias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las asistencias: ' . $e->getMessage()
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
            'id_actividad' => 'required|exists:actividades,id_actividad',
            'fecha' => 'required|date',
            'hora_llegada' => 'nullable|date_format:H:i',
            'estado' => 'required|in:presente,ausente,justificado,tardanza',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si ya existe registro de asistencia para este deportista y actividad en la fecha
            $existente = Asistencia::where('id_deportista', $request->id_deportista)
                ->where('id_actividad', $request->id_actividad)
                ->where('fecha', $request->fecha)
                ->first();

            if ($existente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ya existe un registro de asistencia para este deportista en esta actividad y fecha'
                ], 409);
            }

            // Verificar que la fecha de asistencia coincida con la fecha de la actividad
            $actividad = Actividad::find($request->id_actividad);
            if ($actividad->fecha != $request->fecha) {
                return response()->json([
                    'success' => false,
                    'message' => 'La fecha de asistencia no coincide con la fecha de la actividad'
                ], 400);
            }

            $asistencia = Asistencia::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Asistencia registrada exitosamente',
                'data' => $asistencia->load(['deportista.usuario', 'deportista.categoria', 'actividad'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar la asistencia: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $asistencia = Asistencia::with([
                'deportista.usuario',
                'deportista.categoria',
                'deportista.posiciones',
                'actividad'
            ])->find($id);
            
            if (!$asistencia) {
                return response()->json([
                    'success' => false,
                    'message' => 'Asistencia no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $asistencia
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la asistencia: ' . $e->getMessage()
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
            'id_actividad' => 'exists:actividades,id_actividad',
            'fecha' => 'date',
            'hora_llegada' => 'nullable|date_format:H:i',
            'estado' => 'in:presente,ausente,justificado,tardanza',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $asistencia = Asistencia::find($id);
            
            if (!$asistencia) {
                return response()->json([
                    'success' => false,
                    'message' => 'Asistencia no encontrada'
                ], 404);
            }

            // Verificar si se está cambiando deportista, actividad o fecha
            if (($request->has('id_deportista') && $request->id_deportista != $asistencia->id_deportista) ||
                ($request->has('id_actividad') && $request->id_actividad != $asistencia->id_actividad) ||
                ($request->has('fecha') && $request->fecha != $asistencia->fecha)) {
                
                $idDeportista = $request->id_deportista ?? $asistencia->id_deportista;
                $idActividad = $request->id_actividad ?? $asistencia->id_actividad;
                $fecha = $request->fecha ?? $asistencia->fecha;
                
                // Verificar si ya existe otro registro con la nueva combinación
                $existente = Asistencia::where('id_deportista', $idDeportista)
                    ->where('id_actividad', $idActividad)
                    ->where('fecha', $fecha)
                    ->where('id_asistencia', '!=', $id)
                    ->first();

                if ($existente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ya existe un registro de asistencia para esta combinación'
                    ], 409);
                }
            }

            $asistencia->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Asistencia actualizada exitosamente',
                'data' => $asistencia->load(['deportista.usuario', 'deportista.categoria', 'actividad'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la asistencia: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $asistencia = Asistencia::find($id);
            
            if (!$asistencia) {
                return response()->json([
                    'success' => false,
                    'message' => 'Asistencia no encontrada'
                ], 404);
            }

            $asistencia->delete();

            return response()->json([
                'success' => true,
                'message' => 'Asistencia eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la asistencia: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener asistencias por deportista.
     */
    public function porDeportista(string $idDeportista, Request $request)
    {
        try {
            $query = Asistencia::where('id_deportista', $idDeportista)
                ->with(['deportista.usuario', 'deportista.categoria', 'actividad']);
            
            // Filtrar por rango de fechas si se proporciona
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
            }
            
            // Filtrar por estado si se proporciona
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            $asistencias = $query->orderBy('fecha', 'desc')->get();

            if ($asistencias->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron asistencias para el deportista especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $asistencias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener asistencias por deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener asistencias por actividad.
     */
    public function porActividad(string $idActividad)
    {
        try {
            $asistencias = Asistencia::where('id_actividad', $idActividad)
                ->with(['deportista.usuario', 'deportista.categoria', 'deportista.posiciones'])
                ->orderBy('estado')
                ->orderBy('hora_llegada')
                ->get();

            if ($asistencias->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron asistencias para la actividad especificada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $asistencias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener asistencias por actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener asistencias por fecha.
     */
    public function porFecha(string $fecha)
    {
        try {
            $asistencias = Asistencia::where('fecha', $fecha)
                ->with(['deportista.usuario', 'deportista.categoria', 'actividad'])
                ->orderBy('id_actividad')
                ->orderBy('estado')
                ->get();

            if ($asistencias->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron asistencias para la fecha especificada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $asistencias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener asistencias por fecha: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener asistencias por estado.
     */
    public function porEstado(string $estado, Request $request)
    {
        try {
            $query = Asistencia::where('estado', $estado)
                ->with(['deportista.usuario', 'deportista.categoria', 'actividad']);
            
            // Filtrar por rango de fechas si se proporciona
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
            }

            $asistencias = $query->orderBy('fecha', 'desc')->get();

            if ($asistencias->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron asistencias con el estado especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $asistencias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener asistencias por estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registrar múltiples asistencias para una actividad.
     */
    public function registrarMultiples(Request $request, string $idActividad)
    {
        $validator = Validator::make($request->all(), [
            'asistencias' => 'required|array|min:1',
            'asistencias.*.id_deportista' => 'required|exists:deportistas,id_deportista',
            'asistencias.*.estado' => 'required|in:presente,ausente,justificado,tardanza',
            'asistencias.*.hora_llegada' => 'nullable|date_format:H:i',
            'asistencias.*.observaciones' => 'nullable|string',
            'fecha' => 'required|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $actividad = Actividad::find($idActividad);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada'
                ], 404);
            }

            // Verificar que la fecha coincida con la actividad
            if ($actividad->fecha != $request->fecha) {
                return response()->json([
                    'success' => false,
                    'message' => 'La fecha no coincide con la fecha de la actividad'
                ], 400);
            }

            $registros = [];
            $existentes = 0;
            $nuevos = 0;
            $errores = [];

            foreach ($request->asistencias as $asistenciaData) {
                try {
                    // Verificar si ya existe
                    $existente = Asistencia::where('id_deportista', $asistenciaData['id_deportista'])
                        ->where('id_actividad', $idActividad)
                        ->where('fecha', $request->fecha)
                        ->first();

                    if ($existente) {
                        // Actualizar existente
                        $existente->update([
                            'estado' => $asistenciaData['estado'],
                            'hora_llegada' => $asistenciaData['hora_llegada'] ?? null,
                            'observaciones' => $asistenciaData['observaciones'] ?? null
                        ]);
                        $existentes++;
                    } else {
                        // Crear nuevo
                        Asistencia::create([
                            'id_deportista' => $asistenciaData['id_deportista'],
                            'id_actividad' => $idActividad,
                            'fecha' => $request->fecha,
                            'estado' => $asistenciaData['estado'],
                            'hora_llegada' => $asistenciaData['hora_llegada'] ?? null,
                            'observaciones' => $asistenciaData['observaciones'] ?? null
                        ]);
                        $nuevos++;
                    }
                } catch (\Exception $e) {
                    $errores[] = [
                        'id_deportista' => $asistenciaData['id_deportista'],
                        'error' => $e->getMessage()
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Asistencias registradas exitosamente',
                'data' => [
                    'actividad' => $actividad->nombre_actividad,
                    'fecha' => $request->fecha,
                    'registros_nuevos' => $nuevos,
                    'registros_actualizados' => $existentes,
                    'total_registros' => $nuevos + $existentes,
                    'errores' => $errores
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar múltiples asistencias: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener resumen de asistencias por actividad.
     */
    public function resumenActividad(string $idActividad)
    {
        try {
            $actividad = Actividad::find($idActividad);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada'
                ], 404);
            }

            $total = Asistencia::where('id_actividad', $idActividad)->count();
            $presentes = Asistencia::where('id_actividad', $idActividad)
                ->where('estado', 'presente')->count();
            $ausentes = Asistencia::where('id_actividad', $idActividad)
                ->where('estado', 'ausente')->count();
            $justificados = Asistencia::where('id_actividad', $idActividad)
                ->where('estado', 'justificado')->count();
            $tardanzas = Asistencia::where('id_actividad', $idActividad)
                ->where('estado', 'tardanza')->count();

            $porcentajeAsistencia = $total > 0 ? 
                round((($presentes + $tardanzas) / $total) * 100, 2) : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'actividad' => $actividad->nombre_actividad,
                    'fecha' => $actividad->fecha,
                    'total_registros' => $total,
                    'presentes' => $presentes,
                    'ausentes' => $ausentes,
                    'justificados' => $justificados,
                    'tardanzas' => $tardanzas,
                    'porcentaje_asistencia' => $porcentajeAsistencia
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener resumen de actividad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de asistencias por deportista.
     */
    public function estadisticasDeportista(string $idDeportista, Request $request)
    {
        try {
            $deportista = Deportista::find($idDeportista);
            
            if (!$deportista) {
                return response()->json([
                    'success' => false,
                    'message' => 'Deportista no encontrado'
                ], 404);
            }

            $fechaInicio = $request->fecha_inicio ?? now()->subMonth();
            $fechaFin = $request->fecha_fin ?? now();

            $query = Asistencia::where('id_deportista', $idDeportista)
                ->whereBetween('fecha', [$fechaInicio, $fechaFin]);

            $total = $query->count();
            $presentes = $query->where('estado', 'presente')->count();
            $ausentes = $query->where('estado', 'ausente')->count();
            $justificados = $query->where('estado', 'justificado')->count();
            $tardanzas = $query->where('estado', 'tardanza')->count();

            $porcentajeAsistencia = $total > 0 ? 
                round((($presentes + $tardanzas) / $total) * 100, 2) : 0;

            // Asistencias por tipo de actividad
            $porTipoActividad = Asistencia::selectRaw('actividades.tipo, COUNT(*) as cantidad')
                ->join('actividades', 'asistencias.id_actividad', '=', 'actividades.id_actividad')
                ->where('asistencias.id_deportista', $idDeportista)
                ->whereBetween('asistencias.fecha', [$fechaInicio, $fechaFin])
                ->where('asistencias.estado', 'presente')
                ->groupBy('actividades.tipo')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'deportista' => $deportista->nombres . ' ' . $deportista->apellidos,
                    'periodo' => [
                        'fecha_inicio' => $fechaInicio,
                        'fecha_fin' => $fechaFin
                    ],
                    'total_asistencias' => $total,
                    'presentes' => $presentes,
                    'ausentes' => $ausentes,
                    'justificados' => $justificados,
                    'tardanzas' => $tardanzas,
                    'porcentaje_asistencia' => $porcentajeAsistencia,
                    'por_tipo_actividad' => $porTipoActividad
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas del deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar asistencias.
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
            
            $asistencias = Asistencia::where('observaciones', 'like', "%{$busqueda}%")
                ->orWhereHas('deportista', function($query) use ($busqueda) {
                    $query->where('nombres', 'like', "%{$busqueda}%")
                          ->orWhere('apellidos', 'like', "%{$busqueda}%")
                          ->orWhere('numero_documento', 'like', "%{$busqueda}%");
                })
                ->orWhereHas('actividad', function($query) use ($busqueda) {
                    $query->where('nombre_actividad', 'like', "%{$busqueda}%");
                })
                ->with(['deportista.usuario', 'deportista.categoria', 'actividad'])
                ->orderBy('fecha', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $asistencias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar asistencias: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener asistencias por rango de fechas.
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
            $asistencias = Asistencia::whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin])
                ->with(['deportista.usuario', 'deportista.categoria', 'actividad'])
                ->orderBy('fecha', 'desc')
                ->orderBy('id_actividad')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $asistencias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener asistencias por rango de fechas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener reporte de asistencias.
     */
    public function reporte(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio',
            'id_deportista' => 'nullable|exists:deportistas,id_deportista',
            'id_actividad' => 'nullable|exists:actividades,id_actividad'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $query = Asistencia::whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin])
                ->with(['deportista.usuario', 'deportista.categoria', 'actividad']);
            
            if ($request->has('id_deportista')) {
                $query->where('id_deportista', $request->id_deportista);
            }
            
            if ($request->has('id_actividad')) {
                $query->where('id_actividad', $request->id_actividad);
            }

            $asistencias = $query->orderBy('fecha')->orderBy('id_actividad')->get();

            // Agrupar por fecha y actividad
            $reporte = [];
            foreach ($asistencias as $asistencia) {
                $fecha = $asistencia->fecha;
                $idActividad = $asistencia->id_actividad;
                
                if (!isset($reporte[$fecha])) {
                    $reporte[$fecha] = [];
                }
                
                if (!isset($reporte[$fecha][$idActividad])) {
                    $reporte[$fecha][$idActividad] = [
                        'actividad' => $asistencia->actividad->nombre_actividad,
                        'asistencias' => []
                    ];
                }
                
                $reporte[$fecha][$idActividad]['asistencias'][] = [
                    'deportista' => $asistencia->deportista->nombres . ' ' . $asistencia->deportista->apellidos,
                    'estado' => $asistencia->estado,
                    'hora_llegada' => $asistencia->hora_llegada,
                    'observaciones' => $asistencia->observaciones
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'periodo' => [
                        'fecha_inicio' => $request->fecha_inicio,
                        'fecha_fin' => $request->fecha_fin
                    ],
                    'total_registros' => $asistencias->count(),
                    'reporte' => $reporte
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar reporte: ' . $e->getMessage()
            ], 500);
        }
    }
}