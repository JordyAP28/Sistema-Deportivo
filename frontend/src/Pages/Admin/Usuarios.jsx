import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Edit2, Trash2, Eye, Filter,
  UserCheck, UserX, AlertCircle, CheckCircle, MoreVertical,
  Mail, Phone, MapPin, Shield, Calendar, RefreshCw
} from 'lucide-react';
import '../../styles/admin/usuario.css';
import Sidebar from './Sidebar';

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

  const getToken = () => localStorage.getItem('auth_token');

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
      if (data.success) setUsuarios(data.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const res = await fetch(`${API_URL}/usuarios/estadisticas/general`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) setEstadisticas(data.data);
    } catch (error) {
      console.error('Error estadísticas:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Realmente deseas eliminar este usuario?')) return;
    
    try {
      const res = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Usuario eliminado correctamente');
        fetchUsuarios();
      } else {
        alert(data.message || 'No se pudo eliminar');
      }
    } catch (error) {
      alert('Error al eliminar usuario');
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchEstadisticas();
  }, []);

  const usuariosFiltrados = usuarios.filter(user => {
    const matchStatus = filterStatus === 'todos' || user.status === filterStatus;
    const matchRol = filterRol === 'todos' || user.id_rol.toString() === filterRol;
    const matchSearch = !searchTerm || 
      user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchStatus && matchRol && matchSearch;
  });

  const getStatusConfig = (status) => {
    const configs = {
      activo:    { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Activo' },
      inactivo:  { bg: 'bg-slate-100',   text: 'text-slate-700',   label: 'Inactivo' },
      suspendido:{ bg: 'bg-rose-100',    text: 'text-rose-700',    label: 'Suspendido' }
    };
    return configs[status] || configs.inactivo;
  };

  if (loading && !usuarios.length) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-14 h-14 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

   // Topbar simplificado integrado
  const Topbar = () => (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle">
          <Menu size={24} />
        </button>
        <h2>Panel de Control</h2>
        <span className="role">
          <Shield size={14} />
          {getRoleName(user.id_rol)}
        </span>
      </div>

      <div className="topbar-right">
        <div className="notifications">
          <button className="notification-btn">
            <Bell size={20} />
            {notifications > 0 && (
              <span className="notification-badge">{notifications}</span>
            )}
          </button>
        </div>
        
        <div className="user-info">
          <div className="user-avatar">
            {getUserInitials()}
          </div>
          <div className="user-details">
            <span className="user-name">
              {user.nombre} {user.apellido}
            </span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          <span className="logout-text">Salir</span>
        </button>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-slate-50/40 pb-12">
      <Sidebar />
      <div className="max-w-[1400px] mx-auto px-5 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3.5 rounded-xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                  Gestión de Usuarios
                </h1>
                <p className="text-slate-600 mt-1.5">
                  Administra y supervisa todos los usuarios del sistema
                </p>
              </div>
            </div>
          </div>
          
          <button className="flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
            <Plus size={18} />
            Nuevo Usuario
          </button>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[
              { title: "Total Usuarios", value: estadisticas.total, color: "indigo", icon: Users },
              { title: "Activos", value: estadisticas.activos, color: "emerald", icon: UserCheck },
              { title: "Inactivos", value: estadisticas.inactivos, color: "slate", icon: UserX },
              { title: "Suspendidos", value: estadisticas.suspendidos, color: "rose", icon: AlertCircle }
            ].map((stat, i) => (
              <div 
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 bg-${stat.color}-50 rounded-lg`}>
                    <stat.icon className={`w-7 h-7 text-${stat.color}-600 opacity-80`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar nombre, email, teléfono..."
                  className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filtro Estado */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 appearance-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>

            {/* Filtro Rol */}
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 appearance-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer"
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

          <div className="flex flex-wrap gap-3 mt-5">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium shadow-sm">
              <Search size={16} />
              Buscar
            </button>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('todos');
                setFilterRol('todos');
                fetchUsuarios();
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition font-medium"
            >
              Limpiar filtros
            </button>
            <button 
              onClick={fetchUsuarios}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition font-medium"
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Usuario", "Contacto", "Rol", "Estado", "Registro", "Acciones"].map((title) => (
                    <th
                      key={title}
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <AlertCircle size={48} />
                        <p className="text-lg font-medium">No se encontraron usuarios</p>
                        <p className="text-sm">Intenta cambiar los filtros o crear uno nuevo</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((user) => {
                    const status = getStatusConfig(user.status);
                    return (
                      <tr 
                        key={user.id_usuario}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                              {user.nombre?.[0]}{user.apellido?.[0]}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">
                                {user.nombre} {user.apellido}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                ID: {user.id_usuario}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Mail size={15} className="text-slate-400" />
                              {user.email}
                            </div>
                            {user.telefono && (
                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone size={15} className="text-slate-400" />
                                {user.telefono}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Shield size={16} className="text-slate-400" />
                            <span className="font-medium text-slate-700">
                              {user.rol?.nombre || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(user.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => { setSelectedUser(user); setShowModal(true); }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(user.id_usuario)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-slate-800">Detalles del Usuario</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-md">
                    {selectedUser.nombre?.[0]}{selectedUser.apellido?.[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">
                      {selectedUser.nombre} {selectedUser.apellido}
                    </h3>
                    <p className="text-slate-600 mt-1">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">ID Usuario</p>
                    <p className="font-semibold text-slate-800">{selectedUser.id_usuario}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">Rol</p>
                    <p className="font-semibold text-slate-800">{selectedUser.rol?.nombre || 'No asignado'}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">Estado</p>
                    <span className={`inline-flex px-3.5 py-1 rounded-full text-sm font-medium ${getStatusConfig(selectedUser.status).bg} ${getStatusConfig(selectedUser.status).text}`}>
                      {getStatusConfig(selectedUser.status).label}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">Teléfono</p>
                    <p className="font-semibold text-slate-800">{selectedUser.telefono || '—'}</p>
                  </div>
                </div>

                {selectedUser.direccion && (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">Dirección</p>
                    <div className="flex items-start gap-2 text-slate-800">
                      <MapPin size={16} className="mt-1 text-slate-400 flex-shrink-0" />
                      <p>{selectedUser.direccion}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Fecha de Registro</p>
                    <p className="font-medium text-slate-800">
                      {new Date(selectedUser.created_at).toLocaleString('es-ES', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Última Actualización</p>
                    <p className="font-medium text-slate-800">
                      {new Date(selectedUser.updated_at).toLocaleString('es-ES', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
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