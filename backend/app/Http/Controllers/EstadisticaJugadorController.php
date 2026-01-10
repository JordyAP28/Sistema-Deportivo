<?php

namespace App\Http\Controllers;

use App\Models\EstadisticaJugador;
use App\Models\Deportista;
use App\Models\Campeonato;
use App\Models\Partido;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class EstadisticaJugadorController extends Controller
{
    public function index(Request $request)
    {
        $query = EstadisticaJugador::with([
            'deportista.usuario',
            'deportista.categoria',
            'partido',
            'campeonato'
        ])
        ->when($request->id_deportista, function ($q) use ($request) {
            return $q->where('id_deportista', $request->id_deportista);
        })
        ->when($request->id_campeonato, function ($q) use ($request) {
            return $q->where('id_campeonato', $request->id_campeonato);
        })
        ->when($request->id_partido, function ($q) use ($request) {
            return $q->where('id_partido', $request->id_partido);
        })
        ->when($request->fecha_desde, function ($q) use ($request) {
            return $q->whereHas('partido', function ($query) use ($request) {
                $query->whereDate('fecha', '>=', $request->fecha_desde);
            })->orWhereHas('campeonato', function ($query) use ($request) {
                $query->whereDate('fecha_inicio', '>=', $request->fecha_desde);
            });
        })
        ->when($request->fecha_hasta, function ($q) use ($request) {
            return $q->whereHas('partido', function ($query) use ($request) {
                $query->whereDate('fecha', '<=', $request->fecha_hasta);
            })->orWhereHas('campeonato', function ($query) use ($request) {
                $query->whereDate('fecha_fin', '<=', $request->fecha_hasta);
            });
        });

        $estadisticas = $request->has('per_page') 
            ? $query->paginate($request->per_page)
            : $query->get();

        return response()->json([
            'success' => true,
            'data' => $estadisticas
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'id_partido' => 'nullable|exists:partidos,id_partido',
            'id_campeonato' => 'nullable|exists:campeonatos,id_campeonato',
            'goles' => 'required|integer|min:0',
            'asistencias' => 'required|integer|min:0',
            'tarjetas_amarillas' => 'required|integer|min:0',
            'tarjetas_rojas' => 'required|integer|min:0',
            'minutos_jugados' => 'required|integer|min:0',
            'partidos_jugados' => 'required|integer|min:0',
            'partidos_titular' => 'required|integer|min:0',
            'partidos_suplente' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Verificar unicidad: no puede tener estadísticas para el mismo partido
            if ($request->id_partido) {
                $existente = EstadisticaJugador::where('id_deportista', $request->id_deportista)
                    ->where('id_partido', $request->id_partido)
                    ->first();
                
                if ($existente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ya existe una estadística para este jugador en este partido'
                    ], 409);
                }
            }

            // Verificar unicidad: no puede tener estadísticas generales duplicadas para el mismo campeonato
            if ($request->id_campeonato && !$request->id_partido) {
                $existente = EstadisticaJugador::where('id_deportista', $request->id_deportista)
                    ->where('id_campeonato', $request->id_campeonato)
                    ->whereNull('id_partido')
                    ->first();
                
                if ($existente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ya existe una estadística general para este jugador en este campeonato'
                    ], 409);
                }
            }

            $estadistica = EstadisticaJugador::create([
                'id_deportista' => $request->id_deportista,
                'id_partido' => $request->id_partido,
                'id_campeonato' => $request->id_campeonato,
                'goles' => $request->goles,
                'asistencias' => $request->asistencias,
                'tarjetas_amarillas' => $request->tarjetas_amarillas,
                'tarjetas_rojas' => $request->tarjetas_rojas,
                'minutos_jugados' => $request->minutos_jugados,
                'partidos_jugados' => $request->partidos_jugados,
                'partidos_titular' => $request->partidos_titular,
                'partidos_suplente' => $request->partidos_suplente,
                'created_by' => $request->user()->id_usuario,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Estadística registrada exitosamente',
                'data' => $estadistica->load(['deportista', 'partido', 'campeonato'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar la estadística: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $estadistica = EstadisticaJugador::with([
            'deportista.usuario',
            'deportista.categoria',
            'deportista.posiciones',
            'partido.campeonato',
            'partido.clubLocal',
            'partido.clubVisitante',
            'campeonato',
            'usuarioCreador'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $estadistica
        ]);
    }

    public function update(Request $request, $id)
    {
        $estadistica = EstadisticaJugador::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'goles' => 'required|integer|min:0',
            'asistencias' => 'required|integer|min:0',
            'tarjetas_amarillas' => 'required|integer|min:0',
            'tarjetas_rojas' => 'required|integer|min:0',
            'minutos_jugados' => 'required|integer|min:0',
            'partidos_jugados' => 'required|integer|min:0',
            'partidos_titular' => 'required|integer|min:0',
            'partidos_suplente' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $estadistica->update([
                'goles' => $request->goles,
                'asistencias' => $request->asistencias,
                'tarjetas_amarillas' => $request->tarjetas_amarillas,
                'tarjetas_rojas' => $request->tarjetas_rojas,
                'minutos_jugados' => $request->minutos_jugados,
                'partidos_jugados' => $request->partidos_jugados,
                'partidos_titular' => $request->partidos_titular,
                'partidos_suplente' => $request->partidos_suplente,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estadística actualizada exitosamente',
                'data' => $estadistica->load(['deportista', 'partido', 'campeonato'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la estadística: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $estadistica = EstadisticaJugador::findOrFail($id);
            $estadistica->delete();

            return response()->json([
                'success' => true,
                'message' => 'Estadística eliminada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la estadística: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getByDeportista($deportistaId)
    {
        $estadisticas = EstadisticaJugador::where('id_deportista', $deportistaId)
            ->with(['partido', 'campeonato'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Calcular estadísticas totales
        $totales = [
            'goles' => $estadisticas->sum('goles'),
            'asistencias' => $estadisticas->sum('asistencias'),
            'tarjetas_amarillas' => $estadisticas->sum('tarjetas_amarillas'),
            'tarjetas_rojas' => $estadisticas->sum('tarjetas_rojas'),
            'minutos_jugados' => $estadisticas->sum('minutos_jugados'),
            'partidos_jugados' => $estadisticas->sum('partidos_jugados'),
            'partidos_titular' => $estadisticas->sum('partidos_titular'),
            'partidos_suplente' => $estadisticas->sum('partidos_suplente'),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'estadisticas' => $estadisticas,
                'totales' => $totales
            ]
        ]);
    }

    public function getByCampeonato($campeonatoId)
    {
        $estadisticas = EstadisticaJugador::where('id_campeonato', $campeonatoId)
            ->with(['deportista.usuario', 'deportista.categoria'])
            ->get()
            ->groupBy('id_deportista')
            ->map(function ($group) {
                return [
                    'deportista' => $group->first()->deportista,
                    'total_goles' => $group->sum('goles'),
                    'total_asistencias' => $group->sum('asistencias'),
                    'total_partidos_jugados' => $group->sum('partidos_jugados'),
                    'detalle' => $group
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => $estadisticas
        ]);
    }

    public function getByPartido($partidoId)
    {
        $estadisticas = EstadisticaJugador::where('id_partido', $partidoId)
            ->with(['deportista.usuario', 'deportista.categoria', 'deportista.posiciones'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $estadisticas
        ]);
    }

    public function getRankingGoleadores(Request $request)
    {
        $query = EstadisticaJugador::select(
                'id_deportista',
                DB::raw('SUM(goles) as total_goles'),
                DB::raw('SUM(asistencias) as total_asistencias'),
                DB::raw('SUM(partidos_jugados) as total_partidos')
            )
            ->with(['deportista.usuario', 'deportista.categoria'])
            ->groupBy('id_deportista')
            ->orderBy('total_goles', 'desc')
            ->orderBy('total_asistencias', 'desc');

        if ($request->id_campeonato) {
            $query->where('id_campeonato', $request->id_campeonato);
        }

        if ($request->fecha_desde) {
            $query->whereHas('partido', function ($q) use ($request) {
                $q->whereDate('fecha', '>=', $request->fecha_desde);
            });
        }

        if ($request->fecha_hasta) {
            $query->whereHas('partido', function ($q) use ($request) {
                $q->whereDate('fecha', '<=', $request->fecha_hasta);
            });
        }

        $ranking = $request->has('limit') 
            ? $query->limit($request->limit)->get()
            : $query->get();

        return response()->json([
            'success' => true,
            'data' => $ranking
        ]);
    }

    public function getEstadisticasGenerales()
    {
        $estadisticas = EstadisticaJugador::select(
                DB::raw('COUNT(DISTINCT id_deportista) as total_jugadores'),
                DB::raw('SUM(goles) as total_goles'),
                DB::raw('SUM(asistencias) as total_asistencias'),
                DB::raw('SUM(partidos_jugados) as total_partidos'),
                DB::raw('AVG(goles) as promedio_goles_por_jugador'),
                DB::raw('AVG(asistencias) as promedio_asistencias_por_jugador')
            )
            ->first();

        return response()->json([
            'success' => true,
            'data' => $estadisticas
        ]);
    }
}