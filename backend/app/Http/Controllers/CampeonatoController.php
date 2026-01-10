<?php

namespace App\Http\Controllers;

use App\Models\Campeonato;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class CampeonatoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $campeonatos = Campeonato::with(['clubes', 'partidos'])->get();
            return response()->json([
                'success' => true,
                'data' => $campeonatos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los campeonatos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:200',
            'slug' => 'required|string|max:200|unique:campeonatos,slug',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio',
            'categoria' => 'required|string|max:100',
            'representante' => 'required|string|max:100',
            'email_representante' => 'required|email|max:100',
            'telefono_representante' => 'required|string|max:20',
            'descripcion' => 'nullable|string',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'estado' => 'nullable|in:pendiente,activo,finalizado,cancelado',
            'reglas' => 'nullable|array'
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
                $imagenPath = $imagen->store('campeonatos', 'public');
                $data['imagen'] = $imagenPath;
            }

            // Convertir reglas a JSON si se proporcionan
            if ($request->has('reglas')) {
                $data['reglas'] = json_encode($request->reglas);
            }

            $campeonato = Campeonato::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Campeonato creado exitosamente',
                'data' => $campeonato
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $campeonato = Campeonato::with([
                'clubes',
                'partidos.escenario',
                'partidos.clubLocal',
                'partidos.clubVisitante',
                'estadisticas.deportista'
            ])->find($id);
            
            if (!$campeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campeonato no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $campeonato
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'string|max:200',
            'slug' => 'string|max:200|unique:campeonatos,slug,' . $id . ',id_campeonato',
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date|after:fecha_inicio',
            'categoria' => 'string|max:100',
            'representante' => 'string|max:100',
            'email_representante' => 'email|max:100',
            'telefono_representante' => 'string|max:20',
            'descripcion' => 'nullable|string',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'estado' => 'nullable|in:pendiente,activo,finalizado,cancelado',
            'reglas' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $campeonato = Campeonato::find($id);
            
            if (!$campeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campeonato no encontrado'
                ], 404);
            }

            $data = $request->all();
            
            // Manejar subida de nueva imagen
            if ($request->hasFile('imagen')) {
                // Eliminar imagen anterior si existe
                if ($campeonato->imagen && Storage::disk('public')->exists($campeonato->imagen)) {
                    Storage::disk('public')->delete($campeonato->imagen);
                }
                
                $imagen = $request->file('imagen');
                $imagenPath = $imagen->store('campeonatos', 'public');
                $data['imagen'] = $imagenPath;
            }

            // Convertir reglas a JSON si se proporcionan
            if ($request->has('reglas')) {
                $data['reglas'] = json_encode($request->reglas);
            }

            $campeonato->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Campeonato actualizado exitosamente',
                'data' => $campeonato
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $campeonato = Campeonato::find($id);
            
            if (!$campeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campeonato no encontrado'
                ], 404);
            }

            // Verificar si hay datos asociados
            if ($campeonato->clubes()->count() > 0 ||
                $campeonato->partidos()->count() > 0 ||
                $campeonato->estadisticas()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el campeonato porque tiene datos asociados'
                ], 400);
            }

            // Eliminar imagen si existe
            if ($campeonato->imagen && Storage::disk('public')->exists($campeonato->imagen)) {
                Storage::disk('public')->delete($campeonato->imagen);
            }

            $campeonato->delete();

            return response()->json([
                'success' => true,
                'message' => 'Campeonato eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un campeonato eliminado.
     */
    public function restore(string $id)
    {
        try {
            $campeonato = Campeonato::withTrashed()->find($id);
            
            if (!$campeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campeonato no encontrado'
                ], 404);
            }

            if (!$campeonato->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El campeonato no está eliminado'
                ], 400);
            }

            $campeonato->restore();

            return response()->json([
                'success' => true,
                'message' => 'Campeonato restaurado exitosamente',
                'data' => $campeonato
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar el campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener campeonatos activos.
     */
    public function activos()
    {
        try {
            $campeonatos = Campeonato::where('estado', 'activo')
                ->with(['clubes', 'partidos'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $campeonatos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener campeonatos activos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener clubes participantes en un campeonato.
     */
    public function clubes(string $id)
    {
        try {
            $campeonato = Campeonato::with(['clubes' => function($query) {
                $query->orderBy('puntos', 'desc');
            }])->find($id);
            
            if (!$campeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campeonato no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'campeonato' => $campeonato->nombre,
                    'clubes' => $campeonato->clubes
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener clubes del campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener partidos de un campeonato.
     */
    public function partidos(string $id, Request $request)
    {
        try {
            $campeonato = Campeonato::find($id);
            
            if (!$campeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campeonato no encontrado'
                ], 404);
            }

            $query = $campeonato->partidos()->with(['escenario', 'clubLocal', 'clubVisitante']);
            
            // Filtrar por fecha si se proporciona
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
            }
            
            // Filtrar por estado si se proporciona
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            $partidos = $query->orderBy('fecha', 'asc')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'campeonato' => $campeonato->nombre,
                    'partidos' => $partidos
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener partidos del campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar campeonatos.
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
            
            $campeonatos = Campeonato::where('nombre', 'like', "%{$busqueda}%")
                ->orWhere('categoria', 'like', "%{$busqueda}%")
                ->orWhere('descripcion', 'like', "%{$busqueda}%")
                ->orWhere('representante', 'like', "%{$busqueda}%")
                ->with(['clubes', 'partidos'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $campeonatos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar campeonatos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener tabla de posiciones de un campeonato.
     */
    public function tablaPosiciones(string $id)
    {
        try {
            $campeonato = Campeonato::find($id);
            
            if (!$campeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campeonato no encontrado'
                ], 404);
            }

            $clubes = $campeonato->clubes()
                ->orderBy('puntos', 'desc')
                ->orderBy('goles_favor', 'desc')
                ->orderBy('partidos_ganados', 'desc')
                ->get();

            $tabla = [];
            $posicion = 1;
            
            foreach ($clubes as $club) {
                $tabla[] = [
                    'posicion' => $posicion++,
                    'club' => $club->nombre,
                    'puntos' => $club->pivot->puntos,
                    'pj' => $club->pivot->partidos_jugados,
                    'pg' => $club->pivot->partidos_ganados,
                    'pe' => $club->pivot->partidos_empatados,
                    'pp' => $club->pivot->partidos_perdidos,
                    'gf' => $club->pivot->goles_favor,
                    'gc' => $club->pivot->goles_contra,
                    'dif' => $club->pivot->goles_favor - $club->pivot->goles_contra
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'campeonato' => $campeonato->nombre,
                    'tabla_posiciones' => $tabla
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener tabla de posiciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de un campeonato.
     */
    public function estadisticas(string $id)
    {
        try {
            $campeonato = Campeonato::with(['clubes', 'partidos'])->find($id);
            
            if (!$campeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campeonato no encontrado'
                ], 404);
            }

            $totalClubes = $campeonato->clubes()->count();
            $totalPartidos = $campeonato->partidos()->count();
            $partidosJugados = $campeonato->partidos()->where('estado', 'finalizado')->count();
            $partidosPendientes = $campeonato->partidos()->where('estado', 'programado')->count();
            
            // Goleador del campeonato
            $goleador = $campeonato->estadisticas()
                ->selectRaw('id_deportista, SUM(goles) as total_goles')
                ->groupBy('id_deportista')
                ->orderBy('total_goles', 'desc')
                ->with('deportista')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'campeonato' => $campeonato->nombre,
                    'total_clubes' => $totalClubes,
                    'total_partidos' => $totalPartidos,
                    'partidos_jugados' => $partidosJugados,
                    'partidos_pendientes' => $partidosPendientes,
                    'goleador' => $goleador
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas del campeonato: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Inscribir club a campeonato.
     */
    public function inscribirClub(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'id_club' => 'required|exists:clubes,id_club',
            'fecha_inscripcion' => 'required|date',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $campeonato = Campeonato::find($id);
            
            if (!$campeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campeonato no encontrado'
                ], 404);
            }

            // Verificar si el club ya está inscrito
            $yaInscrito = $campeonato->clubes()
                ->where('id_club', $request->id_club)
                ->exists();

            if ($yaInscrito) {
                return response()->json([
                    'success' => false,
                    'message' => 'El club ya está inscrito en este campeonato'
                ], 409);
            }

            // Verificar estado del campeonato
            if ($campeonato->estado !== 'pendiente' && $campeonato->estado !== 'activo') {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pueden inscribir clubes en un campeonato ' . $campeonato->estado
                ], 400);
            }

            // Inscribir club
            $campeonato->clubes()->attach($request->id_club, [
                'fecha_inscripcion' => $request->fecha_inscripcion,
                'observaciones' => $request->observaciones,
                'estado' => 'inscrito'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Club inscrito exitosamente en el campeonato'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al inscribir club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar club de campeonato.
     */
    public function eliminarClub(string $idCampeonato, string $idClub)
    {
        try {
            $campeonato = Campeonato::find($idCampeonato);
            
            if (!$campeonato) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campeonato no encontrado'
                ], 404);
            }

            // Verificar si el club está inscrito
            $inscrito = $campeonato->clubes()
                ->where('id_club', $idClub)
                ->exists();

            if (!$inscrito) {
                return response()->json([
                    'success' => false,
                    'message' => 'El club no está inscrito en este campeonato'
                ], 404);
            }

            // Verificar si el club ha jugado partidos
            $partidosJugados = $campeonato->partidos()
                ->where(function($query) use ($idClub) {
                    $query->where('club_local_id', $idClub)
                          ->orWhere('club_visitante_id', $idClub);
                })
                ->where('estado', 'finalizado')
                ->exists();

            if ($partidosJugados) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el club porque ya ha jugado partidos en el campeonato'
                ], 400);
            }

            // Eliminar club del campeonato
            $campeonato->clubes()->detach($idClub);

            return response()->json([
                'success' => true,
                'message' => 'Club eliminado del campeonato exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar club del campeonato: ' . $e->getMessage()
            ], 500);
        }
    }
}