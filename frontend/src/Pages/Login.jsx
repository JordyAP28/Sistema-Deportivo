import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import '../styles/public/registro.css';


const API_URL = 'http://localhost:8000/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Guardar el token en localStorage
        localStorage.setItem('auth_token', data.data.token);
        
        // Guardar datos del usuario
        localStorage.setItem('user', JSON.stringify(data.data.usuario));
        
        setSuccess(true);
        
        // Aquí puedes redirigir al dashboard o actualizar el estado global
        console.log('Login exitoso:', data.data);
        
        // Simular redirección (en tu app real usarías React Router)
        setTimeout(() => {
          alert('¡Login exitoso! Token guardado en localStorage');
        }, 500);
        
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión. Verifica que tu API esté corriendo.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-600">Bienvenido de nuevo</p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium text-sm">Error de autenticación</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de Éxito */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-800 font-medium text-sm">¡Inicio de sesión exitoso!</p>
                  <p className="text-green-700 text-sm mt-1">Redirigiendo al dashboard...</p>
                </div>
              </div>
            </div>
          )}

          {/* Formulario */}
          <div className="space-y-6">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-800"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onKeyDown={handleKeyPress}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-800"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyDown={handleKeyPress}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Recordarme y Olvidé mi contraseña */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" />
                <span className="text-gray-600">Recordarme</span>
              </label>
              <button className="text-blue-600 hover:text-blue-700 font-medium transition">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón de Login */}
            <button
              onClick={handleLogin}
              disabled={loading || !formData.email || !formData.password}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">o continúa con</span>
            </div>
          </div>



          {/* Footer - Link a Registro */}
          <div className="mt-8 text-center">
            <span className="text-gray-600">¿No tienes una cuenta? </span>
            <button className="text-blue-600 font-semibold hover:text-blue-700 transition">
              Regístrate gratis
            </button>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Al iniciar sesión, aceptas nuestros{' '}
            <button className="text-blue-600 hover:underline">Términos de Servicio</button>
            {' '}y{' '}
            <button className="text-blue-600 hover:underline">Política de Privacidad</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;