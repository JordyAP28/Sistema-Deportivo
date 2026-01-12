import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/campeonatos.css';

const API_URL = 'http://localhost:8000/api';

const Campeonatos = () => {
  // Estados principales
  const [campeonatos, setCampeonatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [showClubesModal, setShowClubesModal] = useState(false);
  const [showPartidosModal, setShowPartidosModal] = useState(false);
  const [showTablaPosicionesModal, setShowTablaPosicionesModal] = useState(false);
  const [showInscribirClubModal, setShowInscribirClubModal] = useState(false);
  const [showReglasModal, setShowReglasModal] = useState(false);
  
  // Estados para datos
  const [currentCampeonato, setCurrentCampeonato] = useState(null);
  const [clubes, setClubes] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [clubesCampeonato, setClubesCampeonato] = useState([]);
  const [partidosCampeonato, setPartidosCampeonato] = useState([]);
  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [imagenPreview, setImagenPreview] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  
  // Form state para nuevo/editar campeonato
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    fecha_inicio: '',
    fecha_fin: '',
    categoria: '',
    representante: '',
    email_representante: '',
    telefono_representante: '',
    descripcion: '',
    estado: 'pendiente',
    reglas: [],
    imagen: null
  });

  // Form state para inscribir club
  const [inscripcionForm, setInscripcionForm] = useState({
    id_club: '',
    fecha_inscripcion: '',
    observaciones: ''
  });

  // Form state para nueva regla
  const [nuevaRegla, setNuevaRegla] = useState('');

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
    fetchCampeonatos();
    fetchClubes();
  }, []);

  // Cargar todos los campeonatos
  const fetchCampeonatos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/campeonatos`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setCampeonatos(response.data.data);
      } else {
        setError('Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('Error al cargar campeonatos:', err);
      setError('Error al cargar campeonatos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar clubes
  const fetchClubes = async () => {
    try {
      const response = await axios.get(`${API_URL}/clubes`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setClubes(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar clubes:', err);
    }
  };

  // Cargar estadísticas de un campeonato
  const fetchEstadisticas = async (campeonatoId) => {
    try {
      const response = await axios.get(`${API_URL}/campeonatos/${campeonatoId}/estadisticas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setEstadisticas(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Cargar clubes de un campeonato
  const fetchClubesCampeonato = async (campeonatoId) => {
    try {
      const response = await axios.get(`${API_URL}/campeonatos/${campeonatoId}/clubes`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setClubesCampeonato(response.data.data.clubes || []);
      }
    } catch (err) {
      console.error('Error al cargar clubes del campeonato:', err);
    }
  };

  // Cargar partidos de un campeonato
  const fetchPartidosCampeonato = async (campeonatoId) => {
    try {
      const response = await axios.get(`${API_URL}/campeonatos/${campeonatoId}/partidos`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setPartidosCampeonato(response.data.data.partidos || []);
      }
    } catch (err) {
      console.error('Error al cargar partidos del campeonato:', err);
    }
  };

  // Cargar tabla de posiciones
  const fetchTablaPosiciones = async (campeonatoId) => {
    try {
      const response = await axios.get(`${API_URL}/campeonatos/${campeonatoId}/tabla-posiciones`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setTablaPosiciones(response.data.data.tabla_posiciones || []);
      }
    } catch (err) {
      console.error('Error al cargar tabla de posiciones:', err);
    }
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      fetchCampeonatos();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/campeonatos/buscar`, {
        params: { busqueda: searchTerm },
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setCampeonatos(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar campeonatos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar campeonatos
  const filtrarCampeonatos = () => {
    try {
      let campeonatosFiltrados = [...campeonatos];
      
      if (filterEstado) {
        campeonatosFiltrados = campeonatosFiltrados.filter(c => c.estado === filterEstado);
      }
      
      if (filterCategoria) {
        campeonatosFiltrados = campeonatosFiltrados.filter(c => c.categoria === filterCategoria);
      }
      
      setCampeonatos(campeonatosFiltrados);
    } catch (err) {
      console.error('Error al filtrar:', err);
      setError('Error al filtrar campeonatos: ' + err.message);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    setFilterCategoria('');
    fetchCampeonatos();
  };

  // Crear campeonato
  const handleCreate = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    
    // Agregar campos del formulario
    Object.keys(formData).forEach(key => {
      if (key === 'reglas') {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Agregar imagen si existe
    if (formData.imagen instanceof File) {
      formDataToSend.append('imagen', formData.imagen);
    }

    try {
      const response = await axios.post(`${API_URL}/campeonatos`, formDataToSend, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchCampeonatos();
        setSuccessMessage('Campeonato creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear campeonato:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al crear campeonato: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar campeonato
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentCampeonato) return;

    const formDataToSend = new FormData();
    
    // Agregar campos del formulario
    Object.keys(formData).forEach(key => {
      if (key === 'reglas') {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Agregar imagen si es un archivo nuevo
    if (formData.imagen instanceof File) {
      formDataToSend.append('imagen', formData.imagen);
    }

    try {
      const response = await axios.post(`${API_URL}/campeonatos/${currentCampeonato.id_campeonato}?_method=PUT`, formDataToSend, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchCampeonatos();
        setSuccessMessage('Campeonato actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar campeonato:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al actualizar campeonato: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar campeonato
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este campeonato?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/campeonatos/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchCampeonatos();
        setSuccessMessage('Campeonato eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar campeonato:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al eliminar campeonato: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Restaurar campeonato
  const handleRestore = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/campeonatos/${id}/restore`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchCampeonatos();
        setSuccessMessage('Campeonato restaurado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al restaurar campeonato:', err);
      setError('Error al restaurar campeonato: ' + (err.response?.data?.message || err.message));
    }
  };

  // Inscribir club a campeonato
  const handleInscribirClub = async (e) => {
    e.preventDefault();
    
    if (!currentCampeonato) return;

    try {
      const response = await axios.post(`${API_URL}/campeonatos/${currentCampeonato.id_campeonato}/inscribir-club`, inscripcionForm, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowInscribirClubModal(false);
        setInscripcionForm({
          id_club: '',
          fecha_inscripcion: '',
          observaciones: ''
        });
        fetchClubesCampeonato(currentCampeonato.id_campeonato);
        setSuccessMessage('Club inscrito exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al inscribir club:', err);
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
        setError('Error al inscribir club: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar club de campeonato
  const handleEliminarClub = async (clubId) => {
    if (!window.confirm('¿Está seguro de eliminar este club del campeonato?')) return;

    try {
      const response = await axios.delete(`${API_URL}/campeonatos/${currentCampeonato.id_campeonato}/eliminar-club/${clubId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchClubesCampeonato(currentCampeonato.id_campeonato);
        setSuccessMessage('Club eliminado del campeonato exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar club del campeonato:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al eliminar club del campeonato: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Editar campeonato
  const handleEdit = (campeonato) => {
    setCurrentCampeonato(campeonato);
    
    // Parsear reglas
    let reglasArray = [];
    try {
      if (campeonato.reglas) {
        reglasArray = typeof campeonato.reglas === 'string' 
          ? JSON.parse(campeonato.reglas) 
          : campeonato.reglas;
      }
    } catch (err) {
      console.error('Error al parsear reglas:', err);
    }
    
    setFormData({
      nombre: campeonato.nombre || '',
      slug: campeonato.slug || '',
      fecha_inicio: campeonato.fecha_inicio?.split('T')[0] || '',
      fecha_fin: campeonato.fecha_fin?.split('T')[0] || '',
      categoria: campeonato.categoria || '',
      representante: campeonato.representante || '',
      email_representante: campeonato.email_representante || '',
      telefono_representante: campeonato.telefono_representante || '',
      descripcion: campeonato.descripcion || '',
      estado: campeonato.estado || 'pendiente',
      reglas: reglasArray,
      imagen: null
    });
    
    setImagenPreview(campeonato.imagen ? `${API_URL.replace('/api', '')}/storage/${campeonato.imagen}` : null);
    setShowEditModal(true);
  };

  // Ver detalles
  const handleViewDetails = (campeonato) => {
    setCurrentCampeonato(campeonato);
    setShowDetallesModal(true);
  };

  // Ver clubes
  const handleViewClubes = (campeonato) => {
    setCurrentCampeonato(campeonato);
    fetchClubesCampeonato(campeonato.id_campeonato);
    setShowClubesModal(true);
  };

  // Ver partidos
  const handleViewPartidos = (campeonato) => {
    setCurrentCampeonato(campeonato);
    fetchPartidosCampeonato(campeonato.id_campeonato);
    setShowPartidosModal(true);
  };

  // Ver tabla de posiciones
  const handleViewTablaPosiciones = (campeonato) => {
    setCurrentCampeonato(campeonato);
    fetchTablaPosiciones(campeonato.id_campeonato);
    setShowTablaPosicionesModal(true);
  };

  // Ver estadísticas
  const handleViewEstadisticas = (campeonato) => {
    setCurrentCampeonato(campeonato);
    fetchEstadisticas(campeonato.id_campeonato);
    setShowEstadisticasModal(true);
  };

  // Ver reglas
  const handleViewReglas = (campeonato) => {
    setCurrentCampeonato(campeonato);
    setShowReglasModal(true);
  };

  // Abrir modal para inscribir club
  const handleOpenInscribirClub = (campeonato) => {
    setCurrentCampeonato(campeonato);
    setInscripcionForm({
      id_club: '',
      fecha_inscripcion: new Date().toISOString().split('T')[0],
      observaciones: ''
    });
    setShowInscribirClubModal(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      slug: '',
      fecha_inicio: '',
      fecha_fin: '',
      categoria: '',
      representante: '',
      email_representante: '',
      telefono_representante: '',
      descripcion: '',
      estado: 'pendiente',
      reglas: [],
      imagen: null
    });
    setImagenPreview(null);
    setCurrentCampeonato(null);
    setNuevaRegla('');
  };

  // Manejar cambio de imagen
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imagen: file });
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagenPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generar slug automáticamente
  const generarSlug = (nombre) => {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Manejar cambio de nombre
  const handleNombreChange = (e) => {
    const nombre = e.target.value;
    setFormData({
      ...formData,
      nombre,
      slug: generarSlug(nombre)
    });
  };

  // Agregar regla
  const agregarRegla = () => {
    if (nuevaRegla.trim() !== '') {
      setFormData({
        ...formData,
        reglas: [...formData.reglas, nuevaRegla.trim()]
      });
      setNuevaRegla('');
    }
  };

  // Eliminar regla
  const eliminarRegla = (index) => {
    const nuevasReglas = [...formData.reglas];
    nuevasReglas.splice(index, 1);
    setFormData({
      ...formData,
      reglas: nuevasReglas
    });
  };

  // Obtener campeonatos filtrados
  const getFilteredCampeonatos = () => {
    let filtered = campeonatos;
    
    if (filterEstado) {
      filtered = filtered.filter(c => c.estado === filterEstado);
    }
    
    if (filterCategoria) {
      filtered = filtered.filter(c => c.categoria === filterCategoria);
    }
    
    return filtered;
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

  // Formatear fecha con hora
  const formatFechaHora = (fechaString) => {
    if (!fechaString) return 'No especificada';
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener club por ID
  const getClubById = (id) => {
    return clubes.find(c => c.id_club == id);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  // Función para calcular estadísticas manualmente
  const calcularEstadisticasGenerales = () => {
    if (campeonatos.length === 0) return null;
    
    const total = campeonatos.length;
    const activos = campeonatos.filter(c => c.estado === 'activo').length;
    const finalizados = campeonatos.filter(c => c.estado === 'finalizado').length;
    const pendientes = campeonatos.filter(c => c.estado === 'pendiente').length;
    const cancelados = campeonatos.filter(c => c.estado === 'cancelado').length;
    
    // Categorías únicas
    const categorias = [...new Set(campeonatos.map(c => c.categoria).filter(Boolean))];
    
    // Campeonato con más clubes
    const campeonatoConMasClubes = [...campeonatos]
      .sort((a, b) => (b.clubes?.length || 0) - (a.clubes?.length || 0))
      .shift();
    
    return {
      total,
      activos,
      finalizados,
      pendientes,
      cancelados,
      categorias,
      campeonato_con_mas_clubes: campeonatoConMasClubes
    };
  };

  // Parsear reglas del campeonato
  const parsearReglas = (reglasString) => {
    try {
      if (!reglasString) return [];
      return typeof reglasString === 'string' 
        ? JSON.parse(reglasString) 
        : reglasString;
    } catch (err) {
      console.error('Error al parsear reglas:', err);
      return [];
    }
  };

  const campeonatosFiltrados = getFilteredCampeonatos();
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
                <i className="fas fa-trophy me-2"></i>
                Gestión de Campeonatos
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
                  <i className="fas fa-plus"></i> Nuevo Campeonato
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
                        placeholder="Nombre, categoría, representante..."
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
                      <option value="activo">Activo</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Categoría</label>
                    <select 
                      className="form-select"
                      value={filterCategoria}
                      onChange={(e) => setFilterCategoria(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {estadisticasGenerales?.categorias.map((categoria, index) => (
                        <option key={`categoria-${index}`} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={filtrarCampeonatos}
                      disabled={loading}
                      title="Aplicar filtros"
                    >
                      <i className="fas fa-filter"></i> Filtrar
                    </button>
                  </div>
                  
                  <div className="col-md-3">
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
              </div>

              {/* Estadísticas rápidas */}
              {estadisticasGenerales && (
                <div className="stats-section mb-4">
                  <div className="row g-3">
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticasGenerales.total}</h4>
                        <p>Total</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-warning text-white">
                        <h4>{estadisticasGenerales.pendientes}</h4>
                        <p>Pendientes</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-success text-white">
                        <h4>{estadisticasGenerales.activos}</h4>
                        <p>Activos</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-primary text-white">
                        <h4>{estadisticasGenerales.finalizados}</h4>
                        <p>Finalizados</p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="stat-card bg-danger text-white">
                        <h4>{estadisticasGenerales.cancelados}</h4>
                        <p>Cancelados</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de campeonatos */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando campeonatos...</p>
                </div>
              ) : campeonatosFiltrados.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-trophy fa-3x text-muted mb-3"></i>
                  <h4>No hay campeonatos registrados</h4>
                  <p>Crea tu primer campeonato usando el botón "Nuevo Campeonato"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Fechas</th>
                        <th>Estado</th>
                        <th>Clubes</th>
                        <th>Partidos</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campeonatosFiltrados.map((campeonato) => (
                        <tr key={`campeonato-${campeonato.id_campeonato}`}>
                          <td>
                            <div className="campeonato-img-container">
                              {campeonato.imagen ? (
                                <img 
                                  src={`${API_URL.replace('/api', '')}/storage/${campeonato.imagen}`}
                                  alt={campeonato.nombre}
                                  className="campeonato-img"
                                />
                              ) : (
                                <div className="campeonato-img-placeholder">
                                  <i className="fas fa-trophy"></i>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <strong>{campeonato.nombre}</strong>
                            <div className="text-muted small">
                              {campeonato.descripcion ? (
                                campeonato.descripcion.length > 50 
                                  ? `${campeonato.descripcion.substring(0, 50)}...`
                                  : campeonato.descripcion
                              ) : 'Sin descripción'}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary">{campeonato.categoria}</span>
                          </td>
                          <td>
                            <div className="small">
                              <strong>Inicio:</strong> {formatFecha(campeonato.fecha_inicio)}
                            </div>
                            <div className="small">
                              <strong>Fin:</strong> {formatFecha(campeonato.fecha_fin)}
                            </div>
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${campeonato.estado}`}>
                              {campeonato.estado}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="badge bg-info me-2">
                                <i className="fas fa-shield-alt me-1"></i>
                                {campeonato.clubes?.length || 0}
                              </span>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewClubes(campeonato)}
                                title="Ver clubes"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="badge bg-warning me-2">
                                <i className="fas fa-futbol me-1"></i>
                                {campeonato.partidos?.length || 0}
                              </span>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleViewPartidos(campeonato)}
                                title="Ver partidos"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetails(campeonato)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEdit(campeonato)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleOpenInscribirClub(campeonato)}
                                title="Inscribir club"
                              >
                                <i className="fas fa-plus-circle"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewTablaPosiciones(campeonato)}
                                title="Tabla de posiciones"
                              >
                                <i className="fas fa-list-ol"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(campeonato.id_campeonato)}
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

      {/* Modal para crear campeonato */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nuevo Campeonato
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
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Nombre del Campeonato *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.nombre}
                            onChange={handleNombreChange}
                            required
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
                          />
                          <small className="text-muted">URL amigable para el campeonato</small>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Categoría *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.categoria}
                            onChange={(e) => setFormData({...formData, categoria: e.target.value})}
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
                            <option value="activo">Activo</option>
                            <option value="finalizado">Finalizado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </div>
                      </div>
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
                      <div className="col-md-6">
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
                      <div className="col-md-6">
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
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Teléfono Representante *</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.telefono_representante}
                        onChange={(e) => setFormData({...formData, telefono_representante: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        rows="3"
                        placeholder="Descripción del campeonato..."
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Imagen del Campeonato</label>
                      <div className="imagen-upload-container">
                        {imagenPreview ? (
                          <img 
                            src={imagenPreview} 
                            alt="Imagen preview" 
                            className="imagen-preview"
                          />
                        ) : (
                          <div className="imagen-placeholder">
                            <i className="fas fa-camera fa-3x"></i>
                            <p>Click para subir imagen</p>
                          </div>
                        )}
                        <input
                          type="file"
                          className="imagen-input"
                          accept="image/*"
                          onChange={handleImagenChange}
                        />
                      </div>
                      <small className="text-muted d-block mt-2">
                        Tamaño máximo: 2MB. Formatos: JPG, PNG, GIF
                      </small>
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Reglas del Campeonato</label>
                      <div className="reglas-container">
                        {formData.reglas.map((regla, index) => (
                          <div key={`regla-${index}`} className="regla-item mb-2">
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                value={regla}
                                readOnly
                              />
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => eliminarRegla(index)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            value={nuevaRegla}
                            onChange={(e) => setNuevaRegla(e.target.value)}
                            placeholder="Nueva regla..."
                            onKeyPress={(e) => e.key === 'Enter' && agregarRegla()}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={agregarRegla}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
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
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Campeonato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar campeonato */}
      {showEditModal && currentCampeonato && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-warning text-white">
              <h3>
                <i className="fas fa-edit me-2"></i>
                Editar Campeonato: {currentCampeonato.nombre}
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
                <div className="row">
                  <div className="col-md-8">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Nombre del Campeonato *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.nombre}
                            onChange={(e) => {
                              const nombre = e.target.value;
                              setFormData({
                                ...formData,
                                nombre,
                                slug: generarSlug(nombre)
                              });
                            }}
                            required
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
                          />
                          <small className="text-muted">URL amigable para el campeonato</small>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Categoría *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.categoria}
                            onChange={(e) => setFormData({...formData, categoria: e.target.value})}
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
                            <option value="activo">Activo</option>
                            <option value="finalizado">Finalizado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </div>
                      </div>
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
                      <div className="col-md-6">
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
                      <div className="col-md-6">
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
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Teléfono Representante *</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.telefono_representante}
                        onChange={(e) => setFormData({...formData, telefono_representante: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        rows="3"
                        placeholder="Descripción del campeonato..."
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Imagen del Campeonato</label>
                      <div className="imagen-upload-container">
                        {imagenPreview ? (
                          <img 
                            src={imagenPreview} 
                            alt="Imagen preview" 
                            className="imagen-preview"
                          />
                        ) : (
                          <div className="imagen-placeholder">
                            <i className="fas fa-camera fa-3x"></i>
                            <p>Click para cambiar imagen</p>
                          </div>
                        )}
                        <input
                          type="file"
                          className="imagen-input"
                          accept="image/*"
                          onChange={handleImagenChange}
                        />
                      </div>
                      <div className="mt-2">
                        {currentCampeonato.imagen && !imagenPreview && (
                          <div className="alert alert-info p-2">
                            <i className="fas fa-info-circle me-2"></i>
                            Imagen actual: {currentCampeonato.imagen.split('/').pop()}
                          </div>
                        )}
                      </div>
                      <small className="text-muted d-block mt-2">
                        Tamaño máximo: 2MB. Formatos: JPG, PNG, GIF
                      </small>
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Reglas del Campeonato</label>
                      <div className="reglas-container">
                        {formData.reglas.map((regla, index) => (
                          <div key={`regla-edit-${index}`} className="regla-item mb-2">
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                value={regla}
                                onChange={(e) => {
                                  const nuevasReglas = [...formData.reglas];
                                  nuevasReglas[index] = e.target.value;
                                  setFormData({
                                    ...formData,
                                    reglas: nuevasReglas
                                  });
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => eliminarRegla(index)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            value={nuevaRegla}
                            onChange={(e) => setNuevaRegla(e.target.value)}
                            placeholder="Nueva regla..."
                            onKeyPress={(e) => e.key === 'Enter' && agregarRegla()}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={agregarRegla}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {currentCampeonato && (
                      <div className="alert alert-warning">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Al actualizar el campeonato, se mantendrán todos los clubes y partidos asociados.
                      </div>
                    )}
                  </div>
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
                <button type="submit" className="btn btn-warning">
                  Actualizar Campeonato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles del campeonato */}
      {showDetallesModal && currentCampeonato && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-trophy me-2"></i>
                Detalles del Campeonato: {currentCampeonato.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDetallesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="text-center mb-4">
                    {currentCampeonato.imagen ? (
                      <img 
                        src={`${API_URL.replace('/api', '')}/storage/${currentCampeonato.imagen}`}
                        alt={currentCampeonato.nombre}
                        className="campeonato-img-large"
                      />
                    ) : (
                      <div className="campeonato-img-large-placeholder">
                        <i className="fas fa-trophy fa-5x"></i>
                      </div>
                    )}
                    <h4 className="mt-3">{currentCampeonato.nombre}</h4>
                    <span className={`badge estado-badge estado-${currentCampeonato.estado} mt-2`}>
                      {currentCampeonato.estado}
                    </span>
                  </div>
                  
                  <div className="info-section">
                    <h5 className="text-primary">
                      <i className="fas fa-info-circle me-2"></i>Información General
                    </h5>
                    <div className="info-item">
                      <strong>Categoría:</strong> {currentCampeonato.categoria}
                    </div>
                    <div className="info-item">
                      <strong>Slug:</strong> {currentCampeonato.slug}
                    </div>
                    <div className="info-item">
                      <strong>Fecha Inicio:</strong> {formatFecha(currentCampeonato.fecha_inicio)}
                    </div>
                    <div className="info-item">
                      <strong>Fecha Fin:</strong> {formatFecha(currentCampeonato.fecha_fin)}
                    </div>
                    <div className="info-item">
                      <strong>Representante:</strong> {currentCampeonato.representante}
                    </div>
                  </div>
                </div>
                
                <div className="col-md-8">
                  <div className="info-section mb-4">
                    <h5 className="text-primary">
                      <i className="fas fa-address-card me-2"></i>Contacto
                    </h5>
                    <div className="info-item">
                      <i className="fas fa-envelope me-2 text-primary"></i>
                      <strong>Email:</strong> 
                      <a href={`mailto:${currentCampeonato.email_representante}`} className="ms-2">
                        {currentCampeonato.email_representante}
                      </a>
                    </div>
                    <div className="info-item">
                      <i className="fas fa-phone me-2 text-primary"></i>
                      <strong>Teléfono:</strong> 
                      <span className="ms-2">{currentCampeonato.telefono_representante}</span>
                    </div>
                  </div>

                  {currentCampeonato.descripcion && (
                    <div className="info-section mb-4">
                      <h5 className="text-primary">
                        <i className="fas fa-align-left me-2"></i>Descripción
                      </h5>
                      <p className="p-3 bg-light rounded">{currentCampeonato.descripcion}</p>
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6">
                      <div className="info-section">
                        <h5 className="text-primary">
                          <i className="fas fa-shield-alt me-2"></i>Clubes Participantes
                        </h5>
                        <div className="text-center">
                          <h2 className="display-4 text-primary">
                            {currentCampeonato.clubes?.length || 0}
                          </h2>
                          <button 
                            className="btn btn-outline-primary btn-sm mt-2"
                            onClick={() => {
                              setShowDetallesModal(false);
                              handleViewClubes(currentCampeonato);
                            }}
                          >
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="info-section">
                        <h5 className="text-primary">
                          <i className="fas fa-futbol me-2"></i>Partidos
                        </h5>
                        <div className="text-center">
                          <h2 className="display-4 text-warning">
                            {currentCampeonato.partidos?.length || 0}
                          </h2>
                          <button 
                            className="btn btn-outline-warning btn-sm mt-2"
                            onClick={() => {
                              setShowDetallesModal(false);
                              handleViewPartidos(currentCampeonato);
                            }}
                          >
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row mt-4">
                    <div className="col-md-12">
                      <div className="info-section">
                        <h5 className="text-primary">
                          <i className="fas fa-chart-bar me-2"></i>Acciones Rápidas
                        </h5>
                        <div className="d-flex flex-wrap gap-2">
                          <button 
                            className="btn btn-outline-info btn-sm"
                            onClick={() => {
                              setShowDetallesModal(false);
                              handleViewTablaPosiciones(currentCampeonato);
                            }}
                          >
                            <i className="fas fa-list-ol me-1"></i> Tabla de Posiciones
                          </button>
                          <button 
                            className="btn btn-outline-success btn-sm"
                            onClick={() => {
                              setShowDetallesModal(false);
                              handleOpenInscribirClub(currentCampeonato);
                            }}
                          >
                            <i className="fas fa-plus-circle me-1"></i> Inscribir Club
                          </button>
                          <button 
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => {
                              setShowDetallesModal(false);
                              handleViewEstadisticas(currentCampeonato);
                            }}
                          >
                            <i className="fas fa-chart-pie me-1"></i> Estadísticas
                          </button>
                          {currentCampeonato.reglas && (
                            <button 
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => {
                                setShowDetallesModal(false);
                                handleViewReglas(currentCampeonato);
                              }}
                            >
                              <i className="fas fa-book me-1"></i> Ver Reglas
                            </button>
                          )}
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
                onClick={() => setShowDetallesModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-warning"
                onClick={() => {
                  setShowDetallesModal(false);
                  handleEdit(currentCampeonato);
                }}
              >
                <i className="fas fa-edit"></i> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver estadísticas generales */}
      {showEstadisticasModal && estadisticasGenerales && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-chart-bar me-2"></i>
                Estadísticas de Campeonatos
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
                        <span>Total Campeonatos:</span>
                        <strong>{estadisticasGenerales.total}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-warning">
                        <span>Pendientes:</span>
                        <strong>{estadisticasGenerales.pendientes}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Activos:</span>
                        <strong>{estadisticasGenerales.activos}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-primary">
                        <span>Finalizados:</span>
                        <strong>{estadisticasGenerales.finalizados}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-danger">
                        <span>Cancelados:</span>
                        <strong>{estadisticasGenerales.cancelados}</strong>
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
                          style={{width: `${(estadisticasGenerales.pendientes / estadisticasGenerales.total) * 100 || 0}%`}}
                        >
                          Pendientes: {estadisticasGenerales.pendientes}
                        </div>
                      </div>
                      <div className="progress mb-2">
                        <div 
                          className="progress-bar bg-success" 
                          style={{width: `${(estadisticasGenerales.activos / estadisticasGenerales.total) * 100 || 0}%`}}
                        >
                          Activos: {estadisticasGenerales.activos}
                        </div>
                      </div>
                      <div className="progress mb-2">
                        <div 
                          className="progress-bar bg-primary" 
                          style={{width: `${(estadisticasGenerales.finalizados / estadisticasGenerales.total) * 100 || 0}%`}}
                        >
                          Finalizados: {estadisticasGenerales.finalizados}
                        </div>
                      </div>
                      <div className="progress mb-2">
                        <div 
                          className="progress-bar bg-danger" 
                          style={{width: `${(estadisticasGenerales.cancelados / estadisticasGenerales.total) * 100 || 0}%`}}
                        >
                          Cancelados: {estadisticasGenerales.cancelados}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {estadisticasGenerales.campeonato_con_mas_clubes && (
                <div className="row">
                  <div className="col-md-12">
                    <div className="stat-card-lg mb-4">
                      <h4 className="text-primary">Campeonato con Más Clubes</h4>
                      <div className="p-3 bg-light rounded">
                        <h5>{estadisticasGenerales.campeonato_con_mas_clubes.nombre}</h5>
                        <p className="mb-1">
                          <i className="fas fa-shield-alt text-primary me-2"></i>
                          Total clubes: {estadisticasGenerales.campeonato_con_mas_clubes.clubes?.length || 0}
                        </p>
                        <p className="mb-0">
                          <i className="fas fa-calendar text-warning me-2"></i>
                          Fechas: {formatFecha(estadisticasGenerales.campeonato_con_mas_clubes.fecha_inicio)} - {formatFecha(estadisticasGenerales.campeonato_con_mas_clubes.fecha_fin)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="row">
                <div className="col-md-12">
                  <div className="stat-card-lg">
                    <h4 className="text-primary">Categorías</h4>
                    <div className="p-3 bg-light rounded">
                      {estadisticasGenerales.categorias.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                          {estadisticasGenerales.categorias.map((categoria, index) => (
                            <span key={`categoria-badge-${index}`} className="badge bg-primary">
                              {categoria}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted">No hay categorías registradas</p>
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

      {/* Modal para ver clubes del campeonato */}
      {showClubesModal && currentCampeonato && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-shield-alt me-2"></i>
                Clubes del Campeonato: {currentCampeonato.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowClubesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-4">
                <i className="fas fa-info-circle me-2"></i>
                Total de clubes inscritos: <strong>{clubesCampeonato.length}</strong>
              </div>

              {clubesCampeonato.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-shield-alt fa-3x text-muted mb-3"></i>
                  <h4>No hay clubes inscritos en este campeonato</h4>
                  <p>Inscribe clubes usando el botón "Inscribir Club"</p>
                  <button 
                    className="btn btn-success mt-3"
                    onClick={() => {
                      setShowClubesModal(false);
                      handleOpenInscribirClub(currentCampeonato);
                    }}
                  >
                    <i className="fas fa-plus-circle me-2"></i> Inscribir Club
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Club</th>
                        <th>Representante</th>
                        <th>Contacto</th>
                        <th>Deportistas</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clubesCampeonato.map((club, index) => (
                        <tr key={`club-campeonato-${club.id_club}`}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              {club.logo && (
                                <img 
                                  src={`${API_URL.replace('/api', '')}/storage/${club.logo}`}
                                  alt={club.nombre}
                                  className="club-logo-small me-2"
                                />
                              )}
                              <div>
                                <strong>{club.nombre}</strong>
                                <div className="text-muted small">
                                  {club.categoria || 'Sin categoría'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{club.representante}</strong>
                          </td>
                          <td>
                            <div className="small">
                              <i className="fas fa-envelope me-1"></i>
                              {club.email}
                            </div>
                            <div className="small">
                              <i className="fas fa-phone me-1"></i>
                              {club.telefono}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary">
                              <i className="fas fa-users me-1"></i>
                              {club.deportistas?.length || 0}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${club.pivot?.estado === 'inscrito' ? 'bg-success' : 'bg-warning'}`}>
                              {club.pivot?.estado || 'No especificado'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleEliminarClub(club.id_club)}
                                title="Eliminar del campeonato"
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
                        <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowClubesModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => {
                  setShowClubesModal(false);
                  handleOpenInscribirClub(currentCampeonato);
                }}
              >
                <i className="fas fa-plus-circle me-2"></i> Inscribir Club
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver partidos del campeonato */}
      {showPartidosModal && currentCampeonato && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-warning text-white">
              <h3>
                <i className="fas fa-futbol me-2"></i>
                Partidos del Campeonato: {currentCampeonato.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowPartidosModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning mb-4">
                <i className="fas fa-info-circle me-2"></i>
                Total de partidos programados: <strong>{partidosCampeonato.length}</strong>
              </div>

              {partidosCampeonato.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-futbol fa-3x text-muted mb-3"></i>
                  <h4>No hay partidos programados</h4>
                  <p>Los partidos se generan automáticamente cuando se inscriben los clubes</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Local</th>
                        <th>vs</th>
                        <th>Visitante</th>
                        <th>Resultado</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidosCampeonato.map((partido, index) => (
                        <tr key={`partido-${partido.id_partido}`}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="small">
                              {formatFechaHora(partido.fecha_hora)}
                            </div>
                            <div className="text-muted small">
                              {partido.lugar}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {partido.club_local?.logo && (
                                <img 
                                  src={`${API_URL.replace('/api', '')}/storage/${partido.club_local.logo}`}
                                  alt={partido.club_local.nombre}
                                  className="club-logo-xs me-2"
                                />
                              )}
                              <span>{partido.club_local?.nombre}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-secondary">VS</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {partido.club_visitante?.logo && (
                                <img 
                                  src={`${API_URL.replace('/api', '')}/storage/${partido.club_visitante.logo}`}
                                  alt={partido.club_visitante.nombre}
                                  className="club-logo-xs me-2"
                                />
                              )}
                              <span>{partido.club_visitante?.nombre}</span>
                            </div>
                          </td>
                          <td>
                            <div className="text-center">
                              <span className="badge bg-dark fs-6">
                                {partido.goles_local !== null ? partido.goles_local : '-'}
                                <span className="mx-1">-</span>
                                {partido.goles_visitante !== null ? partido.goles_visitante : '-'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${partido.estado === 'finalizado' ? 'bg-success' : 
                                               partido.estado === 'en_juego' ? 'bg-warning' : 'bg-secondary'}`}>
                              {partido.estado}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-info"
                                title="Ver detalles"
                                onClick={() => {
                                  // Aquí puedes implementar la función para ver detalles del partido
                                  alert(`Detalles del partido: ${partido.id_partido}`);
                                }}
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                title="Editar resultado"
                                onClick={() => {
                                  // Aquí puedes implementar la función para editar el partido
                                  alert(`Editar partido: ${partido.id_partido}`);
                                }}
                              >
                                <i className="fas fa-edit"></i>
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
                  // Función para generar partidos automáticamente
                  if (window.confirm('¿Generar partidos automáticamente para todos los clubes inscritos?')) {
                    alert('Funcionalidad en desarrollo');
                  }
                }}
              >
                <i className="fas fa-cogs me-2"></i> Generar Partidos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para tabla de posiciones */}
      {showTablaPosicionesModal && currentCampeonato && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-list-ol me-2"></i>
                Tabla de Posiciones: {currentCampeonato.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowTablaPosicionesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-success mb-4">
                <i className="fas fa-info-circle me-2"></i>
                Clasificación actual del campeonato
              </div>

              {tablaPosiciones.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-list-ol fa-3x text-muted mb-3"></i>
                  <h4>No hay tabla de posiciones disponible</h4>
                  <p>La tabla se genera automáticamente cuando hay partidos jugados</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Pos</th>
                        <th>Club</th>
                        <th>PJ</th>
                        <th>PG</th>
                        <th>PE</th>
                        <th>PP</th>
                        <th>GF</th>
                        <th>GC</th>
                        <th>DG</th>
                        <th>PTS</th>
                        <th>Forma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tablaPosiciones.map((posicion, index) => (
                        <tr key={`posicion-${posicion.id_club}`}>
                          <td>
                            <span className={`badge ${index < 3 ? 'bg-success' : 'bg-secondary'} fs-6`}>
                              {index + 1}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {posicion.club?.logo && (
                                <img 
                                  src={`${API_URL.replace('/api', '')}/storage/${posicion.club.logo}`}
                                  alt={posicion.club.nombre}
                                  className="club-logo-xs me-2"
                                />
                              )}
                              <span>{posicion.club?.nombre}</span>
                            </div>
                          </td>
                          <td><strong>{posicion.partidos_jugados}</strong></td>
                          <td className="text-success"><strong>{posicion.partidos_ganados}</strong></td>
                          <td className="text-warning"><strong>{posicion.partidos_empatados}</strong></td>
                          <td className="text-danger"><strong>{posicion.partidos_perdidos}</strong></td>
                          <td><strong>{posicion.goles_a_favor}</strong></td>
                          <td><strong>{posicion.goles_en_contra}</strong></td>
                          <td>
                            <span className={`badge ${posicion.diferencia_goles >= 0 ? 'bg-success' : 'bg-danger'}`}>
                              {posicion.diferencia_goles}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-primary fs-6">{posicion.puntos}</span>
                          </td>
                          <td>
                            <div className="d-flex">
                              {posicion.ultimos_partidos?.slice(-5).map((resultado, i) => (
                                <span 
                                  key={`resultado-${i}`}
                                  className={`resultado-punto ${resultado === 'G' ? 'bg-success' : 
                                             resultado === 'E' ? 'bg-warning' : 'bg-danger'}`}
                                  title={resultado === 'G' ? 'Ganado' : resultado === 'E' ? 'Empatado' : 'Perdido'}
                                >
                                  {resultado}
                                </span>
                              ))}
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
                onClick={() => setShowTablaPosicionesModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => {
                  // Función para actualizar tabla de posiciones
                  fetchTablaPosiciones(currentCampeonato.id_campeonato);
                  setSuccessMessage('Tabla de posiciones actualizada');
                  setTimeout(() => setSuccessMessage(''), 2000);
                }}
              >
                <i className="fas fa-sync-alt me-2"></i> Actualizar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  alert('Funcionalidad de impresión en desarrollo');
                }}
              >
                <i className="fas fa-print me-2"></i> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para inscribir club */}
      {showInscribirClubModal && currentCampeonato && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Inscribir Club en: {currentCampeonato.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowInscribirClubModal(false)}
              ></button>
            </div>
            <form onSubmit={handleInscribirClub}>
              <div className="modal-body">
                <div className="alert alert-info mb-4">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Importante:</strong> El club debe estar registrado en el sistema para poder inscribirlo.
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Seleccionar Club *</label>
                      <select
                        className="form-control"
                        value={inscripcionForm.id_club}
                        onChange={(e) => setInscripcionForm({
                          ...inscripcionForm,
                          id_club: e.target.value
                        })}
                        required
                      >
                        <option value="">Seleccione un club</option>
                        {clubes
                          .filter(club => !clubesCampeonato.some(c => c.id_club == club.id_club))
                          .map(club => (
                            <option key={`club-opt-${club.id_club}`} value={club.id_club}>
                              {club.nombre} ({club.categoria || 'Sin categoría'})
                            </option>
                          ))}
                      </select>
                      <small className="text-muted">
                        Solo se muestran clubes no inscritos en este campeonato
                      </small>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha de Inscripción *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={inscripcionForm.fecha_inscripcion}
                        onChange={(e) => setInscripcionForm({
                          ...inscripcionForm,
                          fecha_inscripcion: e.target.value
                        })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    value={inscripcionForm.observaciones}
                    onChange={(e) => setInscripcionForm({
                      ...inscripcionForm,
                      observaciones: e.target.value
                    })}
                    rows="3"
                    placeholder="Observaciones sobre la inscripción del club..."
                  />
                </div>

                {/* Información del campeonato */}
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Información del Campeonato</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Nombre:</strong> {currentCampeonato.nombre}</p>
                        <p><strong>Categoría:</strong> {currentCampeonato.categoria}</p>
                        <p><strong>Estado:</strong> 
                          <span className={`badge estado-badge estado-${currentCampeonato.estado} ms-2`}>
                            {currentCampeonato.estado}
                          </span>
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Fecha Inicio:</strong> {formatFecha(currentCampeonato.fecha_inicio)}</p>
                        <p><strong>Fecha Fin:</strong> {formatFecha(currentCampeonato.fecha_fin)}</p>
                        <p><strong>Clubes inscritos:</strong> {clubesCampeonato.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clubes ya inscritos */}
                {clubesCampeonato.length > 0 && (
                  <div className="card">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">Clubes Ya Inscritos ({clubesCampeonato.length})</h6>
                    </div>
                    <div className="card-body">
                      <div className="d-flex flex-wrap gap-2">
                        {clubesCampeonato.slice(0, 10).map(club => (
                          <span key={`club-inscrito-${club.id_club}`} className="badge bg-info">
                            {club.nombre}
                          </span>
                        ))}
                        {clubesCampeonato.length > 10 && (
                          <span className="badge bg-secondary">
                            +{clubesCampeonato.length - 10} más...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowInscribirClubModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  <i className="fas fa-check-circle me-2"></i> Inscribir Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver reglas */}
      {showReglasModal && currentCampeonato && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-secondary text-white">
              <h3>
                <i className="fas fa-book me-2"></i>
                Reglas del Campeonato: {currentCampeonato.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowReglasModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {(() => {
                const reglas = parsearReglas(currentCampeonato.reglas);
                
                if (reglas.length === 0) {
                  return (
                    <div className="text-center py-5">
                      <i className="fas fa-book fa-3x text-muted mb-3"></i>
                      <h4>No hay reglas registradas</h4>
                      <p>Este campeonato no tiene reglas específicas definidas</p>
                      <button 
                        className="btn btn-warning mt-3"
                        onClick={() => {
                          setShowReglasModal(false);
                          handleEdit(currentCampeonato);
                        }}
                      >
                        <i className="fas fa-edit me-2"></i> Agregar Reglas
                      </button>
                    </div>
                  );
                }
                
                return (
                  <div className="reglas-content">
                    <div className="alert alert-info mb-4">
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>Total de reglas:</strong> {reglas.length}
                    </div>
                    
                    <div className="list-group">
                      {reglas.map((regla, index) => (
                        <div key={`regla-view-${index}`} className="list-group-item">
                          <div className="d-flex align-items-start">
                            <span className="badge bg-primary me-3 mt-1">{index + 1}</span>
                            <div className="flex-grow-1">
                              <p className="mb-0">{regla}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowReglasModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-warning"
                onClick={() => {
                  setShowReglasModal(false);
                  handleEdit(currentCampeonato);
                }}
              >
                <i className="fas fa-edit me-2"></i> Editar Reglas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campeonatos;