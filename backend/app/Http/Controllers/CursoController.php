<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class CursoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $cursos = Curso::with(['usuarios'])->get();
            return response()->json([
                'success' => true,
                'data' => $cursos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los cursos: ' . $e->getMessage()
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
            'slug' => 'required|string|max:200|unique:cursos,slug',
            'descripcion' => 'nullable|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio',
            'representante' => 'required|string|max:100',
            'email_representante' => 'required|email|max:100',
            'telefono_representante' => 'required|string|max:20',
            'tipo' => 'required|in:teorico,practico,mixto',
            'estado' => 'nullable|in:planificado,activo,finalizado,cancelado',
            'cupo_maximo' => 'required|integer|min:1',
            'precio' => 'required|numeric|min:0',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $request->all();
            $data['cupo_actual'] = 0;
            
            // Manejar subida de imagen
            if ($request->hasFile('imagen')) {
                $imagen = $request->file('imagen');
                $imagenPath = $imagen->store('cursos', 'public');
                $data['imagen'] = $imagenPath;
            }

            $curso = Curso::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Curso creado exitosamente',
                'data' => $curso
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el curso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $curso = Curso::with(['usuarios.usuario'])->find($id);
            
            if (!$curso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $curso
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el curso: ' . $e->getMessage()
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
            'slug' => 'string|max:200|unique:cursos,slug,' . $id . ',id_curso',
            'descripcion' => 'nullable|string',
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date|after:fecha_inicio',
            'representante' => 'string|max:100',
            'email_representante' => 'email|max:100',
            'telefono_representante' => 'string|max:20',
            'tipo' => 'in:teorico,practico,mixto',
            'estado' => 'nullable|in:planificado,activo,finalizado,cancelado',
            'cupo_maximo' => 'integer|min:1',
            'cupo_actual' => 'integer|min:0',
            'precio' => 'numeric|min:0',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $curso = Curso::find($id);
            
            if (!$curso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ], 404);
            }

            $data = $request->all();
            
            // Manejar subida de nueva imagen
            if ($request->hasFile('imagen')) {
                // Eliminar imagen anterior si existe
                if ($curso->imagen && Storage::disk('public')->exists($curso->imagen)) {
                    Storage::disk('public')->delete($curso->imagen);
                }
                
                $imagen = $request->file('imagen');
                $imagenPath = $imagen->store('cursos', 'public');
                $data['imagen'] = $imagenPath;
            }

            // Validar que cupo_actual no sea mayor que cupo_maximo
            if (isset($data['cupo_actual']) && $data['cupo_actual'] > $data['cupo_maximo']) {
                return response()->json([
                    'success' => false,
                    'message' => 'El cupo actual no puede ser mayor que el cupo máximo'
                ], 422);
            }

            $curso->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Curso actualizado exitosamente',
                'data' => $curso
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el curso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $curso = Curso::find($id);
            
            if (!$curso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ], 404);
            }

            // Verificar si hay inscripciones asociadas
            if ($curso->usuarios()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el curso porque tiene inscripciones asociadas'
                ], 400);
            }

            // Eliminar imagen si existe
            if ($curso->imagen && Storage::disk('public')->exists($curso->imagen)) {
                Storage::disk('public')->delete($curso->imagen);
            }

            $curso->delete();

            return response()->json([
                'success' => true,
                'message' => 'Curso eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el curso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un curso eliminado.
     */
    public function restore(string $id)
    {
        try {
            $curso = Curso::withTrashed()->find($id);
            
            if (!$curso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ], 404);
            }

            if (!$curso->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El curso no está eliminado'
                ], 400);
            }

            $curso->restore();

            return response()->json([
                'success' => true,
                'message' => 'Curso restaurado exitosamente',
                'data' => $curso
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar el curso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener cursos activos.
     */
    public function activos()
    {
        try {
            $cursos = Curso::where('estado', 'activo')
                ->with(['usuarios'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $cursos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener cursos activos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener cursos por tipo.
     */
    public function porTipo(string $tipo)
    {
        try {
            $cursos = Curso::where('tipo', $tipo)
                ->where('estado', '!=', 'cancelado')
                ->with(['usuarios'])
                ->get();

            if ($cursos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron cursos del tipo especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $cursos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener cursos por tipo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener inscritos en un curso.
     */
    public function inscritos(string $id)
    {
        try {
            $curso = Curso::with(['usuarios.usuario'])->find($id);
            
            if (!$curso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'curso' => $curso->nombre,
                    'inscritos' => $curso->usuarios
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener inscritos del curso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar cursos.
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
            
            $cursos = Curso::where('nombre', 'like', "%{$busqueda}%")
                ->orWhere('descripcion', 'like', "%{$busqueda}%")
                ->orWhere('representante', 'like', "%{$busqueda}%")
                ->orWhere('email_representante', 'like', "%{$busqueda}%")
                ->with(['usuarios'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $cursos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar cursos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de cursos.
     */
    public function estadisticas()
    {
        try {
            $total = Curso::count();
            $planificados = Curso::where('estado', 'planificado')->count();
            $activos = Curso::where('estado', 'activo')->count();
            $finalizados = Curso::where('estado', 'finalizado')->count();
            $cancelados = Curso::where('estado', 'cancelado')->count();
            
            $totalInscripciones = DB::table('inscripcion_cursos')->count();
            $ingresosTotales = Curso::sum('precio');
            
            $cursosConMasInscritos = Curso::withCount('usuarios')
                ->orderBy('usuarios_count', 'desc')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_cursos' => $total,
                    'planificados' => $planificados,
                    'activos' => $activos,
                    'finalizados' => $finalizados,
                    'cancelados' => $cancelados,
                    'total_inscripciones' => $totalInscripciones,
                    'ingresos_totales' => $ingresosTotales,
                    'cursos_mas_inscritos' => $cursosConMasInscritos
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
     * Actualizar estado de un curso.
     */
    public function actualizarEstado(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'required|in:planificado,activo,finalizado,cancelado'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $curso = Curso::find($id);
            
            if (!$curso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ], 404);
            }

            $curso->update(['estado' => $request->estado]);

            return response()->json([
                'success' => true,
                'message' => 'Estado del curso actualizado exitosamente',
                'data' => $curso
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar estado del curso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar disponibilidad de cupos.
     */
    public function verificarDisponibilidad(string $id)
    {
        try {
            $curso = Curso::find($id);
            
            if (!$curso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Curso no encontrado'
                ], 404);
            }

            $disponibilidad = [
                'curso' => $curso->nombre,
                'cupo_maximo' => $curso->cupo_maximo,
                'cupo_actual' => $curso->cupo_actual,
                'cupos_disponibles' => $curso->cupo_maximo - $curso->cupo_actual,
                'porcentaje_ocupacion' => $curso->cupo_maximo > 0 
                    ? round(($curso->cupo_actual / $curso->cupo_maximo) * 100, 2) 
                    : 0,
                'disponible' => $curso->cupo_actual < $curso->cupo_maximo
            ];

            return response()->json([
                'success' => true,
                'data' => $disponibilidad
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar disponibilidad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener cursos por rango de fechas.
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
            $cursos = Curso::whereBetween('fecha_inicio', [$request->fecha_inicio, $request->fecha_fin])
                ->orWhereBetween('fecha_fin', [$request->fecha_inicio, $request->fecha_fin])
                ->with(['usuarios'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $cursos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener cursos por rango de fechas: ' . $e->getMessage()
            ], 500);
        }
    }
}