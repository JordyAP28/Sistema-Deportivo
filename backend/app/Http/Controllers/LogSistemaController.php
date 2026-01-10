<?php

namespace App\Http\Controllers;

use App\Models\LogSistema;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class LogSistemaController extends Controller
{
    public function index(Request $request)
    {
        $query = LogSistema::with(['usuario'])
            ->when($request->id_usuario, function ($q) use ($request) {
                return $q->where('id_usuario', $request->id_usuario);
            })
            ->when($request->accion, function ($q) use ($request) {
                return $q->where('accion', 'like', '%' . $request->accion . '%');
            })
            ->when($request->modelo, function ($q) use ($request) {
                return $q->where('modelo', $request->modelo);
            })
            ->when($request->modelo_id, function ($q) use ($request) {
                return $q->where('modelo_id', $request->modelo_id);
            })
            ->when($request->fecha_desde, function ($q) use ($request) {
                return $q->whereDate('fecha', '>=', $request->fecha_desde);
            })
            ->when($request->fecha_hasta, function ($q) use ($request) {
                return $q->whereDate('fecha', '<=', $request->fecha_hasta);
            })
            ->when($request->ip_address, function ($q) use ($request) {
                return $q->where('ip_address', 'like', '%' . $request->ip_address . '%');
            });

        // Ordenar siempre por fecha descendente
        $query->orderBy('fecha', 'desc');

        $logs = $request->has('per_page') 
            ? $query->paginate($request->per_page)
            : $query->limit(1000)->get();

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function show($id)
    {
        $log = LogSistema::with(['usuario'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $log
        ]);
    }

    public function getByUsuario($usuarioId)
    {
        $logs = LogSistema::where('id_usuario', $usuarioId)
            ->with(['usuario'])
            ->orderBy('fecha', 'desc')
            ->limit(500)
            ->get();

        // Estadísticas del usuario
        $estadisticas = [
            'total_acciones' => $logs->count(),
            'acciones_por_tipo' => $logs->groupBy('accion')->map->count(),
            'ultima_accion' => $logs->first()->fecha ?? null,
            'modelos_afectados' => $logs->unique('modelo')->pluck('modelo'),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'logs' => $logs,
                'estadisticas' => $estadisticas
            ]
        ]);
    }

    public function getByModelo($modelo)
    {
        $logs = LogSistema::where('modelo', $modelo)
            ->with(['usuario'])
            ->orderBy('fecha', 'desc')
            ->limit(500)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function getByModeloId($modelo, $modeloId)
    {
        $logs = LogSistema::where('modelo', $modelo)
            ->where('modelo_id', $modeloId)
            ->with(['usuario'])
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function getEstadisticas(Request $request)
    {
        $query = LogSistema::query();

        if ($request->fecha_desde) {
            $query->whereDate('fecha', '>=', $request->fecha_desde);
        }

        if ($request->fecha_hasta) {
            $query->whereDate('fecha', '<=', $request->fecha_hasta);
        }

        // Estadísticas generales
        $estadisticas = [
            'total_logs' => $query->count(),
            'logs_por_dia' => $this->getLogsPorDia($query),
            'logs_por_usuario' => $this->getLogsPorUsuario($query),
            'logs_por_accion' => $this->getLogsPorAccion($query),
            'logs_por_modelo' => $this->getLogsPorModelo($query),
            'top_usuarios_activos' => $this->getTopUsuariosActivos($query),
            'horas_pico' => $this->getHorasPico($query),
        ];

        return response()->json([
            'success' => true,
            'data' => $estadisticas
        ]);
    }

    public function getActividadReciente($dias = 7)
    {
        $fechaDesde = now()->subDays($dias);

        $actividad = LogSistema::select(
                DB::raw('DATE(fecha) as fecha'),
                DB::raw('COUNT(*) as total_acciones'),
                DB::raw('COUNT(DISTINCT id_usuario) as usuarios_activos'),
                DB::raw('GROUP_CONCAT(DISTINCT modelo) as modelos_afectados')
            )
            ->whereDate('fecha', '>=', $fechaDesde)
            ->groupBy(DB::raw('DATE(fecha)'))
            ->orderBy('fecha', 'desc')
            ->get();

        // Acciones más comunes
        $accionesComunes = LogSistema::select('accion', DB::raw('COUNT(*) as cantidad'))
            ->whereDate('fecha', '>=', $fechaDesde)
            ->groupBy('accion')
            ->orderBy('cantidad', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'actividad_por_dia' => $actividad,
                'acciones_comunes' => $accionesComunes
            ]
        ]);
    }

    public function limpiarLogsAntiguos(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dias' => 'required|integer|min:1|max:3650',
            'confirmar' => 'required|boolean|accepted'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if (!$request->confirmar) {
            return response()->json([
                'success' => false,
                'message' => 'Debe confirmar la eliminación de logs'
            ], 400);
        }

        try {
            $fechaLimite = now()->subDays($request->dias);
            $logsEliminados = LogSistema::where('fecha', '<', $fechaLimite)->count();

            LogSistema::where('fecha', '<', $fechaLimite)->delete();

            // Registrar esta acción en el log
            LogSistema::create([
                'id_usuario' => $request->user()->id_usuario,
                'accion' => 'limpieza_logs',
                'modelo' => 'LogSistema',
                'descripcion' => "Se eliminaron {$logsEliminados} logs anteriores a {$fechaLimite->format('Y-m-d')}",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Se eliminaron {$logsEliminados} logs antiguos",
                'data' => [
                    'logs_eliminados' => $logsEliminados,
                    'fecha_limite' => $fechaLimite->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al limpiar logs: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportarLogs(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'formato' => 'required|in:csv,json,xml',
            'fecha_desde' => 'nullable|date',
            'fecha_hasta' => 'nullable|date|after_or_equal:fecha_desde',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $query = LogSistema::with(['usuario'])
                ->when($request->fecha_desde, function ($q) use ($request) {
                    return $q->whereDate('fecha', '>=', $request->fecha_desde);
                })
                ->when($request->fecha_hasta, function ($q) use ($request) {
                    return $q->whereDate('fecha', '<=', $request->fecha_hasta);
                })
                ->orderBy('fecha', 'desc');

            $logs = $query->get();

            // Generar nombre de archivo
            $timestamp = now()->format('Ymd_His');
            $filename = "logs_sistema_{$timestamp}.{$request->formato}";

            // Preparar datos para exportación
            $datosExportacion = $logs->map(function ($log) {
                return [
                    'id_log' => $log->id_log,
                    'usuario' => $log->usuario->email ?? 'N/A',
                    'accion' => $log->accion,
                    'modelo' => $log->modelo,
                    'modelo_id' => $log->modelo_id,
                    'descripcion' => $log->descripcion,
                    'fecha' => $log->fecha->format('Y-m-d H:i:s'),
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                ];
            });

            // Registrar exportación
            LogSistema::create([
                'id_usuario' => $request->user()->id_usuario,
                'accion' => 'exportacion_logs',
                'modelo' => 'LogSistema',
                'descripcion' => "Exportación de logs en formato {$request->formato}",
                'datos_nuevos' => json_encode([
                    'total_logs' => $logs->count(),
                    'formato' => $request->formato,
                    'fecha_desde' => $request->fecha_desde,
                    'fecha_hasta' => $request->fecha_hasta,
                ]),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Logs preparados para exportación',
                'data' => [
                    'total_registros' => $logs->count(),
                    'nombre_archivo' => $filename,
                    'datos' => $datosExportacion
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al exportar logs: ' . $e->getMessage()
            ], 500);
        }
    }

    // Métodos auxiliares para estadísticas
    private function getLogsPorDia($query)
    {
        return $query->clone()
            ->select(DB::raw('DATE(fecha) as fecha'), DB::raw('COUNT(*) as cantidad'))
            ->groupBy(DB::raw('DATE(fecha)'))
            ->orderBy('fecha', 'desc')
            ->limit(30)
            ->get();
    }

    private function getLogsPorUsuario($query)
    {
        return $query->clone()
            ->select('id_usuario', DB::raw('COUNT(*) as cantidad'))
            ->with(['usuario:id_usuario,email'])
            ->groupBy('id_usuario')
            ->orderBy('cantidad', 'desc')
            ->limit(20)
            ->get();
    }

    private function getLogsPorAccion($query)
    {
        return $query->clone()
            ->select('accion', DB::raw('COUNT(*) as cantidad'))
            ->groupBy('accion')
            ->orderBy('cantidad', 'desc')
            ->get();
    }

    private function getLogsPorModelo($query)
    {
        return $query->clone()
            ->select('modelo', DB::raw('COUNT(*) as cantidad'))
            ->groupBy('modelo')
            ->orderBy('cantidad', 'desc')
            ->get();
    }

    private function getTopUsuariosActivos($query)
    {
        return $query->clone()
            ->select('id_usuario', DB::raw('COUNT(*) as total_acciones'))
            ->with(['usuario:id_usuario,email,nombre,apellido'])
            ->groupBy('id_usuario')
            ->orderBy('total_acciones', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'usuario' => $item->usuario,
                    'total_acciones' => $item->total_acciones
                ];
            });
    }

    private function getHorasPico($query)
    {
        return $query->clone()
            ->select(DB::raw('HOUR(fecha) as hora'), DB::raw('COUNT(*) as cantidad'))
            ->groupBy(DB::raw('HOUR(fecha)'))
            ->orderBy('cantidad', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'hora' => str_pad($item->hora, 2, '0', STR_PAD_LEFT) . ':00',
                    'cantidad' => $item->cantidad
                ];
            });
    }
}