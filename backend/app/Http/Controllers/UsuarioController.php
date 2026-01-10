<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UsuarioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $usuarios = Usuario::with(['rol', 'deportistas'])->get();
            return response()->json([
                'success' => true,
                'data' => $usuarios
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los usuarios: ' . $e->getMessage()
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
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'email' => 'required|string|email|max:100|unique:usuarios,email',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'password' => 'required|string|min:8|confirmed',
            'status' => 'nullable|in:activo,inactivo,suspendido'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $request->all();
            $data['password'] = Hash::make($request->password);

            // Manejar subida de avatar
            if ($request->hasFile('avatar')) {
                $avatar = $request->file('avatar');
                $avatarPath = $avatar->store('avatars', 'public');
                $data['avatar'] = $avatarPath;
            }

            $usuario = Usuario::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'data' => $usuario->load('rol')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            $usuario = Usuario::with(['rol', 'deportistas', 'inscripcionesCursos.curso', 'facturas', 'notificaciones'])
                ->find($id);
            
            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $usuario
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el usuario: ' . $e->getMessage()
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
            'nombre' => 'string|max:100',
            'apellido' => 'string|max:100',
            'email' => 'string|email|max:100|unique:usuarios,email,' . $id . ',id_usuario',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'password' => 'nullable|string|min:8|confirmed',
            'status' => 'nullable|in:activo,inactivo,suspendido'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $usuario = Usuario::find($id);
            
            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            $data = $request->except('password');
            
            // Actualizar contraseña si se proporciona
            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            // Manejar subida de nuevo avatar
            if ($request->hasFile('avatar')) {
                // Eliminar avatar anterior si existe
                if ($usuario->avatar && Storage::disk('public')->exists($usuario->avatar)) {
                    Storage::disk('public')->delete($usuario->avatar);
                }
                
                $avatar = $request->file('avatar');
                $avatarPath = $avatar->store('avatars', 'public');
                $data['avatar'] = $avatarPath;
            }

            $usuario->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Usuario actualizado exitosamente',
                'data' => $usuario->load('rol')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $usuario = Usuario::find($id);
            
            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // Verificar si hay datos asociados
            if ($usuario->deportistas()->count() > 0 ||
                $usuario->facturas()->count() > 0 ||
                $usuario->inscripcionesCursos()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el usuario porque tiene datos asociados'
                ], 400);
            }

            // Eliminar avatar si existe
            if ($usuario->avatar && Storage::disk('public')->exists($usuario->avatar)) {
                Storage::disk('public')->delete($usuario->avatar);
            }

            $usuario->delete();

            return response()->json([
                'success' => true,
                'message' => 'Usuario eliminado exitosamente'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un usuario eliminado.
     */
    public function restore(string $id)
    {
        try {
            $usuario = Usuario::withTrashed()->find($id);
            
            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            if (!$usuario->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario no está eliminado'
                ], 400);
            }

            $usuario->restore();

            return response()->json([
                'success' => true,
                'message' => 'Usuario restaurado exitosamente',
                'data' => $usuario
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restaurar el usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar perfil del usuario autenticado.
     */
    public function actualizarPerfil(Request $request)
    {
        $usuario = request()->user();
        
        $validator = Validator::make($request->all(), [
            'nombre' => 'string|max:100',
            'apellido' => 'string|max:100',
            'email' => 'string|email|max:100|unique:usuarios,email,' . $usuario->id_usuario . ',id_usuario',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'password_actual' => 'required_with:password|string',
            'password' => 'nullable|string|min:8|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $request->except(['password_actual', 'password']);
            
            // Verificar contraseña actual si se quiere cambiar la contraseña
            if ($request->filled('password')) {
                if (!Hash::check($request->password_actual, $usuario->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'La contraseña actual es incorrecta'
                    ], 401);
                }
                
                $data['password'] = Hash::make($request->password);
            }

            // Manejar subida de nuevo avatar
            if ($request->hasFile('avatar')) {
                // Eliminar avatar anterior si existe
                if ($usuario->avatar && Storage::disk('public')->exists($usuario->avatar)) {
                    Storage::disk('public')->delete($usuario->avatar);
                }
                
                $avatar = $request->file('avatar');
                $avatarPath = $avatar->store('avatars', 'public');
                $data['avatar'] = $avatarPath;
            }

            $usuario->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Perfil actualizado exitosamente',
                'data' => $usuario
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el perfil: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener usuarios por rol.
     */
    public function porRol(string $idRol)
    {
        try {
            $usuarios = Usuario::where('id_rol', $idRol)
                ->with('rol')
                ->get();

            if ($usuarios->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron usuarios para el rol especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $usuarios
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios por rol: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener usuarios por estado.
     */
    public function porEstado(string $estado)
    {
        try {
            $usuarios = Usuario::where('status', $estado)
                ->with('rol')
                ->get();

            if ($usuarios->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron usuarios con el estado especificado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $usuarios
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios por estado: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar usuarios.
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
            
            $usuarios = Usuario::where('nombre', 'like', "%{$busqueda}%")
                ->orWhere('apellido', 'like', "%{$busqueda}%")
                ->orWhere('email', 'like', "%{$busqueda}%")
                ->orWhere('telefono', 'like', "%{$busqueda}%")
                ->with('rol')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $usuarios
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar usuarios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de usuarios.
     */
    public function estadisticas()
    {
        try {
            $total = Usuario::count();
            $activos = Usuario::where('status', 'activo')->count();
            $inactivos = Usuario::where('status', 'inactivo')->count();
            $suspendidos = Usuario::where('status', 'suspendido')->count();
            
            $porRol = Usuario::selectRaw('id_rol, COUNT(*) as total')
                ->groupBy('id_rol')
                ->with('rol')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'activos' => $activos,
                    'inactivos' => $inactivos,
                    'suspendidos' => $suspendidos,
                    'por_rol' => $porRol
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }
}