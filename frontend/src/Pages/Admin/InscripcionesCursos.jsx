import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/inscripcion-curso.css';

const API_URL = 'http://localhost:8000/api';

const InscripcionesCursos = () => {
  // Estados principales
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showCalificarModal, setShowCalificarModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  
  // Estados para datos
  const [currentInscripcion, setCurrentInscripcion] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCurso, setFilterCurso] = useState('');
  const [filterUsuario, setFilterUsuario] = useState('');
  const [fechaInicioFilter, setFechaInicioFilter] = useState('');
  const [fechaFinFilter, setFechaFinFilter] = useState('');
  
  // Form state para nueva/editar inscripción
  const [formData, setFormData] = useState({
    id_curso: '',
    id_usuario: '',
    fecha_inscripcion: '',
    observaciones: '',
    estado: 'pendiente',
    calificacion: '',
    comentarios: ''
  });

  // Form state para calificar
  const [calificacionForm, setCalificacionForm] = useState({
    calificacion: '',
    comentarios: ''
  });

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
    fetchInscripciones();
    fetchDatosComplementarios();
    // fetchEstadisticas(); // Comentado temporalmente porque la ruta no existe
  }, []);

  // Cargar todas las inscripciones
  const fetchInscripciones = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/inscripciones-curso`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setInscripciones(response.data.data);
      } else {
        setError('Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('Error al cargar inscripciones:', err);
      setError('Error al cargar inscripciones: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos complementarios
  const fetchDatosComplementarios = async () => {
    try {
      const [cursosRes, usuariosRes] = await Promise.all([
        axios.get(`${API_URL}/cursos`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/usuarios`, { headers: getAuthHeaders() })
      ]);

      if (cursosRes.data.success) setCursos(cursosRes.data.data);
      if (usuariosRes.data.success) setUsuarios(usuariosRes.data.data);
    } catch (err) {
      console.error('Error al cargar datos complementarios:', err);
    }
  };

  // Cargar estadísticas - COMENTADO TEMPORALMENTE
  const fetchEstadisticas = async () => {
    try {
      const response = await axios.get(`${API_URL}/inscripciones-curso/estadisticas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setEstadisticas(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      // No mostrar error para no confundir al usuario
    }
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      fetchInscripciones();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/inscripciones-curso/buscar`, {
        params: { busqueda: searchTerm },
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setInscripciones(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar inscripciones: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar inscripciones
  const filtrarInscripciones = async () => {
    try {
      setLoading(true);
      
      // Solo filtro manual en el frontend por ahora
      let inscripcionesFiltradas = [...inscripciones];
      
      if (filterEstado) {
        inscripcionesFiltradas = inscripcionesFiltradas.filter(i => i.estado === filterEstado);
      }
      
      if (filterCurso) {
        inscripcionesFiltradas = inscripcionesFiltradas.filter(i => i.id_curso == filterCurso);
      }
      
      if (filterUsuario) {
        inscripcionesFiltradas = inscripcionesFiltradas.filter(i => i.id_usuario == filterUsuario);
      }
      
      setInscripciones(inscripcionesFiltradas);
    } catch (err) {
      console.error('Error al filtrar:', err);
      setError('Error al filtrar inscripciones: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    setFilterCurso('');
    setFilterUsuario('');
    setFechaInicioFilter('');
    setFechaFinFilter('');
    fetchInscripciones();
  };

  // Crear inscripción
  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API_URL}/inscripciones-curso`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchInscripciones();
        // fetchEstadisticas();
        setSuccessMessage('Inscripción creada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear inscripción:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else if (err.response?.status === 409) {
        alert(err.response.data.message);
      } else if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al crear inscripción: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar inscripción
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentInscripcion) return;

    try {
      const response = await axios.put(`${API_URL}/inscripciones-curso/${currentInscripcion.id}`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchInscripciones();
        // fetchEstadisticas();
        setSuccessMessage('Inscripción actualizada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar inscripción:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al actualizar inscripción: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar inscripción
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta inscripción?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/inscripciones-curso/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchInscripciones();
        // fetchEstadisticas();
        setSuccessMessage('Inscripción eliminada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar inscripción:', err);
      setError('Error al eliminar inscripción: ' + (err.response?.data?.message || err.message));
    }
  };

  // Restaurar inscripción
  const handleRestore = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/inscripciones-curso/${id}/restore`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchInscripciones();
        // fetchEstadisticas();
        setSuccessMessage('Inscripción restaurada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al restaurar inscripción:', err);
      setError('Error al restaurar inscripción: ' + (err.response?.data?.message || err.message));
    }
  };

  // Confirmar inscripción
  const handleConfirmar = async (id) => {
    if (!window.confirm('¿Está seguro de confirmar esta inscripción?')) return;

    try {
      const response = await axios.post(`${API_URL}/inscripciones-curso/${id}/confirmar`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchInscripciones();
        // fetchEstadisticas();
        setSuccessMessage('Inscripción confirmada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al confirmar inscripción:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al confirmar inscripción: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Cancelar inscripción
  const handleCancelar = async (id) => {
    if (!window.confirm('¿Está seguro de cancelar esta inscripción?')) return;

    try {
      const response = await axios.post(`${API_URL}/inscripciones-curso/${id}/cancelar`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchInscripciones();
        // fetchEstadisticas();
        setSuccessMessage('Inscripción cancelada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al cancelar inscripción:', err);
      setError('Error al cancelar inscripción: ' + (err.response?.data?.message || err.message));
    }
  };

  // Calificar inscripción
  const handleCalificar = async (e) => {
    e.preventDefault();
    
    if (!currentInscripcion) return;

    try {
      const response = await axios.post(`${API_URL}/inscripciones-curso/${currentInscripcion.id}/calificar`, calificacionForm, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowCalificarModal(false);
        setCalificacionForm({ calificacion: '', comentarios: '' });
        fetchInscripciones();
        // fetchEstadisticas();
        setSuccessMessage('Inscripción calificada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al calificar inscripción:', err);
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
        setError('Error al calificar inscripción: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Editar inscripción
  const handleEdit = (inscripcion) => {
    setCurrentInscripcion(inscripcion);
    setFormData({
      id_curso: inscripcion.id_curso,
      id_usuario: inscripcion.id_usuario,
      fecha_inscripcion: inscripcion.fecha_inscripcion.split('T')[0],
      observaciones: inscripcion.observaciones || '',
      estado: inscripcion.estado,
      calificacion: inscripcion.calificacion || '',
      comentarios: inscripcion.comentarios || ''
    });
    setShowEditModal(true);
  };

  // Ver detalles
  const handleViewDetails = (inscripcion) => {
    setCurrentInscripcion(inscripcion);
    setShowDetallesModal(true);
  };

  // Abrir calificar
  const handleOpenCalificar = (inscripcion) => {
    setCurrentInscripcion(inscripcion);
    setCalificacionForm({
      calificacion: inscripcion.calificacion || '',
      comentarios: inscripcion.comentarios || ''
    });
    setShowCalificarModal(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      id_curso: '',
      id_usuario: '',
      fecha_inscripcion: '',
      observaciones: '',
      estado: 'pendiente',
      calificacion: '',
      comentarios: ''
    });
    setCurrentInscripcion(null);
  };

  // Obtener inscripciones filtradas
  const getFilteredInscripciones = () => {
    let filtered = inscripciones;
    
    if (filterEstado) {
      filtered = filtered.filter(i => i.estado === filterEstado);
    }
    
    if (filterCurso) {
      filtered = filtered.filter(i => i.id_curso == filterCurso);
    }
    
    if (filterUsuario) {
      filtered = filtered.filter(i => i.id_usuario == filterUsuario);
    }
    
    return filtered;
  };

  // Formatear fecha
  const formatFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Obtener curso por ID
  const getCursoById = (id) => {
    return cursos.find(c => c.id_curso == id);
  };

  // Obtener usuario por ID
  const getUsuarioById = (id) => {
    return usuarios.find(u => u.id_usuario == id);
  };

  // Verificar si se puede calificar
  const puedeCalificar = (inscripcion) => {
    const curso = getCursoById(inscripcion.id_curso);
    return curso && curso.estado === 'finalizado' && inscripcion.estado !== 'completado';
  };

  // Verificar si se puede confirmar
  const puedeConfirmar = (inscripcion) => {
    return inscripcion.estado === 'pendiente';
  };

  // Verificar si se puede cancelar
  const puedeCancelar = (inscripcion) => {
    return inscripcion.estado === 'pendiente' || inscripcion.estado === 'confirmado';
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  // Función para calcular estadísticas manualmente
  const calcularEstadisticas = () => {
    if (inscripciones.length === 0) return null;
    
    const total = inscripciones.length;
    const pendientes = inscripciones.filter(i => i.estado === 'pendiente').length;
    const confirmadas = inscripciones.filter(i => i.estado === 'confirmado').length;
    const completadas = inscripciones.filter(i => i.estado === 'completado').length;
    const canceladas = inscripciones.filter(i => i.estado === 'cancelado').length;
    
    const calificaciones = inscripciones
      .filter(i => i.calificacion !== null && i.calificacion !== undefined)
      .map(i => parseFloat(i.calificacion));
    
    const promedio_calificacion = calificaciones.length > 0 
      ? (calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length).toFixed(2)
      : '0.00';
    
    return {
      total,
      pendientes,
      confirmadas,
      completadas,
      canceladas,
      promedio_calificacion
    };
  };

  const inscripcionesFiltradas = getFilteredInscripciones();
  const estadisticasCalculadas = calcularEstadisticas();

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
                <i className="fas fa-user-graduate me-2"></i>
                Inscripciones a Cursos
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
                  onClick={() => setShowModal(true)}
                  disabled={loading}
                >
                  <i className="fas fa-plus"></i> Nueva Inscripción
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
                        placeholder="Curso, usuario, observaciones..."
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
                    <label className="form-label">Estado</label>
                    <select 
                      className="form-select"
                      value={filterEstado}
                      onChange={(e) => setFilterEstado(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="completado">Completado</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Curso</label>
                    <select 
                      className="form-select"
                      value={filterCurso}
                      onChange={(e) => setFilterCurso(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {cursos.map(curso => (
                        <option key={`curso-${curso.id_curso}`} value={curso.id_curso}>
                          {curso.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Usuario</label>
                    <select 
                      className="form-select"
                      value={filterUsuario}
                      onChange={(e) => setFilterUsuario(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {usuarios.map(usuario => (
                        <option key={`usuario-${usuario.id_usuario}`} value={usuario.id_usuario}>
                          {usuario.nombre} {usuario.apellido}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-1">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={filtrarInscripciones}
                      disabled={loading}
                      title="Aplicar filtros"
                    >
                      <i className="fas fa-filter"></i>
                    </button>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Estadísticas</label>
                    <button 
                      className="btn btn-info w-100"
                      onClick={() => setShowEstadisticasModal(true)}
                      disabled={loading}
                    >
                      <i className="fas fa-chart-bar"></i> Ver Estadísticas
                    </button>
                  </div>
                </div>
                
                {/* Filtros de rango de fechas */}
                <div className="row g-3 mt-2">
                  <div className="col-md-3">
                    <label className="form-label">Fecha Inicio</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaInicioFilter}
                      onChange={(e) => setFechaInicioFilter(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Fecha Fin</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaFinFilter}
                      onChange={(e) => setFechaFinFilter(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Estadísticas rápidas */}
              {estadisticasCalculadas && (
                <div className="stats-section mb-4">
                  <div className="row g-3">
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticasCalculadas.total}</h4>
                        <p>Total</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticasCalculadas.pendientes}</h4>
                        <p>Pendientes</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticasCalculadas.confirmadas}</h4>
                        <p>Confirmadas</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticasCalculadas.completadas}</h4>
                        <p>Completadas</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="stat-card bg-primary text-white">
                        <h4>{estadisticasCalculadas.promedio_calificacion || '0.00'}</h4>
                        <p>Promedio Calificación</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de inscripciones */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando inscripciones...</p>
                </div>
              ) : inscripcionesFiltradas.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-file-contract fa-3x text-muted mb-3"></i>
                  <h4>No hay inscripciones registradas</h4>
                  <p>Crea tu primera inscripción usando el botón "Nueva Inscripción"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Curso</th>
                        <th>Usuario</th>
                        <th>Fecha Inscripción</th>
                        <th>Estado</th>
                        <th>Calificación</th>
                        <th>Observaciones</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inscripcionesFiltradas.map((inscripcion) => {
                        const curso = getCursoById(inscripcion.id_curso);
                        const usuario = getUsuarioById(inscripcion.id_usuario);
                        
                        return (
                          <tr key={`inscripcion-${inscripcion.id}`}>
                            <td>
                              {curso ? (
                                <>
                                  <strong>{curso.nombre}</strong>
                                  <div className="text-muted small">
                                    {curso.tipo} - {curso.estado}
                                  </div>
                                </>
                              ) : (
                                <span className="text-muted">Curso no encontrado</span>
                              )}
                            </td>
                            <td>
                              {usuario ? (
                                <>
                                  <strong>{usuario.nombre} {usuario.apellido}</strong>
                                  <div className="text-muted small">
                                    {usuario.email}
                                  </div>
                                </>
                              ) : (
                                <span className="text-muted">Usuario no encontrado</span>
                              )}
                            </td>
                            <td>
                              {formatFecha(inscripcion.fecha_inscripcion)}
                            </td>
                            <td>
                              <span className={`badge estado-badge estado-${inscripcion.estado}`}>
                                {inscripcion.estado}
                              </span>
                            </td>
                            <td>
                              {inscripcion.calificacion !== null ? (
                                <>
                                  <div className="calificacion">
                                    <strong>{inscripcion.calificacion}</strong>/100
                                  </div>
                                  {inscripcion.comentarios && (
                                    <div className="text-muted small" title={inscripcion.comentarios}>
                                      <i className="fas fa-comment"></i>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted">Sin calificar</span>
                              )}
                            </td>
                            <td>
                              {inscripcion.observaciones ? (
                                <span className="observacion-text" title={inscripcion.observaciones}>
                                  {inscripcion.observaciones.length > 30 
                                    ? inscripcion.observaciones.substring(0, 30) + '...'
                                    : inscripcion.observaciones}
                                </span>
                              ) : (
                                <span className="text-muted">Sin observaciones</span>
                              )}
                            </td>
                            <td>
                              <div className="btn-group">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleViewDetails(inscripcion)}
                                  title="Ver detalles"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => handleEdit(inscripcion)}
                                  title="Editar"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                {puedeConfirmar(inscripcion) && (
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => handleConfirmar(inscripcion.id)}
                                    title="Confirmar"
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                )}
                                {puedeCancelar(inscripcion) && (
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleCancelar(inscripcion.id)}
                                    title="Cancelar"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                )}
                                {puedeCalificar(inscripcion) && (
                                  <button
                                    className="btn btn-sm btn-outline-info"
                                    onClick={() => handleOpenCalificar(inscripcion)}
                                    title="Calificar"
                                  >
                                    <i className="fas fa-star"></i>
                                  </button>
                                )}
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
          </div>
        </div>
      </div>

      {/* Modal para crear inscripción */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nueva Inscripción
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
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Curso *</label>
                      <select
                        className="form-control"
                        value={formData.id_curso}
                        onChange={(e) => {
                          const cursoId = e.target.value;
                          const cursoSeleccionado = cursos.find(c => c.id_curso == cursoId);
                          setFormData({
                            ...formData,
                            id_curso: cursoId,
                            estado: cursoSeleccionado?.estado === 'activo' ? 'confirmado' : 'pendiente'
                          });
                        }}
                        required
                      >
                        <option value="">Seleccione curso...</option>
                        {cursos
                          .filter(curso => curso.estado === 'planificado' || curso.estado === 'activo')
                          .map(curso => (
                            <option key={curso.id_curso} value={curso.id_curso}>
                              {curso.nombre} ({curso.estado}) - Cupos: {curso.cupo_actual}/{curso.cupo_maximo}
                            </option>
                          ))}
                      </select>
                      <small className="text-muted">Solo se muestran cursos planificados o activos</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Usuario *</label>
                      <select
                        className="form-control"
                        value={formData.id_usuario}
                        onChange={(e) => setFormData({...formData, id_usuario: e.target.value})}
                        required
                      >
                        <option value="">Seleccione usuario...</option>
                        {usuarios.map(usuario => (
                          <option key={usuario.id_usuario} value={usuario.id_usuario}>
                            {usuario.nombre} {usuario.apellido} ({usuario.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha Inscripción *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha_inscripcion}
                        onChange={(e) => setFormData({...formData, fecha_inscripcion: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-control"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
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

                {formData.id_curso && (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    {(() => {
                      const cursoSeleccionado = cursos.find(c => c.id_curso == formData.id_curso);
                      if (cursoSeleccionado) {
                        return `Curso: ${cursoSeleccionado.nombre} - Cupos disponibles: ${cursoSeleccionado.cupo_maximo - cursoSeleccionado.cupo_actual}`;
                      }
                      return 'Seleccione un curso para ver más información';
                    })()}
                  </div>
                )}
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear inscripción */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nueva Inscripción
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
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Curso *</label>
                      <select
                        className="form-control"
                        value={formData.id_curso}
                        onChange={(e) => {
                          const cursoId = e.target.value;
                          const cursoSeleccionado = cursos.find(c => c.id_curso == cursoId);
                          setFormData({
                            ...formData,
                            id_curso: cursoId,
                            estado: cursoSeleccionado?.estado === 'activo' ? 'confirmado' : 'pendiente'
                          });
                        }}
                        required
                      >
                        <option value="">Seleccione curso...</option>
                        {cursos
                          .filter(curso => curso.estado === 'planificado' || curso.estado === 'activo')
                          .map(curso => (
                            <option key={`modal-curso-${curso.id_curso}`} value={curso.id_curso}>
                              {curso.nombre} ({curso.estado}) - Cupos: {curso.cupo_actual}/{curso.cupo_maximo}
                            </option>
                          ))}
                      </select>
                      <small className="text-muted">Solo se muestran cursos planificados o activos</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Usuario *</label>
                      <select
                        className="form-control"
                        value={formData.id_usuario}
                        onChange={(e) => setFormData({...formData, id_usuario: e.target.value})}
                        required
                      >
                        <option value="">Seleccione usuario...</option>
                        {usuarios.map(usuario => (
                          <option key={`modal-usuario-${usuario.id_usuario}`} value={usuario.id_usuario}>
                            {usuario.nombre} {usuario.apellido} ({usuario.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha Inscripción *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha_inscripcion}
                        onChange={(e) => setFormData({...formData, fecha_inscripcion: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-control"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
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

                {formData.id_curso && (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    {(() => {
                      const cursoSeleccionado = cursos.find(c => c.id_curso == formData.id_curso);
                      if (cursoSeleccionado) {
                        return `Curso: ${cursoSeleccionado.nombre} - Cupos disponibles: ${cursoSeleccionado.cupo_maximo - cursoSeleccionado.cupo_actual}`;
                      }
                      return 'Seleccione un curso para ver más información';
                    })()}
                  </div>
                )}
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles */}
      {showDetallesModal && currentInscripcion && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-file-contract me-2"></i>
                Detalles de Inscripción
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDetallesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="detail-section mb-4">
                    <h5 className="text-primary">Información del Curso</h5>
                    {(() => {
                      const curso = getCursoById(currentInscripcion.id_curso);
                      return curso ? (
                        <div className="p-3 bg-light rounded">
                          <p><strong>Nombre:</strong> {curso.nombre}</p>
                          <p><strong>Tipo:</strong> {curso.tipo}</p>
                          <p><strong>Estado:</strong> {curso.estado}</p>
                          <p><strong>Duración:</strong> {curso.duracion}</p>
                          <p><strong>Descripción:</strong> {curso.descripcion}</p>
                        </div>
                      ) : (
                        <p className="text-muted">Curso no encontrado</p>
                      );
                    })()}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="detail-section mb-4">
                    <h5 className="text-primary">Información del Usuario</h5>
                    {(() => {
                      const usuario = getUsuarioById(currentInscripcion.id_usuario);
                      return usuario ? (
                        <div className="p-3 bg-light rounded">
                          <p><strong>Nombre:</strong> {usuario.nombre} {usuario.apellido}</p>
                          <p><strong>Email:</strong> {usuario.email}</p>
                          <p><strong>Teléfono:</strong> {usuario.telefono || 'No especificado'}</p>
                          <p><strong>Rol:</strong> {usuario.rol}</p>
                        </div>
                      ) : (
                        <p className="text-muted">Usuario no encontrado</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  <div className="detail-section mb-4">
                    <h5 className="text-primary">Detalles de Inscripción</h5>
                    <div className="p-3 bg-light rounded">
                      <div className="row">
                        <div className="col-md-3">
                          <p><strong>Fecha Inscripción:</strong><br/>{formatFecha(currentInscripcion.fecha_inscripcion)}</p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Estado:</strong><br/>
                            <span className={`badge estado-badge estado-${currentInscripcion.estado}`}>
                              {currentInscripcion.estado}
                            </span>
                          </p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Calificación:</strong><br/>
                            {currentInscripcion.calificacion !== null 
                              ? `${currentInscripcion.calificacion}/100`
                              : 'Sin calificar'}
                          </p>
                        </div>
                        <div className="col-md-3">
                          <p><strong>Creado:</strong><br/>{formatFecha(currentInscripcion.created_at)}</p>
                        </div>
                      </div>
                      {currentInscripcion.observaciones && (
                        <div className="mt-3">
                          <p><strong>Observaciones:</strong></p>
                          <p className="p-2 bg-white rounded">{currentInscripcion.observaciones}</p>
                        </div>
                      )}
                      {currentInscripcion.comentarios && (
                        <div className="mt-3">
                          <p><strong>Comentarios de Calificación:</strong></p>
                          <p className="p-2 bg-white rounded">{currentInscripcion.comentarios}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
                  handleEdit(currentInscripcion);
                }}
              >
                <i className="fas fa-edit"></i> Editar
              </button>
              {puedeCalificar(currentInscripcion) && (
                <button 
                  type="button" 
                  className="btn btn-info"
                  onClick={() => {
                    setShowDetallesModal(false);
                    handleOpenCalificar(currentInscripcion);
                  }}
                >
                  <i className="fas fa-star"></i> Calificar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para calificar */}
      {showCalificarModal && currentInscripcion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-star me-2"></i>
                Calificar Inscripción
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowCalificarModal(false);
                  setCalificacionForm({ calificacion: '', comentarios: '' });
                }}
              ></button>
            </div>
            <form onSubmit={handleCalificar}>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Calificando inscripción para: <strong>{getUsuarioById(currentInscripcion.id_usuario)?.nombre}</strong> 
                  en el curso: <strong>{getCursoById(currentInscripcion.id_curso)?.nombre}</strong>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Calificación (0-100) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={calificacionForm.calificacion}
                    onChange={(e) => setCalificacionForm({...calificacionForm, calificacion: e.target.value})}
                    min="0"
                    max="100"
                    required
                  />
                  <small className="text-muted">Ingrese una calificación entre 0 y 100</small>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Comentarios de Calificación</label>
                  <textarea
                    className="form-control"
                    value={calificacionForm.comentarios}
                    onChange={(e) => setCalificacionForm({...calificacionForm, comentarios: e.target.value})}
                    rows="4"
                    placeholder="Comentarios sobre el desempeño en el curso..."
                  />
                </div>

                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Al calificar, la inscripción cambiará automáticamente a estado "completado"
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCalificarModal(false);
                    setCalificacionForm({ calificacion: '', comentarios: '' });
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-info">
                  Guardar Calificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

 {/* Modal para estadísticas */}
      {showEstadisticasModal && estadisticasCalculadas && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-chart-bar me-2"></i>
                Estadísticas de Inscripciones
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowEstadisticasModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="stat-card-lg mb-4">
                    <h4 className="text-primary">Resumen General</h4>
                    <div className="p-3 bg-light rounded">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Total Inscripciones:</span>
                        <strong>{estadisticasCalculadas.total}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Pendientes:</span>
                        <strong>{estadisticasCalculadas.pendientes}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Confirmadas:</span>
                        <strong>{estadisticasCalculadas.confirmadas}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Completadas:</span>
                        <strong>{estadisticasCalculadas.completadas}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Canceladas:</span>
                        <strong>{estadisticasCalculadas.canceladas}</strong>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between">
                        <span>Promedio Calificación:</span>
                        <strong className="text-success">{estadisticasCalculadas.promedio_calificacion || '0.00'}/100</strong>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="stat-card-lg mb-4">
                    <h4 className="text-primary">Distribución por Estado</h4>
                    <div className="p-3 bg-light rounded">
                      <div className="progress mb-2">
                        <div 
                          className="progress-bar bg-warning" 
                          style={{width: `${(estadisticasCalculadas.pendientes / estadisticasCalculadas.total) * 100 || 0}%`}}
                        >
                          Pendientes: {estadisticasCalculadas.pendientes}
                        </div>
                      </div>
                      <div className="progress mb-2">
                        <div 
                          className="progress-bar bg-success" 
                          style={{width: `${(estadisticasCalculadas.confirmadas / estadisticasCalculadas.total) * 100 || 0}%`}}
                        >
                          Confirmadas: {estadisticasCalculadas.confirmadas}
                        </div>
                      </div>
                      <div className="progress mb-2">
                        <div 
                          className="progress-bar bg-info" 
                          style={{width: `${(estadisticasCalculadas.completadas / estadisticasCalculadas.total) * 100 || 0}%`}}
                        >
                          Completadas: {estadisticasCalculadas.completadas}
                        </div>
                      </div>
                      <div className="progress mb-2">
                        <div 
                          className="progress-bar bg-danger" 
                          style={{width: `${(estadisticasCalculadas.canceladas / estadisticasCalculadas.total) * 100 || 0}%`}}
                        >
                          Canceladas: {estadisticasCalculadas.canceladas}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                <i className="fas fa-download"></i> Exportar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InscripcionesCursos;