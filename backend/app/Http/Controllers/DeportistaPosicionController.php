<?php

namespace App\Http\Controllers;

use App\Models\DeportistaPosicion;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class DeportistaPosicionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $deportistaPosiciones = DeportistaPosicion::with(['deportista', 'posicion'])->get();
            return response()->json([
                'success' => true,
                'data' => $deportistaPosiciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las relaciones deportista-posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_deportista' => 'required|exists:deportistas,id_deportista',
            'id_posicion' => 'required|exists:posiciones,id_posicion',
            'principal' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar si ya existe la relación
            $existente = DeportistaPosicion::where('id_deportista', $request->id_deportista)
                ->where('id_posicion', $request->id_posicion)
                ->first();

            if ($existente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta relación deportista-posición ya existe'
                ], 409);
            }

            $deportistaPosicion = DeportistaPosicion::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Relación deportista-posición creada exitosamente',
                'data' => $deportistaPosicion->load(['deportista', 'posicion'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la relación deportista-posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $deportistaPosicion = DeportistaPosicion::with(['deportista', 'posicion'])->find($id);
            
            if (!$deportistaPosicion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación deportista-posición no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $deportistaPosicion
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la relación deportista-posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'id_deportista' => 'exists:deportistas,id_deportista',
            'id_posicion' => 'exists:posiciones,id_posicion',
            'principal' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $deportistaPosicion = DeportistaPosicion::find($id);
            
            if (!$deportistaPosicion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación deportista-posición no encontrada'
                ], 404);
            }

            // Verificar si la nueva combinación ya existe (si se están cambiando ambos)
            if ($request->has('id_deportista') && $request->has('id_posicion')) {
                $existente = DeportistaPosicion::where('id_deportista', $request->id_deportista)
                    ->where('id_posicion', $request->id_posicion)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Esta relación deportista-posición ya existe'
                    ], 409);
                }
            }

            $deportistaPosicion->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Relación deportista-posición actualizada exitosamente',
                'data' => $deportistaPosicion->load(['deportista', 'posicion'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la relación deportista-posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $deportistaPosicion = DeportistaPosicion::find($id);
            
            if (!$deportistaPosicion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación deportista-posición no encontrada'
                ], 404);
            }

            $deportistaPosicion->delete();

            return response()->json([
                'success' => true,
                'message' => 'Relación deportista-posición eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la relación deportista-posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener posiciones por deportista.
     */
    public function porDeportista(string $idDeportista)
    {
        try {
            $deportistaPosiciones = DeportistaPosicion::where('id_deportista', $idDeportista)
                ->with(['deportista', 'posicion'])
                ->get();

            if ($deportistaPosiciones->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron posiciones para el deportista especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $deportistaPosiciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener posiciones por deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener deportistas por posición.
     */
    public function porPosicion(string $idPosicion)
    {
        try {
            $deportistaPosiciones = DeportistaPosicion::where('id_posicion', $idPosicion)
                ->with(['deportista', 'posicion'])
                ->get();

            if ($deportistaPosiciones->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron deportistas para la posición especificada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $deportistaPosiciones
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener deportistas por posición: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marcar/desmarcar posición como principal.
     */
    public function marcarPrincipal(string $id)
    {
        try {
            $deportistaPosicion = DeportistaPosicion::find($id);
            
            if (!$deportistaPosicion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Relación deportista-posición no encontrada'
                ], 404);
            }

            // Si se va a marcar como principal, primero desmarcar todas las demás posiciones principales del deportista
            if (!$deportistaPosicion->principal) {
                DeportistaPosicion::where('id_deportista', $deportistaPosicion->id_deportista)
                    ->where('principal', true)
                    ->update(['principal' => false]);
            }

            $deportistaPosicion->update(['principal' => !$deportistaPosicion->principal]);

            return response()->json([
                'success' => true,
                'message' => 'Posición ' . ($deportistaPosicion->principal ? 'marcada como principal' : 'desmarcada como principal'),
                'data' => $deportistaPosicion->load(['deportista', 'posicion'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al marcar posición como principal: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener posición principal de un deportista.
     */
    public function posicionPrincipal(string $idDeportista)
    {
        try {
            $posicionPrincipal = DeportistaPosicion::where('id_deportista', $idDeportista)
                ->where('principal', true)
                ->with(['deportista', 'posicion'])
                ->first();

            if (!$posicionPrincipal) {
                return response()->json([
                    'success' => false,
                    'message' => 'El deportista no tiene una posición principal definida'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $posicionPrincipal
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener posición principal: ' . $e->getMessage()
            ], 500);
        }
    }
}