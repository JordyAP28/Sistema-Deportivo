<?php

namespace App\Http\Controllers;

use App\Models\Archivo;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ArchivoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $archivos = Archivo::with(['usuario', 'archivable'])->get();
            return response()->json([
                'success' => true,
                'data' => $archivos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los archivos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'archivable_type' => 'required|string',
            'archivable_id' => 'required|integer',
            'tipo' => 'required|in:documento,imagen,video,audio,otro',
            'archivo' => 'required|file|max:10240', // Máximo 10MB
            'descripcion' => 'nullable|string',
            'usuario_id' => 'required|exists:usuarios,id_usuario'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar que el modelo archivable exista
            $modelClass = $request->archivable_type;
            if (!class_exists($modelClass)) {
                return response()->json([
                    'success' => false,
                    'message' => 'El tipo de modelo no existe'
                ], 400);
            }

            $archivable = $modelClass::find($request->archivable_id);
            if (!$archivable) {
                return response()->json([
                    'success' => false,
                    'message' => 'El recurso al que se quiere adjuntar el archivo no existe'
                ], 404);
            }

            // Procesar archivo
            $archivo = $request->file('archivo');
            $nombreOriginal = $archivo->getClientOriginalName();
            $extension = $archivo->getClientOriginalExtension();
            $mimeType = $archivo->getMimeType();
            $tamaño = $archivo->getSize();
            
            // Generar nombre único
            $nombreArchivo = time() . '_' . uniqid() . '.' . $extension;
            
            // Determinar ruta según tipo
            $ruta = 'archivos/' . strtolower($request->tipo);
            
            // Almacenar archivo
            $rutaCompleta = $archivo->storeAs($ruta, $nombreArchivo, 'public');

            // Crear registro en la base de datos
            $archivoModel = Archivo::create([
                'archivable_type' => $request->archivable_type,
                'archivable_id' => $request->archivable_id,
                'tipo' => $request->tipo,
                'nombre_original' => $nombreOriginal,
                'nombre_archivo' => $nombreArchivo,
                'ruta' => $rutaCompleta,
                'extension' => $extension,
                'mime_type' => $mimeType,
                'tamaño' => $tamaño,
                'descripcion' => $request->descripcion,
                'usuario_id' => $request->usuario_id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Archivo subido exitosamente',
                'data' => $archivoModel->load(['usuario', 'archivable'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir el archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $archivo = Archivo::with(['usuario', 'archivable'])->find($id);
            
            if (!$archivo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $archivo
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'tipo' => 'in:documento,imagen,video,audio,otro',
            'descripcion' => 'nullable|string',
            'usuario_id' => 'exists:usuarios,id_usuario'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $archivo = Archivo::find($id);
            
            if (!$archivo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo no encontrado'
                ], 404);
            }

            $archivo->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Archivo actualizado exitosamente',
                'data' => $archivo->load(['usuario', 'archivable'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $archivo = Archivo::find($id);
            
            if (!$archivo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo no encontrado'
                ], 404);
            }

            // Eliminar archivo físico
            if (Storage::disk('public')->exists($archivo->ruta)) {
                Storage::disk('public')->delete($archivo->ruta);
            }

            $archivo->delete();

            return response()->json([
                'success' => true,
                'message' => 'Archivo eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un archivo eliminado.
     */
    public function restore(string $id)
    {
        try {
            $archivo = Archivo::withTrashed()->find($id);
            
            if (!$archivo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo no encontrado'
                ], 404);
            }

            if (!$archivo->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El archivo no está eliminado'
                ], 400);
            }

            $archivo->restore();

            return response()->json([
                'success' => true,
                'message' => 'Archivo restaurado exitosamente',
                'data' => $archivo
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar el archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Descargar un archivo.
     */
    public function download(string $id)
    {
        try {
            $archivo = Archivo::find($id);
            
            if (!$archivo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo no encontrado'
                ], 404);
            }

            if (!Storage::disk('public')->exists($archivo->ruta)) {
                return response()->json([
                    'success' => false,
                    'message' => 'El archivo físico no existe'
                ], 404);
            }

            $rutaCompleta = Storage::disk('public')->path($archivo->ruta);
            
            return response()->download($rutaCompleta, $archivo->nombre_original);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al descargar el archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ver archivo (mostrar en navegador).
     */
    public function view(string $id)
    {
        try {
            $archivo = Archivo::find($id);
            
            if (!$archivo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo no encontrado'
                ], 404);
            }

            if (!Storage::disk('public')->exists($archivo->ruta)) {
                return response()->json([
                    'success' => false,
                    'message' => 'El archivo físico no existe'
                ], 404);
            }

            $rutaCompleta = Storage::disk('public')->path($archivo->ruta);
            
            return response()->file($rutaCompleta);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al visualizar el archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener archivos por tipo.
     */
    public function porTipo(string $tipo)
    {
        try {
            $archivos = Archivo::where('tipo', $tipo)
                ->with(['usuario', 'archivable'])
                ->orderBy('created_at', 'desc')
                ->get();

            if ($archivos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron archivos del tipo especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $archivos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener archivos por tipo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener archivos por usuario.
     */
    public function porUsuario(string $idUsuario)
    {
        try {
            $archivos = Archivo::where('usuario_id', $idUsuario)
                ->with(['usuario', 'archivable'])
                ->orderBy('created_at', 'desc')
                ->get();

            if ($archivos->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron archivos para el usuario especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $archivos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener archivos por usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener archivos por recurso (archivable).
     */
    public function porRecurso(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'archivable_type' => 'required|string',
            'archivable_id' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $archivos = Archivo::where('archivable_type', $request->archivable_type)
                ->where('archivable_id', $request->archivable_id)
                ->with(['usuario', 'archivable'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $archivos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener archivos por recurso: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar archivos.
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
            
            $archivos = Archivo::where('nombre_original', 'like', "%{$busqueda}%")
                ->orWhere('descripcion', 'like', "%{$busqueda}%")
                ->orWhere('extension', 'like', "%{$busqueda}%")
                ->orWhereHas('usuario', function($query) use ($busqueda) {
                    $query->where('nombre', 'like', "%{$busqueda}%")
                          ->orWhere('apellido', 'like', "%{$busqueda}%")
                          ->orWhere('email', 'like', "%{$busqueda}%");
                })
                ->with(['usuario', 'archivable'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $archivos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar archivos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de archivos.
     */
    public function estadisticas()
    {
        try {
            $total = Archivo::count();
            $totalTamaño = Archivo::sum('tamaño');
            
            $porTipo = Archivo::selectRaw('tipo, COUNT(*) as cantidad, SUM(tamaño) as tamaño_total')
                ->groupBy('tipo')
                ->get();
            
            $porExtension = Archivo::selectRaw('extension, COUNT(*) as cantidad')
                ->groupBy('extension')
                ->orderBy('cantidad', 'desc')
                ->limit(10)
                ->get();
            
            $porUsuario = Archivo::selectRaw('usuario_id, COUNT(*) as cantidad')
                ->groupBy('usuario_id')
                ->with('usuario')
                ->orderBy('cantidad', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_archivos' => $total,
                    'total_tamaño' => $totalTamaño,
                    'tamaño_promedio' => $total > 0 ? round($totalTamaño / $total) : 0,
                    'por_tipo' => $porTipo,
                    'por_extension' => $porExtension,
                    'por_usuario' => $porUsuario
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener archivos recientes.
     */
    public function recientes()
    {
        try {
            $archivos = Archivo::with(['usuario', 'archivable'])
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $archivos
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener archivos recientes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reemplazar archivo.
     */
    public function reemplazar(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'archivo' => 'required|file|max:10240',
            'descripcion' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $archivoExistente = Archivo::find($id);
            
            if (!$archivoExistente) {
                return response()->json([
                    'success' => false,
                    'message' => 'Archivo no encontrado'
                ], 404);
            }

            // Eliminar archivo físico anterior
            if (Storage::disk('public')->exists($archivoExistente->ruta)) {
                Storage::disk('public')->delete($archivoExistente->ruta);
            }

            // Procesar nuevo archivo
            $nuevoArchivo = $request->file('archivo');
            $nombreOriginal = $nuevoArchivo->getClientOriginalName();
            $extension = $nuevoArchivo->getClientOriginalExtension();
            $mimeType = $nuevoArchivo->getMimeType();
            $tamaño = $nuevoArchivo->getSize();
            
            // Generar nombre único
            $nombreArchivo = time() . '_' . uniqid() . '.' . $extension;
            
            // Determinar ruta según tipo existente
            $ruta = 'archivos/' . strtolower($archivoExistente->tipo);
            
            // Almacenar nuevo archivo
            $rutaCompleta = $nuevoArchivo->storeAs($ruta, $nombreArchivo, 'public');

            // Actualizar registro
            $archivoExistente->update([
                'nombre_original' => $nombreOriginal,
                'nombre_archivo' => $nombreArchivo,
                'ruta' => $rutaCompleta,
                'extension' => $extension,
                'mime_type' => $mimeType,
                'tamaño' => $tamaño,
                'descripcion' => $request->descripcion ?? $archivoExistente->descripcion
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Archivo reemplazado exitosamente',
                'data' => $archivoExistente->load(['usuario', 'archivable'])
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al reemplazar el archivo: ' . $e->getMessage()
            ], 500);
        }
    }
}