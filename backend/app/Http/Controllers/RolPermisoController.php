<?php

namespace App\Http\Controllers;

use App\Models\RolPermiso;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class RolPermisoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $rolPermisos = RolPermiso::with(['rol', 'permiso'])->get();
            return response()->json([
                'success' => true,
                'data' => $rolPermisos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las relaciones rol-permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_rol' => 'required|exists:rols,id_rol',
            'id_permiso' => 'required|exists:permisos,id_permiso'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si ya existe la relación
            $existente = RolPermiso::where('id_rol', $request->id_rol)
                ->where('id_permiso', $request->id_permiso)
                ->first();

            if ($existente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta relación rol-permiso ya existe'
                ], 409);
            }

            $rolPermiso = RolPermiso::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Relación rol-permiso creada exitosamente',
                'data' => $rolPermiso->load(['rol', 'permiso'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la relación rol-permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $rolPermiso = RolPermiso::with(['rol', 'permiso'])->find($id);
            
            if (!$rolPermiso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación rol-permiso no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $rolPermiso
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la relación rol-permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'id_rol' => 'exists:rols,id_rol',
            'id_permiso' => 'exists:permisos,id_permiso'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $rolPermiso = RolPermiso::find($id);
            
            if (!$rolPermiso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación rol-permiso no encontrada'
                ], 404);
            }

            // Verificar si la nueva combinación ya existe (si se están cambiando ambos)
            if ($request->has('id_rol') && $request->has('id_permiso')) {
                $existente = RolPermiso::where('id_rol', $request->id_rol)
                    ->where('id_permiso', $request->id_permiso)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Esta relación rol-permiso ya existe'
                    ], 409);
                }
            }

            $rolPermiso->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Relación rol-permiso actualizada exitosamente',
                'data' => $rolPermiso->load(['rol', 'permiso'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la relación rol-permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $rolPermiso = RolPermiso::find($id);
            
            if (!$rolPermiso) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación rol-permiso no encontrada'
                ], 404);
            }

            $rolPermiso->delete();

            return response()->json([
                'success' => true,
                'message' => 'Relación rol-permiso eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la relación rol-permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener relaciones por rol.
     */
    public function porRol(string $idRol)
    {
        try {
            $rolPermisos = RolPermiso::where('id_rol', $idRol)
                ->with(['rol', 'permiso'])
                ->get();

            if ($rolPermisos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron permisos para el rol especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $rolPermisos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener permisos por rol: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener relaciones por permiso.
     */
    public function porPermiso(string $idPermiso)
    {
        try {
            $rolPermisos = RolPermiso::where('id_permiso', $idPermiso)
                ->with(['rol', 'permiso'])
                ->get();

            if ($rolPermisos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron roles para el permiso especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $rolPermisos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener roles por permiso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar si un rol tiene un permiso específico.
     */
    public function verificarPermiso(string $idRol, string $idPermiso)
    {
        try {
            $existe = RolPermiso::where('id_rol', $idRol)
                ->where('id_permiso', $idPermiso)
                ->exists();

            return response()->json([
                'success' => true,
                'data' => [
                    'tiene_permiso' => $existe
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar permiso: ' . $e->getMessage()
            ], 500);
        }
    }
}