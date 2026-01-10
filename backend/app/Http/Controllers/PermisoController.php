<?php

namespace App\Http\Controllers;

use App\Models\Permiso;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class PermisoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $permisos = Permiso::with('roles')->get();
            return response()->json([
                'success' => true,
                'data' => $permisos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los permisos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:permisos,slug',
            'descripcion' => 'nullable|string',
            'modulo' => 'required|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $permiso = Permiso::create($request->all());
            
            if ($request->has('roles')) {
                $permiso->roles()->sync($request->roles);
            }

            return response()->json([
                'success' => true,
                'message' => 'Permiso creado exitosamente',
                'data' => $permiso->load('roles')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $permiso = Permiso::with('roles')->find($id);
            
            if (!$permiso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permiso no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $permiso
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'string|max:100',
            'slug' => 'string|max:100|unique:permisos,slug,' . $id . ',id_permiso',
            'descripcion' => 'nullable|string',
            'modulo' => 'string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $permiso = Permiso::find($id);
            
            if (!$permiso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permiso no encontrado'
                ], 404);
            }

            $permiso->update($request->all());
            
            if ($request->has('roles')) {
                $permiso->roles()->sync($request->roles);
            }

            return response()->json([
                'success' => true,
                'message' => 'Permiso actualizado exitosamente',
                'data' => $permiso->load('roles')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $permiso = Permiso::find($id);
            
            if (!$permiso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permiso no encontrado'
                ], 404);
            }

            // Verificar si hay roles asociados
            if ($permiso->roles()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el permiso porque tiene roles asociados'
                ], 400);
            }

            $permiso->delete();

            return response()->json([
                'success' => true,
                'message' => 'Permiso eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener permisos por módulo.
     */
    public function porModulo(string $modulo)
    {
        try {
            $permisos = Permiso::where('modulo', $modulo)
                ->with('roles')
                ->get();

            if ($permisos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron permisos para el módulo especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $permisos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener permisos por módulo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar permisos por nombre o descripción.
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
            
            $permisos = Permiso::where('nombre', 'like', "%{$busqueda}%")
                ->orWhere('descripcion', 'like', "%{$busqueda}%")
                ->orWhere('slug', 'like', "%{$busqueda}%")
                ->orWhere('modulo', 'like', "%{$busqueda}%")
                ->with('roles')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $permisos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar permisos: ' . $e->getMessage()
            ], 500);
        }
    }
}