<?php

namespace App\Http\Controllers;

use App\Models\Lesion;
use App\Models\Deportista;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LesionController extends Controller
{
    public function index(Request $request)
    {
        $query = Lesion::with(['deportista.usuario', 'deportista.categoria', 'usuarioCreador', 'usuarioActualizador'])
            ->when($request->id_deportista, function ($q) use ($request) {
                return $q->where('id_deportista', $request->id_deportista);
            })
            ->when($request->tipo_lesion, function ($q) use ($request) {
                return $q->where('tipo_lesion', 'like', '%' . $request->tipo_lesion . '%');
            })
            ->when($request->zona_afectada, function ($q) use ($request) {
                return $q->where('zona_afectada', 'like', '%' . $request->zona_afectada . '%');
            })
            ->when($request->gravedad, function ($q) use ($request) {
                return $q->where('gravedad', $request->gravedad);
            })
            ->when($request->estado, function ($q) use ($request) {
                return $q->where('estado', $request->estado);
            })
            ->when($request->fecha_desde, function ($q) use ($request) {
                return $q->whereDate('fecha_lesion', '>=', $request->fecha_desde);
            })
            ->when($request->fecha_hasta, function ($q) use ($request) {
                return $q->whereDate('fecha_lesion', '<=', $request->fecha_hasta);
            });

        $lesiones = $request->has('per_page') 
            ? $query->paginate($request->per_page)
            : $query->orderBy('fecha_lesion', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $lesiones
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'tipo_lesion' => 'required|string|max:100',
            'zona_afectada' => 'required|string|max:100',
            'fecha_lesion' => 'required|date',
            'fecha_recuperacion_estimada' => 'nullable|date|after_or_equal:fecha_lesion',
            'fecha_alta' => 'nullable|date|after_or_equal:fecha_lesion',
            'descripcion' => 'required|string',
            'tratamiento' => 'required|string',
            'gravedad' => 'required|in:leve,moderada,grave,muy_grave',
            'estado' => 'required|in:activa,en_recuperacion,curada,cronica',
            'medico_tratante' => 'nullable|string|max:200',
            'observaciones' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Verificar si el deportista ya tiene una lesión activa en la misma zona
            $lesionActiva = Lesion::where('id_deportista', $request->id_deportista)
                ->where('zona_afectada', $request->zona_afectada)
                ->whereIn('estado', ['activa', 'en_recuperacion'])
                ->first();

            if ($lesionActiva) {
                return response()->json([
                    'success' => false,
                    'message' => 'El deportista ya tiene una lesión activa o en recuperación en esta zona'
                ], 409);
            }

            $lesion = Lesion::create([
                'id_deportista' => $request->id_deportista,
                'tipo_lesion' => $request->tipo_lesion,
                'zona_afectada' => $request->zona_afectada,
                'fecha_lesion' => $request->fecha_lesion,
                'fecha_recuperacion_estimada' => $request->fecha_recuperacion_estimada,
                'fecha_alta' => $request->fecha_alta,
                'descripcion' => $request->descripcion,
                'tratamiento' => $request->tratamiento,
                'gravedad' => $request->gravedad,
                'estado' => $request->estado,
                'medico_tratante' => $request->medico_tratante,
                'observaciones' => $request->observaciones,
                'created_by' => $request->user()->id_usuario,
            ]);

            // Si la lesión es grave o muy grave, actualizar estado del deportista a lesionado
            if (in_array($request->gravedad, ['grave', 'muy_grave'])) {
                $deportista = Deportista::find($request->id_deportista);
                if ($deportista) {
                    $deportista->update(['estado' => 'lesionado']);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Lesión registrada exitosamente',
                'data' => $lesion->load(['deportista', 'usuarioCreador'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar la lesión: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $lesion = Lesion::with([
            'deportista.usuario',
            'deportista.categoria',
            'deportista.clubes',
            'usuarioCreador',
            'usuarioActualizador'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $lesion
        ]);
    }

    public function update(Request $request, $id)
    {
        $lesion = Lesion::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'tipo_lesion' => 'required|string|max:100',
            'zona_afectada' => 'required|string|max:100',
            'fecha_lesion' => 'required|date',
            'fecha_recuperacion_estimada' => 'nullable|date|after_or_equal:fecha_lesion',
            'fecha_alta' => 'nullable|date|after_or_equal:fecha_lesion',
            'descripcion' => 'required|string',
            'tratamiento' => 'required|string',
            'gravedad' => 'required|in:leve,moderada,grave,muy_grave',
            'estado' => 'required|in:activa,en_recuperacion,curada,cronica',
            'medico_tratante' => 'nullable|string|max:200',
            'observaciones' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Guardar datos anteriores para comparación
            $estadoAnterior = $lesion->estado;
            $gravedadAnterior = $lesion->gravedad;

            $lesion->update([
                'tipo_lesion' => $request->tipo_lesion,
                'zona_afectada' => $request->zona_afectada,
                'fecha_lesion' => $request->fecha_lesion,
                'fecha_recuperacion_estimada' => $request->fecha_recuperacion_estimada,
                'fecha_alta' => $request->fecha_alta,
                'descripcion' => $request->descripcion,
                'tratamiento' => $request->tratamiento,
                'gravedad' => $request->gravedad,
                'estado' => $request->estado,
                'medico_tratante' => $request->medico_tratante,
                'observaciones' => $request->observaciones,
                'updated_by' => $request->user()->id_usuario,
            ]);

            // Actualizar estado del deportista según la lesión
            $deportista = $lesion->deportista;

            if ($request->estado === 'curada') {
                // Si la lesión se cura, verificar si hay otras lesiones activas
                $lesionesActivas = Lesion::where('id_deportista', $deportista->id_deportista)
                    ->where('id_lesion', '!=', $id)
                    ->whereIn('estado', ['activa', 'en_recuperacion'])
                    ->exists();

                if (!$lesionesActivas) {
                    $deportista->update(['estado' => 'activo']);
                }
            } elseif ($request->estado === 'activa' && in_array($request->gravedad, ['grave', 'muy_grave'])) {
                // Si la lesión se vuelve grave, actualizar estado del deportista
                $deportista->update(['estado' => 'lesionado']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Lesión actualizada exitosamente',
                'data' => $lesion->load(['deportista', 'usuarioActualizador'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la lesión: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $lesion = Lesion::findOrFail($id);

            // No permitir eliminar lesiones si el deportista está lesionado por esta lesión
            $deportista = $lesion->deportista;
            if ($deportista->estado === 'lesionado' && $lesion->estado === 'activa') {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar una lesión activa de un deportista lesionado'
                ], 400);
            }

            $lesion->delete();

            return response()->json([
                'success' => true,
                'message' => 'Lesión eliminada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la lesión: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getByDeportista($deportistaId)
    {
        $lesiones = Lesion::where('id_deportista', $deportistaId)
            ->with(['usuarioCreador', 'usuarioActualizador'])
            ->orderBy('fecha_lesion', 'desc')
            ->get();

        // Estadísticas del deportista
        $estadisticas = [
            'total_lesiones' => $lesiones->count(),
            'lesiones_activas' => $lesiones->whereIn('estado', ['activa', 'en_recuperacion'])->count(),
            'lesiones_curadas' => $lesiones->where('estado', 'curada')->count(),
            'lesiones_cronicas' => $lesiones->where('estado', 'cronica')->count(),
            'tiempo_promedio_recuperacion' => $this->calcularTiempoPromedioRecuperacion($lesiones),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'lesiones' => $lesiones,
                'estadisticas' => $estadisticas
            ]
        ]);
    }

    public function getLesionesActivas()
    {
        $lesiones = Lesion::whereIn('estado', ['activa', 'en_recuperacion'])
            ->with(['deportista.usuario', 'deportista.categoria'])
            ->orderBy('gravedad', 'desc')
            ->orderBy('fecha_lesion', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $lesiones
        ]);
    }

    public function darAltaMedica(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'fecha_alta' => 'required|date',
            'observaciones_alta' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $lesion = Lesion::findOrFail($id);

            // Verificar que la lesión no esté ya curada
            if ($lesion->estado === 'curada') {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta lesión ya está curada'
                ], 400);
            }

            $lesion->update([
                'fecha_alta' => $request->fecha_alta,
                'estado' => 'curada',
                'observaciones' => $lesion->observaciones . "\n--- ALTA MÉDICA ---\n" . $request->observaciones_alta,
                'updated_by' => $request->user()->id_usuario,
            ]);

            // Verificar si el deportista tiene otras lesiones activas
            $lesionesActivas = Lesion::where('id_deportista', $lesion->id_deportista)
                ->where('id_lesion', '!=', $id)
                ->whereIn('estado', ['activa', 'en_recuperacion'])
                ->exists();

            if (!$lesionesActivas) {
                $deportista = $lesion->deportista;
                $deportista->update(['estado' => 'activo']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Alta médica registrada exitosamente',
                'data' => $lesion->load('deportista')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el alta médica: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getEstadisticasLesiones()
    {
        $estadisticas = Lesion::select(
                DB::raw('COUNT(*) as total_lesiones'),
                DB::raw('COUNT(CASE WHEN estado IN ("activa", "en_recuperacion") THEN 1 END) as lesiones_activas'),
                DB::raw('COUNT(CASE WHEN estado = "curada" THEN 1 END) as lesiones_curadas'),
                DB::raw('COUNT(CASE WHEN estado = "cronica" THEN 1 END) as lesiones_cronicas'),
                DB::raw('COUNT(CASE WHEN gravedad = "leve" THEN 1 END) as lesiones_leves'),
                DB::raw('COUNT(CASE WHEN gravedad = "moderada" THEN 1 END) as lesiones_moderadas'),
                DB::raw('COUNT(CASE WHEN gravedad = "grave" THEN 1 END) as lesiones_graves'),
                DB::raw('COUNT(CASE WHEN gravedad = "muy_grave" THEN 1 END) as lesiones_muy_graves')
            )
            ->first();

        // Lesiones por zona del cuerpo
        $lesionesPorZona = Lesion::select('zona_afectada', DB::raw('COUNT(*) as cantidad'))
            ->groupBy('zona_afectada')
            ->orderBy('cantidad', 'desc')
            ->get();

        // Lesiones por tipo
        $lesionesPorTipo = Lesion::select('tipo_lesion', DB::raw('COUNT(*) as cantidad'))
            ->groupBy('tipo_lesion')
            ->orderBy('cantidad', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'estadisticas_generales' => $estadisticas,
                'lesiones_por_zona' => $lesionesPorZona,
                'lesiones_por_tipo' => $lesionesPorTipo
            ]
        ]);
    }

    private function calcularTiempoPromedioRecuperacion($lesiones)
    {
        $lesionesCuradas = $lesiones->where('estado', 'curada')
            ->whereNotNull('fecha_alta')
            ->whereNotNull('fecha_lesion');

        if ($lesionesCuradas->isEmpty()) {
            return 0;
        }

        $totalDias = $lesionesCuradas->sum(function ($lesion) {
            return $lesion->fecha_alta->diffInDays($lesion->fecha_lesion);
        });

        return round($totalDias / $lesionesCuradas->count(), 1);
    }
}