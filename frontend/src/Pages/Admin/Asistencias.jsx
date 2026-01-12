import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/asistencia.css';

const API_URL = 'http://localhost:8000/api';

const Asistencias = () => {
  // Estados principales
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showMultiplesModal, setShowMultiplesModal] = useState(false);
  const [showReporteModal, setShowReporteModal] = useState(false);
  const [showResumenModal, setShowResumenModal] = useState(false);
  
  // Estados para datos
  const [currentAsistencia, setCurrentAsistencia] = useState(null);
  const [deportistas, setDeportistas] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [resumenActividad, setResumenActividad] = useState(null);
  const [estadisticasDeportista, setEstadisticasDeportista] = useState(null);
  const [reporteData, setReporteData] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterDeportista, setFilterDeportista] = useState('');
  const [filterActividad, setFilterActividad] = useState('');
  const [fechaInicioFilter, setFechaInicioFilter] = useState('');
  const [fechaFinFilter, setFechaFinFilter] = useState('');
  const [fechaFilter, setFechaFilter] = useState('');
  
  // Estados para múltiples asistencias
  const [asistenciasMultiples, setAsistenciasMultiples] = useState([]);
  const [actividadMultiples, setActividadMultiples] = useState('');
  const [fechaMultiples, setFechaMultiples] = useState('');
  
  // Estados para reporte
  const [reporteFechaInicio, setReporteFechaInicio] = useState('');
  const [reporteFechaFin, setReporteFechaFin] = useState('');
  const [reporteDeportista, setReporteDeportista] = useState('');
  const [reporteActividad, setReporteActividad] = useState('');
  
  // Form state para nueva/editar asistencia
  const [formData, setFormData] = useState({
    id_deportista: '',
    id_actividad: '',
    fecha: '',
    hora_llegada: '',
    estado: 'presente',
    observaciones: ''
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
    fetchAsistencias();
    fetchDatosComplementarios();
  }, []);

  // Cargar todas las asistencias
  const fetchAsistencias = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/asistencias`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setAsistencias(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar asistencias:', err);
      setError('Error al cargar asistencias: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos complementarios
  const fetchDatosComplementarios = async () => {
    try {
      const [deportistasRes, actividadesRes] = await Promise.all([
        axios.get(`${API_URL}/deportistas`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/actividades`, { headers: getAuthHeaders() })
      ]);

      if (deportistasRes.data.success) setDeportistas(deportistasRes.data.data);
      if (actividadesRes.data.success) setActividades(actividadesRes.data.data);
    } catch (err) {
      console.error('Error al cargar datos complementarios:', err);
    }
  };

  // Inicializar múltiples asistencias
  const inicializarMultiplesAsistencias = () => {
    const nuevasAsistencias = deportistas.map(deportista => ({
      id_deportista: deportista.id_deportista,
      nombre: `${deportista.nombres} ${deportista.apellidos}`,
      estado: 'presente',
      hora_llegada: '',
      observaciones: ''
    }));
    setAsistenciasMultiples(nuevasAsistencias);
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      fetchAsistencias();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/asistencias/buscar`, {
        params: { busqueda: searchTerm },
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setAsistencias(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar asistencias: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar asistencias
  const filtrarAsistencias = async () => {
    try {
      setLoading(true);
      
      let url = `${API_URL}/asistencias`;
      let params = {};
      let usarFiltroEspecifico = false;

      if (fechaFilter) {
        // Filtrar por fecha específica
        url = `${API_URL}/asistencias/por-fecha/${fechaFilter}`;
        usarFiltroEspecifico = true;
      } else if (fechaInicioFilter && fechaFinFilter) {
        // Filtrar por rango de fechas
        url = `${API_URL}/asistencias/por-rango-fechas`;
        params = {
          fecha_inicio: fechaInicioFilter,
          fecha_fin: fechaFinFilter
        };
        usarFiltroEspecifico = true;
      } else if (filterDeportista) {
        // Filtrar por deportista
        url = `${API_URL}/asistencias/por-deportista/${filterDeportista}`;
        params = {};
        if (filterEstado) params.estado = filterEstado;
        if (fechaInicioFilter && fechaFinFilter) {
          params.fecha_inicio = fechaInicioFilter;
          params.fecha_fin = fechaFinFilter;
        }
        usarFiltroEspecifico = true;
      } else if (filterActividad) {
        // Filtrar por actividad
        url = `${API_URL}/asistencias/por-actividad/${filterActividad}`;
        usarFiltroEspecifico = true;
      } else if (filterEstado) {
        // Filtrar por estado
        url = `${API_URL}/asistencias/por-estado/${filterEstado}`;
        params = {};
        if (fechaInicioFilter && fechaFinFilter) {
          params.fecha_inicio = fechaInicioFilter;
          params.fecha_fin = fechaFinFilter;
        }
        usarFiltroEspecifico = true;
      }

      if (usarFiltroEspecifico) {
        const response = await axios.get(url, {
          params,
          headers: getAuthHeaders()
        });
        
        if (response.data.success) {
          setAsistencias(response.data.data);
        }
      } else {
        // Filtro manual en el frontend
        let asistenciasFiltradas = [...asistencias];
        
        if (filterEstado) {
          asistenciasFiltradas = asistenciasFiltradas.filter(a => a.estado === filterEstado);
        }
        
        if (filterDeportista) {
          asistenciasFiltradas = asistenciasFiltradas.filter(a => a.id_deportista == filterDeportista);
        }
        
        if (filterActividad) {
          asistenciasFiltradas = asistenciasFiltradas.filter(a => a.id_actividad == filterActividad);
        }
        
        setAsistencias(asistenciasFiltradas);
      }
    } catch (err) {
      console.error('Error al filtrar:', err);
      setError('Error al filtrar asistencias: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    setFilterDeportista('');
    setFilterActividad('');
    setFechaInicioFilter('');
    setFechaFinFilter('');
    setFechaFilter('');
    fetchAsistencias();
  };

  // Crear asistencia
  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API_URL}/asistencias`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchAsistencias();
        setSuccessMessage('Asistencia registrada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear asistencia:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else if (err.response?.status === 409) {
        alert(err.response.data.message);
      } else {
        setError('Error al crear asistencia: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar asistencia
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentAsistencia) return;

    try {
      const response = await axios.put(`${API_URL}/asistencias/${currentAsistencia.id_asistencia}`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchAsistencias();
        setSuccessMessage('Asistencia actualizada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar asistencia:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else if (err.response?.status === 409) {
        alert(err.response.data.message);
      } else {
        setError('Error al actualizar asistencia: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar asistencia
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este registro de asistencia?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/asistencias/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchAsistencias();
        setSuccessMessage('Asistencia eliminada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar asistencia:', err);
      setError('Error al eliminar asistencia: ' + (err.response?.data?.message || err.message));
    }
  };

  // Registrar múltiples asistencias
  const handleMultiplesAsistencias = async (e) => {
    e.preventDefault();
    
    if (!actividadMultiples || !fechaMultiples) {
      alert('Debe seleccionar una actividad y fecha');
      return;
    }

    const asistenciasFiltradas = asistenciasMultiples.filter(a => a.estado !== '');
    
    if (asistenciasFiltradas.length === 0) {
      alert('Debe registrar al menos una asistencia');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/asistencias/registrar-multiples/${actividadMultiples}`, {
        asistencias: asistenciasFiltradas,
        fecha: fechaMultiples
      }, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowMultiplesModal(false);
        setActividadMultiples('');
        setFechaMultiples('');
        setAsistenciasMultiples([]);
        fetchAsistencias();
        setSuccessMessage(`Asistencias registradas exitosamente: ${response.data.data.total_registros} registros`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al registrar múltiples asistencias:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al registrar asistencias: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Generar reporte
  const handleGenerarReporte = async (e) => {
    e.preventDefault();
    
    if (!reporteFechaInicio || !reporteFechaFin) {
      alert('Debe especificar un rango de fechas');
      return;
    }

    try {
      const params = {
        fecha_inicio: reporteFechaInicio,
        fecha_fin: reporteFechaFin
      };

      if (reporteDeportista) params.id_deportista = reporteDeportista;
      if (reporteActividad) params.id_actividad = reporteActividad;

      const response = await axios.get(`${API_URL}/asistencias/reporte`, {
        params,
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setReporteData(response.data.data);
        setShowReporteModal(true);
      }
    } catch (err) {
      console.error('Error al generar reporte:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al generar reporte: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Ver resumen de actividad
  const handleVerResumen = async (idActividad) => {
    try {
      const response = await axios.get(`${API_URL}/asistencias/resumen-actividad/${idActividad}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setResumenActividad(response.data.data);
        setShowResumenModal(true);
      }
    } catch (err) {
      console.error('Error al obtener resumen:', err);
      setError('Error al obtener resumen: ' + (err.response?.data?.message || err.message));
    }
  };

  // Ver estadísticas de deportista
  const handleVerEstadisticas = async (idDeportista) => {
    try {
      const response = await axios.get(`${API_URL}/asistencias/estadisticas-deportista/${idDeportista}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setEstadisticasDeportista(response.data.data);
        alert(`Estadísticas de asistencia:\n\nPresentes: ${response.data.data.presentes}\nAusentes: ${response.data.data.ausentes}\nPorcentaje: ${response.data.data.porcentaje_asistencia}%`);
      }
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      setError('Error al obtener estadísticas: ' + (err.response?.data?.message || err.message));
    }
  };

  // Editar asistencia
  const handleEdit = (asistencia) => {
    setCurrentAsistencia(asistencia);
    setFormData({
      id_deportista: asistencia.id_deportista,
      id_actividad: asistencia.id_actividad,
      fecha: asistencia.fecha.split('T')[0],
      hora_llegada: asistencia.hora_llegada || '',
      estado: asistencia.estado,
      observaciones: asistencia.observaciones || ''
    });
    setShowEditModal(true);
  };

  // Ver detalles
  const handleViewDetails = (asistencia) => {
    setCurrentAsistencia(asistencia);
    setShowDetallesModal(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      id_deportista: '',
      id_actividad: '',
      fecha: '',
      hora_llegada: '',
      estado: 'presente',
      observaciones: ''
    });
    setCurrentAsistencia(null);
  };

  // Actualizar múltiples asistencias
  const updateMultipleAsistencia = (index, field, value) => {
    const nuevasAsistencias = [...asistenciasMultiples];
    nuevasAsistencias[index][field] = value;
    setAsistenciasMultiples(nuevasAsistencias);
  };

  // Obtener asistencias filtradas
  const getFilteredAsistencias = () => {
    let filtered = asistencias;
    
    if (filterEstado) {
      filtered = filtered.filter(a => a.estado === filterEstado);
    }
    
    if (filterDeportista) {
      filtered = filtered.filter(a => a.id_deportista == filterDeportista);
    }
    
    if (filterActividad) {
      filtered = filtered.filter(a => a.id_actividad == filterActividad);
    }
    
    return filtered;
  };

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const total = asistencias.length;
    const presentes = asistencias.filter(a => a.estado === 'presente').length;
    const ausentes = asistencias.filter(a => a.estado === 'ausente').length;
    const justificados = asistencias.filter(a => a.estado === 'justificado').length;
    const tardanzas = asistencias.filter(a => a.estado === 'tardanza').length;
    
    const porcentajeAsistencia = total > 0 ? 
      ((presentes + tardanzas) / total * 100).toFixed(2) : 0;
    
    return { total, presentes, ausentes, justificados, tardanzas, porcentajeAsistencia };
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

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  const estadisticas = calcularEstadisticas();

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
                <i className="fas fa-clipboard-check me-2"></i>
                Gestión de Asistencias
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
                  className="btn btn-info me-2"
                  onClick={() => setShowMultiplesModal(true)}
                  disabled={loading}
                >
                  <i className="fas fa-users"></i> Múltiples
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowModal(true)}
                  disabled={loading}
                >
                  <i className="fas fa-plus"></i> Nueva Asistencia
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
                        placeholder="Deportista, actividad, observaciones..."
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
                      <option value="presente">Presente</option>
                      <option value="ausente">Ausente</option>
                      <option value="justificado">Justificado</option>
                      <option value="tardanza">Tardanza</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Deportista</label>
                    <select 
                      className="form-select"
                      value={filterDeportista}
                      onChange={(e) => setFilterDeportista(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {deportistas.map(deportista => (
                        <option key={deportista.id_deportista} value={deportista.id_deportista}>
                          {deportista.nombres} {deportista.apellidos}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Actividad</label>
                    <select 
                      className="form-select"
                      value={filterActividad}
                      onChange={(e) => setFilterActividad(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {actividades.map(actividad => (
                        <option key={actividad.id_actividad} value={actividad.id_actividad}>
                          {actividad.nombre_actividad}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Fecha Específica</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaFilter}
                      onChange={(e) => setFechaFilter(e.target.value)}
                    />
                  </div>
                  
                  <div className="col-md-1">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={filtrarAsistencias}
                      disabled={loading}
                      title="Aplicar filtros"
                    >
                      <i className="fas fa-filter"></i>
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
                  <div className="col-md-6">
                    <label className="form-label">Reporte</label>
                    <div className="d-flex gap-2">
                      <input
                        type="date"
                        className="form-control"
                        placeholder="Fecha inicio"
                        value={reporteFechaInicio}
                        onChange={(e) => setReporteFechaInicio(e.target.value)}
                      />
                      <input
                        type="date"
                        className="form-control"
                        placeholder="Fecha fin"
                        value={reporteFechaFin}
                        onChange={(e) => setReporteFechaFin(e.target.value)}
                      />
                      <button 
                        className="btn btn-warning"
                        onClick={handleGenerarReporte}
                        disabled={loading}
                      >
                        <i className="fas fa-chart-bar"></i> Reporte
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="stats-section mb-4">
                <div className="row g-3">
                  <div className="col-md-2">
                    <div className="stat-card">
                      <h4>{estadisticas.total}</h4>
                      <p>Total Registros</p>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="stat-card">
                      <h4>{estadisticas.presentes}</h4>
                      <p>Presentes</p>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="stat-card">
                      <h4>{estadisticas.ausentes}</h4>
                      <p>Ausentes</p>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="stat-card">
                      <h4>{estadisticas.tardanzas}</h4>
                      <p>Tardanzas</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="stat-card bg-primary text-white">
                      <h4>{estadisticas.porcentajeAsistencia}%</h4>
                      <p>Porcentaje de Asistencia</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de asistencias */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando asistencias...</p>
                </div>
              ) : getFilteredAsistencias().length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                  <h4>No hay asistencias registradas</h4>
                  <p>Registra tu primera asistencia usando el botón "Nueva Asistencia"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Fecha</th>
                        <th>Deportista</th>
                        <th>Actividad</th>
                        <th>Hora Llegada</th>
                        <th>Estado</th>
                        <th>Observaciones</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredAsistencias().map((asistencia) => (
                        <tr key={asistencia.id_asistencia}>
                          <td>
                            <strong>{formatFecha(asistencia.fecha)}</strong>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {asistencia.deportista.foto ? (
                                <img 
                                  src={`${API_URL}/storage/${asistencia.deportista.foto}`} 
                                  alt={asistencia.deportista.nombres}
                                  className="deportista-foto me-2"
                                />
                              ) : (
                                <div className="deportista-foto-placeholder me-2">
                                  <i className="fas fa-user"></i>
                                </div>
                              )}
                              <div>
                                <strong>{asistencia.deportista.nombres} {asistencia.deportista.apellidos}</strong>
                                <div className="text-muted small">
                                  {asistencia.deportista.categoria?.nombre || 'Sin categoría'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{asistencia.actividad?.nombre_actividad}</strong>
                            <div className="text-muted small">
                              {asistencia.actividad?.tipo}
                            </div>
                          </td>
                          <td>
                            {asistencia.hora_llegada || (
                              <span className="text-muted">No registrada</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${asistencia.estado}`}>
                              {asistencia.estado}
                            </span>
                          </td>
                          <td>
                            {asistencia.observaciones ? (
                              <span className="observacion-text" title={asistencia.observaciones}>
                                {asistencia.observaciones.length > 50 
                                  ? asistencia.observaciones.substring(0, 50) + '...'
                                  : asistencia.observaciones}
                              </span>
                            ) : (
                              <span className="text-muted">Sin observaciones</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetails(asistencia)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEdit(asistencia)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleVerResumen(asistencia.id_actividad)}
                                title="Ver resumen actividad"
                              >
                                <i className="fas fa-chart-pie"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleVerEstadisticas(asistencia.id_deportista)}
                                title="Estadísticas deportista"
                              >
                                <i className="fas fa-chart-line"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(asistencia.id_asistencia)}
                                title="Eliminar"
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

      {/* Modal para crear asistencia */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nueva Asistencia
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
                      <label className="form-label">Deportista *</label>
                      <select
                        className="form-control"
                        value={formData.id_deportista}
                        onChange={(e) => setFormData({...formData, id_deportista: e.target.value})}
                        required
                      >
                        <option value="">Seleccione deportista...</option>
                        {deportistas.map(deportista => (
                          <option key={deportista.id_deportista} value={deportista.id_deportista}>
                            {deportista.nombres} {deportista.apellidos} ({deportista.categoria?.nombre})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Actividad *</label>
                      <select
                        className="form-control"
                        value={formData.id_actividad}
                        onChange={(e) => setFormData({...formData, id_actividad: e.target.value})}
                        required
                      >
                        <option value="">Seleccione actividad...</option>
                        {actividades.map(actividad => (
                          <option key={actividad.id_actividad} value={actividad.id_actividad}>
                            {actividad.nombre_actividad} ({new Date(actividad.fecha).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
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
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Hora Llegada</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.hora_llegada}
                        onChange={(e) => setFormData({...formData, hora_llegada: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Estado *</label>
                  <div className="estado-options">
                    {['presente', 'ausente', 'justificado', 'tardanza'].map((estado) => (
                      <div key={estado} className="form-check form-check-inline">
                        <input
                          type="radio"
                          className="form-check-input"
                          id={`estado-${estado}`}
                          name="estado"
                          value={estado}
                          checked={formData.estado === estado}
                          onChange={(e) => setFormData({...formData, estado: e.target.value})}
                          required
                        />
                        <label className="form-check-label" htmlFor={`estado-${estado}`}>
                          <span className={`badge estado-badge estado-${estado}`}>
                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                          </span>
                        </label>
                      </div>
                    ))}
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
                  Registrar Asistencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar asistencia */}
      {showEditModal && currentAsistencia && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-warning text-white">
              <h3>
                <i className="fas fa-edit me-2"></i>
                Editar Asistencia
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
                  Editando asistencia del {formatFecha(currentAsistencia.fecha)} para {currentAsistencia.deportista.nombres}
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Deportista *</label>
                      <select
                        className="form-control"
                        value={formData.id_deportista}
                        onChange={(e) => setFormData({...formData, id_deportista: e.target.value})}
                        required
                      >
                        {deportistas.map(deportista => (
                          <option key={deportista.id_deportista} value={deportista.id_deportista}>
                            {deportista.nombres} {deportista.apellidos}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Actividad *</label>
                      <select
                        className="form-control"
                        value={formData.id_actividad}
                        onChange={(e) => setFormData({...formData, id_actividad: e.target.value})}
                        required
                      >
                        {actividades.map(actividad => (
                          <option key={actividad.id_actividad} value={actividad.id_actividad}>
                            {actividad.nombre_actividad}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
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
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Hora Llegada</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.hora_llegada}
                        onChange={(e) => setFormData({...formData, hora_llegada: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Estado *</label>
                  <select
                    className="form-control"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    required
                  >
                    <option value="presente">Presente</option>
                    <option value="ausente">Ausente</option>
                    <option value="justificado">Justificado</option>
                    <option value="tardanza">Tardanza</option>
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    rows="3"
                  />
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
                  Actualizar Asistencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para múltiples asistencias */}
      {showMultiplesModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-xl">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-users me-2"></i>
                Registrar Múltiples Asistencias
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowMultiplesModal(false);
                  setAsistenciasMultiples([]);
                }}
              ></button>
            </div>
            <form onSubmit={handleMultiplesAsistencias}>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Actividad *</label>
                      <select
                        className="form-control"
                        value={actividadMultiples}
                        onChange={(e) => {
                          setActividadMultiples(e.target.value);
                          const actividadSeleccionada = actividades.find(a => a.id_actividad == e.target.value);
                          if (actividadSeleccionada) {
                            setFechaMultiples(actividadSeleccionada.fecha.split('T')[0]);
                          }
                        }}
                        required
                      >
                        <option value="">Seleccione actividad...</option>
                        {actividades.map(actividad => (
                          <option key={actividad.id_actividad} value={actividad.id_actividad}>
                            {actividad.nombre_actividad} ({new Date(actividad.fecha).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Fecha *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fechaMultiples}
                        onChange={(e) => setFechaMultiples(e.target.value)}
                        required
                        readOnly={!!actividadMultiples}
                      />
                    </div>
                  </div>
                </div>

                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  {asistenciasMultiples.length} deportistas listados. Marque la asistencia de cada uno.
                </div>

                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Deportista</th>
                        <th>Estado</th>
                        <th>Hora Llegada</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistenciasMultiples.map((asistencia, index) => (
                        <tr key={asistencia.id_deportista}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="deportista-foto-placeholder me-2">
                                <i className="fas fa-user"></i>
                              </div>
                              <div>
                                <strong>{asistencia.nombre}</strong>
                              </div>
                            </div>
                          </td>
                          <td>
                            <select
                              className="form-control form-control-sm"
                              value={asistencia.estado}
                              onChange={(e) => updateMultipleAsistencia(index, 'estado', e.target.value)}
                            >
                              <option value="presente">Presente</option>
                              <option value="ausente">Ausente</option>
                              <option value="justificado">Justificado</option>
                              <option value="tardanza">Tardanza</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={asistencia.hora_llegada}
                              onChange={(e) => updateMultipleAsistencia(index, 'hora_llegada', e.target.value)}
                              disabled={asistencia.estado !== 'presente' && asistencia.estado !== 'tardanza'}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={asistencia.observaciones}
                              onChange={(e) => updateMultipleAsistencia(index, 'observaciones', e.target.value)}
                              placeholder="Observaciones..."
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={inicializarMultiplesAsistencias}
                >
                  <i className="fas fa-redo me-1"></i> Reiniciar
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowMultiplesModal(false);
                    setAsistenciasMultiples([]);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!actividadMultiples || !fechaMultiples}
                >
                  <i className="fas fa-save me-1"></i> Registrar Todas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para reporte */}
      {showReporteModal && reporteData && (
        <div className="modal-overlay">
          <div className="modal-content modal-xl">
            <div className="modal-header bg-warning text-white">
              <h3>
                <i className="fas fa-chart-bar me-2"></i>
                Reporte de Asistencias
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowReporteModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Reporte del {new Date(reporteData.periodo.fecha_inicio).toLocaleDateString()} al {new Date(reporteData.periodo.fecha_fin).toLocaleDateString()}
                <br />
                Total de registros: <strong>{reporteData.total_registros}</strong>
              </div>

              {Object.keys(reporteData.reporte).length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-file-excel fa-3x text-muted mb-3"></i>
                  <h4>No hay datos para mostrar</h4>
                  <p>No se encontraron asistencias en el período seleccionado</p>
                </div>
              ) : (
                Object.entries(reporteData.reporte).map(([fecha, actividades]) => (
                  <div key={fecha} className="mb-4">
                    <h5 className="border-bottom pb-2">
                      <i className="fas fa-calendar-day me-2"></i>
                      {formatFecha(fecha)}
                    </h5>
                    
                    {Object.entries(actividades).map(([idActividad, data]) => (
                      <div key={idActividad} className="card mb-3">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">
                            <i className="fas fa-running me-2"></i>
                            {data.actividad}
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Deportista</th>
                                  <th>Estado</th>
                                  <th>Hora Llegada</th>
                                  <th>Observaciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.asistencias.map((asistencia, idx) => (
                                  <tr key={idx}>
                                    <td>{asistencia.deportista}</td>
                                    <td>
                                      <span className={`badge estado-badge estado-${asistencia.estado}`}>
                                        {asistencia.estado}
                                      </span>
                                    </td>
                                    <td>{asistencia.hora_llegada || '-'}</td>
                                    <td>{asistencia.observaciones || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowReporteModal(false)}
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

      {/* Modal para ver detalles */}
      {showDetallesModal && currentAsistencia && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-info-circle me-2"></i>
                Detalles de la Asistencia
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDetallesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <h5>Información de la Asistencia</h5>
                  <p><strong>ID:</strong> {currentAsistencia.id_asistencia}</p>
                  <p><strong>Fecha:</strong> {formatFecha(currentAsistencia.fecha)}</p>
                  <p><strong>Hora Llegada:</strong> {currentAsistencia.hora_llegada || 'No registrada'}</p>
                  <p><strong>Estado:</strong> 
                    <span className={`badge estado-badge estado-${currentAsistencia.estado} ms-2`}>
                      {currentAsistencia.estado}
                    </span>
                  </p>
                  <p><strong>Observaciones:</strong> {currentAsistencia.observaciones || 'Ninguna'}</p>
                </div>
                <div className="col-md-6">
                  <h5>Deportista</h5>
                  <p><strong>Nombre:</strong> {currentAsistencia.deportista.nombres} {currentAsistencia.deportista.apellidos}</p>
                  <p><strong>Documento:</strong> {currentAsistencia.deportista.tipo_documento}: {currentAsistencia.deportista.numero_documento}</p>
                  <p><strong>Categoría:</strong> {currentAsistencia.deportista.categoria?.nombre || 'N/A'}</p>
                  <p><strong>Teléfono:</strong> {currentAsistencia.deportista.telefono || 'N/A'}</p>
                </div>
              </div>
              
              <div className="row mt-3">
                <div className="col-12">
                  <h5>Actividad</h5>
                  <div className="card">
                    <div className="card-body">
                      <p><strong>Nombre:</strong> {currentAsistencia.actividad?.nombre_actividad}</p>
                      <p><strong>Tipo:</strong> {currentAsistencia.actividad?.tipo}</p>
                      <p><strong>Descripción:</strong> {currentAsistencia.actividad?.descripcion || 'N/A'}</p>
                      <p><strong>Horario:</strong> {currentAsistencia.actividad?.hora_inicio} - {currentAsistencia.actividad?.hora_fin}</p>
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
            </div>
          </div>
        </div>
      )}

      {/* Modal para resumen de actividad */}
      {showResumenModal && resumenActividad && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-chart-pie me-2"></i>
                Resumen de Actividad
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowResumenModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <h4>{resumenActividad.actividad}</h4>
              <p className="text-muted">Fecha: {new Date(resumenActividad.fecha).toLocaleDateString()}</p>
              
              <div className="row mt-4">
                <div className="col-md-3">
                  <div className="stat-card text-center">
                    <h4>{resumenActividad.total_registros}</h4>
                    <p>Total</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card text-center bg-success text-white">
                    <h4>{resumenActividad.presentes}</h4>
                    <p>Presentes</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card text-center bg-danger text-white">
                    <h4>{resumenActividad.ausentes}</h4>
                    <p>Ausentes</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card text-center bg-warning text-white">
                    <h4>{resumenActividad.tardanzas}</h4>
                    <p>Tardanzas</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h5>Porcentaje de Asistencia</h5>
                <div className="progress" style={{ height: '30px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar" 
                    style={{ width: `${resumenActividad.porcentaje_asistencia}%` }}
                    aria-valuenow={resumenActividad.porcentaje_asistencia}
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  >
                    {resumenActividad.porcentaje_asistencia}%
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h5>Distribución</h5>
                <ul className="list-group">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Presentes
                    <span className="badge bg-success rounded-pill">{resumenActividad.presentes}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Ausentes
                    <span className="badge bg-danger rounded-pill">{resumenActividad.ausentes}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Justificados
                    <span className="badge bg-info rounded-pill">{resumenActividad.justificados}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Tardanzas
                    <span className="badge bg-warning rounded-pill">{resumenActividad.tardanzas}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowResumenModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asistencias;