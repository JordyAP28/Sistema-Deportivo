<?php

namespace App\Http\Controllers;

use App\Models\Configuracion;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class ConfiguracionController extends Controller
{
    public function index(Request $request)
    {
        $query = Configuracion::query()
            ->when($request->grupo, function ($q) use ($request) {
                return $q->where('grupo', $request->grupo);
            })
            ->when($request->clave, function ($q) use ($request) {
                return $q->where('clave', 'like', '%' . $request->clave . '%');
            })
            ->when($request->editable !== null, function ($q) use ($request) {
                return $q->where('editable', $request->editable);
            });

        $configuraciones = $request->has('per_page') 
            ? $query->paginate($request->per_page)
            : $query->get();

        return response()->json([
            'success' => true,
            'data' => $configuraciones
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'clave' => 'required|string|max:100|unique:configuraciones,clave',
            'valor' => 'nullable|string',
            'tipo' => 'required|in:string,integer,boolean,json,array',
            'grupo' => 'nullable|string|max:50',
            'descripcion' => 'nullable|string',
            'editable' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validar el valor según el tipo
            $valorValidado = $this->validarValorPorTipo($request->tipo, $request->valor);

            $configuracion = Configuracion::create([
                'clave' => $request->clave,
                'valor' => $valorValidado,
                'tipo' => $request->tipo,
                'grupo' => $request->grupo,
                'descripcion' => $request->descripcion,
                'editable' => $request->editable ?? true,
            ]);

            // Limpiar caché de configuraciones
            Cache::forget('configuraciones_sistema');

            return response()->json([
                'success' => true,
                'message' => 'Configuración creada exitosamente',
                'data' => $configuracion
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la configuración: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $configuracion = Configuracion::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $configuracion
        ]);
    }

    public function update(Request $request, $id)
    {
        $configuracion = Configuracion::findOrFail($id);

        if (!$configuracion->editable) {
            return response()->json([
                'success' => false,
                'message' => 'Esta configuración no es editable'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'valor' => 'required|string',
            'descripcion' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validar el valor según el tipo
            $valorValidado = $this->validarValorPorTipo($configuracion->tipo, $request->valor);

            $configuracion->update([
                'valor' => $valorValidado,
                'descripcion' => $request->descripcion ?? $configuracion->descripcion,
            ]);

            // Limpiar caché de configuraciones
            Cache::forget('configuraciones_sistema');

            return response()->json([
                'success' => true,
                'message' => 'Configuración actualizada exitosamente',
                'data' => $configuracion
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la configuración: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $configuracion = Configuracion::findOrFail($id);

        if (!$configuracion->editable) {
            return response()->json([
                'success' => false,
                'message' => 'Esta configuración no se puede eliminar'
            ], 403);
        }

        try {
            $configuracion->delete();

            // Limpiar caché de configuraciones
            Cache::forget('configuraciones_sistema');

            return response()->json([
                'success' => true,
                'message' => 'Configuración eliminada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la configuración: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getByGrupo($grupo)
    {
        $configuraciones = Configuracion::where('grupo', $grupo)
            ->where('editable', true)
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->clave => $this->convertirValor($item->tipo, $item->valor)];
            });

        return response()->json([
            'success' => true,
            'data' => $configuraciones
        ]);
    }

    public function getByClave($clave)
    {
        $configuracion = Configuracion::where('clave', $clave)->first();

        if (!$configuracion) {
            return response()->json([
                'success' => false,
                'message' => 'Configuración no encontrada'
            ], 404);
        }

        $valor = $this->convertirValor($configuracion->tipo, $configuracion->valor);

        return response()->json([
            'success' => true,
            'data' => [
                'clave' => $configuracion->clave,
                'valor' => $valor,
                'tipo' => $configuracion->tipo,
                'descripcion' => $configuracion->descripcion
            ]
        ]);
    }

    public function bulkUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'configuraciones' => 'required|array',
            'configuraciones.*.clave' => 'required|string|exists:configuraciones,clave',
            'configuraciones.*.valor' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            foreach ($request->configuraciones as $config) {
                $configuracion = Configuracion::where('clave', $config['clave'])->first();

                if ($configuracion && $configuracion->editable) {
                    $valorValidado = $this->validarValorPorTipo($configuracion->tipo, $config['valor']);
                    $configuracion->update(['valor' => $valorValidado]);
                }
            }

            DB::commit();

            // Limpiar caché de configuraciones
            Cache::forget('configuraciones_sistema');

            return response()->json([
                'success' => true,
                'message' => 'Configuraciones actualizadas exitosamente'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar configuraciones: ' . $e->getMessage()
            ], 500);
        }
    }

    private function validarValorPorTipo($tipo, $valor)
    {
        switch ($tipo) {
            case 'integer':
                if (!is_numeric($valor)) {
                    throw new \Exception('El valor debe ser un número entero');
                }
                return (int)$valor;

            case 'boolean':
                if (!in_array(strtolower($valor), ['true', 'false', '1', '0', 'yes', 'no'])) {
                    throw new \Exception('El valor debe ser booleano (true/false)');
                }
                return filter_var($valor, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';

            case 'json':
                if (!is_string($valor) || !json_decode($valor, true)) {
                    throw new \Exception('El valor debe ser un JSON válido');
                }
                return $valor;

            case 'array':
                if (!is_string($valor) || !json_decode($valor, true)) {
                    throw new \Exception('El valor debe ser un array JSON válido');
                }
                return $valor;

            default: // string
                return (string)$valor;
        }
    }

    private function convertirValor($tipo, $valor)
    {
        switch ($tipo) {
            case 'integer':
                return (int)$valor;
            case 'boolean':
                return filter_var($valor, FILTER_VALIDATE_BOOLEAN);
            case 'json':
            case 'array':
                return json_decode($valor, true);
            default:
                return $valor;
        }
    }
}