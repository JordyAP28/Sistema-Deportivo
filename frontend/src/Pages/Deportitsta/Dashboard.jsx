import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, LogOut, Calendar, Trophy, Settings } from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Obtener usuario de localStorage
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    
    if (!userData || !token) {
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getRoleName = (idRol) => {
    switch(idRol) {
      case 1: return 'Administrador';
      case 2: return 'Deportista';
      case 3: return 'Secretario';
      default: return 'Usuario';
    }
  };

  const getRoleIcon = (idRol) => {
    switch(idRol) {
      case 1: return <Shield className="w-6 h-6" />;
      case 2: return <Trophy className="w-6 h-6" />;
      case 3: return <Calendar className="w-6 h-6" />;
      default: return <User className="w-6 h-6" />;
    }
  };

  const getRoleColor = (idRol) => {
    switch(idRol) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-green-100 text-green-800 border-green-200';
      case 3: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getRoleColor(user.id_rol)}`}>
                {getRoleIcon(user.id_rol)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel de {getRoleName(user.id_rol)}
                </h1>
                <p className="text-gray-600">Sistema de gestión deportiva</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del Usuario */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Información del Usuario</h2>
            <Settings className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Nombre Completo
                </label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 font-medium">
                    {user.nombre} {user.apellido}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Correo Electrónico
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{user.email}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Rol del Sistema
                </label>
                <div className={`flex items-center gap-3 p-3 ${getRoleColor(user.id_rol)} rounded-lg border`}>
                  {getRoleIcon(user.id_rol)}
                  <span className="font-semibold">{getRoleName(user.id_rol)}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Estado de la Cuenta
                </label>
                <div className={`p-3 rounded-lg ${
                  user.status === 'activo' 
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}>
                  <span className="font-medium capitalize">{user.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones según Rol */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Funcionalidades Disponibles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Administrador */}
            {user.id_rol === 1 && (
              <>
                <div className="p-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-red-600" />
                    <h3 className="font-semibold text-red-800">Gestión de Usuarios</h3>
                  </div>
                  <p className="text-gray-700 text-sm">
                    Administra todos los usuarios del sistema, crea, edita y elimina cuentas.
                  </p>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-6 h-6 text-purple-600" />
                    <h3 className="font-semibold text-purple-800">Configuración</h3>
                  </div>
                  <p className="text-gray-700 text-sm">
                    Configura parámetros del sistema y ajustes generales.
                  </p>
                </div>
              </>
            )}
            
            {/* Deportista */}
            {user.id_rol === 2 && (
              <>
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-6 h-6 text-green-600" />
                    <h3 className="font-semibold text-green-800">Mis Competencias</h3>
                  </div>
                  <p className="text-gray-700 text-sm">
                    Consulta tus competencias registradas y resultados.
                  </p>
                </div>
              </>
            )}
            
            {/* Secretario */}
            {user.id_rol === 3 && (
              <>
                <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Gestión de Eventos</h3>
                  </div>
                  <p className="text-gray-700 text-sm">
                    Organiza y gestiona eventos y competencias deportivas.
                  </p>
                </div>
              </>
            )}
            
            {/* Funcionalidad común para todos */}
            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Mi Perfil</h3>
              </div>
              <p className="text-gray-700 text-sm">
                Actualiza tu información personal y cambia tu contraseña.
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje de Bienvenida */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Bienvenido al sistema, <span className="font-semibold text-blue-600">{user.nombre}</span>. 
            Has iniciado sesión como <span className="font-semibold">{getRoleName(user.id_rol).toLowerCase()}</span>.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;