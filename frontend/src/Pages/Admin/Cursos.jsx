import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/curso.css';

const API_URL = 'http://localhost:8000/api';

const Cursos = () => {
  // Estados principales
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showInscritosModal, setShowInscritosModal] = useState(false);
  const [showDisponibilidadModal, setShowDisponibilidadModal] = useState(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  
  // Estados para datos
  const [currentCurso, setCurrentCurso] = useState(null);
  const [inscritosCurso, setInscritosCurso] = useState([]);
  const [disponibilidadCurso, setDisponibilidadCurso] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [fechaInicioFilter, setFechaInicioFilter] = useState('');
  const [fechaFinFilter, setFechaFinFilter] = useState('');
  
  // Form state para nuevo/editar curso
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    representante: '',
    email_representante: '',
    telefono_representante: '',
    tipo: 'teorico',
    estado: 'planificado',
    cupo_maximo: '',
    precio: '',
    imagen: null,
    imagenPreview: ''
  });

  // Estado para cambiar estado
  const [nuevoEstado, setNuevoEstado] = useState('');

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

  // Headers para subida de archivos
  const getAuthHeadersMultipart = () => {
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
    if (!getToken()) {
      window.location.href = '/login';
      return;
    }
    fetchCursos();
    fetchEstadisticas();
  }, []);

  // Cargar todos los cursos
  const fetchCursos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/cursos`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setCursos(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar cursos:', err);
      setError('Error al cargar cursos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const fetchEstadisticas = async () => {
    try {
      const response = await axios.get(`${API_URL}/cursos/estadisticas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setEstadisticas(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Cargar inscritos de un curso
  const fetchInscritosCurso = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/cursos/${id}/inscritos`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setInscritosCurso(response.data.data.inscritos);
      }
    } catch (err) {
      console.error('Error al cargar inscritos:', err);
      setError('Error al cargar inscritos: ' + (err.response?.data?.message || err.message));
    }
  };

  // Verificar disponibilidad de cupos
  const verificarDisponibilidad = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/cursos/${id}/verificar-disponibilidad`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setDisponibilidadCurso(response.data.data);
        setShowDisponibilidadModal(true);
      }
    } catch (err) {
      console.error('Error al verificar disponibilidad:', err);
      setError('Error al verificar disponibilidad: ' + (err.response?.data?.message || err.message));
    }
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      fetchCursos();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/cursos/buscar`, {
        params: { busqueda: searchTerm },
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setCursos(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar cursos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar cursos
  const filtrarCursos = async () => {
    try {
      setLoading(true);
      
      let url = `${API_URL}/cursos`;
      let params = {};
      let usarFiltroEspecifico = false;

      if (fechaInicioFilter && fechaFinFilter) {
        // Filtrar por rango de fechas
        url = `${API_URL}/cursos/por-rango-fechas`;
        params = {
          fecha_inicio: fechaInicioFilter,
          fecha_fin: fechaFinFilter
        };
        usarFiltroEspecifico = true;
      } else if (filterEstado) {
        // Obtener cursos activos
        if (filterEstado === 'activo') {
          url = `${API_URL}/cursos/activos`;
          usarFiltroEspecifico = true;
        }
      } else if (filterTipo) {
        // Filtrar por tipo
        url = `${API_URL}/cursos/por-tipo/${filterTipo}`;
        usarFiltroEspecifico = true;
      }

      if (usarFiltroEspecifico) {
        const response = await axios.get(url, {
          params,
          headers: getAuthHeaders()
        });
        
        if (response.data.success) {
          setCursos(response.data.data);
        }
      } else {
        // Filtro manual en el frontend
        let cursosFiltrados = [...cursos];
        
        if (filterEstado) {
          cursosFiltrados = cursosFiltrados.filter(c => c.estado === filterEstado);
        }
        
        if (filterTipo) {
          cursosFiltrados = cursosFiltrados.filter(c => c.tipo === filterTipo);
        }
        
        setCursos(cursosFiltrados);
      }
    } catch (err) {
      console.error('Error al filtrar:', err);
      setError('Error al filtrar cursos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    setFilterTipo('');
    setFechaInicioFilter('');
    setFechaFinFilter('');
    fetchCursos();
  };

  // Crear curso
  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      // Agregar campos al FormData
      Object.keys(formData).forEach(key => {
        if (key === 'imagen' && formData.imagen instanceof File) {
          formDataToSend.append('imagen', formData.imagen);
        } else if (formData[key] !== '' && formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.post(`${API_URL}/cursos`, formDataToSend, {
        headers: getAuthHeadersMultipart()
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchCursos();
        fetchEstadisticas();
        setSuccessMessage('Curso creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear curso:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al crear curso: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar curso
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentCurso) return;
    
    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'imagen' && formData.imagen instanceof File) {
          formDataToSend.append('imagen', formData.imagen);
        } else if (formData[key] !== currentCurso[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.post(`${API_URL}/cursos/${currentCurso.id_curso}?_method=PUT`, formDataToSend, {
        headers: getAuthHeadersMultipart()
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchCursos();
        fetchEstadisticas();
        setSuccessMessage('Curso actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar curso:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al actualizar curso: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar curso
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este curso?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/cursos/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchCursos();
        fetchEstadisticas();
        setSuccessMessage('Curso eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar curso:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al eliminar curso: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Restaurar curso
  const handleRestore = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/cursos/${id}/restore`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchCursos();
        fetchEstadisticas();
        setSuccessMessage('Curso restaurado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al restaurar curso:', err);
      setError('Error al restaurar curso: ' + (err.response?.data?.message || err.message));
    }
  };

  // Actualizar estado del curso
  const handleUpdateEstado = async () => {
    if (!currentCurso || !nuevoEstado) return;
    
    try {
      const response = await axios.put(`${API_URL}/cursos/${currentCurso.id_curso}/actualizar-estado`, {
        estado: nuevoEstado
      }, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowEstadoModal(false);
        setNuevoEstado('');
        fetchCursos();
        fetchEstadisticas();
        setSuccessMessage('Estado del curso actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al actualizar estado: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Editar curso
  const handleEdit = (curso) => {
    setCurrentCurso(curso);
    setFormData({
      nombre: curso.nombre,
      slug: curso.slug,
      descripcion: curso.descripcion || '',
      fecha_inicio: curso.fecha_inicio.split('T')[0],
      fecha_fin: curso.fecha_fin.split('T')[0],
      representante: curso.representante,
      email_representante: curso.email_representante,
      telefono_representante: curso.telefono_representante,
      tipo: curso.tipo,
      estado: curso.estado,
      cupo_maximo: curso.cupo_maximo,
      precio: curso.precio,
      imagen: null,
      imagenPreview: curso.imagen ? `${API_URL}/storage/${curso.imagen}` : ''
    });
    setShowEditModal(true);
  };

  // Ver detalles
  const handleViewDetails = (curso) => {
    setCurrentCurso(curso);
    setShowDetallesModal(true);
  };

  // Ver inscritos
  const handleViewInscritos = async (curso) => {
    setCurrentCurso(curso);
    await fetchInscritosCurso(curso.id_curso);
    setShowInscritosModal(true);
  };

  // Cambiar estado
  const handleChangeEstado = (curso) => {
    setCurrentCurso(curso);
    setNuevoEstado(curso.estado);
    setShowEstadoModal(true);
  };

  // Manejar cambio de archivo (imagen)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        imagen: file,
        imagenPreview: URL.createObjectURL(file)
      });
    }
  };

  // Generar slug automáticamente
  const generarSlug = (nombre) => {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      slug: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      representante: '',
      email_representante: '',
      telefono_representante: '',
      tipo: 'teorico',
      estado: 'planificado',
      cupo_maximo: '',
      precio: '',
      imagen: null,
      imagenPreview: ''
    });
    setCurrentCurso(null);
  };

  // Obtener cursos filtrados
  const getFilteredCursos = () => {
    let filtered = cursos;
    
    if (filterEstado) {
      filtered = filtered.filter(c => c.estado === filterEstado);
    }
    
    if (filterTipo) {
      filtered = filtered.filter(c => c.tipo === filterTipo);
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

  // Formatear moneda
  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'COP'
    }).format(valor);
  };

  // Calcular días restantes
  const calcularDiasRestantes = (fechaFin) => {
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diferencia = fin - hoy;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  const cursosFiltrados = getFilteredCursos();

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
                <i className="fas fa-graduation-cap me-2"></i>
                Gestión de Cursos
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
                  <i className="fas fa-plus"></i> Nuevo Curso
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
                        placeholder="Nombre, descripción, representante..."
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
                      <option value="planificado">Planificado</option>
                      <option value="activo">Activo</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Tipo</label>
                    <select 
                      className="form-select"
                      value={filterTipo}
                      onChange={(e) => setFilterTipo(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="teorico">Teórico</option>
                      <option value="practico">Práctico</option>
                      <option value="mixto">Mixto</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Fecha Inicio</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaInicioFilter}
                      onChange={(e) => setFechaInicioFilter(e.target.value)}
                    />
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Fecha Fin</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaFinFilter}
                      onChange={(e) => setFechaFinFilter(e.target.value)}
                    />
                  </div>
                  
                  <div className="col-md-1">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={filtrarCursos}
                      disabled={loading}
                      title="Aplicar filtros"
                    >
                      <i className="fas fa-filter"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Estadísticas rápidas */}
              {estadisticas && (
                <div className="stats-section mb-4">
                  <div className="row g-3">
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticas.total_cursos}</h4>
                        <p>Total Cursos</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticas.activos}</h4>
                        <p>Activos</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticas.total_inscripciones}</h4>
                        <p>Inscripciones</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticas.ingresos_totales ? formatMoneda(estadisticas.ingresos_totales) : '$0'}</h4>
                        <p>Ingresos</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="stat-card bg-primary text-white">
                        <h4>
                          <button 
                            className="btn btn-link text-white p-0"
                            onClick={() => setShowEstadisticasModal(true)}
                            style={{textDecoration: 'none'}}
                          >
                            <i className="fas fa-chart-bar me-2"></i>
                            Ver Estadísticas
                          </button>
                        </h4>
                        <p>Reportes completos</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de cursos */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando cursos...</p>
                </div>
              ) : cursosFiltrados.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-book fa-3x text-muted mb-3"></i>
                  <h4>No hay cursos registrados</h4>
                  <p>Crea tu primer curso usando el botón "Nuevo Curso"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>Fechas</th>
                        <th>Tipo</th>
                        <th>Cupo</th>
                        <th>Precio</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cursosFiltrados.map((curso) => (
                        <tr key={curso.id_curso}>
                          <td>
                            {curso.imagen ? (
                              <img 
                                src={`${API_URL}/storage/${curso.imagen}`} 
                                alt={curso.nombre}
                                className="curso-imagen"
                              />
                            ) : (
                              <div className="curso-imagen-placeholder">
                                <i className="fas fa-graduation-cap"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <strong>{curso.nombre}</strong>
                            <div className="text-muted small">
                              {curso.descripcion ? 
                                (curso.descripcion.length > 50 ? curso.descripcion.substring(0, 50) + '...' : curso.descripcion) : 
                                'Sin descripción'}
                            </div>
                            <div className="text-muted small">
                              <i className="fas fa-user-tie me-1"></i>
                              {curso.representante}
                            </div>
                          </td>
                          <td>
                            <div className="fechas-info">
                              <div>
                                <small className="text-muted">Inicio:</small>
                                <br />
                                <strong>{formatFecha(curso.fecha_inicio)}</strong>
                              </div>
                              <div className="mt-1">
                                <small className="text-muted">Fin:</small>
                                <br />
                                <strong>{formatFecha(curso.fecha_fin)}</strong>
                              </div>
                              {new Date(curso.fecha_fin) > new Date() && (
                                <div className="mt-1">
                                  <span className="badge bg-info">
                                    {calcularDiasRestantes(curso.fecha_fin)} días restantes
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge tipo-badge tipo-${curso.tipo}`}>
                              <i className={`fas fa-${curso.tipo === 'teorico' ? 'chalkboard-teacher' : curso.tipo === 'practico' ? 'running' : 'blender'} me-1`}></i>
                              {curso.tipo}
                            </span>
                          </td>
                          <td>
                            <div className="cupo-info">
                              <div className="progress mb-1" style={{height: '8px'}}>
                                <div 
                                  className={`progress-bar ${curso.cupo_actual >= curso.cupo_maximo ? 'bg-danger' : 'bg-success'}`}
                                  role="progressbar"
                                  style={{ width: `${(curso.cupo_actual / curso.cupo_maximo) * 100}%` }}
                                  aria-valuenow={curso.cupo_actual}
                                  aria-valuemin="0"
                                  aria-valuemax={curso.cupo_maximo}
                                ></div>
                              </div>
                              <small>
                                {curso.cupo_actual} / {curso.cupo_maximo}
                                <button 
                                  className="btn btn-sm btn-link p-0 ms-1"
                                  onClick={() => verificarDisponibilidad(curso.id_curso)}
                                  title="Ver disponibilidad"
                                >
                                  <i className="fas fa-info-circle"></i>
                                </button>
                              </small>
                            </div>
                          </td>
                          <td>
                            <strong>{formatMoneda(curso.precio)}</strong>
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${curso.estado}`}>
                              {curso.estado}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetails(curso)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEdit(curso)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewInscritos(curso)}
                                title="Ver inscritos"
                              >
                                <i className="fas fa-users"></i>
                              </button>
                              <div className="btn-group dropstart">
                                <button
                                  className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                  type="button"
                                  data-bs-toggle="dropdown"
                                  title="Más opciones"
                                >
                                  <i className="fas fa-ellipsis-v"></i>
                                </button>
                                <ul className="dropdown-menu">
                                  <li>
                                    <button 
                                      className="dropdown-item"
                                      onClick={() => handleChangeEstado(curso)}
                                    >
                                      <i className="fas fa-exchange-alt me-2"></i>
                                      Cambiar estado
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item"
                                      onClick={() => verificarDisponibilidad(curso.id_curso)}
                                    >
                                      <i className="fas fa-info-circle me-2"></i>
                                      Ver disponibilidad
                                    </button>
                                  </li>
                                  <li><hr className="dropdown-divider" /></li>
                                  <li>
                                    <button 
                                      className="dropdown-item text-danger"
                                      onClick={() => handleDelete(curso.id_curso)}
                                    >
                                      <i className="fas fa-trash me-2"></i>
                                      Eliminar
                                    </button>
                                  </li>
                                </ul>
                              </div>
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

      {/* Modal para crear curso */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nuevo Curso
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
                      <label className="form-label">Nombre del Curso *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombre}
                        onChange={(e) => {
                          const nombre = e.target.value;
                          setFormData({
                            ...formData,
                            nombre: nombre,
                            slug: generarSlug(nombre)
                          });
                        }}
                        required
                        placeholder="Ej: Curso de Fútbol Avanzado"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Slug *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        required
                        placeholder="curso-futbol-avanzado"
                      />
                      <small className="text-muted">Identificador único para URLs</small>
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
                    placeholder="Descripción detallada del curso..."
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha Inicio *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha Fin *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Representante *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.representante}
                        onChange={(e) => setFormData({...formData, representante: e.target.value})}
                        required
                        placeholder="Nombre completo"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Email Representante *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email_representante}
                        onChange={(e) => setFormData({...formData, email_representante: e.target.value})}
                        required
                        placeholder="ejemplo@email.com"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Teléfono Representante *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.telefono_representante}
                        onChange={(e) => setFormData({...formData, telefono_representante: e.target.value})}
                        required
                        placeholder="+57 300 1234567"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Tipo de Curso *</label>
                      <select
                        className="form-control"
                        value={formData.tipo}
                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                        required
                      >
                        <option value="teorico">Teórico</option>
                        <option value="practico">Práctico</option>
                        <option value="mixto">Mixto</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-control"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      >
                        <option value="planificado">Planificado</option>
                        <option value="activo">Activo</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Cupo Máximo *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.cupo_maximo}
                        onChange={(e) => setFormData({...formData, cupo_maximo: e.target.value})}
                        required
                        min="1"
                        placeholder="50"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Precio *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.precio}
                          onChange={(e) => setFormData({...formData, precio: e.target.value})}
                          required
                          min="0"
                          step="0.01"
                          placeholder="150000"
                        />
                        <span className="input-group-text">COP</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Imagen del Curso</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      {formData.imagenPreview && (
                        <div className="mt-2">
                          <img 
                            src={formData.imagenPreview} 
                            alt="Preview" 
                            className="img-preview"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  El curso tendrá una duración de {formData.fecha_inicio && formData.fecha_fin ? 
                    Math.ceil((new Date(formData.fecha_fin) - new Date(formData.fecha_inicio)) / (1000 * 60 * 60 * 24)) : 
                    '0'} días
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
                  Crear Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar curso */}
      {showEditModal && currentCurso && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-warning text-white">
              <h3>
                <i className="fas fa-edit me-2"></i>
                Editar Curso
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              ></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Editando curso: <strong>{currentCurso.nombre}</strong> (ID: {currentCurso.id_curso})
                </div>

                <div className="row">
                  <div className="col-md-8">
                    <div className="form-group mb-3">
                      <label className="form-label">Nombre del Curso *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombre}
                        onChange={(e) => {
                          const nombre = e.target.value;
                          setFormData({
                            ...formData,
                            nombre: nombre,
                            slug: generarSlug(nombre)
                          });
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Slug *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        required
                      />
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
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha Inicio *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha_inicio}
                        onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha Fin *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha_fin}
                        onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Representante *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.representante}
                        onChange={(e) => setFormData({...formData, representante: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Email Representante *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email_representante}
                        onChange={(e) => setFormData({...formData, email_representante: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Teléfono Representante *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.telefono_representante}
                        onChange={(e) => setFormData({...formData, telefono_representante: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Tipo de Curso *</label>
                      <select
                        className="form-control"
                        value={formData.tipo}
                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                        required
                      >
                        <option value="teorico">Teórico</option>
                        <option value="practico">Práctico</option>
                        <option value="mixto">Mixto</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-control"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      >
                        <option value="planificado">Planificado</option>
                        <option value="activo">Activo</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Cupo Máximo *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.cupo_maximo}
                        onChange={(e) => setFormData({...formData, cupo_maximo: e.target.value})}
                        required
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Cupo Actual</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.cupo_actual || currentCurso.cupo_actual}
                        onChange={(e) => setFormData({...formData, cupo_actual: e.target.value})}
                        min="0"
                        max={formData.cupo_maximo}
                      />
                      <small className="text-muted">No puede ser mayor al cupo máximo</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Precio *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.precio}
                          onChange={(e) => setFormData({...formData, precio: e.target.value})}
                          required
                          min="0"
                          step="0.01"
                        />
                        <span className="input-group-text">COP</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Imagen del Curso</label>
                  {currentCurso.imagen && !formData.imagenPreview && (
                    <div className="mb-2">
                      <img 
                        src={`${API_URL}/storage/${currentCurso.imagen}`} 
                        alt="Imagen actual" 
                        className="img-preview"
                      />
                      <div className="form-text">Imagen actual</div>
                    </div>
                  )}
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {formData.imagenPreview && (
                    <div className="mt-2">
                      <img 
                        src={formData.imagenPreview} 
                        alt="Nueva imagen" 
                        className="img-preview"
                      />
                      <div className="form-text">Nueva imagen (reemplazará la actual)</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-warning text-white">
                  Actualizar Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles */}
      {showDetallesModal && currentCurso && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-info-circle me-2"></i>
                Detalles del Curso
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDetallesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-4 text-center">
                  {currentCurso.imagen ? (
                    <img 
                      src={`${API_URL}/storage/${currentCurso.imagen}`} 
                      alt={currentCurso.nombre}
                      className="img-fluid rounded mb-3 curso-imagen-detalle"
                    />
                  ) : (
                    <div className="curso-imagen-grande mb-3">
                      <i className="fas fa-graduation-cap fa-5x text-muted"></i>
                    </div>
                  )}
                  <h4>{currentCurso.nombre}</h4>
                  <span className={`badge estado-badge estado-${currentCurso.estado}`}>
                    {currentCurso.estado}
                  </span>
                </div>
                <div className="col-md-8">
                  <div className="row">
                    <div className="col-md-6">
                      <h5>Información del Curso</h5>
                      <p><strong>Slug:</strong> {currentCurso.slug}</p>
                      <p><strong>Tipo:</strong> 
                        <span className={`badge tipo-badge tipo-${currentCurso.tipo} ms-2`}>
                          {currentCurso.tipo}
                        </span>
                      </p>
                      <p><strong>Fecha Inicio:</strong> {formatFecha(currentCurso.fecha_inicio)}</p>
                      <p><strong>Fecha Fin:</strong> {formatFecha(currentCurso.fecha_fin)}</p>
                      <p><strong>Duración:</strong> 
                        {Math.ceil((new Date(currentCurso.fecha_fin) - new Date(currentCurso.fecha_inicio)) / (1000 * 60 * 60 * 24))} días
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h5>Información de Cupos</h5>
                      <p><strong>Cupo Máximo:</strong> {currentCurso.cupo_maximo}</p>
                      <p><strong>Cupo Actual:</strong> {currentCurso.cupo_actual}</p>
                      <p><strong>Disponibles:</strong> {currentCurso.cupo_maximo - currentCurso.cupo_actual}</p>
                      <p><strong>Precio:</strong> {formatMoneda(currentCurso.precio)}</p>
                      <p><strong>Porcentaje Ocupación:</strong> 
                        {((currentCurso.cupo_actual / currentCurso.cupo_maximo) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="row mt-3">
                    <div className="col-12">
                      <h5>Representante</h5>
                      <div className="card">
                        <div className="card-body">
                          <p><strong>Nombre:</strong> {currentCurso.representante}</p>
                          <p><strong>Email:</strong> {currentCurso.email_representante}</p>
                          <p><strong>Teléfono:</strong> {currentCurso.telefono_representante}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {currentCurso.descripcion && (
                    <div className="row mt-3">
                      <div className="col-12">
                        <h5>Descripción</h5>
                        <div className="card">
                          <div className="card-body">
                            {currentCurso.descripcion}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver inscritos */}
      {showInscritosModal && currentCurso && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-users me-2"></i>
                Inscritos en {currentCurso.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowInscritosModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Mostrando {inscritosCurso.length} inscritos de {currentCurso.cupo_maximo} cupos disponibles
              </div>
              
              {inscritosCurso.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-user-slash fa-3x text-muted mb-3"></i>
                  <h4>No hay inscritos en este curso</h4>
                  <p>No hay usuarios inscritos todavía</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Fecha Inscripción</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inscritosCurso.map((inscripcion) => (
                        <tr key={inscripcion.id}>
                          <td>
                            <strong>{inscripcion.usuario?.nombre}</strong>
                          </td>
                          <td>{inscripcion.usuario?.email}</td>
                          <td>{inscripcion.created_at ? new Date(inscripcion.created_at).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <span className={`badge ${inscripcion.estado === 'activo' ? 'bg-success' : 'bg-warning'}`}>
                              {inscripcion.estado || 'Pendiente'}
                            </span>
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
                onClick={() => setShowInscritosModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para disponibilidad */}
      {showDisponibilidadModal && disponibilidadCurso && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-info-circle me-2"></i>
                Disponibilidad de Cupos
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDisponibilidadModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <h4>{disponibilidadCurso.curso}</h4>
              
              <div className="mt-4">
                <div className="row">
                  <div className="col-md-6">
                    <div className="info-box">
                      <div className="info-label">Cupo Máximo</div>
                      <div className="info-value">{disponibilidadCurso.cupo_maximo}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="info-box">
                      <div className="info-label">Cupo Actual</div>
                      <div className="info-value">{disponibilidadCurso.cupo_actual}</div>
                    </div>
                  </div>
                </div>
                
                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="info-box">
                      <div className="info-label">Cupos Disponibles</div>
                      <div className="info-value">{disponibilidadCurso.cupos_disponibles}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="info-box">
                      <div className="info-label">Porcentaje Ocupación</div>
                      <div className="info-value">{disponibilidadCurso.porcentaje_ocupacion}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="progress" style={{ height: '30px' }}>
                    <div 
                      className={`progress-bar ${disponibilidadCurso.porcentaje_ocupacion >= 100 ? 'bg-danger' : disponibilidadCurso.porcentaje_ocupacion >= 80 ? 'bg-warning' : 'bg-success'}`}
                      role="progressbar"
                      style={{ width: `${disponibilidadCurso.porcentaje_ocupacion}%` }}
                      aria-valuenow={disponibilidadCurso.porcentaje_ocupacion}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {disponibilidadCurso.porcentaje_ocupacion}%
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 text-center">
                  {disponibilidadCurso.disponible ? (
                    <div className="alert alert-success">
                      <i className="fas fa-check-circle me-2"></i>
                      Hay {disponibilidadCurso.cupos_disponibles} cupos disponibles
                    </div>
                  ) : (
                    <div className="alert alert-danger">
                      <i className="fas fa-times-circle me-2"></i>
                      No hay cupos disponibles
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowDisponibilidadModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cambiar estado */}
      {showEstadoModal && currentCurso && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-warning text-white">
              <h3>
                <i className="fas fa-exchange-alt me-2"></i>
                Cambiar Estado del Curso
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowEstadoModal(false);
                  setNuevoEstado('');
                }}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Cambiando estado del curso: <strong>{currentCurso.nombre}</strong>
              </div>
              
              <div className="form-group mb-3">
                <label className="form-label">Nuevo Estado *</label>
                <select
                  className="form-control"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  required
                >
                  <option value="">Seleccione un estado...</option>
                  <option value="planificado">Planificado</option>
                  <option value="activo">Activo</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Estado actual: <span className={`badge estado-badge estado-${currentCurso.estado}`}>
                  {currentCurso.estado}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowEstadoModal(false);
                  setNuevoEstado('');
                }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-warning"
                onClick={handleUpdateEstado}
                disabled={!nuevoEstado || nuevoEstado === currentCurso.estado}
              >
                Cambiar Estado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para estadísticas */}
      {showEstadisticasModal && estadisticas && (
        <div className="modal-overlay">
          <div className="modal-content modal-xl">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-chart-bar me-2"></i>
                Estadísticas de Cursos
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowEstadisticasModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-3">
                  <div className="stat-card bg-primary text-white">
                    <h4>{estadisticas.total_cursos}</h4>
                    <p>Total Cursos</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-success text-white">
                    <h4>{estadisticas.activos}</h4>
                    <p>Cursos Activos</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-info text-white">
                    <h4>{estadisticas.total_inscripciones}</h4>
                    <p>Total Inscripciones</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card bg-warning text-white">
                    <h4>{formatMoneda(estadisticas.ingresos_totales)}</h4>
                    <p>Ingresos Totales</p>
                  </div>
                </div>
              </div>
              
              <div className="row mt-4">
                <div className="col-md-6">
                  <h5>Distribución por Estado</h5>
                  <ul className="list-group">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      Planificados
                      <span className="badge bg-info rounded-pill">{estadisticas.planificados}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      Activos
                      <span className="badge bg-success rounded-pill">{estadisticas.activos}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      Finalizados
                      <span className="badge bg-secondary rounded-pill">{estadisticas.finalizados}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      Cancelados
                      <span className="badge bg-danger rounded-pill">{estadisticas.cancelados}</span>
                    </li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h5>Cursos con Más Inscritos</h5>
                  {estadisticas.cursos_mas_inscritos.length === 0 ? (
                    <p className="text-muted">No hay datos</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Curso</th>
                            <th>Inscritos</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estadisticas.cursos_mas_inscritos.map((curso) => (
                            <tr key={curso.id_curso}>
                              <td>{curso.nombre}</td>
                              <td>
                                <span className="badge bg-primary">
                                  {curso.usuarios_count}
                                </span>
                              </td>
                              <td>
                                <span className={`badge estado-badge estado-${curso.estado}`}>
                                  {curso.estado}
                                </span>
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
                onClick={() => window.print()}
              >
                <i className="fas fa-print me-1"></i> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cursos;