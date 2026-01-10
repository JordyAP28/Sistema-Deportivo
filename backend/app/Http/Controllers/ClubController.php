<?php

namespace App\Http\Controllers;

use App\Models\Club;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ClubController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $clubes = Club::with(['deportistas', 'campeonatos', 'partidosLocal', 'partidosVisitante'])->get();
            return response()->json([
                'success' => true,
                'data' => $clubes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los clubes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:200|unique:clubes,nombre',
            'slug' => 'required|string|max:200|unique:clubes,slug',
            'fecha_creacion' => 'required|date',
            'fecha_fundacion' => 'nullable|date',
            'representante' => 'required|string|max:100',
            'email' => 'required|email|max:100',
            'telefono' => 'required|string|max:20',
            'direccion' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'descripcion' => 'nullable|string',
            'redes_sociales' => 'nullable|array',
            'estado' => 'nullable|in:activo,inactivo,suspendido'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $request->all();
            
            // Manejar subida de logo
            if ($request->hasFile('logo')) {
                $logo = $request->file('logo');
                $logoPath = $logo->store('clubes', 'public');
                $data['logo'] = $logoPath;
            }

            // Convertir redes sociales a JSON si se proporcionan
            if ($request->has('redes_sociales')) {
                $data['redes_sociales'] = json_encode($request->redes_sociales);
            }

            $club = Club::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Club creado exitosamente',
                'data' => $club
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $club = Club::with([
                'deportistas.usuario',
                'deportistas.categoria',
                'deportistas.posiciones',
                'campeonatos',
                'partidosLocal.escenario',
                'partidosLocal.clubVisitante',
                'partidosVisitante.escenario',
                'partidosVisitante.clubLocal'
            ])->find($id);
            
            if (!$club) {
                return response()->json([
                    'success' => false,
                    'message' => 'Club no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $club
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'string|max:200|unique:clubes,nombre,' . $id . ',id_club',
            'slug' => 'string|max:200|unique:clubes,slug,' . $id . ',id_club',
            'fecha_creacion' => 'date',
            'fecha_fundacion' => 'nullable|date',
            'representante' => 'string|max:100',
            'email' => 'email|max:100',
            'telefono' => 'string|max:20',
            'direccion' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'descripcion' => 'nullable|string',
            'redes_sociales' => 'nullable|array',
            'estado' => 'nullable|in:activo,inactivo,suspendido'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $club = Club::find($id);
            
            if (!$club) {
                return response()->json([
                    'success' => false,
                    'message' => 'Club no encontrado'
                ], 404);
            }

            $data = $request->all();
            
            // Manejar subida de nuevo logo
            if ($request->hasFile('logo')) {
                // Eliminar logo anterior si existe
                if ($club->logo && Storage::disk('public')->exists($club->logo)) {
                    Storage::disk('public')->delete($club->logo);
                }
                
                $logo = $request->file('logo');
                $logoPath = $logo->store('clubes', 'public');
                $data['logo'] = $logoPath;
            }

            // Convertir redes sociales a JSON si se proporcionan
            if ($request->has('redes_sociales')) {
                $data['redes_sociales'] = json_encode($request->redes_sociales);
            }

            $club->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Club actualizado exitosamente',
                'data' => $club
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $club = Club::find($id);
            
            if (!$club) {
                return response()->json([
                    'success' => false,
                    'message' => 'Club no encontrado'
                ], 404);
            }

            // Verificar si hay datos asociados
            if ($club->deportistas()->count() > 0 ||
                $club->campeonatos()->count() > 0 ||
                $club->partidosLocal()->count() > 0 ||
                $club->partidosVisitante()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el club porque tiene datos asociados'
                ], 400);
            }

            // Eliminar logo si existe
            if ($club->logo && Storage::disk('public')->exists($club->logo)) {
                Storage::disk('public')->delete($club->logo);
            }

            $club->delete();

            return response()->json([
                'success' => true,
                'message' => 'Club eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un club eliminado.
     */
    public function restore(string $id)
    {
        try {
            $club = Club::withTrashed()->find($id);
            
            if (!$club) {
                return response()->json([
                    'success' => false,
                    'message' => 'Club no encontrado'
                ], 404);
            }

            if (!$club->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El club no está eliminado'
                ], 400);
            }

            $club->restore();

            return response()->json([
                'success' => true,
                'message' => 'Club restaurado exitosamente',
                'data' => $club
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar el club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener clubes activos.
     */
    public function activos()
    {
        try {
            $clubes = Club::where('estado', 'activo')
                ->with(['deportistas', 'campeonatos'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $clubes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener clubes activos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener deportistas de un club.
     */
    public function deportistas(string $id)
    {
        try {
            $club = Club::with(['deportistas.usuario', 'deportistas.categoria', 'deportistas.posiciones'])->find($id);
            
            if (!$club) {
                return response()->json([
                    'success' => false,
                    'message' => 'Club no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'club' => $club->nombre,
                    'deportistas' => $club->deportistas
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener deportistas del club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener campeonatos de un club.
     */
    public function campeonatos(string $id)
    {
        try {
            $club = Club::with(['campeonatos' => function($query) {
                $query->orderBy('fecha_inicio', 'desc');
            }])->find($id);
            
            if (!$club) {
                return response()->json([
                    'success' => false,
                    'message' => 'Club no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'club' => $club->nombre,
                    'campeonatos' => $club->campeonatos
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener campeonatos del club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener partidos de un club.
     */
    public function partidos(string $id, Request $request)
    {
        try {
            $club = Club::find($id);
            
            if (!$club) {
                return response()->json([
                    'success' => false,
                    'message' => 'Club no encontrado'
                ], 404);
            }

            $partidosLocal = $club->partidosLocal()->with(['escenario', 'clubVisitante', 'campeonato']);
            $partidosVisitante = $club->partidosVisitante()->with(['escenario', 'clubLocal', 'campeonato']);

            // Filtrar por fecha si se proporciona
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $partidosLocal->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
                $partidosVisitante->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
            }

            // Filtrar por estado si se proporciona
            if ($request->has('estado')) {
                $partidosLocal->where('estado', $request->estado);
                $partidosVisitante->where('estado', $request->estado);
            }

            $partidos = [
                'local' => $partidosLocal->orderBy('fecha', 'desc')->get(),
                'visitante' => $partidosVisitante->orderBy('fecha', 'desc')->get()
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'club' => $club->nombre,
                    'partidos' => $partidos
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener partidos del club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar clubes.
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
            
            $clubes = Club::where('nombre', 'like', "%{$busqueda}%")
                ->orWhere('representante', 'like', "%{$busqueda}%")
                ->orWhere('email', 'like', "%{$busqueda}%")
                ->orWhere('telefono', 'like', "%{$busqueda}%")
                ->orWhere('direccion', 'like', "%{$busqueda}%")
                ->orWhere('descripcion', 'like', "%{$busqueda}%")
                ->with(['deportistas', 'campeonatos'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $clubes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar clubes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de clubes.
     */
    public function estadisticas()
    {
        try {
            $total = Club::count();
            $activos = Club::where('estado', 'activo')->count();
            $inactivos = Club::where('estado', 'inactivo')->count();
            $suspendidos = Club::where('estado', 'suspendido')->count();
            
            $clubConMasDeportistas = Club::withCount('deportistas')
                ->orderBy('deportistas_count', 'desc')
                ->first();

            $clubConMasCampeonatos = Club::withCount('campeonatos')
                ->orderBy('campeonatos_count', 'desc')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'activos' => $activos,
                    'inactivos' => $inactivos,
                    'suspendidos' => $suspendidos,
                    'club_con_mas_deportistas' => $clubConMasDeportistas,
                    'club_con_mas_campeonatos' => $clubConMasCampeonatos
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
     * Agregar deportista a un club.
     */
    public function agregarDeportista(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'fecha_ingreso' => 'required|date',
            'numero_camiseta' => 'nullable|integer|min:1|max:99',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $club = Club::find($id);
            
            if (!$club) {
                return response()->json([
                    'success' => false,
                    'message' => 'Club no encontrado'
                ], 404);
            }

            // Verificar si el deportista ya está en el club (activo)
            $existente = $club->deportistas()
                ->where('id_deportista', $request->id_deportista)
                ->wherePivot('estado', 'activo')
                ->exists();

            if ($existente) {
                return response()->json([
                    'success' => false,
                    'message' => 'El deportista ya está activo en este club'
                ], 409);
            }

            // Agregar deportista al club
            $club->deportistas()->attach($request->id_deportista, [
                'fecha_ingreso' => $request->fecha_ingreso,
                'numero_camiseta' => $request->numero_camiseta,
                'observaciones' => $request->observaciones,
                'estado' => 'activo'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Deportista agregado al club exitosamente',
                'data' => $club->load('deportistas')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al agregar deportista al club: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remover deportista de un club.
     */
    public function removerDeportista(Request $request, string $idClub, string $idDeportista)
    {
        $validator = Validator::make($request->all(), [
            'fecha_salida' => 'required|date',
            'motivo' => 'required|string|in:transferido,retirado,fin_contrato,otro'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $club = Club::find($idClub);
            
            if (!$club) {
                return response()->json([
                    'success' => false,
                    'message' => 'Club no encontrado'
                ], 404);
            }

            // Verificar si el deportista está en el club
            $deportistaClub = $club->deportistas()
                ->where('id_deportista', $idDeportista)
                ->wherePivot('estado', 'activo')
                ->first();

            if (!$deportistaClub) {
                return response()->json([
                    'success' => false,
                    'message' => 'El deportista no está activo en este club'
                ], 404);
            }

            // Actualizar estado del deportista en el club
            $club->deportistas()->updateExistingPivot($idDeportista, [
                'fecha_salida' => $request->fecha_salida,
                'estado' => $request->motivo,
                'observaciones' => $request->observaciones ?? 'Removido del club'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Deportista removido del club exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al remover deportista del club: ' . $e->getMessage()
            ], 500);
        }
    }
}