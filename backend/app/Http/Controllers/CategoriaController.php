<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class CategoriaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $categorias = Categoria::with('deportistas')->get();
            return response()->json([
                'success' => true,
                'data' => $categorias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las categorías: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100|unique:categorias,nombre',
            'edad_minima' => 'required|integer|min:0',
            'edad_maxima' => 'required|integer|gt:edad_minima',
            'genero' => 'required|in:masculino,femenino,mixto',
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
            $categoria = Categoria::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Categoría creada exitosamente',
                'data' => $categoria
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $categoria = Categoria::with(['deportistas.usuario', 'deportistas.posiciones'])->find($id);
            
            if (!$categoria) {
                return response()->json([
                    'success' => false,
                    'message' => 'Categoría no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $categoria
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'string|max:100|unique:categorias,nombre,' . $id . ',id_categoria',
            'edad_minima' => 'integer|min:0',
            'edad_maxima' => 'integer|gt:edad_minima',
            'genero' => 'in:masculino,femenino,mixto',
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
            $categoria = Categoria::find($id);
            
            if (!$categoria) {
                return response()->json([
                    'success' => false,
                    'message' => 'Categoría no encontrada'
                ], 404);
            }

            $categoria->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Categoría actualizada exitosamente',
                'data' => $categoria
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $categoria = Categoria::find($id);
            
            if (!$categoria) {
                return response()->json([
                    'success' => false,
                    'message' => 'Categoría no encontrada'
                ], 404);
            }

            // Verificar si hay deportistas asociados
            if ($categoria->deportistas()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar la categoría porque tiene deportistas asociados'
                ], 400);
            }

            $categoria->delete();

            return response()->json([
                'success' => true,
                'message' => 'Categoría eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar una categoría eliminada.
     */
    public function restore(string $id)
    {
        try {
            $categoria = Categoria::withTrashed()->find($id);
            
            if (!$categoria) {
                return response()->json([
                    'success' => false,
                    'message' => 'Categoría no encontrada'
                ], 404);
            }

            if (!$categoria->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La categoría no está eliminada'
                ], 400);
            }

            $categoria->restore();

            return response()->json([
                'success' => true,
                'message' => 'Categoría restaurada exitosamente',
                'data' => $categoria
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar la categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener categorías activas.
     */
    public function activas()
    {
        try {
            $categorias = Categoria::where('activo', true)
                ->with('deportistas')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $categorias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener categorías activas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener categorías por género.
     */
    public function porGenero(string $genero)
    {
        try {
            $categorias = Categoria::where('genero', $genero)
                ->where('activo', true)
                ->with('deportistas')
                ->get();

            if ($categorias->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron categorías para el género especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $categorias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener categorías por género: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener categorías por rango de edad.
     */
    public function porRangoEdad(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'edad_minima' => 'required|integer|min:0',
            'edad_maxima' => 'required|integer|gt:edad_minima'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $categorias = Categoria::where('activo', true)
                ->where('edad_minima', '<=', $request->edad_maxima)
                ->where('edad_maxima', '>=', $request->edad_minima)
                ->with('deportistas')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $categorias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener categorías por rango de edad: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener deportistas por categoría.
     */
    public function deportistas(string $id)
    {
        try {
            $categoria = Categoria::with(['deportistas.usuario', 'deportistas.posiciones', 'deportistas.clubes'])->find($id);
            
            if (!$categoria) {
                return response()->json([
                    'success' => false,
                    'message' => 'Categoría no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'categoria' => $categoria->nombre,
                    'deportistas' => $categoria->deportistas
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener deportistas por categoría: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar categorías.
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
            
            $categorias = Categoria::where('nombre', 'like', "%{$busqueda}%")
                ->orWhere('descripcion', 'like', "%{$busqueda}%")
                ->with('deportistas')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $categorias
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar categorías: ' . $e->getMessage()
            ], 500);
        }
    }
}