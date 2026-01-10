<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;

class NotificacionController extends Controller
{
    /**
     * Listar notificaciones.
     * - Por defecto devuelve las del usuario autenticado
     * - Admin/secretaria pueden pasar usuario_id para consultar de otro usuario
     * - Filtros: ?solo_no_leidas=1
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = Notificacion::with('usuario');

            $usuarioIdInput = $request->input('usuario_id');
            $usuarioId = is_null($usuarioIdInput) ? null : (int) $usuarioIdInput;
            $soloNoLeidas = (bool) $request->boolean('solo_no_leidas');

            if ($usuarioId) {
                if (Gate::denies('admin-o-secretaria')) {
                    // No admin: forzar a sus propias notificaciones
                    $usuarioId = $user->id_usuario;
                }
                $query->where('usuario_id', $usuarioId);
            } else {
                // Por defecto: notificaciones del usuario autenticado
                $query->where('usuario_id', $user->id_usuario);
            }

            if ($soloNoLeidas) {
                $query->where('leida', false);
            }

            $notificaciones = $query->orderByDesc('created_at')->get();

            return response()->json([
                'success' => true,
                'data' => $notificaciones,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al listar notificaciones: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crear notificación.
     * - Admin/secretaria: pueden crear para cualquier usuario
     * - Usuario normal: solo para sí mismo (ignora usuario_id si envía otro)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'usuario_id' => 'nullable|integer|exists:usuarios,id_usuario',
            'tipo' => 'nullable|string|max:50',
            'titulo' => 'required|string|max:150',
            'mensaje' => 'required|string',
            'data' => 'nullable|array',
            'url' => 'nullable|url',
            'leida' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = $request->user();
            $data = $validator->validated();

            // Determinar usuario destino
            if (!Gate::allows('admin-o-secretaria')) {
                $data['usuario_id'] = $user->id_usuario; // fuerza a sí mismo
            } else {
                $data['usuario_id'] = $data['usuario_id'] ?? $user->id_usuario;
            }

            // Estado de lectura
            if (!array_key_exists('leida', $data)) {
                $data['leida'] = false;
            }

            $notificacion = Notificacion::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Notificación creada exitosamente',
                'data' => $notificacion->load('usuario'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la notificación: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mostrar notificación.
     * - Acceso: propietario o admin/secretaria
     */
    public function show(string $id)
    {
        try {
            $notificacion = Notificacion::with('usuario')->find($id);

            if (!$notificacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notificación no encontrada',
                ], 404);
            }

            $user = request()->user();
            if ($notificacion->usuario_id !== $user->id_usuario && Gate::denies('admin-o-secretaria')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autorizado',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $notificacion,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la notificación: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar notificación.
     * - Acceso: propietario o admin/secretaria
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'tipo' => 'sometimes|nullable|string|max:50',
            'titulo' => 'sometimes|required|string|max:150',
            'mensaje' => 'sometimes|required|string',
            'data' => 'sometimes|nullable|array',
            'url' => 'sometimes|nullable|url',
            'leida' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $notificacion = Notificacion::find($id);

            if (!$notificacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notificación no encontrada',
                ], 404);
            }

            $user = $request->user();
            if ($notificacion->usuario_id !== $user->id_usuario && Gate::denies('admin-o-secretaria')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autorizado',
                ], 403);
            }

            $data = $validator->validated();

            // Gestionar marca de lectura
            if (array_key_exists('leida', $data)) {
                if ($data['leida'] && !$notificacion->leida) {
                    $data['fecha_lectura'] = now();
                } elseif (!$data['leida']) {
                    $data['fecha_lectura'] = null;
                }
            }

            $notificacion->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Notificación actualizada',
                'data' => $notificacion,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la notificación: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar notificación.
     * - Acceso: propietario o admin/secretaria
     */
    public function destroy(string $id)
    {
        try {
            $notificacion = Notificacion::find($id);

            if (!$notificacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notificación no encontrada',
                ], 404);
            }

            $user = request()->user();
            if ($notificacion->usuario_id !== $user->id_usuario && Gate::denies('admin-o-secretaria')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autorizado',
                ], 403);
            }

            $notificacion->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notificación eliminada',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la notificación: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Marcar una notificación como leída.
     */
    public function marcarLeida(string $id)
    {
        try {
            $notificacion = Notificacion::find($id);

            if (!$notificacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notificación no encontrada',
                ], 404);
            }

            $user = request()->user();
            if ($notificacion->usuario_id !== $user->id_usuario && Gate::denies('admin-o-secretaria')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autorizado',
                ], 403);
            }

            $notificacion->update([
                'leida' => true,
                'fecha_lectura' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notificación marcada como leída',
                'data' => $notificacion,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al marcar la notificación como leída: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Marcar todas las notificaciones del usuario autenticado como leídas.
     * - Admin/secretaria pueden pasar usuario_id para marcar las de otro usuario
     */
    public function marcarTodasLeidas(Request $request)
    {
        try {
            $user = $request->user();
            $usuarioId = (int) ($request->input('usuario_id') ?? $user->id_usuario);

            if ($usuarioId !== $user->id_usuario && Gate::denies('admin-o-secretaria')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No autorizado',
                ], 403);
            }

            Notificacion::where('usuario_id', $usuarioId)
                ->where('leida', false)
                ->update([
                    'leida' => true,
                    'fecha_lectura' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Notificaciones marcadas como leídas',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al marcar todas como leídas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar solo no leídas del usuario autenticado.
     */
    public function noLeidas(Request $request)
    {
        try {
            $user = $request->user();
            $notificaciones = Notificacion::where('usuario_id', $user->id_usuario)
                ->where('leida', false)
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $notificaciones,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener no leídas: ' . $e->getMessage(),
            ], 500);
        }
    }
}
