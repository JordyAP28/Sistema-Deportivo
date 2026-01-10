<?php

namespace App\Http\Controllers;

use App\Models\Factura;
use App\Models\Deportista;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB; 
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class FacturaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $facturas = Factura::with(['deportista.usuario', 'usuario', 'detalles', 'pagos'])->get();
            return response()->json([
                'success' => true,
                'data' => $facturas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las facturas: ' . $e->getMessage()
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
            'usuario_id' => 'required|exists:usuarios,id_usuario',
            'numero_factura' => 'required|string|max:50|unique:facturas,numero_factura',
            'concepto' => 'required|string|max:200',
            'fecha_emision' => 'required|date',
            'fecha_vencimiento' => 'required|date|after:fecha_emision',
            'subtotal' => 'required|numeric|min:0',
            'descuento' => 'nullable|numeric|min:0',
            'impuesto' => 'nullable|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'estado' => 'nullable|in:pendiente,pagado,vencido,cancelado',
            'metodo_pago' => 'nullable|in:efectivo,tarjeta,transferencia,otro',
            'comprobante_pago' => 'nullable|string',
            'observaciones' => 'nullable|string',
            'detalles' => 'required|array|min:1',
            'detalles.*.concepto' => 'required|string|max:200',
            'detalles.*.descripcion' => 'nullable|string',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
            'detalles.*.descuento' => 'nullable|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Crear factura
            $factura = Factura::create($request->except('detalles'));

            // Crear detalles de factura
            $detalles = [];
            $totalCalculado = 0;
            
            foreach ($request->detalles as $detalle) {
                $subtotal = $detalle['cantidad'] * $detalle['precio_unitario'];
                $descuento = $detalle['descuento'] ?? 0;
                $monto = $subtotal - $descuento;
                $totalCalculado += $monto;
                
                $detalles[] = [
                    'id_factura' => $factura->id_factura,
                    'concepto' => $detalle['concepto'],
                    'descripcion' => $detalle['descripcion'] ?? null,
                    'cantidad' => $detalle['cantidad'],
                    'precio_unitario' => $detalle['precio_unitario'],
                    'subtotal' => $subtotal,
                    'descuento' => $descuento,
                    'monto' => $monto,
                    'created_at' => now(),
                    'updated_at' => now()
                ];
            }

            // Insertar detalles
            DB::table('detalle_facturas')->insert($detalles);

            // Verificar que el total calculado coincida con el total proporcionado
            $tolerancia = 0.01; // Tolerancia de 1 centavo
            if (abs($totalCalculado - $factura->total) > $tolerancia) {
                // Si no coincide, actualizar el total
                $factura->update([
                    'subtotal' => $factura->subtotal,
                    'total' => $totalCalculado + $factura->impuesto
                ]);
            }

            // Cargar relaciones
            $factura->load(['deportista.usuario', 'usuario', 'detalles', 'pagos']);

            return response()->json([
                'success' => true,
                'message' => 'Factura creada exitosamente',
                'data' => $factura
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $factura = Factura::with([
                'deportista.usuario',
                'deportista.categoria',
                'usuario',
                'detalles',
                'pagos'
            ])->find($id);
            
            if (!$factura) {
                return response()->json([
                    'success' => false,
                    'message' => 'Factura no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $factura
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la factura: ' . $e->getMessage()
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
            'usuario_id' => 'exists:usuarios,id_usuario',
            'numero_factura' => 'string|max:50|unique:facturas,numero_factura,' . $id . ',id_factura',
            'concepto' => 'string|max:200',
            'fecha_emision' => 'date',
            'fecha_vencimiento' => 'date|after:fecha_emision',
            'subtotal' => 'numeric|min:0',
            'descuento' => 'nullable|numeric|min:0',
            'impuesto' => 'nullable|numeric|min:0',
            'total' => 'numeric|min:0',
            'estado' => 'in:pendiente,pagado,vencido,cancelado',
            'metodo_pago' => 'nullable|in:efectivo,tarjeta,transferencia,otro',
            'comprobante_pago' => 'nullable|string',
            'observaciones' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $factura = Factura::find($id);
            
            if (!$factura) {
                return response()->json([
                    'success' => false,
                    'message' => 'Factura no encontrada'
                ], 404);
            }

            // No permitir modificar facturas pagadas o canceladas
            if (in_array($factura->estado, ['pagado', 'cancelado'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede modificar una factura ' . $factura->estado
                ], 400);
            }

            $factura->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Factura actualizada exitosamente',
                'data' => $factura->load(['deportista.usuario', 'usuario', 'detalles', 'pagos'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $factura = Factura::find($id);
            
            if (!$factura) {
                return response()->json([
                    'success' => false,
                    'message' => 'Factura no encontrada'
                ], 404);
            }

            // No permitir eliminar facturas con pagos asociados
            if ($factura->pagos()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar una factura con pagos asociados'
                ], 400);
            }

            // Eliminar detalles primero
            $factura->detalles()->delete();
            $factura->delete();

            return response()->json([
                'success' => true,
                'message' => 'Factura eliminada exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar una factura eliminada.
     */
    public function restore(string $id)
    {
        try {
            $factura = Factura::withTrashed()->find($id);
            
            if (!$factura) {
                return response()->json([
                    'success' => false,
                    'message' => 'Factura no encontrada'
                ], 404);
            }

            if (!$factura->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'La factura no está eliminada'
                ], 400);
            }

            // Restaurar detalles también
            $factura->detalles()->withTrashed()->restore();
            $factura->restore();

            return response()->json([
                'success' => true,
                'message' => 'Factura restaurada exitosamente',
                'data' => $factura
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar la factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener facturas por deportista.
     */
    public function porDeportista(string $idDeportista)
    {
        try {
            $facturas = Factura::where('id_deportista', $idDeportista)
                ->with(['deportista.usuario', 'usuario', 'detalles', 'pagos'])
                ->orderBy('fecha_emision', 'desc')
                ->get();

            if ($facturas->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron facturas para el deportista especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $facturas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener facturas por deportista: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener facturas por estado.
     */
    public function porEstado(string $estado)
    {
        try {
            $facturas = Factura::where('estado', $estado)
                ->with(['deportista.usuario', 'usuario', 'detalles', 'pagos'])
                ->orderBy('fecha_emision', 'desc')
                ->get();

            if ($facturas->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron facturas con el estado especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $facturas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener facturas por estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener facturas por rango de fechas.
     */
    public function porRangoFechas(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after:fecha_inicio',
            'tipo_fecha' => 'nullable|in:emision,vencimiento'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $tipoFecha = $request->tipo_fecha ?? 'emision';
            $campoFecha = $tipoFecha === 'vencimiento' ? 'fecha_vencimiento' : 'fecha_emision';
            
            $facturas = Factura::whereBetween($campoFecha, [$request->fecha_inicio, $request->fecha_fin])
                ->with(['deportista.usuario', 'usuario', 'detalles', 'pagos'])
                ->orderBy($campoFecha, 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $facturas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener facturas por rango de fechas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar facturas.
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
            
            $facturas = Factura::where('numero_factura', 'like', "%{$busqueda}%")
                ->orWhere('concepto', 'like', "%{$busqueda}%")
                ->orWhere('observaciones', 'like', "%{$busqueda}%")
                ->orWhereHas('deportista', function($query) use ($busqueda) {
                    $query->where('nombres', 'like', "%{$busqueda}%")
                          ->orWhere('apellidos', 'like', "%{$busqueda}%")
                          ->orWhere('numero_documento', 'like', "%{$busqueda}%");
                })
                ->orWhereHas('usuario', function($query) use ($busqueda) {
                    $query->where('nombre', 'like', "%{$busqueda}%")
                          ->orWhere('apellido', 'like', "%{$busqueda}%")
                          ->orWhere('email', 'like', "%{$busqueda}%");
                })
                ->with(['deportista.usuario', 'usuario', 'detalles', 'pagos'])
                ->orderBy('fecha_emision', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $facturas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar facturas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar estado de una factura.
     */
    public function cambiarEstado(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'required|in:pendiente,pagado,vencido,cancelado'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $factura = Factura::find($id);
            
            if (!$factura) {
                return response()->json([
                    'success' => false,
                    'message' => 'Factura no encontrada'
                ], 404);
            }

            $factura->update(['estado' => $request->estado]);

            return response()->json([
                'success' => true,
                'message' => 'Estado de la factura actualizado exitosamente',
                'data' => $factura
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar estado de la factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener resumen financiero.
     */
    public function resumenFinanciero(Request $request)
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
            // Total facturado
            $totalFacturado = Factura::whereBetween('fecha_emision', [$request->fecha_inicio, $request->fecha_fin])
                ->sum('total');

            // Total pagado
            $totalPagado = Factura::whereBetween('fecha_emision', [$request->fecha_inicio, $request->fecha_fin])
                ->where('estado', 'pagado')
                ->sum('total');

            // Total pendiente
            $totalPendiente = Factura::whereBetween('fecha_emision', [$request->fecha_inicio, $request->fecha_fin])
                ->where('estado', 'pendiente')
                ->sum('total');

            // Total vencido
            $totalVencido = Factura::whereBetween('fecha_emision', [$request->fecha_inicio, $request->fecha_fin])
                ->where('estado', 'vencido')
                ->sum('total');

            // Total cancelado
            $totalCancelado = Factura::whereBetween('fecha_emision', [$request->fecha_inicio, $request->fecha_fin])
                ->where('estado', 'cancelado')
                ->sum('total');

            // Facturas por estado
            $facturasPorEstado = Factura::selectRaw('estado, COUNT(*) as cantidad, SUM(total) as monto')
                ->whereBetween('fecha_emision', [$request->fecha_inicio, $request->fecha_fin])
                ->groupBy('estado')
                ->get();

            // Facturas por mes
            $facturasPorMes = Factura::selectRaw('DATE_FORMAT(fecha_emision, "%Y-%m") as mes, COUNT(*) as cantidad, SUM(total) as monto')
                ->whereBetween('fecha_emision', [$request->fecha_inicio, $request->fecha_fin])
                ->groupBy('mes')
                ->orderBy('mes')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'periodo' => [
                        'fecha_inicio' => $request->fecha_inicio,
                        'fecha_fin' => $request->fecha_fin
                    ],
                    'total_facturado' => $totalFacturado,
                    'total_pagado' => $totalPagado,
                    'total_pendiente' => $totalPendiente,
                    'total_vencido' => $totalVencido,
                    'total_cancelado' => $totalCancelado,
                    'facturas_por_estado' => $facturasPorEstado,
                    'facturas_por_mes' => $facturasPorMes,
                    'porcentaje_cobranza' => $totalFacturado > 0 ? 
                        round(($totalPagado / $totalFacturado) * 100, 2) : 0
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener resumen financiero: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar número de factura automático.
     */
    public function generarNumeroFactura()
    {
        try {
            // Obtener el año actual
            $anio = date('Y');
            
            // Buscar la última factura del año actual
            $ultimaFactura = Factura::where('numero_factura', 'like', "FACT-{$anio}-%")
                ->orderBy('numero_factura', 'desc')
                ->first();
            
            if ($ultimaFactura) {
                // Extraer el número secuencial
                $partes = explode('-', $ultimaFactura->numero_factura);
                $ultimoNumero = intval($partes[2]);
                $nuevoNumero = str_pad($ultimoNumero + 1, 6, '0', STR_PAD_LEFT);
            } else {
                // Primera factura del año
                $nuevoNumero = '000001';
            }
            
            $numeroFactura = "FACT-{$anio}-{$nuevoNumero}";

            return response()->json([
                'success' => true,
                'data' => [
                    'numero_factura' => $numeroFactura
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar número de factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar facturas vencidas.
     */
    public function verificarVencidas()
    {
        try {
            $hoy = now()->format('Y-m-d');
            
            $facturasVencidas = Factura::where('fecha_vencimiento', '<', $hoy)
                ->where('estado', 'pendiente')
                ->with(['deportista.usuario'])
                ->get();

            // Actualizar estado de facturas vencidas
            if ($facturasVencidas->isNotEmpty()) {
                Factura::where('fecha_vencimiento', '<', $hoy)
                    ->where('estado', 'pendiente')
                    ->update(['estado' => 'vencido']);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'fecha_verificacion' => $hoy,
                    'facturas_vencidas' => $facturasVencidas->count(),
                    'detalle' => $facturasVencidas
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar facturas vencidas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Agregar detalle a factura.
     */
    public function agregarDetalle(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
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
            $factura = Factura::find($id);
            
            if (!$factura) {
                return response()->json([
                    'success' => false,
                    'message' => 'Factura no encontrada'
                ], 404);
            }

            // No permitir agregar detalles a facturas pagadas o canceladas
            if (in_array($factura->estado, ['pagado', 'cancelado'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede modificar una factura ' . $factura->estado
                ], 400);
            }

            // Calcular montos
            $subtotal = $request->cantidad * $request->precio_unitario;
            $descuento = $request->descuento ?? 0;
            $monto = $subtotal - $descuento;

            // Crear detalle
            $detalle = $factura->detalles()->create([
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
                'message' => 'Detalle agregado exitosamente',
                'data' => $factura->load(['deportista.usuario', 'usuario', 'detalles', 'pagos'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al agregar detalle: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar detalle de factura.
     */
    public function eliminarDetalle(string $idFactura, string $idDetalle)
    {
        try {
            $factura = Factura::find($idFactura);
            
            if (!$factura) {
                return response()->json([
                    'success' => false,
                    'message' => 'Factura no encontrada'
                ], 404);
            }

            // No permitir eliminar detalles de facturas pagadas o canceladas
            if (in_array($factura->estado, ['pagado', 'cancelado'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede modificar una factura ' . $factura->estado
                ], 400);
            }

            $detalle = $factura->detalles()->find($idDetalle);
            
            if (!$detalle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Detalle no encontrado'
                ], 404);
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
                'message' => 'Detalle eliminado exitosamente',
                'data' => $factura->load(['deportista.usuario', 'usuario', 'detalles', 'pagos'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar detalle: ' . $e->getMessage()
            ], 500);
        }
    }
}