<?php

namespace App\Http\Controllers;

use App\Models\Partido;
use App\Models\Campeonato;
use App\Models\Club;
use App\Models\Escenario;
use App\Models\EstadisticaJugador;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PartidoController extends Controller
{
    public function index(Request $request)
    {
        $query = Partido::with([
            'campeonato',
            'escenario',
            'clubLocal',
            'clubVisitante',
            'usuarioCreador',
            'usuarioActualizador'
        ])
        ->when($request->id_campeonato, function ($q) use ($request) {
            return $q->where('id_campeonato', $request->id_campeonato);
        })
        ->when($request->id_escenario, function ($q) use ($request) {
            return $q->where('id_escenario', $request->id_escenario);
        })
        ->when($request->club_local_id, function ($q) use ($request) {
            return $q->where('club_local_id', $request->club_local_id);
        })
        ->when($request->club_visitante_id, function ($q) use ($request) {
            return $q->where('club_visitante_id', $request->club_visitante_id);
        })
        ->when($request->estado, function ($q) use ($request) {
            return $q->where('estado', $request->estado);
        })
        ->when($request->fecha_desde, function ($q) use ($request) {
            return $q->whereDate('fecha', '>=', $request->fecha_desde);
        })
        ->when($request->fecha_hasta, function ($q) use ($request) {
            return $q->whereDate('fecha', '<=', $request->fecha_hasta);
        })
        ->when($request->resultado, function ($q) use ($request) {
            if ($request->resultado === 'local') {
                return $q->whereRaw('goles_local > goles_visitante');
            } elseif ($request->resultado === 'visitante') {
                return $q->whereRaw('goles_local < goles_visitante');
            } elseif ($request->resultado === 'empate') {
                return $q->whereRaw('goles_local = goles_visitante');
            }
        });

        // Ordenar por fecha y hora
        $query->orderBy('fecha', 'desc')->orderBy('hora', 'desc');

        $partidos = $request->has('per_page') 
            ? $query->paginate($request->per_page)
            : $query->get();

        return response()->json([
            'success' => true,
            'data' => $partidos
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_campeonato' => 'required|exists:campeonatos,id_campeonato',
            'id_escenario' => 'required|exists:escenarios,id_escenario',
            'club_local_id' => 'required|exists:clubes,id_club|different:club_visitante_id',
            'club_visitante_id' => 'required|exists:clubes,id_club|different:club_local_id',
            'fecha' => 'required|date',
            'hora' => 'required|date_format:H:i',
            'goles_local' => 'integer|min:0|nullable',
            'goles_visitante' => 'integer|min:0|nullable',
            'estado' => 'required|in:programado,en_juego,finalizado,suspendido,cancelado',
            'arbitro' => 'nullable|string|max:200',
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

            // Verificar que los clubes estén inscritos en el campeonato
            $campeonato = Campeonato::find($request->id_campeonato);
            
            $clubLocalInscrito = $campeonato->clubes()->where('id_club', $request->club_local_id)->exists();
            $clubVisitanteInscrito = $campeonato->clubes()->where('id_club', $request->club_visitante_id)->exists();

            if (!$clubLocalInscrito || !$clubVisitanteInscrito) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ambos clubes deben estar inscritos en el campeonato'
                ], 400);
            }

            // Verificar que el escenario esté disponible en la fecha y hora
            $partidoExistente = Partido::where('id_escenario', $request->id_escenario)
                ->whereDate('fecha', $request->fecha)
                ->where('hora', $request->hora)
                ->whereIn('estado', ['programado', 'en_juego'])
                ->exists();

            if ($partidoExistente) {
                return response()->json([
                    'success' => false,
                    'message' => 'El escenario ya está ocupado en esa fecha y hora'
                ], 409);
            }

            // Verificar que los clubes no tengan otro partido a la misma hora
            $clubLocalOcupado = Partido::where(function ($q) use ($request) {
                    $q->where('club_local_id', $request->club_local_id)
                      ->orWhere('club_visitante_id', $request->club_local_id);
                })
                ->whereDate('fecha', $request->fecha)
                ->where('hora', $request->hora)
                ->whereIn('estado', ['programado', 'en_juego'])
                ->exists();

            $clubVisitanteOcupado = Partido::where(function ($q) use ($request) {
                    $q->where('club_local_id', $request->club_visitante_id)
                      ->orWhere('club_visitante_id', $request->club_visitante_id);
                })
                ->whereDate('fecha', $request->fecha)
                ->where('hora', $request->hora)
                ->whereIn('estado', ['programado', 'en_juego'])
                ->exists();

            if ($clubLocalOcupado || $clubVisitanteOcupado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Uno de los clubes ya tiene un partido programado a esa hora'
                ], 409);
            }

            $partido = Partido::create([
                'id_campeonato' => $request->id_campeonato,
                'id_escenario' => $request->id_escenario,
                'club_local_id' => $request->club_local_id,
                'club_visitante_id' => $request->club_visitante_id,
                'fecha' => $request->fecha,
                'hora' => $request->hora,
                'goles_local' => $request->goles_local ?? 0,
                'goles_visitante' => $request->goles_visitante ?? 0,
                'estado' => $request->estado,
                'arbitro' => $request->arbitro,
                'observaciones' => $request->observaciones,
                'created_by' => $request->user()->id_usuario,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Partido creado exitosamente',
                'data' => $partido->load(['campeonato', 'escenario', 'clubLocal', 'clubVisitante'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el partido: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $partido = Partido::with([
            'campeonato',
            'escenario',
            'clubLocal',
            'clubVisitante',
            'usuarioCreador',
            'usuarioActualizador',
            'estadisticas.deportista.usuario',
            'estadisticas.deportista.categoria'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $partido
        ]);
    }

    public function update(Request $request, $id)
    {
        $partido = Partido::findOrFail($id);

        // Si el partido ya está finalizado, solo permitir ciertas actualizaciones
        if ($partido->estado === 'finalizado' && !$request->has('observaciones')) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede modificar un partido finalizado'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'id_escenario' => 'nullable|exists:escenarios,id_escenario',
            'fecha' => 'nullable|date',
            'hora' => 'nullable|date_format:H:i',
            'goles_local' => 'integer|min:0|nullable',
            'goles_visitante' => 'integer|min:0|nullable',
            'estado' => 'nullable|in:programado,en_juego,finalizado,suspendido,cancelado',
            'arbitro' => 'nullable|string|max:200',
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

            // Si se está finalizando el partido, actualizar estadísticas del campeonato
            if ($request->estado === 'finalizado' && $partido->estado !== 'finalizado') {
                $this->actualizarEstadisticasCampeonato($partido, $request);
            }

            $partido->update([
                'id_escenario' => $request->id_escenario ?? $partido->id_escenario,
                'fecha' => $request->fecha ?? $partido->fecha,
                'hora' => $request->hora ?? $partido->hora,
                'goles_local' => $request->goles_local ?? $partido->goles_local,
                'goles_visitante' => $request->goles_visitante ?? $partido->goles_visitante,
                'estado' => $request->estado ?? $partido->estado,
                'arbitro' => $request->arbitro ?? $partido->arbitro,
                'observaciones' => $request->observaciones ?? $partido->observaciones,
                'updated_by' => $request->user()->id_usuario,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Partido actualizado exitosamente',
                'data' => $partido->load(['campeonato', 'escenario', 'clubLocal', 'clubVisitante'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el partido: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $partido = Partido::findOrFail($id);

            // No permitir eliminar partidos finalizados
            if ($partido->estado === 'finalizado') {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar un partido finalizado'
                ], 400);
            }

            $partido->delete();

            return response()->json([
                'success' => true,
                'message' => 'Partido eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el partido: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getByCampeonato($campeonatoId)
    {
        $partidos = Partido::where('id_campeonato', $campeonatoId)
            ->with(['escenario', 'clubLocal', 'clubVisitante'])
            ->orderBy('fecha', 'desc')
            ->orderBy('hora', 'desc')
            ->get();

        // Estadísticas del campeonato
        $estadisticas = [
            'total_partidos' => $partidos->count(),
            'partidos_jugados' => $partidos->where('estado', 'finalizado')->count(),
            'partidos_programados' => $partidos->where('estado', 'programado')->count(),
            'total_goles' => $partidos->sum(function ($partido) {
                return $partido->goles_local + $partido->goles_visitante;
            }),
            'promedio_goles_por_partido' => $partidos->where('estado', 'finalizado')->count() > 0 
                ? round($partidos->where('estado', 'finalizado')->sum(function ($partido) {
                    return $partido->goles_local + $partido->goles_visitante;
                }) / $partidos->where('estado', 'finalizado')->count(), 2)
                : 0,
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'partidos' => $partidos,
                'estadisticas' => $estadisticas
            ]
        ]);
    }

    public function getByClub($clubId)
    {
        $partidos = Partido::where('club_local_id', $clubId)
            ->orWhere('club_visitante_id', $clubId)
            ->with(['campeonato', 'escenario', 'clubLocal', 'clubVisitante'])
            ->orderBy('fecha', 'desc')
            ->orderBy('hora', 'desc')
            ->get();

        // Estadísticas del club
        $estadisticas = [
            'total_partidos' => $partidos->count(),
            'partidos_como_local' => $partidos->where('club_local_id', $clubId)->count(),
            'partidos_como_visitante' => $partidos->where('club_visitante_id', $clubId)->count(),
            'victorias' => $partidos->where('estado', 'finalizado')->filter(function ($partido) use ($clubId) {
                return ($partido->club_local_id == $clubId && $partido->goles_local > $partido->goles_visitante) ||
                       ($partido->club_visitante_id == $clubId && $partido->goles_visitante > $partido->goles_local);
            })->count(),
            'derrotas' => $partidos->where('estado', 'finalizado')->filter(function ($partido) use ($clubId) {
                return ($partido->club_local_id == $clubId && $partido->goles_local < $partido->goles_visitante) ||
                       ($partido->club_visitante_id == $clubId && $partido->goles_visitante < $partido->goles_local);
            })->count(),
            'empates' => $partidos->where('estado', 'finalizado')->filter(function ($partido) use ($clubId) {
                return $partido->goles_local == $partido->goles_visitante;
            })->count(),
            'goles_a_favor' => $partidos->where('estado', 'finalizado')->sum(function ($partido) use ($clubId) {
                return $partido->club_local_id == $clubId ? $partido->goles_local : $partido->goles_visitante;
            }),
            'goles_en_contra' => $partidos->where('estado', 'finalizado')->sum(function ($partido) use ($clubId) {
                return $partido->club_local_id == $clubId ? $partido->goles_visitante : $partido->goles_local;
            }),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'partidos' => $partidos,
                'estadisticas' => $estadisticas
            ]
        ]);
    }

    public function getProximosPartidos(Request $request)
    {
        $query = Partido::with(['campeonato', 'escenario', 'clubLocal', 'clubVisitante'])
            ->where('estado', 'programado')
            ->whereDate('fecha', '>=', now())
            ->orderBy('fecha', 'asc')
            ->orderBy('hora', 'asc');

        if ($request->dias) {
            $fechaHasta = now()->addDays($request->dias);
            $query->whereDate('fecha', '<=', $fechaHasta);
        }

        $partidos = $request->has('limit') 
            ? $query->limit($request->limit)->get()
            : $query->get();

        return response()->json([
            'success' => true,
            'data' => $partidos
        ]);
    }

    public function getHistorialPartidos($clubLocalId, $clubVisitanteId)
    {
        $partidos = Partido::where(function ($q) use ($clubLocalId, $clubVisitanteId) {
                $q->where('club_local_id', $clubLocalId)
                  ->where('club_visitante_id', $clubVisitanteId);
            })
            ->orWhere(function ($q) use ($clubLocalId, $clubVisitanteId) {
                $q->where('club_local_id', $clubVisitanteId)
                  ->where('club_visitante_id', $clubLocalId);
            })
            ->with(['campeonato', 'escenario'])
            ->where('estado', 'finalizado')
            ->orderBy('fecha', 'desc')
            ->get();

        // Estadísticas del enfrentamiento
        $estadisticas = [
            'total_partidos' => $partidos->count(),
            'victorias_local' => $partidos->filter(function ($partido) use ($clubLocalId) {
                return ($partido->club_local_id == $clubLocalId && $partido->goles_local > $partido->goles_visitante) ||
                       ($partido->club_visitante_id == $clubLocalId && $partido->goles_visitante > $partido->goles_local);
            })->count(),
            'victorias_visitante' => $partidos->filter(function ($partido) use ($clubVisitanteId) {
                return ($partido->club_local_id == $clubVisitanteId && $partido->goles_local > $partido->goles_visitante) ||
                       ($partido->club_visitante_id == $clubVisitanteId && $partido->goles_visitante > $partido->goles_local);
            })->count(),
            'empates' => $partidos->filter(function ($partido) {
                return $partido->goles_local == $partido->goles_visitante;
            })->count(),
            'goles_local' => $partidos->sum(function ($partido) use ($clubLocalId) {
                return $partido->club_local_id == $clubLocalId ? $partido->goles_local : $partido->goles_visitante;
            }),
            'goles_visitante' => $partidos->sum(function ($partido) use ($clubVisitanteId) {
                return $partido->club_local_id == $clubVisitanteId ? $partido->goles_local : $partido->goles_visitante;
            }),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'partidos' => $partidos,
                'estadisticas' => $estadisticas
            ]
        ]);
    }

    public function getCalendario(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mes' => 'required|integer|between:1,12',
            'ano' => 'required|integer|min:2000|max:2100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $fechaInicio = \Carbon\Carbon::create($request->ano, $request->mes, 1)->startOfMonth();
        $fechaFin = $fechaInicio->copy()->endOfMonth();

        $partidos = Partido::with(['campeonato', 'escenario', 'clubLocal', 'clubVisitante'])
            ->whereBetween('fecha', [$fechaInicio, $fechaFin])
            ->orderBy('fecha', 'asc')
            ->orderBy('hora', 'asc')
            ->get()
            ->groupBy(function ($partido) {
                return $partido->fecha->format('Y-m-d');
            });

        return response()->json([
            'success' => true,
            'data' => [
                'mes' => $fechaInicio->monthName,
                'ano' => $fechaInicio->year,
                'calendario' => $partidos
            ]
        ]);
    }

    public function actualizarResultado(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'goles_local' => 'required|integer|min:0',
            'goles_visitante' => 'required|integer|min:0',
            'estadisticas' => 'nullable|array',
            'estadisticas.*.id_deportista' => 'required|exists:deportistas,id_deportista',
            'estadisticas.*.goles' => 'integer|min:0',
            'estadisticas.*.asistencias' => 'integer|min:0',
            'estadisticas.*.tarjetas_amarillas' => 'integer|min:0',
            'estadisticas.*.tarjetas_rojas' => 'integer|min:0',
            'estadisticas.*.minutos_jugados' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $partido = Partido::findOrFail($id);

            // Actualizar resultado
            $partido->update([
                'goles_local' => $request->goles_local,
                'goles_visitante' => $request->goles_visitante,
                'estado' => 'finalizado',
                'updated_by' => $request->user()->id_usuario,
            ]);

            // Registrar estadísticas de jugadores si se proporcionan
            if ($request->has('estadisticas')) {
                foreach ($request->estadisticas as $estadisticaData) {
                    EstadisticaJugador::create([
                        'id_deportista' => $estadisticaData['id_deportista'],
                        'id_partido' => $partido->id_partido,
                        'id_campeonato' => $partido->id_campeonato,
                        'goles' => $estadisticaData['goles'] ?? 0,
                        'asistencias' => $estadisticaData['asistencias'] ?? 0,
                        'tarjetas_amarillas' => $estadisticaData['tarjetas_amarillas'] ?? 0,
                        'tarjetas_rojas' => $estadisticaData['tarjetas_rojas'] ?? 0,
                        'minutos_jugados' => $estadisticaData['minutos_jugados'] ?? 0,
                        'partidos_jugados' => 1,
                        'partidos_titular' => $estadisticaData['titular'] ?? 1,
                        'partidos_suplente' => $estadisticaData['titular'] ? 0 : 1,
                        'created_by' => $request->user()->id_usuario,
                    ]);
                }
            }

            // Actualizar estadísticas del campeonato
            $this->actualizarEstadisticasCampeonato($partido, $request);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Resultado del partido actualizado exitosamente',
                'data' => $partido->load(['campeonato', 'clubLocal', 'clubVisitante', 'estadisticas'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el resultado: ' . $e->getMessage()
            ], 500);
        }
    }

    private function actualizarEstadisticasCampeonato($partido, $request)
    {
        // Actualizar estadísticas del club local en el campeonato
        $clubLocalCampeonato = DB::table('club_campeonatos')
            ->where('id_club', $partido->club_local_id)
            ->where('id_campeonato', $partido->id_campeonato)
            ->first();

        if ($clubLocalCampeonato) {
            $golesLocal = $request->goles_local ?? $partido->goles_local;
            $golesVisitante = $request->goles_visitante ?? $partido->goles_visitante;

            $updateData = [
                'partidos_jugados' => $clubLocalCampeonato->partidos_jugados + 1,
                'goles_favor' => $clubLocalCampeonato->goles_favor + $golesLocal,
                'goles_contra' => $clubLocalCampeonato->goles_contra + $golesVisitante,
            ];

            if ($golesLocal > $golesVisitante) {
                $updateData['partidos_ganados'] = $clubLocalCampeonato->partidos_ganados + 1;
                $updateData['puntos'] = $clubLocalCampeonato->puntos + 3;
            } elseif ($golesLocal < $golesVisitante) {
                $updateData['partidos_perdidos'] = $clubLocalCampeonato->partidos_perdidos + 1;
            } else {
                $updateData['partidos_empatados'] = $clubLocalCampeonato->partidos_empatados + 1;
                $updateData['puntos'] = $clubLocalCampeonato->puntos + 1;
            }

            DB::table('club_campeonatos')
                ->where('id_club_campeonato', $clubLocalCampeonato->id_club_campeonato)
                ->update($updateData);
        }

        // Actualizar estadísticas del club visitante en el campeonato
        $clubVisitanteCampeonato = DB::table('club_campeonatos')
            ->where('id_club', $partido->club_visitante_id)
            ->where('id_campeonato', $partido->id_campeonato)
            ->first();

        if ($clubVisitanteCampeonato) {
            $golesLocal = $request->goles_local ?? $partido->goles_local;
            $golesVisitante = $request->goles_visitante ?? $partido->goles_visitante;

            $updateData = [
                'partidos_jugados' => $clubVisitanteCampeonato->partidos_jugados + 1,
                'goles_favor' => $clubVisitanteCampeonato->goles_favor + $golesVisitante,
                'goles_contra' => $clubVisitanteCampeonato->goles_contra + $golesLocal,
            ];

            if ($golesVisitante > $golesLocal) {
                $updateData['partidos_ganados'] = $clubVisitanteCampeonato->partidos_ganados + 1;
                $updateData['puntos'] = $clubVisitanteCampeonato->puntos + 3;
            } elseif ($golesVisitante < $golesLocal) {
                $updateData['partidos_perdidos'] = $clubVisitanteCampeonato->partidos_perdidos + 1;
            } else {
                $updateData['partidos_empatados'] = $clubVisitanteCampeonato->partidos_empatados + 1;
                $updateData['puntos'] = $clubVisitanteCampeonato->puntos + 1;
            }

            DB::table('club_campeonatos')
                ->where('id_club_campeonato', $clubVisitanteCampeonato->id_club_campeonato)
                ->update($updateData);
        }
    }
}