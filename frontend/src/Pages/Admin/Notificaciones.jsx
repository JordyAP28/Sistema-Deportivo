import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/notificaciones.css';

const API_URL = 'http://localhost:8000/api';

const Notificaciones = () => {
  // Estados principales
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showConfirmarEliminarModal, setShowConfirmarEliminarModal] = useState(false);
  const [showMarcarTodasModal, setShowMarcarTodasModal] = useState(false);
  const [showUsuarioModal, setShowUsuarioModal] = useState(false);
  
  // Estados para datos relacionados
  const [currentNotificacion, setCurrentNotificacion] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Estados para filtros
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('');
  
  // Estados para formularios
  const [formData, setFormData] = useState({
    usuario_id: '',
    tipo: 'info',
    titulo: '',
    mensaje: '',
    data: {},
    url: '',
    leida: false
  });

  // Tipos de notificaciones
  const tiposNotificaciones = [
    { value: 'info', label: 'Información', icon: 'fas fa-info-circle', color: 'info' },
    { value: 'success', label: 'Éxito', icon: 'fas fa-check-circle', color: 'success' },
    { value: 'warning', label: 'Advertencia', icon: 'fas fa-exclamation-triangle', color: 'warning' },
    { value: 'error', label: 'Error', icon: 'fas fa-times-circle', color: 'danger' },
    { value: 'sistema', label: 'Sistema', icon: 'fas fa-cogs', color: 'secondary' },
    { value: 'evento', label: 'Evento', icon: 'fas fa-calendar-alt', color: 'primary' },
    { value: 'pago', label: 'Pago', icon: 'fas fa-money-bill-wave', color: 'success' },
    { value: 'actividad', label: 'Actividad', icon: 'fas fa-calendar-check', color: 'info' }
  ];

    // Función para obtener el token
  const getToken = () => {
    return localStorage.getItem('auth_token');
  };

  // Función para obtener headers
  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Headers para multipart/form-data
  const getMultipartHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'multipart/form-data',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };


  // Configurar axios interceptor
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Verificar autenticación y cargar datos iniciales
  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    // Obtener datos del usuario del localStorage
    const storedUserData = JSON.parse(localStorage.getItem('user_data') || '{}');
    setUserData(storedUserData);
    
    // Verificar si es admin/secretaria
    const adminStatus = storedUserData.rol === 'admin' || storedUserData.rol === 'secretaria';
    setIsAdmin(adminStatus);
    
    console.log('Datos del usuario:', storedUserData);
    console.log('¿Es admin/secretaria?:', adminStatus);
    
    fetchNotificaciones();
  }, []);

  // Cargar todas las notificaciones
  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      console.log('Iniciando carga de notificaciones...');
      
      const params = {};
      
      if (soloNoLeidas) {
        params.solo_no_leidas = 1;
      }
      
      // Si es admin y seleccionó un usuario específico
      if (isAdmin && selectedUsuarioId) {
        params.usuario_id = selectedUsuarioId;
      } else if (userData && userData.id_usuario) {
        // Para usuarios normales, el backend debería usar su ID automáticamente
        console.log('Usuario normal, ID:', userData.id_usuario);
      }

      console.log('Parámetros de búsqueda:', params);
      
      const response = await axios.get(`${API_URL}/notificaciones`, {
        params,
        headers: getAuthHeaders()
      });
      
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data.success) {
        setNotificaciones(response.data.data || []);
        console.log('Notificaciones cargadas:', response.data.data?.length || 0);
      } else {
        console.error('Error en respuesta del servidor:', response.data);
        setError('Error en la respuesta del servidor: ' + response.data.message);
      }
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
      console.error('Detalles del error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
        setTimeout(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/login';
        }, 2000);
      } else {
        setError('Error al cargar notificaciones: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios (solo para admin/secretaria)
  const fetchUsuarios = async () => {
    try {
      console.log('Cargando usuarios...');
      const response = await axios.get(`${API_URL}/usuarios`, {
        headers: getAuthHeaders()
      });
      
      console.log('Usuarios cargados:', response.data);
      
      if (response.data.success) {
        setUsuarios(response.data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  // Cargar notificaciones no leídas
  const fetchNoLeidas = async () => {
    try {
      setLoading(true);
      console.log('Cargando notificaciones no leídas...');
      
      const response = await axios.get(`${API_URL}/notificaciones/no-leidas`, {
        headers: getAuthHeaders()
      });
      
      console.log('Notificaciones no leídas:', response.data);
      
      if (response.data.success) {
        setNotificaciones(response.data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar notificaciones no leídas:', err);
      setError('Error al cargar notificaciones no leídas: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Crear notificación
  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSend = { ...formData };
      
      // Si no es admin, forzar usuario_id al usuario actual
      if (!isAdmin && userData) {
        dataToSend.usuario_id = userData.id_usuario;
      }

      console.log('Creando notificación con datos:', dataToSend);
      
      const response = await axios.post(`${API_URL}/notificaciones`, dataToSend, {
        headers: getAuthHeaders()
      });
      
      console.log('Respuesta creación:', response.data);
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchNotificaciones();
        setSuccessMessage('Notificación creada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear notificación:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else if (err.response?.status === 403) {
        alert('No tiene permisos para realizar esta acción');
      } else {
        setError('Error al crear notificación: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar notificación
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentNotificacion) return;

    try {
      console.log('Actualizando notificación:', currentNotificacion.id_notificacion, 'con datos:', formData);
      
      const response = await axios.put(`${API_URL}/notificaciones/${currentNotificacion.id_notificacion}`, formData, {
        headers: getAuthHeaders()
      });
      
      console.log('Respuesta actualización:', response.data);
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchNotificaciones();
        setSuccessMessage('Notificación actualizada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar notificación:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else if (err.response?.status === 403) {
        alert('No tiene permisos para realizar esta acción');
      } else {
        setError('Error al actualizar notificación: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar notificación
  const handleDelete = async (id) => {
    try {
      console.log('Eliminando notificación:', id);
      
      const response = await axios.delete(`${API_URL}/notificaciones/${id}`, {
        headers: getAuthHeaders()
      });
      
      console.log('Respuesta eliminación:', response.data);
      
      if (response.data.success) {
        setShowConfirmarEliminarModal(false);
        fetchNotificaciones();
        setSuccessMessage('Notificación eliminada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar notificación:', err);
      if (err.response?.status === 403) {
        alert('No tiene permisos para realizar esta acción');
      } else {
        setError('Error al eliminar notificación: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Marcar como leída
  const handleMarcarLeida = async (id) => {
    try {
      console.log('Marcando como leída notificación:', id);
      
      const response = await axios.post(`${API_URL}/notificaciones/${id}/marcar-leida`, {}, {
        headers: getAuthHeaders()
      });
      
      console.log('Respuesta marcar leída:', response.data);
      
      if (response.data.success) {
        fetchNotificaciones();
        setSuccessMessage('Notificación marcada como leída');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al marcar como leída:', err);
      if (err.response?.status === 403) {
        alert('No tiene permisos para realizar esta acción');
      } else {
        setError('Error al marcar como leída: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Marcar todas como leídas
  const handleMarcarTodasLeidas = async () => {
    try {
      console.log('Marcando todas como leídas...');
      
      const params = {};
      if (selectedUsuarioId && isAdmin) {
        params.usuario_id = selectedUsuarioId;
      }

      const response = await axios.post(`${API_URL}/notificaciones/marcar-todas-leidas`, params, {
        headers: getAuthHeaders()
      });
      
      console.log('Respuesta marcar todas:', response.data);
      
      if (response.data.success) {
        setShowMarcarTodasModal(false);
        fetchNotificaciones();
        setSuccessMessage('Todas las notificaciones han sido marcadas como leídas');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
      if (err.response?.status === 403) {
        alert('No tiene permisos para realizar esta acción');
      } else {
        setError('Error al marcar todas como leídas: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Ver detalles
  const handleViewDetails = (notificacion) => {
    console.log('Ver detalles de notificación:', notificacion);
    setCurrentNotificacion(notificacion);
    setShowDetallesModal(true);
    
    // Marcar como leída si no lo está
    if (!notificacion.leida) {
      handleMarcarLeida(notificacion.id_notificacion);
    }
  };

  // Abrir modal para crear notificación
  const handleOpenCreate = () => {
    if (isAdmin) {
      fetchUsuarios();
    }
    resetForm();
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (notificacion) => {
    console.log('Editando notificación:', notificacion);
    setCurrentNotificacion(notificacion);
    
    setFormData({
      usuario_id: notificacion.usuario_id || '',
      tipo: notificacion.tipo || 'info',
      titulo: notificacion.titulo || '',
      mensaje: notificacion.mensaje || '',
      data: notificacion.data || {},
      url: notificacion.url || '',
      leida: notificacion.leida || false
    });
    
    setShowEditModal(true);
  };

  // Abrir modal para confirmar eliminación
  const handleOpenConfirmarEliminar = (notificacion) => {
    setCurrentNotificacion(notificacion);
    setShowConfirmarEliminarModal(true);
  };

  // Abrir modal para marcar todas como leídas
  const handleOpenMarcarTodas = () => {
    setShowMarcarTodasModal(true);
  };

  // Resetear formularios
  const resetForm = () => {
    setFormData({
      usuario_id: isAdmin ? '' : (userData?.id_usuario || ''),
      tipo: 'info',
      titulo: '',
      mensaje: '',
      data: {},
      url: '',
      leida: false
    });
    setCurrentNotificacion(null);
  };

  // Formatear fecha
  const formatFecha = (fechaString) => {
    if (!fechaString) return 'No leída';
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return 'Fecha inválida';
      
      return fecha.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', fechaString, error);
      return fechaString;
    }
  };

  // Formatear tiempo relativo
  const formatTiempoRelativo = (fechaString) => {
    if (!fechaString) return '';
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return fechaString;
      
      const ahora = new Date();
      const diffMs = ahora - fecha;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHoras = Math.floor(diffMin / 60);
      const diffDias = Math.floor(diffHoras / 24);

      if (diffMin < 1) return 'Ahora mismo';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      if (diffHoras < 24) return `Hace ${diffHoras} h`;
      if (diffDias < 7) return `Hace ${diffDias} d`;
      return formatFecha(fechaString);
    } catch (error) {
      console.error('Error al formatear tiempo relativo:', fechaString, error);
      return fechaString;
    }
  };

  // Obtener icono según tipo
  const getIconoTipo = (tipo) => {
    const tipoEncontrado = tiposNotificaciones.find(t => t.value === tipo);
    return tipoEncontrado ? tipoEncontrado.icon : 'fas fa-bell';
  };

  // Obtener color según tipo
  const getColorTipo = (tipo) => {
    const tipoEncontrado = tiposNotificaciones.find(t => t.value === tipo);
    return tipoEncontrado ? tipoEncontrado.color : 'info';
  };

  // Obtener label según tipo
  const getLabelTipo = (tipo) => {
    const tipoEncontrado = tiposNotificaciones.find(t => t.value === tipo);
    return tipoEncontrado ? tipoEncontrado.label : 'Información';
  };

  // Contar notificaciones no leídas
  const contarNoLeidas = () => {
    return notificaciones.filter(n => !n.leida).length;
  };

  const notificacionesFiltradas = notificaciones;
  const noLeidasCount = contarNoLeidas();

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  };

  // Verificar si hay datos de usuario
  useEffect(() => {
    if (!userData || !userData.id_usuario) {
      console.error('No hay datos de usuario disponibles');
      setError('No se encontraron datos de usuario. Por favor, inicie sesión nuevamente.');
    }
  }, [userData]);

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-content">
        <Toolbar onLogout={handleLogout} />
        
        <div className="content-wrapper">
          {/* Mensajes de depuración */}
          <div className="debug-info mb-3 p-3 bg-light rounded">
            <small className="text-muted">
              <strong>Información de depuración:</strong><br />
              Usuario ID: {userData?.id_usuario || 'No disponible'}<br />
              Rol: {userData?.rol || 'No disponible'}<br />
              Es admin/secretaria: {isAdmin ? 'Sí' : 'No'}<br />
              Total notificaciones: {notificaciones.length}<br />
              No leídas: {noLeidasCount}
            </small>
          </div>

          {/* Mensajes de error/success */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>Error:</strong> {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}
          
          {successMessage && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {successMessage}
              <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center w-100">
                <h2 className="mb-0">
                  <i className="fas fa-bell me-2"></i>
                  Notificaciones
                  {noLeidasCount > 0 && (
                    <span className="badge bg-danger ms-2">{noLeidasCount}</span>
                  )}
                </h2>
                <div>
                  <button 
                    className="btn btn-secondary me-2"
                    onClick={() => {
                      console.log('Actualizando notificaciones...');
                      fetchNotificaciones();
                    }}
                    disabled={loading}
                  >
                    <i className="fas fa-sync-alt"></i> Actualizar
                  </button>
                  {isAdmin && (
                    <button 
                      className="btn btn-primary me-2"
                      onClick={handleOpenCreate}
                      disabled={loading}
                    >
                      <i className="fas fa-plus"></i> Nueva Notificación
                    </button>
                  )}
                  <button 
                    className="btn btn-success"
                    onClick={handleOpenMarcarTodas}
                    disabled={loading || noLeidasCount === 0}
                  >
                    <i className="fas fa-check-double"></i> Marcar todas como leídas
                  </button>
                </div>
              </div>
            </div>

            <div className="card-body">
              {/* Filtros */}
              <div className="filters-section mb-4">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Filtro de Estado</label>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="soloNoLeidas"
                        checked={soloNoLeidas}
                        onChange={(e) => {
                          console.log('Cambiando filtro solo no leídas:', e.target.checked);
                          setSoloNoLeidas(e.target.checked);
                          if (e.target.checked) {
                            fetchNoLeidas();
                          } else {
                            fetchNotificaciones();
                          }
                        }}
                      />
                      <label className="form-check-label" htmlFor="soloNoLeidas">
                        <i className="fas fa-eye-slash me-1"></i> Solo no leídas
                      </label>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <>
                      <div className="col-md-4">
                        <label className="form-label">Filtrar por Usuario</label>
                        <div className="input-group">
                          <select
                            className="form-control"
                            value={selectedUsuarioId}
                            onChange={(e) => {
                              console.log('Cambiando usuario seleccionado:', e.target.value);
                              setSelectedUsuarioId(e.target.value);
                              fetchNotificaciones();
                            }}
                          >
                            <option value="">Todos los usuarios</option>
                            {usuarios.map((usuario) => (
                              <option key={`usuario-${usuario.id_usuario}`} value={usuario.id_usuario}>
                                {usuario.nombres} {usuario.apellidos} ({usuario.email})
                              </option>
                            ))}
                          </select>
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={fetchUsuarios}
                            title="Actualizar lista de usuarios"
                          >
                            <i className="fas fa-sync-alt"></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="col-md-4">
                        <label className="form-label">&nbsp;</label>
                        <button 
                          className="btn btn-info w-100"
                          onClick={() => {
                            fetchUsuarios();
                            setShowUsuarioModal(true);
                          }}
                          disabled={loading}
                        >
                          <i className="fas fa-users me-2"></i> Gestionar Usuarios
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="stats-section mb-4">
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="stat-card">
                      <h4>{notificaciones.length}</h4>
                      <p>Total Notificaciones</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="stat-card bg-warning text-white">
                      <h4>{noLeidasCount}</h4>
                      <p>No Leídas</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="stat-card bg-success text-white">
                      <h4>{notificaciones.length - noLeidasCount}</h4>
                      <p>Leídas</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="stat-card bg-info text-white">
                      <h4>{tiposNotificaciones.length}</h4>
                      <p>Tipos Disponibles</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de notificaciones */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando notificaciones...</p>
                  <button 
                    className="btn btn-link"
                    onClick={() => {
                      console.log('Estado actual:', { notificaciones, loading, error, userData, isAdmin });
                    }}
                  >
                    Ver estado de depuración
                  </button>
                </div>
              ) : notificacionesFiltradas.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                  <h4>No hay notificaciones</h4>
                  <p>{soloNoLeidas ? 'No hay notificaciones no leídas' : 'No se encontraron notificaciones'}</p>
                  {isAdmin && !soloNoLeidas && (
                    <button 
                      className="btn btn-primary mt-3"
                      onClick={handleOpenCreate}
                    >
                      <i className="fas fa-plus me-2"></i> Crear primera notificación
                    </button>
                  )}
                  <div className="mt-3">
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        console.log('Forzando recarga de notificaciones...');
                        fetchNotificaciones();
                      }}
                    >
                      <i className="fas fa-redo me-1"></i> Reintentar carga
                    </button>
                  </div>
                </div>
              ) : (
                <div className="notificaciones-list">
                  {notificacionesFiltradas.map((notificacion) => (
                    <div 
                      key={`notificacion-${notificacion.id_notificacion}`}
                      className={`notificacion-item ${notificacion.leida ? 'leida' : 'no-leida'} mb-3`}
                    >
                      <div className="card">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-2">
                                <div className={`icono-tipo bg-${getColorTipo(notificacion.tipo)}`}>
                                  <i className={getIconoTipo(notificacion.tipo)}></i>
                                </div>
                                <div className="ms-3">
                                  <h5 className="mb-0">
                                    {notificacion.titulo || 'Sin título'}
                                    {!notificacion.leida && (
                                      <span className="badge bg-warning ms-2">Nueva</span>
                                    )}
                                  </h5>
                                  <small className="text-muted">
                                    <span className="badge bg-secondary me-2">
                                      {getLabelTipo(notificacion.tipo)}
                                    </span>
                                    {formatTiempoRelativo(notificacion.created_at)}
                                  </small>
                                </div>
                              </div>
                              
                              <p className="mb-3">{notificacion.mensaje || 'Sin mensaje'}</p>
                              
                              <div className="d-flex flex-wrap gap-2">
                                {notificacion.url && (
                                  <a 
                                    href={notificacion.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="fas fa-external-link-alt me-1"></i> Ver más
                                  </a>
                                )}
                                
                                {isAdmin && notificacion.usuario && (
                                  <small className="text-muted">
                                    <i className="fas fa-user me-1"></i>
                                    {notificacion.usuario.nombres} {notificacion.usuario.apellidos}
                                  </small>
                                )}
                                
                                <small className="text-muted">
                                  <i className="fas fa-calendar me-1"></i>
                                  {formatFecha(notificacion.created_at)}
                                </small>
                                
                                {notificacion.leida && notificacion.fecha_lectura && (
                                  <small className="text-muted">
                                    <i className="fas fa-check-circle me-1"></i>
                                    Leída: {formatFecha(notificacion.fecha_lectura)}
                                  </small>
                                )}
                              </div>
                            </div>
                            
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleViewDetails(notificacion)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    className="btn btn-outline-warning"
                                    onClick={() => handleEdit(notificacion)}
                                    title="Editar"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleOpenConfirmarEliminar(notificacion)}
                                    title="Eliminar"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </>
                              )}
                              {!notificacion.leida && (
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => handleMarcarLeida(notificacion.id_notificacion)}
                                  title="Marcar como leída"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para ver detalles de la notificación */}
      {showDetallesModal && currentNotificacion && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className={getIconoTipo(currentNotificacion.tipo) + " me-2"}></i>
                {currentNotificacion.titulo}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDetallesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-8">
                  <div className="info-section mb-4">
                    <h5 className="text-primary">
                      <i className="fas fa-info-circle me-2"></i>Información de la Notificación
                    </h5>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="info-item mb-3">
                          <strong>Tipo:</strong>
                          <span className={`badge bg-${getColorTipo(currentNotificacion.tipo)} ms-2`}>
                            <i className={getIconoTipo(currentNotificacion.tipo) + " me-1"}></i>
                            {getLabelTipo(currentNotificacion.tipo)}
                          </span>
                        </div>
                        <div className="info-item mb-3">
                          <strong>Estado:</strong>
                          <span className={`badge ${currentNotificacion.leida ? 'bg-success' : 'bg-warning'} ms-2`}>
                            {currentNotificacion.leida ? 'Leída' : 'No leída'}
                          </span>
                        </div>
                        <div className="info-item mb-3">
                          <strong>Creada:</strong> {formatFecha(currentNotificacion.created_at)}
                        </div>
                        <div className="info-item mb-3">
                          <strong>Actualizada:</strong> {formatFecha(currentNotificacion.updated_at)}
                        </div>
                      </div>
                      <div className="col-md-6">
                        {currentNotificacion.fecha_lectura && (
                          <div className="info-item mb-3">
                            <strong>Leída el:</strong> {formatFecha(currentNotificacion.fecha_lectura)}
                          </div>
                        )}
                        {currentNotificacion.url && (
                          <div className="info-item mb-3">
                            <strong>URL:</strong>
                            <a 
                              href={currentNotificacion.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ms-2"
                            >
                              <i className="fas fa-external-link-alt"></i> Abrir enlace
                            </a>
                          </div>
                        )}
                        {isAdmin && currentNotificacion.usuario && (
                          <div className="info-item mb-3">
                            <strong>Destinatario:</strong>
                            <div className="ms-2">
                              {currentNotificacion.usuario.nombres} {currentNotificacion.usuario.apellidos}
                              <br />
                              <small className="text-muted">{currentNotificacion.usuario.email}</small>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="info-section mb-4">
                    <h5 className="text-primary">
                      <i className="fas fa-history me-2"></i>Historial
                    </h5>
                    <div className="text-center">
                      <div className={`icono-tipo-grande bg-${getColorTipo(currentNotificacion.tipo)}`}>
                        <i className={getIconoTipo(currentNotificacion.tipo)}></i>
                      </div>
                      <p className="mt-3 mb-0">
                        <small className="text-muted">
                          Tiempo transcurrido: {formatTiempoRelativo(currentNotificacion.created_at)}
                        </small>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-section mb-4">
                <h5 className="text-primary">
                  <i className="fas fa-envelope me-2"></i>Mensaje
                </h5>
                <div className="p-3 bg-light rounded">
                  {currentNotificacion.mensaje.split('\n').map((line, index) => (
                    <p key={index} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>

              {currentNotificacion.data && Object.keys(currentNotificacion.data).length > 0 && (
                <div className="info-section mb-4">
                  <h5 className="text-primary">
                    <i className="fas fa-database me-2"></i>Datos Adicionales
                  </h5>
                  <div className="p-3 bg-light rounded">
                    <pre className="mb-0" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                      {JSON.stringify(currentNotificacion.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowDetallesModal(false)}
              >
                Cerrar
              </button>
              {isAdmin && (
                <button 
                  type="button" 
                  className="btn btn-warning"
                  onClick={() => {
                    setShowDetallesModal(false);
                    handleEdit(currentNotificacion);
                  }}
                >
                  <i className="fas fa-edit me-2"></i> Editar
                </button>
              )}
              {!currentNotificacion.leida && (
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={() => {
                    handleMarcarLeida(currentNotificacion.id_notificacion);
                    setShowDetallesModal(false);
                  }}
                >
                  <i className="fas fa-check me-2"></i> Marcar como leída
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar eliminación */}
      {showConfirmarEliminarModal && currentNotificacion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h3>
                <i className="fas fa-trash-alt me-2"></i>
                Eliminar Notificación
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowConfirmarEliminarModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>¿Está seguro de eliminar esta notificación?</strong>
                <ul className="mt-2 mb-0">
                  <li><strong>Título:</strong> {currentNotificacion.titulo}</li>
                  <li><strong>Tipo:</strong> {getLabelTipo(currentNotificacion.tipo)}</li>
                  <li><strong>Creada:</strong> {formatFecha(currentNotificacion.created_at)}</li>
                  {currentNotificacion.usuario && (
                    <li><strong>Destinatario:</strong> {currentNotificacion.usuario.nombres} {currentNotificacion.usuario.apellidos}</li>
                  )}
                  <li className="mt-2">Esta acción no se puede deshacer</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowConfirmarEliminarModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={() => handleDelete(currentNotificacion.id_notificacion)}
              >
                <i className="fas fa-trash-alt me-2"></i> Eliminar Notificación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para marcar todas como leídas */}
      {showMarcarTodasModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-check-double me-2"></i>
                Marcar todas como leídas
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowMarcarTodasModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>¿Está seguro de marcar todas las notificaciones como leídas?</strong>
                <ul className="mt-2 mb-0">
                  <li>Se marcarán <strong>{noLeidasCount}</strong> notificaciones como leídas</li>
                  <li>Esta acción actualizará la fecha de lectura a ahora</li>
                  <li>Las notificaciones ya leídas no se verán afectadas</li>
                </ul>
              </div>
              
              {isAdmin && selectedUsuarioId && (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Esta acción afectará solo a las notificaciones del usuario seleccionado.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowMarcarTodasModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={handleMarcarTodasLeidas}
              >
                <i className="fas fa-check-double me-2"></i> Marcar todas como leídas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para usuarios (solo admin) */}
      {showUsuarioModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-users me-2"></i>
                Usuarios del Sistema
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowUsuarioModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-4">
                <i className="fas fa-info-circle me-2"></i>
                Como administrador, puede enviar notificaciones a cualquiera de estos usuarios.
              </div>

              {usuarios.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-users-slash fa-3x text-muted mb-3"></i>
                  <h5>No hay usuarios registrados</h5>
                  <p className="text-muted">No se encontraron usuarios en el sistema</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Notificaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => {
                        const notificacionesUsuario = notificaciones.filter(n => n.usuario_id === usuario.id_usuario);
                        const noLeidasUsuario = notificacionesUsuario.filter(n => !n.leida).length;
                        
                        return (
                          <tr key={`usuario-${usuario.id_usuario}`}>
                            <td>
                              <strong>{usuario.nombres} {usuario.apellidos}</strong>
                            </td>
                            <td>
                              <small>{usuario.email}</small>
                            </td>
                            <td>
                              <span className={`badge bg-${usuario.rol === 'admin' ? 'danger' : usuario.rol === 'secretaria' ? 'warning' : 'secondary'}`}>
                                {usuario.rol}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${usuario.activo ? 'bg-success' : 'bg-danger'}`}>
                                {usuario.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <span className="badge bg-primary">
                                  Total: {notificacionesUsuario.length}
                                </span>
                                {noLeidasUsuario > 0 && (
                                  <span className="badge bg-warning">
                                    No leídas: {noLeidasUsuario}
                                  </span>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    setSelectedUsuarioId(usuario.id_usuario);
                                    setShowUsuarioModal(false);
                                    fetchNotificaciones();
                                  }}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowUsuarioModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={fetchUsuarios}
              >
                <i className="fas fa-sync-alt me-2"></i> Actualizar lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;