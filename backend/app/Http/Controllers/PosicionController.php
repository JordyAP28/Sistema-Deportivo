<?php

namespace App\Http\Controllers;

use App\Models\Posicion;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class PosicionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $posiciones = Posicion::with('deportistas')->get();
            return response()->json([
                'success' => true,
                'data' => $posiciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las posiciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100|unique:posiciones,nombre',
            'abreviatura' => 'nullable|string|max:10',
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
            $posicion = Posicion::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Posición creada exitosamente',
                'data' => $posicion
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $posicion = Posicion::with('deportistas')->find($id);
            
            if (!$posicion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Posición no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $posicion
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'string|max:100|unique:posiciones,nombre,' . $id . ',id_posicion',
            'abreviatura' => 'nullable|string|max:10',
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
            $posicion = Posicion::find($id);
            
            if (!$posicion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Posición no encontrada'
                ], 404);
            }

            $posicion->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Posición actualizada exitosamente',
                'data' => $posicion
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $posicion = Posicion::find($id);
            
            if (!$posicion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Posición no encontrada'
                ], 404);
            }

            // Verificar si hay deportistas asociados
            if ($posicion->deportistas()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar la posición porque tiene deportistas asociados'
                ], 400);
            }

            $posicion->delete();

            return response()->json([
                'success' => true,
                'message' => 'Posición eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar una posición eliminada.
     */
    public function restore(string $id)
    {
        try {
            $posicion = Posicion::withTrashed()->find($id);
            
            if (!$posicion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Posición no encontrada'
                ], 404);
            }

            if (!$posicion->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La posición no está eliminada'
                ], 400);
            }

            $posicion->restore();

            return response()->json([
                'success' => true,
                'message' => 'Posición restaurada exitosamente',
                'data' => $posicion
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar la posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener posiciones activas.
     */
    public function activas()
    {
        try {
            $posiciones = Posicion::where('activo', true)
                ->with('deportistas')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $posiciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener posiciones activas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener deportistas por posición.
     */
    public function deportistas(string $id)
    {
        try {
            $posicion = Posicion::with(['deportistas.usuario', 'deportistas.categoria'])->find($id);
            
            if (!$posicion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Posición no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'posicion' => $posicion->nombre,
                    'deportistas' => $posicion->deportistas
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener deportistas por posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar posiciones.
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
            
            $posiciones = Posicion::where('nombre', 'like', "%{$busqueda}%")
                ->orWhere('abreviatura', 'like', "%{$busqueda}%")
                ->orWhere('descripcion', 'like', "%{$busqueda}%")
                ->with('deportistas')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $posiciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar posiciones: ' . $e->getMessage()
            ], 500);
        }
    }
}