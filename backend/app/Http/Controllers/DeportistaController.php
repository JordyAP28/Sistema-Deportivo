<?php

namespace App\Http\Controllers;

use App\Models\Deportista;
use App\Models\Usuario;
use App\Models\Categoria;
use App\Models\Posicion;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class DeportistaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $deportistas = Deportista::with([
                'usuario',
                'categoria',
                'posiciones',
                'clubes',
                'facturas',
                'asistencias',
                'lesiones',
                'estadisticas'
            ])->get();
            
            return response()->json([
                'success' => true,
                'data' => $deportistas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los deportistas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_usuario' => 'required|exists:usuarios,id_usuario',
            'id_categoria' => 'required|exists:categorias,id_categoria',
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'fecha_nacimiento' => 'required|date',
            'genero' => 'required|in:masculino,femenino',
            'tipo_documento' => 'required|string|max:20',
            'numero_documento' => 'required|string|max:20|unique:deportistas,numero_documento',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'direccion' => 'nullable|string',
            'correo' => 'nullable|email|max:100',
            'telefono' => 'nullable|string|max:20',
            'altura' => 'nullable|numeric|min:0.5|max:3',
            'peso' => 'nullable|numeric|min:20|max:200',
            'pie_habil' => 'nullable|string|max:10',
            'numero_camiseta' => 'nullable|integer|min:1|max:99',
            'estado' => 'nullable|in:activo,inactivo,lesionado,suspendido',
            'contacto_emergencia_nombre' => 'nullable|string|max:100',
            'contacto_emergencia_telefono' => 'nullable|string|max:20',
            'contacto_emergencia_relacion' => 'nullable|string|max:50',
            'posiciones' => 'nullable|array',
            'posiciones.*' => 'exists:posiciones,id_posicion'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $request->all();
            
            // Manejar subida de foto
            if ($request->hasFile('foto')) {
                $foto = $request->file('foto');
                $fotoPath = $foto->store('deportistas', 'public');
                $data['foto'] = $fotoPath;
            }

            // Crear deportista
            $deportista = Deportista::create($data);
            
            // Asignar posiciones si se proporcionan
            if ($request->has('posiciones')) {
                $posicionesData = [];
                foreach ($request->posiciones as $index => $idPosicion) {
                    $posicionesData[$idPosicion] = ['principal' => $index === 0]; // La primera es principal
                }
                $deportista->posiciones()->sync($posicionesData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Deportista creado exitosamente',
                'data' => $deportista->load(['usuario', 'categoria', 'posiciones'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $deportista = Deportista::with([
                'usuario',
                'categoria',
                'posiciones',
                'clubes.club',
                'facturas',
                'asistencias.actividad',
                'lesiones',
                'estadisticas.partido',
                'estadisticas.campeonato'
            ])->find($id);
            
            if (!$deportista) {
                return response()->json([
                    'success' => false,
                    'message' => 'Deportista no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $deportista
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'id_usuario' => 'exists:usuarios,id_usuario',
            'id_categoria' => 'exists:categorias,id_categoria',
            'nombres' => 'string|max:100',
            'apellidos' => 'string|max:100',
            'fecha_nacimiento' => 'date',
            'genero' => 'in:masculino,femenino',
            'tipo_documento' => 'string|max:20',
            'numero_documento' => 'string|max:20|unique:deportistas,numero_documento,' . $id . ',id_deportista',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'direccion' => 'nullable|string',
            'correo' => 'nullable|email|max:100',
            'telefono' => 'nullable|string|max:20',
            'altura' => 'nullable|numeric|min:0.5|max:3',
            'peso' => 'nullable|numeric|min:20|max:200',
            'pie_habil' => 'nullable|string|max:10',
            'numero_camiseta' => 'nullable|integer|min:1|max:99',
            'estado' => 'nullable|in:activo,inactivo,lesionado,suspendido',
            'contacto_emergencia_nombre' => 'nullable|string|max:100',
            'contacto_emergencia_telefono' => 'nullable|string|max:20',
            'contacto_emergencia_relacion' => 'nullable|string|max:50',
            'posiciones' => 'nullable|array',
            'posiciones.*' => 'exists:posiciones,id_posicion'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $deportista = Deportista::find($id);
            
            if (!$deportista) {
                return response()->json([
                    'success' => false,
                    'message' => 'Deportista no encontrado'
                ], 404);
            }

            $data = $request->all();
            
            // Manejar subida de nueva foto
            if ($request->hasFile('foto')) {
                // Eliminar foto anterior si existe
                if ($deportista->foto && Storage::disk('public')->exists($deportista->foto)) {
                    Storage::disk('public')->delete($deportista->foto);
                }
                
                $foto = $request->file('foto');
                $fotoPath = $foto->store('deportistas', 'public');
                $data['foto'] = $fotoPath;
            }

            $deportista->update($data);
            
            // Actualizar posiciones si se proporcionan
            if ($request->has('posiciones')) {
                $posicionesData = [];
                foreach ($request->posiciones as $index => $idPosicion) {
                    $posicionesData[$idPosicion] = ['principal' => $index === 0];
                }
                $deportista->posiciones()->sync($posicionesData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Deportista actualizado exitosamente',
                'data' => $deportista->load(['usuario', 'categoria', 'posiciones'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $deportista = Deportista::find($id);
            
            if (!$deportista) {
                return response()->json([
                    'success' => false,
                    'message' => 'Deportista no encontrado'
                ], 404);
            }

            // Verificar si hay datos asociados
            if ($deportista->facturas()->count() > 0 ||
                $deportista->asistencias()->count() > 0 ||
                $deportista->lesiones()->count() > 0 ||
                $deportista->estadisticas()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el deportista porque tiene datos asociados'
                ], 400);
            }

            // Eliminar foto si existe
            if ($deportista->foto && Storage::disk('public')->exists($deportista->foto)) {
                Storage::disk('public')->delete($deportista->foto);
            }

            $deportista->delete();

            return response()->json([
                'success' => true,
                'message' => 'Deportista eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un deportista eliminado.
     */
    public function restore(string $id)
    {
        try {
            $deportista = Deportista::withTrashed()->find($id);
            
            if (!$deportista) {
                return response()->json([
                    'success' => false,
                    'message' => 'Deportista no encontrado'
                ], 404);
            }

            if (!$deportista->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El deportista no está eliminado'
                ], 400);
            }

            $deportista->restore();

            return response()->json([
                'success' => true,
                'message' => 'Deportista restaurado exitosamente',
                'data' => $deportista
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar el deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar posiciones a un deportista.
     */
    public function asignarPosiciones(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'posiciones' => 'required|array|min:1',
            'posiciones.*.id_posicion' => 'required|exists:posiciones,id_posicion',
            'posiciones.*.principal' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $deportista = Deportista::find($id);
            
            if (!$deportista) {
                return response()->json([
                    'success' => false,
                    'message' => 'Deportista no encontrado'
                ], 404);
            }

            $posicionesData = [];
            foreach ($request->posiciones as $posicion) {
                $posicionesData[$posicion['id_posicion']] = [
                    'principal' => $posicion['principal'] ?? false
                ];
            }

            $deportista->posiciones()->sync($posicionesData);

            return response()->json([
                'success' => true,
                'message' => 'Posiciones asignadas exitosamente',
                'data' => $deportista->load('posiciones')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar posiciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener deportistas por categoría.
     */
    public function porCategoria(string $idCategoria)
    {
        try {
            $deportistas = Deportista::where('id_categoria', $idCategoria)
                ->with(['usuario', 'categoria', 'posiciones', 'clubes'])
                ->get();

            if ($deportistas->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron deportistas para la categoría especificada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $deportistas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener deportistas por categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener deportistas por estado.
     */
    public function porEstado(string $estado)
    {
        try {
            $deportistas = Deportista::where('estado', $estado)
                ->with(['usuario', 'categoria', 'posiciones'])
                ->get();

            if ($deportistas->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron deportistas con el estado especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $deportistas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener deportistas por estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar deportistas.
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
            
            $deportistas = Deportista::where('nombres', 'like', "%{$busqueda}%")
                ->orWhere('apellidos', 'like', "%{$busqueda}%")
                ->orWhere('numero_documento', 'like', "%{$busqueda}%")
                ->orWhere('correo', 'like', "%{$busqueda}%")
                ->orWhere('telefono', 'like', "%{$busqueda}%")
                ->with(['usuario', 'categoria', 'posiciones'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $deportistas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar deportistas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de deportistas.
     */
    public function estadisticas()
    {
        try {
            $total = Deportista::count();
            $activos = Deportista::where('estado', 'activo')->count();
            $inactivos = Deportista::where('estado', 'inactivo')->count();
            $lesionados = Deportista::where('estado', 'lesionado')->count();
            $suspendidos = Deportista::where('estado', 'suspendido')->count();
            
            $porGenero = Deportista::selectRaw('genero, COUNT(*) as total')
                ->groupBy('genero')
                ->get();
            
            $porCategoria = Deportista::selectRaw('id_categoria, COUNT(*) as total')
                ->groupBy('id_categoria')
                ->with('categoria')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'activos' => $activos,
                    'inactivos' => $inactivos,
                    'lesionados' => $lesionados,
                    'suspendidos' => $suspendidos,
                    'por_genero' => $porGenero,
                    'por_categoria' => $porCategoria
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
     * Obtener historial médico (lesiones) de un deportista.
     */
    public function historialMedico(string $id)
    {
        try {
            $deportista = Deportista::with(['lesiones' => function($query) {
                $query->orderBy('fecha_lesion', 'desc');
            }])->find($id);
            
            if (!$deportista) {
                return response()->json([
                    'success' => false,
                    'message' => 'Deportista no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'deportista' => $deportista->nombres . ' ' . $deportista->apellidos,
                    'lesiones' => $deportista->lesiones
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener historial médico: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener asistencias de un deportista.
     */
    public function asistencias(string $id, Request $request)
    {
        try {
            $deportista = Deportista::find($id);
            
            if (!$deportista) {
                return response()->json([
                    'success' => false,
                    'message' => 'Deportista no encontrado'
                ], 404);
            }

            $query = $deportista->asistencias()->with('actividad');
            
            // Filtrar por fecha si se proporciona
            if ($request->has('fecha_inicio') && $request->has('fecha_fin')) {
                $query->whereBetween('fecha', [$request->fecha_inicio, $request->fecha_fin]);
            }
            
            // Filtrar por estado si se proporciona
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            $asistencias = $query->orderBy('fecha', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $asistencias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener asistencias: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas deportivas de un deportista.
     */
    public function estadisticasDeportivas(string $id)
    {
        try {
            $deportista = Deportista::with(['estadisticas' => function($query) {
                $query->orderBy('created_at', 'desc');
            }])->find($id);
            
            if (!$deportista) {
                return response()->json([
                    'success' => false,
                    'message' => 'Deportista no encontrado'
                ], 404);
            }

            // Calcular totales
            $totales = [
                'goles' => $deportista->estadisticas->sum('goles'),
                'asistencias' => $deportista->estadisticas->sum('asistencias'),
                'tarjetas_amarillas' => $deportista->estadisticas->sum('tarjetas_amarillas'),
                'tarjetas_rojas' => $deportista->estadisticas->sum('tarjetas_rojas'),
                'minutos_jugados' => $deportista->estadisticas->sum('minutos_jugados'),
                'partidos_jugados' => $deportista->estadisticas->sum('partidos_jugados'),
                'partidos_titular' => $deportista->estadisticas->sum('partidos_titular'),
                'partidos_suplente' => $deportista->estadisticas->sum('partidos_suplente')
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'deportista' => $deportista->nombres . ' ' . $deportista->apellidos,
                    'estadisticas' => $deportista->estadisticas,
                    'totales' => $totales
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas deportivas: ' . $e->getMessage()
            ], 500);
        }
    }
}