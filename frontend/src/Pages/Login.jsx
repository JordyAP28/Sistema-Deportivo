import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import '../styles/Login.css';

const API_URL = 'http://localhost:8000/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
  setError('');
  setLoading(true);

  try {
    console.log('Enviando datos:', formData);
    
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Quita credentials por ahora para probar
      // credentials: 'include',
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      }),
    });

    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Respuesta API:', data);

    if (response.ok) {
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.usuario));
      
      const userRole = data.data.usuario.id_rol;
      
      switch(userRole) {
        case 1:
          navigate('/Admin/Dashboard');
          break;
        case 2:
          navigate('/Deportista/Dashboard');
          break;
        case 3:
          navigate('/Secretario/Dashboard');
          break;
        default:
          navigate('/');
      }
      
    } else {
      setError(data.message || `Error ${response.status}: ${response.statusText}`);
    }
  } catch (err) {
    console.error('Error completo:', err);
    setError(`Error de conexión: ${err.message}. Verifica que tu API esté corriendo en ${API_URL}.`);
  } finally {
    setLoading(false);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // Para pruebas rápidas - quita esto en producción
  const fillTestCredentials = (role) => {
    const testAccounts = {
      1: { email: 'admin@test.com', password: 'password123' },
      2: { email: 'deportista@test.com', password: 'password123' },
      3: { email: 'secretario@test.com', password: 'password123' }
    };
    
    if (testAccounts[role]) {
      setFormData(testAccounts[role]);
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
            
            {/* Botones de prueba - Quita en producción */}
            <div className="mt-4 flex gap-2 justify-center">
              <button 
                onClick={() => fillTestCredentials(1)}
                className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
              >
                Admin Test
              </button>
              <button 
                onClick={() => fillTestCredentials(2)}
                className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
              >
                Deportista Test
              </button>
              <button 
                onClick={() => fillTestCredentials(3)}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
              >
                Secretario Test
              </button>
            </div>
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

          {/* Footer */}
          <div className="mt-8 text-center">
            <span className="text-gray-600">¿No tienes una cuenta? </span>
            <button 
              className="text-blue-600 font-semibold hover:text-blue-700 transition"
              onClick={() => navigate('/registro')}
            >
              Regístrate gratis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;