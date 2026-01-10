<?php

namespace App\Http\Controllers;

use App\Models\InscripcionCurso;
use App\Models\Curso;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class InscripcionCursoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $inscripciones = InscripcionCurso::with(['curso', 'usuario'])->get();
            return response()->json([
                'success' => true,
                'data' => $inscripciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las inscripciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_curso' => 'required|exists:cursos,id_curso',
            'id_usuario' => 'required|exists:usuarios,id_usuario',
            'fecha_inscripcion' => 'required|date',
            'observaciones' => 'nullable|string',
            'estado' => 'nullable|in:pendiente,confirmado,cancelado,completado',
            'calificacion' => 'nullable|numeric|min:0|max:100',
            'comentarios' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si el usuario ya está inscrito en el curso
            $existente = InscripcionCurso::where('id_curso', $request->id_curso)
                ->where('id_usuario', $request->id_usuario)
                ->first();

            if ($existente) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario ya está inscrito en este curso'
                ], 409);
            }

            // Verificar disponibilidad de cupos en el curso
            $curso = Curso::find($request->id_curso);
            if ($curso->cupo_actual >= $curso->cupo_maximo) {
                return response()->json([
                    'success' => false,
                    'message' => 'El curso no tiene cupos disponibles'
                ], 400);
            }

            // Verificar estado del curso
            if ($curso->estado !== 'planificado' && $curso->estado !== 'activo') {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pueden realizar inscripciones a un curso ' . $curso->estado
                ], 400);
            }

            // Crear inscripción
            $inscripcion = InscripcionCurso::create($request->all());

            // Actualizar cupo actual del curso si la inscripción está confirmada
            if ($inscripcion->estado === 'confirmado') {
                $curso->increment('cupo_actual');
            }

            return response()->json([
                'success' => true,
                'message' => 'Inscripción creada exitosamente',
                'data' => $inscripcion->load(['curso', 'usuario'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la inscripción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $inscripcion = InscripcionCurso::with(['curso', 'usuario'])->find($id);
            
            if (!$inscripcion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inscripción no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $inscripcion
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la inscripción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'id_curso' => 'exists:cursos,id_curso',
            'id_usuario' => 'exists:usuarios,id_usuario',
            'fecha_inscripcion' => 'date',
            'observaciones' => 'nullable|string',
            'estado' => 'in:pendiente,confirmado,cancelado,completado',
            'calificacion' => 'nullable|numeric|min:0|max:100',
            'comentarios' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $inscripcion = InscripcionCurso::find($id);
            
            if (!$inscripcion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inscripción no encontrada'
                ], 404);
            }

            // Guardar estado anterior
            $estadoAnterior = $inscripcion->estado;

            // Actualizar inscripción
            $inscripcion->update($request->all());

            // Actualizar cupo del curso si cambió el estado
            if ($estadoAnterior !== $inscripcion->estado) {
                $curso = $inscripcion->curso;
                
                if ($estadoAnterior === 'confirmado' && $inscripcion->estado !== 'confirmado') {
                    // Disminuir cupo actual
                    $curso->decrement('cupo_actual');
                } elseif ($estadoAnterior !== 'confirmado' && $inscripcion->estado === 'confirmado') {
                    // Aumentar cupo actual
                    $curso->increment('cupo_actual');
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Inscripción actualizada exitosamente',
                'data' => $inscripcion->load(['curso', 'usuario'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la inscripción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $inscripcion = InscripcionCurso::find($id);
            
            if (!$inscripcion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inscripción no encontrada'
                ], 404);
            }

            // Actualizar cupo del curso si la inscripción estaba confirmada
            if ($inscripcion->estado === 'confirmado') {
                $inscripcion->curso->decrement('cupo_actual');
            }

            $inscripcion->delete();

            return response()->json([
                'success' => true,
                'message' => 'Inscripción eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la inscripción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar una inscripción eliminada.
     */
    public function restore(string $id)
    {
        try {
            $inscripcion = InscripcionCurso::withTrashed()->find($id);
            
            if (!$inscripcion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inscripción no encontrada'
                ], 404);
            }

            if (!$inscripcion->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La inscripción no está eliminada'
                ], 400);
            }

            // Actualizar cupo del curso si la inscripción estaba confirmada
            if ($inscripcion->estado === 'confirmado') {
                $inscripcion->curso->increment('cupo_actual');
            }

            $inscripcion->restore();

            return response()->json([
                'success' => true,
                'message' => 'Inscripción restaurada exitosamente',
                'data' => $inscripcion
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar la inscripción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener inscripciones por curso.
     */
    public function porCurso(string $idCurso)
    {
        try {
            $inscripciones = InscripcionCurso::where('id_curso', $idCurso)
                ->with(['curso', 'usuario'])
                ->orderBy('fecha_inscripcion', 'desc')
                ->get();

            if ($inscripciones->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron inscripciones para el curso especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $inscripciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener inscripciones por curso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener inscripciones por usuario.
     */
    public function porUsuario(string $idUsuario)
    {
        try {
            $inscripciones = InscripcionCurso::where('id_usuario', $idUsuario)
                ->with(['curso', 'usuario'])
                ->orderBy('fecha_inscripcion', 'desc')
                ->get();

            if ($inscripciones->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron inscripciones para el usuario especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $inscripciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener inscripciones por usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener inscripciones por estado.
     */
    public function porEstado(string $estado)
    {
        try {
            $inscripciones = InscripcionCurso::where('estado', $estado)
                ->with(['curso', 'usuario'])
                ->orderBy('fecha_inscripcion', 'desc')
                ->get();

            if ($inscripciones->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron inscripciones con el estado especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $inscripciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener inscripciones por estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Confirmar inscripción.
     */
    public function confirmar(string $id)
    {
        try {
            $inscripcion = InscripcionCurso::find($id);
            
            if (!$inscripcion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inscripción no encontrada'
                ], 404);
            }

            if ($inscripcion->estado === 'confirmado') {
                return response()->json([
                    'success' => false,
                    'message' => 'La inscripción ya está confirmada'
                ], 400);
            }

            // Verificar disponibilidad de cupos
            $curso = $inscripcion->curso;
            if ($curso->cupo_actual >= $curso->cupo_maximo) {
                return response()->json([
                    'success' => false,
                    'message' => 'El curso no tiene cupos disponibles'
                ], 400);
            }

            // Confirmar inscripción
            $inscripcion->update(['estado' => 'confirmado']);
            
            // Actualizar cupo del curso
            $curso->increment('cupo_actual');

            return response()->json([
                'success' => true,
                'message' => 'Inscripción confirmada exitosamente',
                'data' => $inscripcion->load(['curso', 'usuario'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al confirmar la inscripción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancelar inscripción.
     */
    public function cancelar(string $id)
    {
        try {
            $inscripcion = InscripcionCurso::find($id);
            
            if (!$inscripcion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inscripción no encontrada'
                ], 404);
            }

            if ($inscripcion->estado === 'cancelado') {
                return response()->json([
                    'success' => false,
                    'message' => 'La inscripción ya está cancelada'
                ], 400);
            }

            // Guardar estado anterior
            $estadoAnterior = $inscripcion->estado;

            // Cancelar inscripción
            $inscripcion->update(['estado' => 'cancelado']);
            
            // Actualizar cupo del curso si estaba confirmada
            if ($estadoAnterior === 'confirmado') {
                $inscripcion->curso->decrement('cupo_actual');
            }

            return response()->json([
                'success' => true,
                'message' => 'Inscripción cancelada exitosamente',
                'data' => $inscripcion->load(['curso', 'usuario'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cancelar la inscripción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calificar inscripción.
     */
    public function calificar(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'calificacion' => 'required|numeric|min:0|max:100',
            'comentarios' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $inscripcion = InscripcionCurso::find($id);
            
            if (!$inscripcion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inscripción no encontrada'
                ], 404);
            }

            // Verificar que el curso esté finalizado
            if ($inscripcion->curso->estado !== 'finalizado') {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden calificar inscripciones de cursos finalizados'
                ], 400);
            }

            $inscripcion->update([
                'calificacion' => $request->calificacion,
                'comentarios' => $request->comentarios,
                'estado' => 'completado'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Inscripción calificada exitosamente',
                'data' => $inscripcion->load(['curso', 'usuario'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al calificar la inscripción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar inscripciones.
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
            
            $inscripciones = InscripcionCurso::whereHas('curso', function($query) use ($busqueda) {
                    $query->where('nombre', 'like', "%{$busqueda}%");
                })
                ->orWhereHas('usuario', function($query) use ($busqueda) {
                    $query->where('nombre', 'like', "%{$busqueda}%")
                          ->orWhere('apellido', 'like', "%{$busqueda}%")
                          ->orWhere('email', 'like', "%{$busqueda}%");
                })
                ->orWhere('observaciones', 'like', "%{$busqueda}%")
                ->orWhere('comentarios', 'like', "%{$busqueda}%")
                ->with(['curso', 'usuario'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $inscripciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar inscripciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de inscripciones.
     */
    public function estadisticas()
    {
        try {
            $total = InscripcionCurso::count();
            $pendientes = InscripcionCurso::where('estado', 'pendiente')->count();
            $confirmadas = InscripcionCurso::where('estado', 'confirmado')->count();
            $canceladas = InscripcionCurso::where('estado', 'cancelado')->count();
            $completadas = InscripcionCurso::where('estado', 'completado')->count();
            
            $promedioCalificacion = InscripcionCurso::whereNotNull('calificacion')
                ->avg('calificacion');
            
            $inscripcionesPorCurso = InscripcionCurso::selectRaw('id_curso, COUNT(*) as total')
                ->groupBy('id_curso')
                ->with('curso')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'pendientes' => $pendientes,
                    'confirmadas' => $confirmadas,
                    'canceladas' => $canceladas,
                    'completadas' => $completadas,
                    'promedio_calificacion' => round($promedioCalificacion, 2),
                    'inscripciones_por_curso' => $inscripcionesPorCurso
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
     * Obtener inscripciones por rango de fechas.
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
            $inscripciones = InscripcionCurso::whereBetween('fecha_inscripcion', [$request->fecha_inicio, $request->fecha_fin])
                ->with(['curso', 'usuario'])
                ->orderBy('fecha_inscripcion', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $inscripciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener inscripciones por rango de fechas: ' . $e->getMessage()
            ], 500);
        }
    }
}