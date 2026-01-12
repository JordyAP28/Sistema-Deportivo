import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/escenarios.css';

const API_URL = 'http://localhost:8000/api';

// Función helper para parsear servicios de forma segura
const parseServicios = (serviciosString) => {
  try {
    if (!serviciosString || serviciosString.trim() === '') {
      return [];
    }
    // Limpiar posibles caracteres problemáticos
    const cleaned = serviciosString.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing servicios JSON:', error, 'String:', serviciosString);
    // Si no es JSON válido, intenta dividir por comas
    if (serviciosString && typeof serviciosString === 'string' && serviciosString.includes(',')) {
      return serviciosString.split(',').map(s => s.trim()).filter(s => s);
    }
    // Si es un array ya, devuélvelo directamente
    if (Array.isArray(serviciosString)) {
      return serviciosString;
    }
    return [serviciosString];
  }
};

const Escenarios = () => {
  // Estados principales
  const [escenarios, setEscenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showActividadesModal, setShowActividadesModal] = useState(false);
  const [showPartidosModal, setShowPartidosModal] = useState(false);
  const [showDisponibilidadModal, setShowDisponibilidadModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [showCambiarEstadoModal, setShowCambiarEstadoModal] = useState(false);
  const [showConfirmarEliminarModal, setShowConfirmarEliminarModal] = useState(false);
  
  // Estados para datos relacionados
  const [currentEscenario, setCurrentEscenario] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [disponibilidadInfo, setDisponibilidadInfo] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCapacidadMin, setFilterCapacidadMin] = useState('');
  const [filterCapacidadMax, setFilterCapacidadMax] = useState('');
  const [filterServicios, setFilterServicios] = useState('');
  
  // Estados para formularios
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    tipo: '',
    capacidad: '',
    descripcion: '',
    direccion: '',
    imagen: null,
    servicios: [],
    estado: 'disponible'
  });

  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState('');
  const [servicioInput, setServicioInput] = useState('');
  
  // Estados para disponibilidad
  const [disponibilidadForm, setDisponibilidadForm] = useState({
    fecha: '',
    hora_inicio: '09:00',
    hora_fin: '10:00'
  });

  // Estados para actividades/partidos
  const [filtroFechas, setFiltroFechas] = useState({
    fecha_inicio: '',
    fecha_fin: ''
  });

  // Form state para cambiar estado
  const [cambioEstadoForm, setCambioEstadoForm] = useState({
    estado: 'disponible',
    observaciones: ''
  });

  // Tipos de escenarios disponibles
  const tiposEscenarios = [
    'Fútbol', 'Baloncesto', 'Tenis', 'Voleibol', 'Natación', 
    'Atletismo', 'Gimnasio', 'Polideportivo', 'Otro'
  ];

  // Servicios disponibles
  const serviciosDisponibles = [
    'Baños', 'Duchas', 'Vestidores', 'Estacionamiento', 'Cafetería',
    'Iluminación nocturna', 'Gradas', 'Sistema de sonido', 'Primeros auxilios',
    'Wi-Fi', 'Alquiler de equipo', 'Seguridad'
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
    if (!getToken()) {
      window.location.href = '/login';
      return;
    }
    fetchEscenarios();
  }, []);

  // Cargar todos los escenarios
  const fetchEscenarios = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/escenarios`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        // Debug: verifica la estructura de servicios
        console.log('Escenarios recibidos:', response.data.data.map(e => ({
          id: e.id_escenario,
          nombre: e.nombre,
          servicios: e.servicios,
          serviciosType: typeof e.servicios,
          serviciosParsed: parseServicios(e.servicios)
        })));
        setEscenarios(response.data.data);
      } else {
        setError('Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('Error al cargar escenarios:', err);
      setError('Error al cargar escenarios: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar actividades de un escenario
  const fetchActividades = async (escenarioId) => {
    try {
      const params = {};
      if (filtroFechas.fecha_inicio && filtroFechas.fecha_fin) {
        params.fecha_inicio = filtroFechas.fecha_inicio;
        params.fecha_fin = filtroFechas.fecha_fin;
      }
      
      const response = await axios.get(`${API_URL}/escenarios/${escenarioId}/actividades`, {
        params,
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setActividades(response.data.data.actividades);
      }
    } catch (err) {
      console.error('Error al cargar actividades:', err);
      setError('Error al cargar actividades: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cargar partidos de un escenario
  const fetchPartidos = async (escenarioId) => {
    try {
      const params = {};
      if (filtroFechas.fecha_inicio && filtroFechas.fecha_fin) {
        params.fecha_inicio = filtroFechas.fecha_inicio;
        params.fecha_fin = filtroFechas.fecha_fin;
      }
      
      const response = await axios.get(`${API_URL}/escenarios/${escenarioId}/partidos`, {
        params,
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setPartidos(response.data.data.partidos);
      }
    } catch (err) {
      console.error('Error al cargar partidos:', err);
      setError('Error al cargar partidos: ' + (err.response?.data?.message || err.message));
    }
  };

  // Verificar disponibilidad
  const verificarDisponibilidad = async (escenarioId) => {
    try {
      const response = await axios.get(`${API_URL}/escenarios/${escenarioId}/disponibilidad`, {
        params: disponibilidadForm,
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setDisponibilidadInfo(response.data.data);
      }
    } catch (err) {
      console.error('Error al verificar disponibilidad:', err);
      if (err.response?.status === 400) {
        setDisponibilidadInfo({
          disponible: false,
          mensaje: err.response.data.message
        });
      } else {
        setError('Error al verificar disponibilidad: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Cargar estadísticas
  const fetchEstadisticas = async (escenarioId) => {
    try {
      const params = {};
      if (filtroFechas.fecha_inicio && filtroFechas.fecha_fin) {
        params.fecha_inicio = filtroFechas.fecha_inicio;
        params.fecha_fin = filtroFechas.fecha_fin;
      }
      
      const response = await axios.get(`${API_URL}/escenarios/${escenarioId}/estadisticas-uso`, {
        params,
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

  // Buscar escenarios
  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/escenarios/buscar`, {
        busqueda: searchTerm
      }, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setEscenarios(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar escenarios: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar escenarios localmente
  const filtrarEscenarios = () => {
    let filtered = [...escenarios];
    
    if (filterTipo) {
      filtered = filtered.filter(e => e.tipo === filterTipo);
    }
    
    if (filterEstado) {
      filtered = filtered.filter(e => e.estado === filterEstado);
    }
    
    if (filterCapacidadMin) {
      filtered = filtered.filter(e => e.capacidad >= parseInt(filterCapacidadMin));
    }
    
    if (filterCapacidadMax) {
      filtered = filtered.filter(e => e.capacidad <= parseInt(filterCapacidadMax));
    }
    
    if (filterServicios) {
      filtered = filtered.filter(e => {
        const servicios = e.servicios ? parseServicios(e.servicios) : [];
        return servicios.some(s => s.toLowerCase().includes(filterServicios.toLowerCase()));
      });
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.nombre?.toLowerCase().includes(term) ||
        e.direccion?.toLowerCase().includes(term) ||
        e.descripcion?.toLowerCase().includes(term) ||
        e.tipo?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterTipo('');
    setFilterEstado('');
    setFilterCapacidadMin('');
    setFilterCapacidadMax('');
    setFilterServicios('');
    fetchEscenarios();
  };

  // Crear escenario
  const handleCreate = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    
    // Agregar campos del formulario
    Object.keys(formData).forEach(key => {
      if (key === 'servicios') {
        if (formData.servicios.length > 0) {
          formDataToSend.append(key, JSON.stringify(formData.servicios));
        }
      } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Agregar archivo de imagen si existe
    if (imagenFile) {
      formDataToSend.append('imagen', imagenFile);
    }

    try {
      const response = await axios.post(`${API_URL}/escenarios`, formDataToSend, {
        headers: getMultipartHeaders()
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchEscenarios();
        setSuccessMessage('Escenario creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear escenario:', err);
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
        setError('Error al crear escenario: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar escenario
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentEscenario) return;

    const formDataToSend = new FormData();
    
    // Agregar campos del formulario
    Object.keys(formData).forEach(key => {
      if (key === 'servicios') {
        if (formData.servicios.length > 0) {
          formDataToSend.append(key, JSON.stringify(formData.servicios));
        } else {
          formDataToSend.append(key, JSON.stringify([]));
        }
      } else if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Agregar archivo de imagen si existe
    if (imagenFile) {
      formDataToSend.append('imagen', imagenFile);
    }

    try {
      const response = await axios.put(`${API_URL}/escenarios/${currentEscenario.id_escenario}`, formDataToSend, {
        headers: getMultipartHeaders()
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchEscenarios();
        setSuccessMessage('Escenario actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar escenario:', err);
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
        setError('Error al actualizar escenario: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar escenario
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este escenario?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/escenarios/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowConfirmarEliminarModal(false);
        fetchEscenarios();
        setSuccessMessage('Escenario eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar escenario:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al eliminar escenario: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Restaurar escenario
  const handleRestore = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/escenarios/${id}/restore`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchEscenarios();
        setSuccessMessage('Escenario restaurado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al restaurar escenario:', err);
      setError('Error al restaurar escenario: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cambiar estado del escenario
  const cambiarEstadoEscenario = async (e) => {
    e.preventDefault();
    
    if (!currentEscenario) return;

    try {
      const response = await axios.post(
        `${API_URL}/escenarios/${currentEscenario.id_escenario}/cambiar-estado`,
        cambioEstadoForm,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setShowCambiarEstadoModal(false);
        setCambioEstadoForm({
          estado: 'disponible',
          observaciones: ''
        });
        fetchEscenarios();
        setSuccessMessage('Estado del escenario actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
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
        setError('Error al cambiar estado: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Ver detalles
  const handleViewDetails = (escenario) => {
    setCurrentEscenario(escenario);
    setShowDetallesModal(true);
  };

  // Ver actividades
  const handleViewActividades = (escenario) => {
    setCurrentEscenario(escenario);
    fetchActividades(escenario.id_escenario);
    setShowActividadesModal(true);
  };

  // Ver partidos
  const handleViewPartidos = (escenario) => {
    setCurrentEscenario(escenario);
    fetchPartidos(escenario.id_escenario);
    setShowPartidosModal(true);
  };

  // Ver disponibilidad
  const handleViewDisponibilidad = (escenario) => {
    setCurrentEscenario(escenario);
    setDisponibilidadForm({
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: '09:00',
      hora_fin: '10:00'
    });
    setDisponibilidadInfo(null);
    setShowDisponibilidadModal(true);
  };

  // Ver estadísticas
  const handleViewEstadisticas = (escenario) => {
    setCurrentEscenario(escenario);
    setFiltroFechas({
      fecha_inicio: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fecha_fin: new Date().toISOString().split('T')[0]
    });
    fetchEstadisticas(escenario.id_escenario);
    setShowEstadisticasModal(true);
  };

  // Abrir modal para cambiar estado
  const handleOpenCambiarEstado = (escenario) => {
    setCurrentEscenario(escenario);
    setCambioEstadoForm({
      estado: escenario.estado,
      observaciones: ''
    });
    setShowCambiarEstadoModal(true);
  };

  // Abrir modal para confirmar eliminación
  const handleOpenConfirmarEliminar = (escenario) => {
    setCurrentEscenario(escenario);
    setShowConfirmarEliminarModal(true);
  };

  // Editar escenario
  const handleEdit = (escenario) => {
    setCurrentEscenario(escenario);
    
    // Usar parseServicios en lugar de JSON.parse directo
    const servicios = escenario.servicios ? parseServicios(escenario.servicios) : [];
    
    setFormData({
      nombre: escenario.nombre || '',
      slug: escenario.slug || '',
      tipo: escenario.tipo || '',
      capacidad: escenario.capacidad || '',
      descripcion: escenario.descripcion || '',
      direccion: escenario.direccion || '',
      imagen: null,
      servicios: servicios,
      estado: escenario.estado || 'disponible'
    });
    
    setImagenFile(null);
    setImagenPreview(escenario.imagen ? `${API_URL.replace('/api', '')}/storage/${escenario.imagen}` : '');
    setServicioInput('');
    
    setShowEditModal(true);
  };

  // Manejar cambio de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenFile(file);
      
      // Crear preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagenPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setImagenPreview('');
      }
    }
  };

  // Agregar servicio
  const addServicio = () => {
    if (servicioInput.trim() && !formData.servicios.includes(servicioInput.trim())) {
      setFormData({
        ...formData,
        servicios: [...formData.servicios, servicioInput.trim()]
      });
      setServicioInput('');
    }
  };

  // Eliminar servicio
  const removeServicio = (index) => {
    const newServicios = [...formData.servicios];
    newServicios.splice(index, 1);
    setFormData({ ...formData, servicios: newServicios });
  };

  // Resetear formularios
  const resetForm = () => {
    setFormData({
      nombre: '',
      slug: '',
      tipo: '',
      capacidad: '',
      descripcion: '',
      direccion: '',
      imagen: null,
      servicios: [],
      estado: 'disponible'
    });
    setImagenFile(null);
    setImagenPreview('');
    setServicioInput('');
    setCurrentEscenario(null);
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

  // Obtener escenarios filtrados
  const getFilteredEscenarios = () => {
    return filtrarEscenarios();
  };

  // Calcular estadísticas generales
  const calcularEstadisticasGenerales = () => {
    if (escenarios.length === 0) return null;
    
    const total = escenarios.length;
    const disponibles = escenarios.filter(e => e.estado === 'disponible').length;
    const ocupados = escenarios.filter(e => e.estado === 'ocupado').length;
    const mantenimiento = escenarios.filter(e => e.estado === 'mantenimiento').length;
    const cerrados = escenarios.filter(e => e.estado === 'cerrado').length;
    
    // Distribución por tipo
    const tiposDistribucion = escenarios.reduce((acc, e) => {
      const tipo = e.tipo || 'No especificado';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
    
    // Capacidad total
    const capacidadTotal = escenarios.reduce((sum, e) => sum + parseInt(e.capacidad || 0), 0);
    
    // Escenario con mayor capacidad
    const mayorCapacidad = [...escenarios]
      .sort((a, b) => parseInt(b.capacidad) - parseInt(a.capacidad))
      .shift();
    
    return {
      total,
      disponibles,
      ocupados,
      mantenimiento,
      cerrados,
      tiposDistribucion,
      capacidadTotal,
      mayorCapacidad
    };
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  const escenariosFiltrados = getFilteredEscenarios();
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
                <i className="fas fa-landmark me-2"></i>
                Gestión de Escenarios
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
                    setShowModal(true);
                  }}
                  disabled={loading}
                >
                  <i className="fas fa-plus"></i> Nuevo Escenario
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
                        placeholder="Nombre, dirección, tipo..."
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
                      {tiposEscenarios.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
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
                      <option value="disponible">Disponible</option>
                      <option value="ocupado">Ocupado</option>
                      <option value="mantenimiento">Mantenimiento</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Capacidad Mín</label>
                    <input
                      type="number"
                      className="form-control"
                      value={filterCapacidadMin}
                      onChange={(e) => setFilterCapacidadMin(e.target.value)}
                      min="1"
                    />
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Capacidad Máx</label>
                    <input
                      type="number"
                      className="form-control"
                      value={filterCapacidadMax}
                      onChange={(e) => setFilterCapacidadMax(e.target.value)}
                      min="1"
                    />
                  </div>
                  
                  <div className="col-md-1">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={() => {
                        const filtered = filtrarEscenarios();
                        setEscenarios(filtered);
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
                    <label className="form-label">Servicios</label>
                    <select 
                      className="form-select"
                      value={filterServicios}
                      onChange={(e) => setFilterServicios(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {serviciosDisponibles.map((servicio) => (
                        <option key={servicio} value={servicio}>
                          {servicio}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-4">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-info w-100"
                      onClick={() => {
                        // Aquí podrías agregar funcionalidad para ver todos los escenarios disponibles
                        const disponibles = escenarios.filter(e => e.estado === 'disponible');
                        setEscenarios(disponibles);
                      }}
                      disabled={loading}
                    >
                      <i className="fas fa-check-circle"></i> Ver Disponibles
                    </button>
                  </div>
                  
                  <div className="col-md-4">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-success w-100"
                      onClick={() => {
                        alert('Funcionalidad de exportación en desarrollo');
                      }}
                      disabled={loading}
                    >
                      <i className="fas fa-file-excel"></i> Exportar
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
                        <p>Total Escenarios</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-success text-white">
                        <h4>{estadisticasGenerales.disponibles}</h4>
                        <p>Disponibles</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-warning text-white">
                        <h4>{estadisticasGenerales.ocupados}</h4>
                        <p>Ocupados</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-danger text-white">
                        <h4>{estadisticasGenerales.mantenimiento}</h4>
                        <p>Mantenimiento</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-secondary text-white">
                        <h4>{estadisticasGenerales.cerrados}</h4>
                        <p>Cerrados</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-primary text-white">
                        <h4>{estadisticasGenerales.capacidadTotal.toLocaleString()}</h4>
                        <p>Capacidad Total</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de escenarios */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando escenarios...</p>
                </div>
              ) : escenariosFiltrados.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-landmark fa-3x text-muted mb-3"></i>
                  <h4>No hay escenarios registrados</h4>
                  <p>Registra tu primer escenario usando el botón "Nuevo Escenario"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Capacidad</th>
                        <th>Dirección</th>
                        <th>Servicios</th>
                        <th>Estado</th>
                        <th>Actividades</th>
                        <th>Partidos</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {escenariosFiltrados.map((escenario) => (
                        <tr key={`escenario-${escenario.id_escenario}`}>
                          <td>
                            <strong>{escenario.nombre}</strong>
                            {escenario.imagen && (
                              <div className="small text-muted">
                                <i className="fas fa-image"></i> Con imagen
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {escenario.tipo}
                            </span>
                          </td>
                          <td>
                            <strong>{escenario.capacidad?.toLocaleString()}</strong> personas
                          </td>
                          <td>
                            <div className="small">
                              {escenario.direccion}
                            </div>
                          </td>
                          <td>
                            {escenario.servicios ? (
                              <div className="servicios-preview">
                                {parseServicios(escenario.servicios).slice(0, 2).map((servicio, idx) => (
                                  <span key={idx} className="badge bg-light text-dark me-1 mb-1">
                                    {servicio}
                                  </span>
                                ))}
                                {parseServicios(escenario.servicios).length > 2 && (
                                  <span className="badge bg-secondary">
                                    +{parseServicios(escenario.servicios).length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${escenario.estado}`}>
                              {escenario.estado}
                            </span>
                          </td>
                          <td>
                            {escenario.actividadesProgramadas?.length > 0 ? (
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewActividades(escenario)}
                                title={`Ver ${escenario.actividadesProgramadas.length} actividades`}
                              >
                                <i className="fas fa-calendar-alt"></i> {escenario.actividadesProgramadas.length}
                              </button>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td>
                            {escenario.partidos?.length > 0 ? (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleViewPartidos(escenario)}
                                title={`Ver ${escenario.partidos.length} partidos`}
                              >
                                <i className="fas fa-futbol"></i> {escenario.partidos.length}
                              </button>
                            ) : (
                              <span className="text-muted">0</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetails(escenario)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEdit(escenario)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewDisponibilidad(escenario)}
                                title="Ver disponibilidad"
                              >
                                <i className="fas fa-calendar-check"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleViewEstadisticas(escenario)}
                                title="Estadísticas"
                              >
                                <i className="fas fa-chart-bar"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleOpenCambiarEstado(escenario)}
                                title="Cambiar estado"
                              >
                                <i className="fas fa-exchange-alt"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleOpenConfirmarEliminar(escenario)}
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

      {/* MODALES */}

      {/* Modal para crear escenario */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nuevo Escenario
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
                      <label className="form-label">Nombre *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombre}
                        onChange={(e) => {
                          const nombre = e.target.value;
                          setFormData({
                            ...formData,
                            nombre: nombre,
                            slug: nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
                          });
                        }}
                        required
                        placeholder="Ej: Estadio Municipal"
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Slug *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value})}
                        required
                        placeholder="Ej: estadio-municipal"
                      />
                      <small className="text-muted">Identificador único para URLs</small>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Tipo *</label>
                      <select
                        className="form-control"
                        value={formData.tipo}
                        onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                        required
                      >
                        <option value="">Seleccione un tipo</option>
                        {tiposEscenarios.map(tipo => (
                          <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Capacidad *</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          value={formData.capacidad}
                          onChange={(e) => setFormData({
                            ...formData,
                            capacidad: parseInt(e.target.value) || ''
                          })}
                          min="1"
                          required
                        />
                        <span className="input-group-text">personas</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group mb-3">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        rows="3"
                        placeholder="Descripción detallada del escenario..."
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group mb-3">
                      <label className="form-label">Dirección *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.direccion}
                        onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                        required
                        placeholder="Dirección completa del escenario"
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
                        <option value="disponible">Disponible</option>
                        <option value="ocupado">Ocupado</option>
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="cerrado">Cerrado</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Imagen (Opcional)</label>
                      <div className="imagen-upload-container">
                        {imagenPreview ? (
                          <div className="imagen-preview">
                            <img 
                              src={imagenPreview} 
                              alt="Escenario preview" 
                              className="img-fluid mb-2"
                              style={{maxHeight: '150px'}}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                setImagenFile(null);
                                setImagenPreview('');
                              }}
                            >
                              <i className="fas fa-times me-1"></i> Eliminar
                            </button>
                          </div>
                        ) : (
                          <div className="imagen-placeholder">
                            <i className="fas fa-cloud-upload-alt fa-3x mb-3 text-muted"></i>
                            <p className="text-muted">Haz click para subir imagen</p>
                            <p className="text-muted small">Formatos: JPG, PNG, GIF (Max: 2MB)</p>
                          </div>
                        )}
                        <input
                          type="file"
                          className="imagen-input"
                          accept=".jpg,.jpeg,.png,.gif"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Servicios */}
                <div className="form-group mb-3">
                  <label className="form-label">Servicios Disponibles</label>
                  <div className="row">
                    <div className="col-md-8">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={servicioInput}
                          onChange={(e) => setServicioInput(e.target.value)}
                          placeholder="Agregar un servicio..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServicio())}
                        />
                        <button 
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={addServicio}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      <small className="text-muted">
                        Sugerencias: {serviciosDisponibles.slice(0, 4).join(', ')}...
                      </small>
                    </div>
                  </div>
                  
                  {formData.servicios.length > 0 && (
                    <div className="servicios-seleccionados mt-3">
                      <h6>Servicios seleccionados:</h6>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {formData.servicios.map((servicio, index) => (
                          <span key={index} className="badge bg-primary d-flex align-items-center">
                            {servicio}
                            <button
                              type="button"
                              onClick={() => removeServicio(index)}
                              className="btn-close btn-close-white ms-2"
                              style={{fontSize: '10px'}}
                            />
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Los campos marcados con * son obligatorios.
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
                  <i className="fas fa-save me-2"></i> Guardar Escenario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles del escenario */}
      {showDetallesModal && currentEscenario && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-landmark me-2"></i>
                {currentEscenario.nombre}
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
                          <strong>Tipo:</strong> {currentEscenario.tipo}
                        </div>
                        <div className="info-item mb-3">
                          <strong>Capacidad:</strong> {currentEscenario.capacidad?.toLocaleString()} personas
                        </div>
                        <div className="info-item mb-3">
                          <strong>Estado:</strong> 
                          <span className={`badge estado-badge estado-${currentEscenario.estado} ms-2`}>
                            {currentEscenario.estado}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="info-item mb-3">
                          <strong>Slug:</strong> {currentEscenario.slug}
                        </div>
                        <div className="info-item mb-3">
                          <strong>Dirección:</strong> {currentEscenario.direccion}
                        </div>
                        <div className="info-item mb-3">
                          <strong>Registrado:</strong> {formatFecha(currentEscenario.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    {currentEscenario.descripcion && (
                      <div className="info-item mt-3">
                        <strong>Descripción:</strong>
                        <p className="mt-2 p-3 bg-light rounded">{currentEscenario.descripcion}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="col-md-4">
                  {currentEscenario.imagen && (
                    <div className="info-section mb-4">
                      <h5 className="text-primary">
                        <i className="fas fa-image me-2"></i>Imagen
                      </h5>
                      <div className="text-center">
                        <img 
                          src={`${API_URL.replace('/api', '')}/storage/${currentEscenario.imagen}`} 
                          alt={currentEscenario.nombre}
                          className="img-fluid rounded shadow"
                          style={{maxHeight: '200px'}}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {currentEscenario.servicios && (
                <div className="info-section mb-4">
                  <h5 className="text-primary">
                    <i className="fas fa-concierge-bell me-2"></i>Servicios
                  </h5>
                  <div className="d-flex flex-wrap gap-2">
                    {parseServicios(currentEscenario.servicios).map((servicio, index) => (
                      <span key={index} className="badge bg-primary">
                        {servicio}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="row">
                <div className="col-md-6">
                  <div className="info-section mb-4">
                    <h5 className="text-primary">
                      <i className="fas fa-calendar-alt me-2"></i>Actividades Programadas
                    </h5>
                    <div className="text-center">
                      <button
                        className="btn btn-outline-info w-100"
                        onClick={() => {
                          setShowDetallesModal(false);
                          handleViewActividades(currentEscenario);
                        }}
                      >
                        <i className="fas fa-eye me-2"></i> Ver {currentEscenario.actividadesProgramadas?.length || 0} actividades
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="info-section mb-4">
                    <h5 className="text-primary">
                      <i className="fas fa-futbol me-2"></i>Partidos Programados
                    </h5>
                    <div className="text-center">
                      <button
                        className="btn btn-outline-success w-100"
                        onClick={() => {
                          setShowDetallesModal(false);
                          handleViewPartidos(currentEscenario);
                        }}
                      >
                        <i className="fas fa-eye me-2"></i> Ver {currentEscenario.partidos?.length || 0} partidos
                      </button>
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
                  handleEdit(currentEscenario);
                }}
              >
                <i className="fas fa-edit me-2"></i> Editar
              </button>
              <button 
                type="button" 
                className="btn btn-info"
                onClick={() => {
                  setShowDetallesModal(false);
                  handleViewDisponibilidad(currentEscenario);
                }}
              >
                <i className="fas fa-calendar-check me-2"></i> Disponibilidad
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => {
                  setShowDetallesModal(false);
                  handleViewEstadisticas(currentEscenario);
                }}
              >
                <i className="fas fa-chart-bar me-2"></i> Estadísticas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver actividades */}
      {showActividadesModal && currentEscenario && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-calendar-alt me-2"></i>
                Actividades Programadas: {currentEscenario.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowActividadesModal(false)}
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
                      value={filtroFechas.fecha_inicio}
                      onChange={(e) => setFiltroFechas({
                        ...filtroFechas,
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
                      value={filtroFechas.fecha_fin}
                      onChange={(e) => setFiltroFechas({
                        ...filtroFechas,
                        fecha_fin: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="col-md-12">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => fetchActividades(currentEscenario.id_escenario)}
                  >
                    <i className="fas fa-filter me-2"></i> Filtrar Actividades
                  </button>
                </div>
              </div>

              {actividades.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <h5>No hay actividades programadas</h5>
                  <p className="text-muted">No se encontraron actividades en este período</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Actividad</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th>Hora Inicio</th>
                        <th>Hora Fin</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividades.map((programa) => (
                        <tr key={`actividad-${programa.id_programa_actividad}`}>
                          <td>
                            <strong>{programa.actividad?.nombre}</strong>
                            <div className="small text-muted">
                              {programa.actividad?.descripcion?.substring(0, 50)}...
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {programa.actividad?.tipo}
                            </span>
                          </td>
                          <td>
                            {formatFecha(programa.actividad?.fecha)}
                          </td>
                          <td>
                            {programa.actividad?.hora_inicio}
                          </td>
                          <td>
                            {programa.actividad?.hora_fin}
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${programa.actividad?.estado}`}>
                              {programa.actividad?.estado}
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
                onClick={() => setShowActividadesModal(false)}
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

      {/* Modal para ver partidos */}
      {showPartidosModal && currentEscenario && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-futbol me-2"></i>
                Partidos Programados: {currentEscenario.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowPartidosModal(false)}
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
                      value={filtroFechas.fecha_inicio}
                      onChange={(e) => setFiltroFechas({
                        ...filtroFechas,
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
                      value={filtroFechas.fecha_fin}
                      onChange={(e) => setFiltroFechas({
                        ...filtroFechas,
                        fecha_fin: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="col-md-12">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => fetchPartidos(currentEscenario.id_escenario)}
                  >
                    <i className="fas fa-filter me-2"></i> Filtrar Partidos
                  </button>
                </div>
              </div>

              {partidos.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-futbol fa-3x text-muted mb-3"></i>
                  <h5>No hay partidos programados</h5>
                  <p className="text-muted">No se encontraron partidos en este período</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Campeonato</th>
                        <th>Local</th>
                        <th>Visitante</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidos.map((partido) => (
                        <tr key={`partido-${partido.id_partido}`}>
                          <td>
                            <strong>{partido.campeonato?.nombre}</strong>
                          </td>
                          <td>
                            <div>
                              <strong>{partido.clubLocal?.nombre}</strong>
                              <div className="small text-muted">
                                {partido.clubLocal?.ciudad}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong>{partido.clubVisitante?.nombre}</strong>
                              <div className="small text-muted">
                                {partido.clubVisitante?.ciudad}
                              </div>
                            </div>
                          </td>
                          <td>
                            {formatFecha(partido.fecha)}
                          </td>
                          <td>
                            <strong>{partido.hora}</strong>
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${partido.estado}`}>
                              {partido.estado}
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
                onClick={() => setShowPartidosModal(false)}
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

      {/* Modal para ver disponibilidad */}
      {showDisponibilidadModal && currentEscenario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-calendar-check me-2"></i>
                Verificar Disponibilidad: {currentEscenario.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDisponibilidadModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Estado actual:</strong> 
                <span className={`badge estado-badge estado-${currentEscenario.estado} ms-2`}>
                  {currentEscenario.estado}
                </span>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Fecha *</label>
                <input
                  type="date"
                  className="form-control"
                  value={disponibilidadForm.fecha}
                  onChange={(e) => setDisponibilidadForm({
                    ...disponibilidadForm,
                    fecha: e.target.value
                  })}
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Hora Inicio *</label>
                    <input
                      type="time"
                      className="form-control"
                      value={disponibilidadForm.hora_inicio}
                      onChange={(e) => setDisponibilidadForm({
                        ...disponibilidadForm,
                        hora_inicio: e.target.value
                      })}
                      required
                    />
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Hora Fin *</label>
                    <input
                      type="time"
                      className="form-control"
                      value={disponibilidadForm.hora_fin}
                      onChange={(e) => setDisponibilidadForm({
                        ...disponibilidadForm,
                        hora_fin: e.target.value
                      })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="text-center mb-4">
                <button 
                  className="btn btn-primary"
                  onClick={() => verificarDisponibilidad(currentEscenario.id_escenario)}
                  disabled={!disponibilidadForm.fecha || !disponibilidadForm.hora_inicio || !disponibilidadForm.hora_fin}
                >
                  <i className="fas fa-search me-2"></i> Verificar Disponibilidad
                </button>
              </div>

              {disponibilidadInfo && (
                <div className={`alert ${disponibilidadInfo.disponible ? 'alert-success' : 'alert-danger'}`}>
                  <h5 className="alert-heading">
                    <i className={`fas ${disponibilidadInfo.disponible ? 'fa-check-circle' : 'fa-times-circle'} me-2`}></i>
                    {disponibilidadInfo.disponible ? 'DISPONIBLE' : 'NO DISPONIBLE'}
                  </h5>
                  <p>{disponibilidadInfo.mensaje}</p>
                  
                  {!disponibilidadInfo.disponible && (
                    <div className="mt-3">
                      <strong>Conflictos detectados:</strong>
                      <ul className="mt-2 mb-0">
                        {disponibilidadInfo.conflictos_actividades && <li>Actividades programadas</li>}
                        {disponibilidadInfo.conflictos_partidos && <li>Partidos programados</li>}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <strong>Detalles:</strong>
                    <ul className="mt-2 mb-0">
                      <li>Fecha: {disponibilidadForm.fecha}</li>
                      <li>Horario: {disponibilidadForm.hora_inicio} - {disponibilidadForm.hora_fin}</li>
                      <li>Escenario: {currentEscenario.nombre}</li>
                    </ul>
                  </div>
                </div>
              )}
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

      {/* Modal para ver estadísticas */}
      {showEstadisticasModal && currentEscenario && estadisticas && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-chart-bar me-2"></i>
                Estadísticas de Uso: {currentEscenario.nombre}
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
                      value={filtroFechas.fecha_inicio}
                      onChange={(e) => setFiltroFechas({
                        ...filtroFechas,
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
                      value={filtroFechas.fecha_fin}
                      onChange={(e) => setFiltroFechas({
                        ...filtroFechas,
                        fecha_fin: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="col-md-12">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => fetchEstadisticas(currentEscenario.id_escenario)}
                  >
                    <i className="fas fa-sync-alt me-2"></i> Actualizar Estadísticas
                  </button>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="stat-card-lg text-center bg-primary text-white">
                    <h4>{estadisticas.total_actividades || 0}</h4>
                    <p>Actividades</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card-lg text-center bg-success text-white">
                    <h4>{estadisticas.total_partidos || 0}</h4>
                    <p>Partidos</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card-lg text-center bg-warning text-dark">
                    <h4>{estadisticas.horas_uso_estimadas || 0}</h4>
                    <p>Horas de Uso</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card-lg text-center bg-info text-white">
                    <h4>{estadisticas.tasa_ocupacion || 0}%</h4>
                    <p>Tasa Ocupación</p>
                  </div>
                </div>
              </div>

              {estadisticas.actividades_por_tipo && estadisticas.actividades_por_tipo.length > 0 && (
                <div className="row mb-4">
                  <div className="col-md-12">
                    <h5>Distribución por Tipo de Actividad</h5>
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
                          {estadisticas.actividades_por_tipo.map((item) => (
                            <tr key={`tipo-${item.tipo}`}>
                              <td>{item.tipo}</td>
                              <td>{item.total}</td>
                              <td>
                                <div className="progress" style={{height: '20px'}}>
                                  <div 
                                    className="progress-bar bg-primary" 
                                    style={{width: `${(item.total / estadisticas.total_actividades) * 100}%`}}
                                  >
                                    {((item.total / estadisticas.total_actividades) * 100).toFixed(1)}%
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

      {/* Modal para cambiar estado */}
      {showCambiarEstadoModal && currentEscenario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-warning text-dark">
              <h3>
                <i className="fas fa-exchange-alt me-2"></i>
                Cambiar Estado: {currentEscenario.nombre}
              </h3>
              <button 
                className="btn-close"
                onClick={() => {
                  setShowCambiarEstadoModal(false);
                  setCambioEstadoForm({
                    estado: 'disponible',
                    observaciones: ''
                  });
                }}
              ></button>
            </div>
            <form onSubmit={cambiarEstadoEscenario}>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Estado actual:</strong> 
                  <span className={`badge estado-badge estado-${currentEscenario.estado} ms-2`}>
                    {currentEscenario.estado}
                  </span>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Nuevo Estado *</label>
                  <select
                    className="form-control"
                    value={cambioEstadoForm.estado}
                    onChange={(e) => setCambioEstadoForm({
                      ...cambioEstadoForm,
                      estado: e.target.value
                    })}
                    required
                  >
                    <option value="disponible">Disponible</option>
                    <option value="ocupado">Ocupado</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    value={cambioEstadoForm.observaciones}
                    onChange={(e) => setCambioEstadoForm({
                      ...cambioEstadoForm,
                      observaciones: e.target.value
                    })}
                    rows="3"
                    placeholder="Observaciones sobre el cambio de estado..."
                  />
                </div>

                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Al marcar como "Mantenimiento" o "Cerrado", se notificará a los usuarios sobre actividades afectadas.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCambiarEstadoModal(false);
                    setCambioEstadoForm({
                      estado: 'disponible',
                      observaciones: ''
                    });
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-warning">
                  <i className="fas fa-exchange-alt me-2"></i> Cambiar Estado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para confirmar eliminación */}
      {showConfirmarEliminarModal && currentEscenario && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h3>
                <i className="fas fa-trash-alt me-2"></i>
                Eliminar Escenario: {currentEscenario.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowConfirmarEliminarModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>¿Está seguro de eliminar este escenario?</strong>
                <ul className="mt-2 mb-0">
                  <li>Nombre: {currentEscenario.nombre}</li>
                  <li>Tipo: {currentEscenario.tipo}</li>
                  <li>Capacidad: {currentEscenario.capacidad} personas</li>
                  <li>Esta acción no se puede deshacer</li>
                </ul>
              </div>
              
              <div className="alert alert-warning mt-3">
                <i className="fas fa-exclamation-circle me-2"></i>
                <strong>Verificación previa:</strong>
                <ul className="mt-2 mb-0">
                  <li>Actividades programadas: {currentEscenario.actividadesProgramadas?.length || 0}</li>
                  <li>Partidos programados: {currentEscenario.partidos?.length || 0}</li>
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
                onClick={() => handleDelete(currentEscenario.id_escenario)}
                disabled={currentEscenario.actividadesProgramadas?.length > 0 || currentEscenario.partidos?.length > 0}
              >
                <i className="fas fa-trash-alt me-2"></i> Eliminar Escenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Escenarios;