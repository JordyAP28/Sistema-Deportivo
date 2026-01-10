<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class RolController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $roles = Rol::with('permisos')->get();
            return response()->json([
                'success' => true,
                'data' => $roles
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los roles: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100|unique:rols,nombre',
            'slug' => 'required|string|max:100|unique:rols,slug',
            'descripcion' => 'nullable|string',
            'activo' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $rol = Rol::create($request->all());
            
            if ($request->has('permisos')) {
                $rol->permisos()->sync($request->permisos);
            }

            return response()->json([
                'success' => true,
                'message' => 'Rol creado exitosamente',
                'data' => $rol->load('permisos')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el rol: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $rol = Rol::with('permisos')->find($id);
            
            if (!$rol) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rol no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $rol
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el rol: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'string|max:100|unique:rols,nombre,' . $id . ',id_rol',
            'slug' => 'string|max:100|unique:rols,slug,' . $id . ',id_rol',
            'descripcion' => 'nullable|string',
            'activo' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $rol = Rol::find($id);
            
            if (!$rol) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rol no encontrado'
                ], 404);
            }

            $rol->update($request->all());
            
            if ($request->has('permisos')) {
                $rol->permisos()->sync($request->permisos);
            }

            return response()->json([
                'success' => true,
                'message' => 'Rol actualizado exitosamente',
                'data' => $rol->load('permisos')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el rol: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $rol = Rol::find($id);
            
            if (!$rol) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rol no encontrado'
                ], 404);
            }

            // Verificar si hay usuarios asociados
            if ($rol->usuarios()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el rol porque tiene usuarios asociados'
                ], 400);
            }

            $rol->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rol eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el rol: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un rol eliminado.
     */
    public function restore(string $id)
    {
        try {
            $rol = Rol::withTrashed()->find($id);
            
            if (!$rol) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rol no encontrado'
                ], 404);
            }

            if (!$rol->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El rol no está eliminado'
                ], 400);
            }

            $rol->restore();

            return response()->json([
                'success' => true,
                'message' => 'Rol restaurado exitosamente',
                'data' => $rol
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar el rol: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener permisos de un rol específico.
     */
    public function permisos(string $id)
    {
        try {
            $rol = Rol::with('permisos')->find($id);
            
            if (!$rol) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rol no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $rol->permisos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener permisos del rol: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar permisos a un rol.
     */
    public function asignarPermisos(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'permisos' => 'required|array',
            'permisos.*' => 'exists:permisos,id_permiso'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $rol = Rol::find($id);
            
            if (!$rol) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rol no encontrado'
                ], 404);
            }

            $rol->permisos()->sync($request->permisos);

            return response()->json([
                'success' => true,
                'message' => 'Permisos asignados exitosamente',
                'data' => $rol->load('permisos')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar permisos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Filtrar roles activos.
     */
    public function activos()
    {
        try {
            $roles = Rol::where('activo', true)
                ->with('permisos')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $roles
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener roles activos: ' . $e->getMessage()
            ], 500);
        }
    }
}