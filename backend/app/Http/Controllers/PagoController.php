<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Models\Factura;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class PagoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $pagos = Pago::with(['factura.deportista', 'factura.usuario'])->get();
            return response()->json([
                'success' => true,
                'data' => $pagos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los pagos: ' . $e->getMessage()
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
            'numero_pago' => 'required|string|max:50|unique:pagos,numero_pago',
            'monto' => 'required|numeric|min:0.01',
            'fecha_pago' => 'required|date',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia,otro',
            'referencia' => 'nullable|string|max:100',
            'comprobante' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
            'observaciones' => 'nullable|string',
            'estado' => 'nullable|in:pendiente,confirmado,rechazado'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $factura = Factura::find($request->id_factura);
            
            // Verificar que la factura no esté cancelada
            if ($factura->estado === 'cancelado') {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pueden registrar pagos para una factura cancelada'
                ], 400);
            }

            // Verificar que el monto no exceda el saldo pendiente
            $totalPagado = $factura->pagos()->where('estado', 'confirmado')->sum('monto');
            $saldoPendiente = $factura->total - $totalPagado;
            
            if ($request->monto > $saldoPendiente) {
                return response()->json([
                    'success' => false,
                    'message' => 'El monto del pago excede el saldo pendiente. Saldo pendiente: ' . $saldoPendiente
                ], 400);
            }

            $data = $request->all();
            
            // Manejar subida de comprobante
            if ($request->hasFile('comprobante')) {
                $comprobante = $request->file('comprobante');
                $comprobantePath = $comprobante->store('comprobantes', 'public');
                $data['comprobante'] = $comprobantePath;
            }

            $pago = Pago::create($data);

            // Si el pago está confirmado, actualizar estado de la factura si se paga completamente
            if ($pago->estado === 'confirmado') {
                $this->actualizarEstadoFactura($factura);
            }

            return response()->json([
                'success' => true,
                'message' => 'Pago registrado exitosamente',
                'data' => $pago->load(['factura.deportista', 'factura.usuario'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $pago = Pago::with([
                'factura.deportista.usuario',
                'factura.deportista.categoria',
                'factura.usuario',
                'factura.detalles'
            ])->find($id);
            
            if (!$pago) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pago no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $pago
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el pago: ' . $e->getMessage()
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
            'numero_pago' => 'string|max:50|unique:pagos,numero_pago,' . $id . ',id_pago',
            'monto' => 'numeric|min:0.01',
            'fecha_pago' => 'date',
            'metodo_pago' => 'in:efectivo,tarjeta,transferencia,otro',
            'referencia' => 'nullable|string|max:100',
            'comprobante' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
            'observaciones' => 'nullable|string',
            'estado' => 'in:pendiente,confirmado,rechazado'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $pago = Pago::find($id);
            
            if (!$pago) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pago no encontrado'
                ], 404);
            }

            $factura = $pago->factura;
            $estadoAnterior = $pago->estado;

            $data = $request->all();
            
            // Manejar subida de nuevo comprobante
            if ($request->hasFile('comprobante')) {
                // Eliminar comprobante anterior si existe
                if ($pago->comprobante && Storage::disk('public')->exists($pago->comprobante)) {
                    Storage::disk('public')->delete($pago->comprobante);
                }
                
                $comprobante = $request->file('comprobante');
                $comprobantePath = $comprobante->store('comprobantes', 'public');
                $data['comprobante'] = $comprobantePath;
            }

            // Si se cambia el monto, verificar que no exceda el saldo pendiente (considerando otros pagos)
            if ($request->has('monto') && $request->monto != $pago->monto) {
                $totalPagado = $factura->pagos()
                    ->where('id_pago', '!=', $id)
                    ->where('estado', 'confirmado')
                    ->sum('monto');
                
                $saldoPendiente = $factura->total - $totalPagado;
                
                if ($request->monto > $saldoPendiente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El nuevo monto excede el saldo pendiente. Saldo pendiente: ' . $saldoPendiente
                    ], 400);
                }
            }

            $pago->update($data);

            // Si cambió el estado, actualizar estado de la factura
            if ($request->has('estado') && $request->estado != $estadoAnterior) {
                $this->actualizarEstadoFactura($factura);
            }

            return response()->json([
                'success' => true,
                'message' => 'Pago actualizado exitosamente',
                'data' => $pago->load(['factura.deportista', 'factura.usuario'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $pago = Pago::find($id);
            
            if (!$pago) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pago no encontrado'
                ], 404);
            }

            // Eliminar comprobante si existe
            if ($pago->comprobante && Storage::disk('public')->exists($pago->comprobante)) {
                Storage::disk('public')->delete($pago->comprobante);
            }

            $factura = $pago->factura;
            $pago->delete();

            // Actualizar estado de la factura
            $this->actualizarEstadoFactura($factura);

            return response()->json([
                'success' => true,
                'message' => 'Pago eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un pago eliminado.
     */
    public function restore(string $id)
    {
        try {
            $pago = Pago::withTrashed()->find($id);
            
            if (!$pago) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pago no encontrado'
                ], 404);
            }

            if (!$pago->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El pago no está eliminado'
                ], 400);
            }

            $pago->restore();

            // Actualizar estado de la factura
            $factura = $pago->factura;
            $this->actualizarEstadoFactura($factura);

            return response()->json([
                'success' => true,
                'message' => 'Pago restaurado exitosamente',
                'data' => $pago
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar estado de una factura basado en sus pagos.
     */
    private function actualizarEstadoFactura(Factura $factura)
    {
        $totalPagado = $factura->pagos()->where('estado', 'confirmado')->sum('monto');
        
        if ($totalPagado >= $factura->total) {
            $factura->update(['estado' => 'pagado']);
        } elseif ($totalPagado > 0) {
            $factura->update(['estado' => 'pendiente']);
        } else {
            // Si no hay pagos, verificar si está vencida
            $hoy = now()->format('Y-m-d');
            if ($factura->fecha_vencimiento < $hoy) {
                $factura->update(['estado' => 'vencido']);
            } else {
                $factura->update(['estado' => 'pendiente']);
            }
        }
    }

    /**
     * Obtener pagos por factura.
     */
    public function porFactura(string $idFactura)
    {
        try {
            $pagos = Pago::where('id_factura', $idFactura)
                ->with(['factura.deportista', 'factura.usuario'])
                ->orderBy('fecha_pago', 'desc')
                ->get();

            if ($pagos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron pagos para la factura especificada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $pagos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener pagos por factura: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener pagos por estado.
     */
    public function porEstado(string $estado)
    {
        try {
            $pagos = Pago::where('estado', $estado)
                ->with(['factura.deportista', 'factura.usuario'])
                ->orderBy('fecha_pago', 'desc')
                ->get();

            if ($pagos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron pagos con el estado especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $pagos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener pagos por estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener pagos por rango de fechas.
     */
    public function porRangoFechas(Request $request)
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
            $pagos = Pago::whereBetween('fecha_pago', [$request->fecha_inicio, $request->fecha_fin])
                ->with(['factura.deportista', 'factura.usuario'])
                ->orderBy('fecha_pago', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $pagos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener pagos por rango de fechas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar pagos.
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
            
            $pagos = Pago::where('numero_pago', 'like', "%{$busqueda}%")
                ->orWhere('referencia', 'like', "%{$busqueda}%")
                ->orWhere('observaciones', 'like', "%{$busqueda}%")
                ->orWhereHas('factura', function($query) use ($busqueda) {
                    $query->where('numero_factura', 'like', "%{$busqueda}%")
                          ->orWhere('concepto', 'like', "%{$busqueda}%")
                          ->orWhereHas('deportista', function($q) use ($busqueda) {
                              $q->where('nombres', 'like', "%{$busqueda}%")
                                ->orWhere('apellidos', 'like', "%{$busqueda}%")
                                ->orWhere('numero_documento', 'like', "%{$busqueda}%");
                          });
                })
                ->with(['factura.deportista', 'factura.usuario'])
                ->orderBy('fecha_pago', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $pagos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar pagos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Confirmar un pago.
     */
    public function confirmar(string $id)
    {
        try {
            $pago = Pago::find($id);
            
            if (!$pago) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pago no encontrado'
                ], 404);
            }

            if ($pago->estado === 'confirmado') {
                return response()->json([
                    'success' => false,
                    'message' => 'El pago ya está confirmado'
                ], 400);
            }

            $pago->update(['estado' => 'confirmado']);

            // Actualizar estado de la factura
            $factura = $pago->factura;
            $this->actualizarEstadoFactura($factura);

            return response()->json([
                'success' => true,
                'message' => 'Pago confirmado exitosamente',
                'data' => $pago->load(['factura.deportista', 'factura.usuario'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al confirmar el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rechazar un pago.
     */
    public function rechazar(string $id, Request $request)
    {
        $validator = Validator::make($request->all(), [
            'motivo' => 'required|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $pago = Pago::find($id);
            
            if (!$pago) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pago no encontrado'
                ], 404);
            }

            if ($pago->estado === 'rechazado') {
                return response()->json([
                    'success' => false,
                    'message' => 'El pago ya está rechazado'
                ], 400);
            }

            $pago->update([
                'estado' => 'rechazado',
                'observaciones' => $request->motivo . ' | ' . ($pago->observaciones ?? '')
            ]);

            // Actualizar estado de la factura
            $factura = $pago->factura;
            $this->actualizarEstadoFactura($factura);

            return response()->json([
                'success' => true,
                'message' => 'Pago rechazado exitosamente',
                'data' => $pago->load(['factura.deportista', 'factura.usuario'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al rechazar el pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar número de pago automático.
     */
    public function generarNumeroPago()
    {
        try {
            // Obtener el año actual
            $anio = date('Y');
            
            // Buscar el último pago del año actual
            $ultimoPago = Pago::where('numero_pago', 'like', "PAGO-{$anio}-%")
                ->orderBy('numero_pago', 'desc')
                ->first();
            
            if ($ultimoPago) {
                // Extraer el número secuencial
                $partes = explode('-', $ultimoPago->numero_pago);
                $ultimoNumero = intval($partes[2]);
                $nuevoNumero = str_pad($ultimoNumero + 1, 6, '0', STR_PAD_LEFT);
            } else {
                // Primer pago del año
                $nuevoNumero = '000001';
            }
            
            $numeroPago = "PAGO-{$anio}-{$nuevoNumero}";

            return response()->json([
                'success' => true,
                'data' => [
                    'numero_pago' => $numeroPago
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar número de pago: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener resumen de pagos.
     */
    public function resumenPagos(Request $request)
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
            // Total pagos confirmados
            $totalConfirmados = Pago::whereBetween('fecha_pago', [$request->fecha_inicio, $request->fecha_fin])
                ->where('estado', 'confirmado')
                ->sum('monto');

            // Total pagos pendientes
            $totalPendientes = Pago::whereBetween('fecha_pago', [$request->fecha_inicio, $request->fecha_fin])
                ->where('estado', 'pendiente')
                ->sum('monto');

            // Total pagos rechazados
            $totalRechazados = Pago::whereBetween('fecha_pago', [$request->fecha_inicio, $request->fecha_fin])
                ->where('estado', 'rechazado')
                ->sum('monto');

            // Pagos por método
            $pagosPorMetodo = Pago::selectRaw('metodo_pago, COUNT(*) as cantidad, SUM(monto) as total')
                ->whereBetween('fecha_pago', [$request->fecha_inicio, $request->fecha_fin])
                ->where('estado', 'confirmado')
                ->groupBy('metodo_pago')
                ->get();

            // Pagos por día
            $pagosPorDia = Pago::selectRaw('DATE(fecha_pago) as fecha, COUNT(*) as cantidad, SUM(monto) as total')
                ->whereBetween('fecha_pago', [$request->fecha_inicio, $request->fecha_fin])
                ->where('estado', 'confirmado')
                ->groupBy('fecha')
                ->orderBy('fecha')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'periodo' => [
                        'fecha_inicio' => $request->fecha_inicio,
                        'fecha_fin' => $request->fecha_fin
                    ],
                    'total_confirmados' => $totalConfirmados,
                    'total_pendientes' => $totalPendientes,
                    'total_rechazados' => $totalRechazados,
                    'pagos_por_metodo' => $pagosPorMetodo,
                    'pagos_por_dia' => $pagosPorDia,
                    'promedio_diario' => $pagosPorDia->count() > 0 ? 
                        round($totalConfirmados / $pagosPorDia->count(), 2) : 0
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener resumen de pagos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener saldo pendiente de una factura.
     */
    public function saldoPendiente(string $idFactura)
    {
        try {
            $factura = Factura::find($idFactura);
            
            if (!$factura) {
                return response()->json([
                    'success' => false,
                    'message' => 'Factura no encontrada'
                ], 404);
            }

            $totalPagado = $factura->pagos()->where('estado', 'confirmado')->sum('monto');
            $saldoPendiente = $factura->total - $totalPagado;

            return response()->json([
                'success' => true,
                'data' => [
                    'factura' => $factura->numero_factura,
                    'total_factura' => $factura->total,
                    'total_pagado' => $totalPagado,
                    'saldo_pendiente' => $saldoPendiente,
                    'porcentaje_pagado' => $factura->total > 0 ? 
                        round(($totalPagado / $factura->total) * 100, 2) : 0,
                    'completamente_pagada' => $saldoPendiente <= 0
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener saldo pendiente: ' . $e->getMessage()
            ], 500);
        }
    }
}