<?php

namespace App\Http\Controllers;

use App\Models\DetalleFactura;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class DetalleFacturaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $detalles = DetalleFactura::with('factura.deportista')->get();
            return response()->json([
                'success' => true,
                'data' => $detalles
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los detalles de factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_factura' => 'required|exists:facturas,id_factura',
            'concepto' => 'required|string|max:200',
            'descripcion' => 'nullable|string',
            'cantidad' => 'required|integer|min:1',
            'precio_unitario' => 'required|numeric|min:0',
            'descuento' => 'nullable|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Obtener la factura
            $factura = \App\Models\Factura::find($request->id_factura);
            
            // Verificar que la factura no esté pagada o cancelada
            if (in_array($factura->estado, ['pagado', 'cancelado'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede agregar detalles a una factura ' . $factura->estado
                ], 400);
            }

            // Calcular montos
            $subtotal = $request->cantidad * $request->precio_unitario;
            $descuento = $request->descuento ?? 0;
            $monto = $subtotal - $descuento;

            // Crear detalle
            $detalle = DetalleFactura::create([
                'id_factura' => $request->id_factura,
                'concepto' => $request->concepto,
                'descripcion' => $request->descripcion,
                'cantidad' => $request->cantidad,
                'precio_unitario' => $request->precio_unitario,
                'subtotal' => $subtotal,
                'descuento' => $descuento,
                'monto' => $monto
            ]);

            // Recalcular total de la factura
            $nuevoSubtotal = $factura->detalles()->sum('subtotal');
            $nuevoDescuento = $factura->detalles()->sum('descuento');
            $nuevoTotal = $nuevoSubtotal - $nuevoDescuento + $factura->impuesto;
            
            $factura->update([
                'subtotal' => $nuevoSubtotal,
                'descuento' => $nuevoDescuento,
                'total' => $nuevoTotal
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Detalle de factura creado exitosamente',
                'data' => $detalle->load('factura.deportista')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el detalle de factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $detalle = DetalleFactura::with('factura.deportista.usuario')->find($id);
            
            if (!$detalle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Detalle de factura no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $detalle
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el detalle de factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'id_factura' => 'exists:facturas,id_factura',
            'concepto' => 'string|max:200',
            'descripcion' => 'nullable|string',
            'cantidad' => 'integer|min:1',
            'precio_unitario' => 'numeric|min:0',
            'descuento' => 'nullable|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $detalle = DetalleFactura::find($id);
            
            if (!$detalle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Detalle de factura no encontrado'
                ], 404);
            }

            // Obtener la factura
            $factura = $detalle->factura;
            
            // Verificar que la factura no esté pagada o cancelada
            if (in_array($factura->estado, ['pagado', 'cancelado'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede modificar detalles de una factura ' . $factura->estado
                ], 400);
            }

            // Guardar valores anteriores para el recálculo
            $subtotalAnterior = $detalle->subtotal;
            $descuentoAnterior = $detalle->descuento;

            // Calcular nuevos montos si se proporcionan cantidad o precio
            $data = $request->all();
            if ($request->has('cantidad') || $request->has('precio_unitario')) {
                $cantidad = $request->cantidad ?? $detalle->cantidad;
                $precioUnitario = $request->precio_unitario ?? $detalle->precio_unitario;
                $descuento = $request->descuento ?? $detalle->descuento;
                
                $data['subtotal'] = $cantidad * $precioUnitario;
                $data['monto'] = $data['subtotal'] - $descuento;
            }

            $detalle->update($data);

            // Recalcular total de la factura
            $nuevoSubtotal = $factura->detalles()->sum('subtotal');
            $nuevoDescuento = $factura->detalles()->sum('descuento');
            $nuevoTotal = $nuevoSubtotal - $nuevoDescuento + $factura->impuesto;
            
            $factura->update([
                'subtotal' => $nuevoSubtotal,
                'descuento' => $nuevoDescuento,
                'total' => $nuevoTotal
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Detalle de factura actualizado exitosamente',
                'data' => $detalle->load('factura.deportista')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el detalle de factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $detalle = DetalleFactura::find($id);
            
            if (!$detalle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Detalle de factura no encontrado'
                ], 404);
            }

            // Obtener la factura
            $factura = $detalle->factura;
            
            // Verificar que la factura no esté pagada o cancelada
            if (in_array($factura->estado, ['pagado', 'cancelado'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar detalles de una factura ' . $factura->estado
                ], 400);
            }

            $detalle->delete();

            // Recalcular total de la factura
            $nuevoSubtotal = $factura->detalles()->sum('subtotal');
            $nuevoDescuento = $factura->detalles()->sum('descuento');
            $nuevoTotal = $nuevoSubtotal - $nuevoDescuento + $factura->impuesto;
            
            $factura->update([
                'subtotal' => $nuevoSubtotal,
                'descuento' => $nuevoDescuento,
                'total' => $nuevoTotal
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Detalle de factura eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el detalle de factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener detalles por factura.
     */
    public function porFactura(string $idFactura)
    {
        try {
            $detalles = DetalleFactura::where('id_factura', $idFactura)
                ->with('factura.deportista')
                ->get();

            if ($detalles->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron detalles para la factura especificada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $detalles
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener detalles por factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de conceptos.
     */
    public function estadisticasConceptos(Request $request)
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
            $conceptos = DetalleFactura::selectRaw('concepto, COUNT(*) as cantidad, SUM(cantidad) as unidades, SUM(monto) as total')
                ->whereHas('factura', function($query) use ($request) {
                    $query->whereBetween('fecha_emision', [$request->fecha_inicio, $request->fecha_fin])
                          ->where('estado', '!=', 'cancelado');
                })
                ->groupBy('concepto')
                ->orderBy('total', 'desc')
                ->get();

            $totalGeneral = $conceptos->sum('total');

            return response()->json([
                'success' => true,
                'data' => [
                    'periodo' => [
                        'fecha_inicio' => $request->fecha_inicio,
                        'fecha_fin' => $request->fecha_fin
                    ],
                    'conceptos' => $conceptos,
                    'total_general' => $totalGeneral
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas de conceptos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar detalles por concepto.
     */
    public function buscarPorConcepto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'concepto' => 'required|string|min:2'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $detalles = DetalleFactura::where('concepto', 'like', "%{$request->concepto}%")
                ->with('factura.deportista.usuario')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $detalles
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar detalles por concepto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener resumen de ventas por período.
     */
    public function resumenVentas(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio',
            'agrupacion' => 'nullable|in:diaria,semanal,mensual'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $agrupacion = $request->agrupacion ?? 'diaria';
            
            switch ($agrupacion) {
                case 'diaria':
                    $formatoFecha = '%Y-%m-%d';
                    $grupo = 'fecha';
                    break;
                case 'semanal':
                    $formatoFecha = '%Y-%U';
                    $grupo = 'semana';
                    break;
                case 'mensual':
                    $formatoFecha = '%Y-%m';
                    $grupo = 'mes';
                    break;
            }

            $ventas = DetalleFactura::selectRaw("
                    DATE_FORMAT(facturas.fecha_emision, '{$formatoFecha}') as {$grupo},
                    COUNT(DISTINCT facturas.id_factura) as facturas,
                    COUNT(*) as items,
                    SUM(detalle_facturas.cantidad) as unidades,
                    SUM(detalle_facturas.monto) as total
                ")
                ->join('facturas', 'detalle_facturas.id_factura', '=', 'facturas.id_factura')
                ->whereBetween('facturas.fecha_emision', [$request->fecha_inicio, $request->fecha_fin])
                ->where('facturas.estado', '!=', 'cancelado')
                ->groupBy($grupo)
                ->orderBy($grupo)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'periodo' => [
                        'fecha_inicio' => $request->fecha_inicio,
                        'fecha_fin' => $request->fecha_fin
                    ],
                    'agrupacion' => $agrupacion,
                    'ventas' => $ventas
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener resumen de ventas: ' . $e->getMessage()
            ], 500);
        }
    }
}