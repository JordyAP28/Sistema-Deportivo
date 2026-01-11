<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Routing\Controller;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            // Validación
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|max:255',
                'password' => 'required|string|min:8',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Buscar usuario incluyendo la relación con rol
            $usuario = Usuario::with('rol')
                ->where('email', $request->email)
                ->first();

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciales inválidas',
                ], 401);
            }

            // Verificar si el usuario está activo
            if ($usuario->status !== 'activo') {
                return response()->json([
                    'success' => false,
                    'message' => 'Tu cuenta no está activa. Contacta al administrador.',
                ], 401);
            }

            // Verificar contraseña
            if (!Hash::check($request->password, $usuario->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciales inválidas',
                ], 401);
            }

            // Crear token Sanctum
            $token = $usuario->createToken('auth_token')->plainTextToken;

            // Preparar respuesta del usuario
            $userResponse = [
                'id_usuario' => $usuario->id_usuario,
                'id_rol' => $usuario->id_rol,
                'nombre' => $usuario->nombre,
                'apellido' => $usuario->apellido,
                'email' => $usuario->email,
                'telefono' => $usuario->telefono,
                'direccion' => $usuario->direccion,
                'avatar' => $usuario->avatar,
                'status' => $usuario->status,
                'rol' => $usuario->rol ? [
                    'id_rol' => $usuario->rol->id_rol,
                    'nombre' => $usuario->rol->nombre,
                    'descripcion' => $usuario->rol->descripcion,
                ] : null,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Inicio de sesión exitoso',
                'data' => [
                    'usuario' => $userResponse,
                    'token' => $token,
                    'token_type' => 'Bearer',
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Error en login: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_rol' => 'required|exists:rols,id_rol',
                'nombre' => 'required|string|max:100',
                'apellido' => 'required|string|max:100',
                'email' => 'required|string|email|max:255|unique:usuarios,email',
                'password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();
            $usuario = Usuario::create([
                'id_rol' => $data['id_rol'],
                'nombre' => $data['nombre'],
                'apellido' => $data['apellido'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'status' => 'activo',
            ]);

            $token = $usuario->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Usuario registrado exitosamente',
                'data' => [
                    'usuario' => $usuario,
                    'token' => $token,
                    'token_type' => 'Bearer',
                ],
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Error en registro: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor',
                'error' => env('APP_DEBUG') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function me(Request $request)
    {
        try {
            $user = $request->user()->load('rol');
            
            return response()->json([
                'success' => true,
                'data' => $user,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error en me: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener información del usuario',
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Sesión cerrada correctamente',
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error en logout: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar sesión',
            ], 500);
        }
    }
}