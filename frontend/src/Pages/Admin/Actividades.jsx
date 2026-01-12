import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/actividades.css';

const API_URL = 'http://localhost:8000/api';

const Actividades = () => {
  // Estados principales
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showAsistenciasModal, setShowAsistenciasModal] = useState(false);
  const [showEscenariosModal, setShowEscenariosModal] = useState(false);
  const [showCuposModal, setShowCuposModal] = useState(false);
  const [showCambiarEstadoModal, setShowCambiarEstadoModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);
  const [showConfirmarEliminarModal, setShowConfirmarEliminarModal] = useState(false);
  
  // Estados para datos relacionados
  const [currentActividad, setCurrentActividad] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [escenarios, setEscenarios] = useState([]);
  const [cuposInfo, setCuposInfo] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [calendario, setCalendario] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterEscenario, setFilterEscenario] = useState('');
  
  // Estados para formularios
  const [formData, setFormData] = useState({
    nombre_actividad: '',
    descripcion: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    tipo: 'entrenamiento',
    estado: 'planificado',
    cupo_maximo: '',
    observaciones: ''
  });

  // Estados para calendario
  const [calendarioForm, setCalendarioForm] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  });

  // Estados para estadísticas
  const [estadisticasForm, setEstadisticasForm] = useState({
    fecha_inicio: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0]
  });

  // Tipos de actividades
  const tiposActividades = [
    { value: 'entrenamiento', label: 'Entrenamiento' },
    { value: 'partido', label: 'Partido' },
    { value: 'clase', label: 'Clase' },
    { value: 'evento', label: 'Evento' },
    { value: 'reunion', label: 'Reunión' }
  ];

  // Estados de actividades
  const estadosActividades = [
    { value: 'planificado', label: 'Planificado', color: 'info' },
    { value: 'confirmado', label: 'Confirmado', color: 'success' },
    { value: 'en_curso', label: 'En Curso', color: 'warning' },
    { value: 'finalizado', label: 'Finalizado', color: 'secondary' },
    { value: 'cancelado', label: 'Cancelado', color: 'danger' }
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
    if (!getToken()) {
      window.location.href = '/login';
      return;
    }
    fetchActividades();
  }, []);

  // Cargar todas las actividades
  const fetchActividades = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/actividades`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setActividades(response.data.data);
      } else {
        setError('Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('Error al cargar actividades:', err);
      setError('Error al cargar actividades: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar asistencias de una actividad
  const fetchAsistencias = async (actividadId) => {
    try {
      const response = await axios.get(`${API_URL}/actividades/${actividadId}/asistencias`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setAsistencias(response.data.data.asistencias);
      }
    } catch (err) {
      console.error('Error al cargar asistencias:', err);
      setError('Error al cargar asistencias: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cargar escenarios de una actividad
  const fetchEscenarios = async (actividadId) => {
    try {
      const response = await axios.get(`${API_URL}/actividades/${actividadId}/escenarios`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setEscenarios(response.data.data.escenarios);
      }
    } catch (err) {
      console.error('Error al cargar escenarios:', err);
      setError('Error al cargar escenarios: ' + (err.response?.data?.message || err.message));
    }
  };

  // Verificar cupos
  const verificarCupos = async (actividadId) => {
    try {
      const response = await axios.get(`${API_URL}/actividades/${actividadId}/verificar-cupos`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setCuposInfo(response.data.data);
      }
    } catch (err) {
      console.error('Error al verificar cupos:', err);
      setError('Error al verificar cupos: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cargar estadísticas
  const fetchEstadisticas = async () => {
    try {
      const response = await axios.get(`${API_URL}/actividades/estadisticas`, {
        params: estadisticasForm,
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setEstadisticas(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar estadísticas: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cargar calendario
  const fetchCalendario = async () => {
    try {
      const response = await axios.get(`${API_URL}/actividades/calendario`, {
        params: calendarioForm,
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setCalendario(response.data.data.calendario || []);
      }
    } catch (err) {
      console.error('Error al cargar calendario:', err);
      setError('Error al cargar calendario: ' + (err.response?.data?.message || err.message));
    }
  };

  // Buscar actividades
  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/actividades/buscar`, {
        busqueda: searchTerm
      }, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setActividades(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar actividades: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar actividades localmente
  const filtrarActividades = () => {
    let filtered = [...actividades];
    
    if (filterTipo) {
      filtered = filtered.filter(a => a.tipo === filterTipo);
    }
    
    if (filterEstado) {
      filtered = filtered.filter(a => a.estado === filterEstado);
    }
    
    if (filterFechaDesde) {
      filtered = filtered.filter(a => new Date(a.fecha) >= new Date(filterFechaDesde));
    }
    
    if (filterFechaHasta) {
      filtered = filtered.filter(a => new Date(a.fecha) <= new Date(filterFechaHasta));
    }
    
    if (filterEscenario) {
      filtered = filtered.filter(a => 
        a.escenariosProgramados?.some(ep => 
          ep.escenario?.nombre?.toLowerCase().includes(filterEscenario.toLowerCase()) ||
          ep.escenario?.tipo?.toLowerCase().includes(filterEscenario.toLowerCase())
        )
      );
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.nombre_actividad?.toLowerCase().includes(term) ||
        a.descripcion?.toLowerCase().includes(term) ||
        a.observaciones?.toLowerCase().includes(term) ||
        a.tipo?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterTipo('');
    setFilterEstado('');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setFilterEscenario('');
    fetchActividades();
  };

  // Crear actividad
  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API_URL}/actividades`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchActividades();
        setSuccessMessage('Actividad creada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear actividad:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al crear actividad: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar actividad
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentActividad) return;

    try {
      const response = await axios.put(`${API_URL}/actividades/${currentActividad.id_actividad}`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchActividades();
        setSuccessMessage('Actividad actualizada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar actividad:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al actualizar actividad: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar actividad
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/actividades/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowConfirmarEliminarModal(false);
        fetchActividades();
        setSuccessMessage('Actividad eliminada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar actividad:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al eliminar actividad: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Restaurar actividad
  const handleRestore = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/actividades/${id}/restore`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchActividades();
        setSuccessMessage('Actividad restaurada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al restaurar actividad:', err);
      setError('Error al restaurar actividad: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cambiar estado de actividad
  const cambiarEstadoActividad = async () => {
    if (!currentActividad) return;

    try {
      const response = await axios.post(
        `${API_URL}/actividades/${currentActividad.id_actividad}/cambiar-estado`,
        { estado: formData.estado },
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setShowCambiarEstadoModal(false);
        fetchActividades();
        setSuccessMessage('Estado de la actividad actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al cambiar estado: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Ver detalles
  const handleViewDetails = (actividad) => {
    setCurrentActividad(actividad);
    setShowDetallesModal(true);
  };

  // Ver asistencias
  const handleViewAsistencias = (actividad) => {
    setCurrentActividad(actividad);
    fetchAsistencias(actividad.id_actividad);
    setShowAsistenciasModal(true);
  };

  // Ver escenarios
  const handleViewEscenarios = (actividad) => {
    setCurrentActividad(actividad);
    fetchEscenarios(actividad.id_actividad);
    setShowEscenariosModal(true);
  };

  // Ver cupos
  const handleViewCupos = (actividad) => {
    setCurrentActividad(actividad);
    verificarCupos(actividad.id_actividad);
    setShowCuposModal(true);
  };

  // Ver estadísticas
  const handleViewEstadisticas = () => {
    fetchEstadisticas();
    setShowEstadisticasModal(true);
  };

  // Ver calendario
  const handleViewCalendario = () => {
    fetchCalendario();
    setShowCalendarioModal(true);
  };

  // Abrir modal para cambiar estado
  const handleOpenCambiarEstado = (actividad) => {
    setCurrentActividad(actividad);
    setFormData({
      ...formData,
      estado: actividad.estado
    });
    setShowCambiarEstadoModal(true);
  };

  // Abrir modal para confirmar eliminación
  const handleOpenConfirmarEliminar = (actividad) => {
    setCurrentActividad(actividad);
    setShowConfirmarEliminarModal(true);
  };

  // Editar actividad
  const handleEdit = (actividad) => {
    setCurrentActividad(actividad);
    
    setFormData({
      nombre_actividad: actividad.nombre_actividad || '',
      descripcion: actividad.descripcion || '',
      fecha: actividad.fecha ? actividad.fecha.split('T')[0] : '',
      hora_inicio: actividad.hora_inicio || '',
      hora_fin: actividad.hora_fin || '',
      tipo: actividad.tipo || 'entrenamiento',
      estado: actividad.estado || 'planificado',
      cupo_maximo: actividad.cupo_maximo || '',
      observaciones: actividad.observaciones || ''
    });
    
    setShowEditModal(true);
  };

  // Resetear formularios
  const resetForm = () => {
    setFormData({
      nombre_actividad: '',
      descripcion: '',
      fecha: '',
      hora_inicio: '',
      hora_fin: '',
      tipo: 'entrenamiento',
      estado: 'planificado',
      cupo_maximo: '',
      observaciones: ''
    });
    setCurrentActividad(null);
  };

  // Formatear fecha
  const formatFecha = (fechaString) => {
    if (!fechaString) return 'No especificada';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Formatear hora
  const formatHora = (horaString) => {
    if (!horaString) return '';
    return horaString.substring(0, 5);
  };

  // Obtener nombre del mes
  const getMesNombre = (mes) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  };

  // Obtener actividades filtradas
  const getFilteredActividades = () => {
    return filtrarActividades();
  };

  // Calcular estadísticas generales
  const calcularEstadisticasGenerales = () => {
    if (actividades.length === 0) return null;
    
    const total = actividades.length;
    const planificadas = actividades.filter(a => a.estado === 'planificado').length;
    const confirmadas = actividades.filter(a => a.estado === 'confirmado').length;
    const enCurso = actividades.filter(a => a.estado === 'en_curso').length;
    const finalizadas = actividades.filter(a => a.estado === 'finalizado').length;
    const canceladas = actividades.filter(a => a.estado === 'cancelado').length;
    
    // Distribución por tipo
    const tiposDistribucion = actividades.reduce((acc, a) => {
      const tipo = a.tipo || 'No especificado';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
    
    // Actividad con más asistencias
    const actividadMayorAsistencia = [...actividades]
      .sort((a, b) => (b.asistencias?.length || 0) - (a.asistencias?.length || 0))
      .shift();
    
    return {
      total,
      planificadas,
      confirmadas,
      enCurso,
      finalizadas,
      canceladas,
      tiposDistribucion,
      actividadMayorAsistencia
    };
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  const actividadesFiltradas = getFilteredActividades(); // CORREGIDO: actividadesFiltradas
  const estadisticasGenerales = calcularEstadisticasGenerales();

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-content">
        <Toolbar onLogout={handleLogout} />
        
        <div className="content-wrapper">
          {/* Mensajes */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
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
              <h2>
                <i className="fas fa-calendar-alt me-2"></i>
                Gestión de Actividades
              </h2>
              <div>
                <button 
                  className="btn btn-secondary me-2"
                  onClick={clearFilters}
                  disabled={loading}
                >
                  <i className="fas fa-sync-alt"></i> Limpiar
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    resetForm();
                    setFormData({
                      ...formData,
                      fecha: new Date().toISOString().split('T')[0],
                      hora_inicio: '09:00',
                      hora_fin: '10:00'
                    });
                    setShowModal(true);
                  }}
                  disabled={loading}
                >
                  <i className="fas fa-plus"></i> Nueva Actividad
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Filtros y búsqueda */}
              <div className="filters-section mb-4">
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Buscar</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre, descripción, observaciones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={handleSearch}
                        disabled={loading}
                      >
                        <i className="fas fa-search"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Tipo</label>
                    <select 
                      className="form-select"
                      value={filterTipo}
                      onChange={(e) => setFilterTipo(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {tiposActividades.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Estado</label>
                    <select 
                      className="form-select"
                      value={filterEstado}
                      onChange={(e) => setFilterEstado(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {estadosActividades.map(estado => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Fecha Desde</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filterFechaDesde}
                      onChange={(e) => setFilterFechaDesde(e.target.value)}
                    />
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Fecha Hasta</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filterFechaHasta}
                      onChange={(e) => setFilterFechaHasta(e.target.value)}
                    />
                  </div>
                  
                  <div className="col-md-1">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={() => {
                        const filtered = filtrarActividades();
                        setActividades(filtered);
                      }}
                      disabled={loading}
                      title="Aplicar filtros"
                    >
                      <i className="fas fa-filter"></i>
                    </button>
                  </div>
                </div>
                
                <div className="row g-3 mt-2">
                  <div className="col-md-4">
                    <label className="form-label">Escenario</label>
                    <input
                      type="text"
                      className="form-control"
                      value={filterEscenario}
                      onChange={(e) => setFilterEscenario(e.target.value)}
                      placeholder="Filtrar por escenario..."
                    />
                  </div>
                  
                  <div className="col-md-4">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-info w-100"
                      onClick={handleViewEstadisticas}
                      disabled={loading}
                    >
                      <i className="fas fa-chart-bar"></i> Estadísticas
                    </button>
                  </div>
                  
                  <div className="col-md-4">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-success w-100"
                      onClick={handleViewCalendario}
                      disabled={loading}
                    >
                      <i className="fas fa-calendar"></i> Calendario
                    </button>
                  </div>
                </div>
              </div>

              {/* Estadísticas rápidas */}
              {estadisticasGenerales && (
                <div className="stats-section mb-4">
                  <div className="row g-3">
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticasGenerales.total}</h4>
                        <p>Total Actividades</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-info text-white">
                        <h4>{estadisticasGenerales.planificadas}</h4>
                        <p>Planificadas</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-success text-white">
                        <h4>{estadisticasGenerales.confirmadas}</h4>
                        <p>Confirmadas</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-warning text-white">
                        <h4>{estadisticasGenerales.enCurso}</h4>
                        <p>En Curso</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-secondary text-white">
                        <h4>{estadisticasGenerales.finalizadas}</h4>
                        <p>Finalizadas</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-danger text-white">
                        <h4>{estadisticasGenerales.canceladas}</h4>
                        <p>Canceladas</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de actividades */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando actividades...</p>
                </div>
              ) : actividadesFiltradas.length === 0 ? ( // CORREGIDO: actividadesFiltradas
                <div className="text-center py-5">
                  <i className="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
                  <h4>No hay actividades registradas</h4>
                  <p>Crea tu primera actividad usando el botón "Nueva Actividad"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Actividad</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th>Horario</th>
                        <th>Estado</th>
                        <th>Escenarios</th>
                        <th>Asistencias</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividadesFiltradas.map((actividad) => ( // CORREGIDO: actividadesFiltradas
                        <tr key={`actividad-${actividad.id_actividad}`}>
                          <td>
                            <strong>{actividad.nombre_actividad}</strong>
                            {actividad.descripcion && (
                              <div className="small text-muted">
                                {actividad.descripcion.substring(0, 50)}...
                              </div>
                            )}
                            {actividad.cupo_maximo && (
                              <div className="small text-muted">
                                <i className="fas fa-users me-1"></i>
                                Cupo: {actividad.cupo_maximo}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge tipo-badge tipo-${actividad.tipo}`}>
                              {tiposActividades.find(t => t.value === actividad.tipo)?.label || actividad.tipo}
                            </span>
                          </td>
                          <td>
                            <div>
                              {formatFecha(actividad.fecha)}
                            </div>
                          </td>
                          <td>
                            <div className="small">
                              {formatHora(actividad.hora_inicio)} - {formatHora(actividad.hora_fin)}
                            </div>
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${actividad.estado}`}>
                              {estadosActividades.find(e => e.value === actividad.estado)?.label || actividad.estado}
                            </span>
                          </td>
                          <td>
                            {actividad.escenariosProgramados?.length > 0 ? (
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewEscenarios(actividad)}
                                title={`Ver ${actividad.escenariosProgramados.length} escenario(s)`}
                              >
                                <i className="fas fa-landmark"></i> {actividad.escenariosProgramados.length}
                              </button>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td>
                            {actividad.asistencias?.length > 0 ? (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleViewAsistencias(actividad)}
                                title={`Ver ${actividad.asistencias.length} asistencias`}
                              >
                                <i className="fas fa-user-check"></i> {actividad.asistencias.length}
                              </button>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetails(actividad)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEdit(actividad)}
                                title="Editar"
                                disabled={actividad.estado === 'finalizado' || actividad.estado === 'cancelado'}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewCupos(actividad)}
                                title="Ver cupos"
                              >
                                <i className="fas fa-users"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleOpenCambiarEstado(actividad)}
                                title="Cambiar estado"
                              >
                                <i className="fas fa-exchange-alt"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleOpenConfirmarEliminar(actividad)}
                                title="Eliminar"
                                disabled={actividad.estado === 'finalizado' || actividad.estado === 'cancelado'}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALES */}

      {/* Modal para crear actividad */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nueva Actividad
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              ></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-8">
                    <div className="form-group mb-3">
                      <label className="form-label">Nombre de la Actividad *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombre_actividad}
                        onChange={(e) => setFormData({...formData, nombre_actividad: e.target.value})}
                        required
                        placeholder="Ej: Entrenamiento de fútbol sub-15"
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Tipo *</label>
                      <select
                        className="form-control"
                        value={formData.tipo}
                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                        required
                      >
                        {tiposActividades.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    rows="3"
                    placeholder="Descripción detallada de la actividad..."
                  />
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Hora Inicio *</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.hora_inicio}
                        onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Hora Fin *</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.hora_fin}
                        onChange={(e) => setFormData({...formData, hora_fin: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-control"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      >
                        {estadosActividades.map(estado => (
                          <option key={estado.value} value={estado.value}>
                            {estado.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Cupo Máximo (Opcional)</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          value={formData.cupo_maximo}
                          onChange={(e) => setFormData({
                            ...formData,
                            cupo_maximo: parseInt(e.target.value) || ''
                          })}
                          min="1"
                          placeholder="Ilimitado"
                        />
                        <span className="input-group-text">personas</span>
                      </div>
                      <small className="text-muted">Dejar vacío para cupo ilimitado</small>
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    rows="3"
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Los campos marcados con * son obligatorios. La hora fin debe ser posterior a la hora inicio.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save me-2"></i> Crear Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de la actividad */}
      {showDetallesModal && currentActividad && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-calendar-alt me-2"></i>
                {currentActividad.nombre_actividad}
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
                      <i className="fas fa-info-circle me-2"></i>Información General
                    </h5>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="info-item mb-3">
                          <strong>Tipo:</strong>
                          <span className={`badge tipo-badge tipo-${currentActividad.tipo} ms-2`}>
                            {tiposActividades.find(t => t.value === currentActividad.tipo)?.label || currentActividad.tipo}
                          </span>
                        </div>
                        <div className="info-item mb-3">
                          <strong>Estado:</strong>
                          <span className={`badge estado-badge estado-${currentActividad.estado} ms-2`}>
                            {estadosActividades.find(e => e.value === currentActividad.estado)?.label || currentActividad.estado}
                          </span>
                        </div>
                        <div className="info-item mb-3">
                          <strong>Fecha:</strong> {formatFecha(currentActividad.fecha)}
                        </div>
                        <div className="info-item mb-3">
                          <strong>Horario:</strong> {formatHora(currentActividad.hora_inicio)} - {formatHora(currentActividad.hora_fin)}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="info-item mb-3">
                          <strong>Cupo Máximo:</strong> {currentActividad.cupo_maximo ? currentActividad.cupo_maximo + ' personas' : 'Ilimitado'}
                        </div>
                        <div className="info-item mb-3">
                          <strong>Asistencias:</strong> {currentActividad.asistencias?.length || 0}
                        </div>
                        <div className="info-item mb-3">
                          <strong>Escenarios:</strong> {currentActividad.escenariosProgramados?.length || 0}
                        </div>
                        <div className="info-item mb-3">
                          <strong>Registrado:</strong> {formatFecha(currentActividad.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    {currentActividad.descripcion && (
                      <div className="info-item mt-3">
                        <strong>Descripción:</strong>
                        <p className="mt-2 p-3 bg-light rounded">{currentActividad.descripcion}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="info-section mb-4">
                    <h5 className="text-primary">
                      <i className="fas fa-chart-pie me-2"></i>Resumen
                    </h5>
                    <div className="text-center">
                      <div className="d-flex justify-content-around mb-3">
                        <div>
                          <h5>{currentActividad.asistencias?.length || 0}</h5>
                          <small>Asistencias</small>
                        </div>
                        <div>
                          <h5>{currentActividad.escenariosProgramados?.length || 0}</h5>
                          <small>Escenarios</small>
                        </div>
                      </div>
                      <button
                        className="btn btn-outline-info w-100 mb-2"
                        onClick={() => handleViewCupos(currentActividad)}
                      >
                        <i className="fas fa-users me-2"></i> Ver Cupos
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {currentActividad.observaciones && (
                <div className="info-section mb-4">
                  <h5 className="text-primary">
                    <i className="fas fa-comment me-2"></i>Observaciones
                  </h5>
                  <p className="p-3 bg-light rounded">{currentActividad.observaciones}</p>
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
              <button 
                type="button" 
                className="btn btn-warning"
                onClick={() => {
                  setShowDetallesModal(false);
                  handleEdit(currentActividad);
                }}
                disabled={currentActividad.estado === 'finalizado' || currentActividad.estado === 'cancelado'}
              >
                <i className="fas fa-edit me-2"></i> Editar
              </button>
              <button 
                type="button" 
                className="btn btn-info"
                onClick={() => {
                  setShowDetallesModal(false);
                  handleViewEscenarios(currentActividad);
                }}
              >
                <i className="fas fa-landmark me-2"></i> Escenarios
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => {
                  setShowDetallesModal(false);
                  handleViewAsistencias(currentActividad);
                }}
              >
                <i className="fas fa-user-check me-2"></i> Asistencias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver asistencias */}
      {showAsistenciasModal && currentActividad && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-user-check me-2"></i>
                Asistencias: {currentActividad.nombre_actividad}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowAsistenciasModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-4">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Total de asistencias:</strong> {asistencias.length}
                {currentActividad.cupo_maximo && (
                  <span className="ms-3">
                    <strong>Cupo máximo:</strong> {currentActividad.cupo_maximo} | 
                    <strong> Disponibles:</strong> {currentActividad.cupo_maximo - asistencias.length}
                  </span>
                )}
              </div>

              {asistencias.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-user-times fa-3x text-muted mb-3"></i>
                  <h5>No hay asistencias registradas</h5>
                  <p className="text-muted">No se han registrado asistencias para esta actividad</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Deportista</th>
                        <th>Documento</th>
                        <th>Categoría</th>
                        <th>Asistió</th>
                        <th>Fecha Registro</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistencias.map((asistencia) => (
                        <tr key={`asistencia-${asistencia.id_asistencia}`}>
                          <td>
                            <strong>
                              {asistencia.deportista?.usuario?.nombres} {asistencia.deportista?.usuario?.apellidos}
                            </strong>
                          </td>
                          <td>
                            {asistencia.deportista?.numero_documento || 'N/A'}
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {asistencia.deportista?.categoria?.nombre || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${asistencia.asistio ? 'bg-success' : 'bg-danger'}`}>
                              {asistencia.asistio ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td>
                            {formatFecha(asistencia.created_at)}
                          </td>
                          <td>
                            <div className="small">
                              {asistencia.observaciones?.substring(0, 50) || 'N/A'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowAsistenciasModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  alert('Funcionalidad de exportación en desarrollo');
                }}
              >
                <i className="fas fa-download me-2"></i> Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver escenarios */}
      {showEscenariosModal && currentActividad && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-landmark me-2"></i>
                Escenarios Programados: {currentActividad.nombre_actividad}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowEscenariosModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-4">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Total de escenarios:</strong> {escenarios.length}
              </div>

              {escenarios.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-landmark fa-3x text-muted mb-3"></i>
                  <h5>No hay escenarios programados</h5>
                  <p className="text-muted">No se han programado escenarios para esta actividad</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Escenario</th>
                        <th>Tipo</th>
                        <th>Capacidad</th>
                        <th>Dirección</th>
                        <th>Estado</th>
                        <th>Fecha Programación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {escenarios.map((programacion) => (
                        <tr key={`programacion-${programacion.id_programa_actividad}`}>
                          <td>
                            <strong>{programacion.escenario?.nombre}</strong>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {programacion.escenario?.tipo}
                            </span>
                          </td>
                          <td>
                            {programacion.escenario?.capacidad?.toLocaleString()} personas
                          </td>
                          <td>
                            <div className="small">
                              {programacion.escenario?.direccion}
                            </div>
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${programacion.escenario?.estado}`}>
                              {programacion.escenario?.estado}
                            </span>
                          </td>
                          <td>
                            {formatFecha(programacion.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowEscenariosModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver cupos */}
      {showCuposModal && currentActividad && cuposInfo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-users me-2"></i>
                Verificación de Cupos: {currentActividad.nombre_actividad}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowCuposModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className={`alert ${cuposInfo.disponible ? 'alert-success' : 'alert-danger'}`}>
                <h5 className="alert-heading">
                  <i className={`fas ${cuposInfo.disponible ? 'fa-check-circle' : 'fa-times-circle'} me-2`}></i>
                  {cuposInfo.disponible ? 'CUPOS DISPONIBLES' : 'CUPOS LLENOS'}
                </h5>
                <p>{cuposInfo.disponible ? 'Hay cupos disponibles para esta actividad' : 'No hay cupos disponibles para esta actividad'}</p>
              </div>

              <div className="cupos-info">
                <div className="info-item mb-3">
                  <strong>Actividad:</strong> {cuposInfo.actividad}
                </div>
                <div className="info-item mb-3">
                  <strong>Cupo Máximo:</strong> {cuposInfo.cupo_maximo ? cuposInfo.cupo_maximo + ' personas' : 'Ilimitado'}
                </div>
                <div className="info-item mb-3">
                  <strong>Inscritos Actuales:</strong> {cuposInfo.inscritos_actuales} personas
                </div>
                {cuposInfo.cupo_maximo && (
                  <>
                    <div className="info-item mb-3">
                      <strong>Cupos Disponibles:</strong> {cuposInfo.cupos_disponibles} personas
                    </div>
                    <div className="info-item mb-4">
                      <strong>Porcentaje de Ocupación:</strong>
                      <div className="progress mt-2">
                        <div 
                          className={`progress-bar ${cuposInfo.porcentaje_ocupacion > 80 ? 'bg-danger' : cuposInfo.porcentaje_ocupacion > 50 ? 'bg-warning' : 'bg-success'}`}
                          style={{width: `${Math.min(cuposInfo.porcentaje_ocupacion, 100)}%`}}
                        >
                          {cuposInfo.porcentaje_ocupacion}%
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="alert alert-info mt-4">
                <i className="fas fa-info-circle me-2"></i>
                Esta información se actualiza automáticamente cuando se registran nuevas asistencias.
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowCuposModal(false)}
              >
                Cerrar
              </button>
              {cuposInfo.disponible && (
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={() => {
                    setShowCuposModal(false);
                    alert('Funcionalidad de inscripción en desarrollo');
                  }}
                >
                  <i className="fas fa-user-plus me-2"></i> Registrar Asistencia
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para cambiar estado */}
      {showCambiarEstadoModal && currentActividad && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-warning text-dark">
              <h3>
                <i className="fas fa-exchange-alt me-2"></i>
                Cambiar Estado: {currentActividad.nombre_actividad}
              </h3>
              <button 
                className="btn-close"
                onClick={() => setShowCambiarEstadoModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Estado actual:</strong>
                <span className={`badge estado-badge estado-${currentActividad.estado} ms-2`}>
                  {estadosActividades.find(e => e.value === currentActividad.estado)?.label || currentActividad.estado}
                </span>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Nuevo Estado *</label>
                <select
                  className="form-control"
                  value={formData.estado}
                  onChange={(e) => setFormData({
                    ...formData,
                    estado: e.target.value
                  })}
                  required
                >
                  {estadosActividades.map(estado => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Al cambiar el estado a "Cancelado", se notificará a los inscritos sobre la cancelación.
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowCambiarEstadoModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-warning"
                onClick={cambiarEstadoActividad}
              >
                <i className="fas fa-exchange-alt me-2"></i> Cambiar Estado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para estadísticas */}
      {showEstadisticasModal && estadisticas && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-chart-bar me-2"></i>
                Estadísticas de Actividades
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowEstadisticasModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Fecha Inicio</label>
                    <input
                      type="date"
                      className="form-control"
                      value={estadisticasForm.fecha_inicio}
                      onChange={(e) => setEstadisticasForm({
                        ...estadisticasForm,
                        fecha_inicio: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Fecha Fin</label>
                    <input
                      type="date"
                      className="form-control"
                      value={estadisticasForm.fecha_fin}
                      onChange={(e) => setEstadisticasForm({
                        ...estadisticasForm,
                        fecha_fin: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="col-md-12">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={fetchEstadisticas}
                  >
                    <i className="fas fa-sync-alt me-2"></i> Actualizar Estadísticas
                  </button>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="stat-card-lg text-center bg-primary text-white">
                    <h4>{estadisticas.total || 0}</h4>
                    <p>Total Actividades</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="stat-card-lg text-center bg-success text-white">
                    <h4>{estadisticas.confirmadas || 0}</h4>
                    <p>Confirmadas</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="stat-card-lg text-center bg-info text-white">
                    <h4>{estadisticas.promedio_asistencia || 0}</h4>
                    <p>Prom. Asistencia</p>
                  </div>
                </div>
              </div>

              {estadisticas.por_tipo && estadisticas.por_tipo.length > 0 && (
                <div className="row mb-4">
                  <div className="col-md-12">
                    <h5>Distribución por Tipo</h5>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estadisticas.por_tipo.map((item) => (
                            <tr key={`tipo-${item.tipo}`}>
                              <td>{tiposActividades.find(t => t.value === item.tipo)?.label || item.tipo}</td>
                              <td>{item.total}</td>
                              <td>
                                <div className="progress" style={{height: '20px'}}>
                                  <div 
                                    className="progress-bar bg-primary" 
                                    style={{width: `${(item.total / estadisticas.total) * 100}%`}}
                                  >
                                    {((item.total / estadisticas.total) * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="alert alert-info mt-4">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Período:</strong> {formatFecha(estadisticas.periodo?.fecha_inicio)} - {formatFecha(estadisticas.periodo?.fecha_fin)}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowEstadisticasModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  alert('Funcionalidad de exportación en desarrollo');
                }}
              >
                <i className="fas fa-download me-2"></i> Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para calendario */}
      {showCalendarioModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-calendar me-2"></i>
                Calendario de Actividades
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowCalendarioModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Mes</label>
                    <select
                      className="form-control"
                      value={calendarioForm.mes}
                      onChange={(e) => setCalendarioForm({
                        ...calendarioForm,
                        mes: parseInt(e.target.value)
                      })}
                    >
                      {Array.from({length: 12}, (_, i) => i + 1).map(mes => (
                        <option key={mes} value={mes}>
                          {getMesNombre(mes)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Año</label>
                    <input
                      type="number"
                      className="form-control"
                      value={calendarioForm.anio}
                      onChange={(e) => setCalendarioForm({
                        ...calendarioForm,
                        anio: parseInt(e.target.value)
                      })}
                      min="2000"
                      max="2100"
                    />
                  </div>
                </div>
                
                <div className="col-md-12">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={fetchCalendario}
                  >
                    <i className="fas fa-sync-alt me-2"></i> Actualizar Calendario
                  </button>
                </div>
              </div>

              {calendario.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <h5>No hay actividades programadas</h5>
                  <p className="text-muted">No se encontraron actividades para el mes seleccionado</p>
                </div>
              ) : (
                <div className="calendario-container">
                  {calendario.map((dia) => (
                    <div key={dia.fecha} className="calendario-dia mb-3">
                      <div className="calendario-header bg-light p-3 rounded">
                        <h5 className="mb-0">
                          <i className="fas fa-calendar-day me-2"></i>
                          {formatFecha(dia.fecha)}
                          <span className="badge bg-primary ms-2">{dia.total_actividades} actividades</span>
                        </h5>
                      </div>
                      <div className="calendario-actividades mt-2">
                        {dia.actividades.map((actividad) => (
                          <div key={actividad.id_actividad} className="card mb-2">
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h6 className="mb-1">{actividad.nombre_actividad}</h6>
                                  <div className="small text-muted">
                                    <i className="fas fa-clock me-1"></i>
                                    {formatHora(actividad.hora_inicio)} - {formatHora(actividad.hora_fin)}
                                  </div>
                                  <div className="small">
                                    <span className={`badge tipo-badge tipo-${actividad.tipo} me-2`}>
                                      {tiposActividades.find(t => t.value === actividad.tipo)?.label || actividad.tipo}
                                    </span>
                                    <span className={`badge estado-badge estado-${actividad.estado}`}>
                                      {estadosActividades.find(e => e.value === actividad.estado)?.label || actividad.estado}
                                    </span>
                                  </div>
                                </div>
                                {actividad.escenariosProgramados?.[0]?.escenario && (
                                  <div className="text-end">
                                    <small className="text-muted">
                                      <i className="fas fa-landmark me-1"></i>
                                      {actividad.escenariosProgramados[0].escenario.nombre}
                                    </small>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowCalendarioModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar eliminación */}
      {showConfirmarEliminarModal && currentActividad && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h3>
                <i className="fas fa-trash-alt me-2"></i>
                Eliminar Actividad: {currentActividad.nombre_actividad}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowConfirmarEliminarModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>¿Está seguro de eliminar esta actividad?</strong>
                <ul className="mt-2 mb-0">
                  <li>Nombre: {currentActividad.nombre_actividad}</li>
                  <li>Fecha: {formatFecha(currentActividad.fecha)}</li>
                  <li>Tipo: {tiposActividades.find(t => t.value === currentActividad.tipo)?.label || currentActividad.tipo}</li>
                  <li>Esta acción no se puede deshacer</li>
                </ul>
              </div>
              
              <div className="alert alert-warning mt-3">
                <i className="fas fa-exclamation-circle me-2"></i>
                <strong>Verificación previa:</strong>
                <ul className="mt-2 mb-0">
                  <li>Asistencias registradas: {currentActividad.asistencias?.length || 0}</li>
                  <li>Escenarios programados: {currentActividad.escenariosProgramados?.length || 0}</li>
                  {currentActividad.asistencias?.length > 0 || currentActividad.escenariosProgramados?.length > 0 ? (
                    <li className="text-danger">
                      <i className="fas fa-ban me-1"></i>
                      No se puede eliminar porque tiene registros asociados
                    </li>
                  ) : (
                    <li className="text-success">
                      <i className="fas fa-check me-1"></i>
                      Se puede eliminar sin problemas
                    </li>
                  )}
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
                onClick={() => handleDelete(currentActividad.id_actividad)}
                disabled={currentActividad.asistencias?.length > 0 || currentActividad.escenariosProgramados?.length > 0}
              >
                <i className="fas fa-trash-alt me-2"></i> Eliminar Actividad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actividades;