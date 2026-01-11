import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Edit2, Trash2, Eye, Filter, 
  UserCheck, UserX, AlertCircle, CheckCircle, MoreVertical,
  Mail, Phone, MapPin, Shield, Calendar, RefreshCw, Download
} from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterRol, setFilterRol] = useState('todos');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);

  // Obtener token del localStorage
  const getToken = () => localStorage.getItem('auth_token');

  // Cargar usuarios
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const fetchEstadisticas = async () => {
    try {
      const response = await fetch(`${API_URL}/usuarios/estadisticas/general`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setEstadisticas(data.data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  // Eliminar usuario
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Usuario eliminado exitosamente');
        fetchUsuarios();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar el usuario');
    }
  };

  // Buscar usuarios
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      fetchUsuarios();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/usuarios/buscar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ busqueda: searchTerm })
      });
      
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchEstadisticas();
  }, []);

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(user => {
    const matchStatus = filterStatus === 'todos' || user.status === filterStatus;
    const matchRol = filterRol === 'todos' || user.id_rol.toString() === filterRol;
    return matchStatus && matchRol;
  });

  // Obtener badge de estado
  const getStatusBadge = (status) => {
    const styles = {
      activo: 'bg-green-100 text-green-700',
      inactivo: 'bg-gray-100 text-gray-700',
      suspendido: 'bg-red-100 text-red-700'
    };
    return styles[status] || styles.inactivo;
  };

  if (loading && usuarios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                <Users className="w-10 h-10 text-blue-600" />
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600 mt-2">Administra todos los usuarios del sistema</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg">
              <Plus className="w-5 h-5" />
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Usuarios</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{estadisticas.total}</p>
                </div>
                <Users className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Activos</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{estadisticas.activos}</p>
                </div>
                <UserCheck className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Inactivos</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{estadisticas.inactivos}</p>
                </div>
                <UserX className="w-12 h-12 text-gray-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Suspendidos</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{estadisticas.suspendidos}</p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-500 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o teléfono..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Filtro por Estado */}
            <div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>
            </div>

            {/* Filtro por Rol */}
            <div>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                  value={filterRol}
                  onChange={(e) => setFilterRol(e.target.value)}
                >
                  <option value="todos">Todos los roles</option>
                  <option value="1">Usuario</option>
                  <option value="2">Administrador</option>
                  <option value="3">Moderador</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button 
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Buscar
            </button>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('todos');
                setFilterRol('todos');
                fetchUsuarios();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Limpiar
            </button>
            <button 
              onClick={fetchUsuarios}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No se encontraron usuarios</p>
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id_usuario} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {usuario.nombre[0]}{usuario.apellido[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {usuario.nombre} {usuario.apellido}
                            </p>
                            <p className="text-xs text-gray-500">ID: {usuario.id_usuario}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-800 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {usuario.email}
                          </p>
                          {usuario.telefono && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {usuario.telefono}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {usuario.rol?.nombre || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(usuario.status)}`}>
                          {usuario.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(usuario.created_at).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedUser(usuario);
                              setShowModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ver detalles"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(usuario.id_usuario)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Detalles */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">Detalles del Usuario</h3>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.nombre[0]}{selectedUser.apellido[0]}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">
                      {selectedUser.nombre} {selectedUser.apellido}
                    </h4>
                    <p className="text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">ID Usuario</p>
                    <p className="font-semibold text-gray-800">{selectedUser.id_usuario}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Rol</p>
                    <p className="font-semibold text-gray-800">{selectedUser.rol?.nombre || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Estado</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Teléfono</p>
                    <p className="font-semibold text-gray-800">{selectedUser.telefono || 'N/A'}</p>
                  </div>
                </div>

                {selectedUser.direccion && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Dirección</p>
                    <p className="font-semibold text-gray-800">{selectedUser.direccion}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de Registro</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(selectedUser.created_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Última Actualización</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(selectedUser.updated_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;