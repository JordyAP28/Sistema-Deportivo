import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/clubes.css';

const API_URL = 'http://localhost:8000/api';

const Clubes = () => {
  // Estados principales
  const [clubes, setClubes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [showDeportistasModal, setShowDeportistasModal] = useState(false);
  const [showCampeonatosModal, setShowCampeonatosModal] = useState(false);
  const [showPartidosModal, setShowPartidosModal] = useState(false);
  const [showAgregarDeportistaModal, setShowAgregarDeportistaModal] = useState(false);
  
  // Estados para datos
  const [currentClub, setCurrentClub] = useState(null);
  const [deportistas, setDeportistas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [deportistasClub, setDeportistasClub] = useState([]);
  const [campeonatosClub, setCampeonatosClub] = useState([]);
  const [partidosClub, setPartidosClub] = useState({ local: [], visitante: [] });
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Form state para nuevo/editar club
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    fecha_creacion: '',
    fecha_fundacion: '',
    representante: '',
    email: '',
    telefono: '',
    direccion: '',
    descripcion: '',
    estado: 'activo',
    redes_sociales: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: ''
    }
  });

  // Form state para agregar deportista
  const [deportistaForm, setDeportistaForm] = useState({
    id_deportista: '',
    fecha_ingreso: '',
    numero_camiseta: '',
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
    fetchClubes();
    fetchDeportistas();
    // fetchEstadisticas(); // Comentado temporalmente
  }, []);

  // Cargar todos los clubes
  const fetchClubes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/clubes`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setClubes(response.data.data);
      } else {
        setError('Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('Error al cargar clubes:', err);
      setError('Error al cargar clubes: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar deportistas
  const fetchDeportistas = async () => {
    try {
      const response = await axios.get(`${API_URL}/deportistas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setDeportistas(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar deportistas:', err);
    }
  };

  // Cargar estadísticas
  const fetchEstadisticas = async () => {
    try {
      const response = await axios.get(`${API_URL}/clubes/estadisticas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setEstadisticas(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Cargar deportistas de un club
  const fetchDeportistasClub = async (clubId) => {
    try {
      const response = await axios.get(`${API_URL}/clubes/${clubId}/deportistas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setDeportistasClub(response.data.data.deportistas || []);
      }
    } catch (err) {
      console.error('Error al cargar deportistas del club:', err);
    }
  };

  // Cargar campeonatos de un club
  const fetchCampeonatosClub = async (clubId) => {
    try {
      const response = await axios.get(`${API_URL}/clubes/${clubId}/campeonatos`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setCampeonatosClub(response.data.data.campeonatos || []);
      }
    } catch (err) {
      console.error('Error al cargar campeonatos del club:', err);
    }
  };

  // Cargar partidos de un club
  const fetchPartidosClub = async (clubId) => {
    try {
      const response = await axios.get(`${API_URL}/clubes/${clubId}/partidos`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setPartidosClub(response.data.data.partidos || { local: [], visitante: [] });
      }
    } catch (err) {
      console.error('Error al cargar partidos del club:', err);
    }
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      fetchClubes();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/clubes/buscar`, {
        params: { busqueda: searchTerm },
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setClubes(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar clubes: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clubes
  const filtrarClubes = () => {
    try {
      let clubesFiltrados = [...clubes];
      
      if (filterEstado) {
        clubesFiltrados = clubesFiltrados.filter(c => c.estado === filterEstado);
      }
      
      setClubes(clubesFiltrados);
    } catch (err) {
      console.error('Error al filtrar:', err);
      setError('Error al filtrar clubes: ' + err.message);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    fetchClubes();
  };

  // Crear club
  const handleCreate = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    
    // Agregar campos del formulario
    Object.keys(formData).forEach(key => {
      if (key === 'redes_sociales') {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Agregar logo si existe
    if (formData.logo instanceof File) {
      formDataToSend.append('logo', formData.logo);
    }

    try {
      const response = await axios.post(`${API_URL}/clubes`, formDataToSend, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchClubes();
        setSuccessMessage('Club creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear club:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al crear club: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar club
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentClub) return;

    const formDataToSend = new FormData();
    
    // Agregar campos del formulario
    Object.keys(formData).forEach(key => {
      if (key === 'redes_sociales') {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Agregar logo si es un archivo nuevo
    if (formData.logo instanceof File) {
      formDataToSend.append('logo', formData.logo);
    }

    try {
      const response = await axios.post(`${API_URL}/clubes/${currentClub.id_club}?_method=PUT`, formDataToSend, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchClubes();
        setSuccessMessage('Club actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar club:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al actualizar club: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar club
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este club?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/clubes/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchClubes();
        setSuccessMessage('Club eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar club:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al eliminar club: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Restaurar club
  const handleRestore = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/clubes/${id}/restore`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchClubes();
        setSuccessMessage('Club restaurado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al restaurar club:', err);
      setError('Error al restaurar club: ' + (err.response?.data?.message || err.message));
    }
  };

  // Agregar deportista a club
  const handleAgregarDeportista = async (e) => {
    e.preventDefault();
    
    if (!currentClub) return;

    try {
      const response = await axios.post(`${API_URL}/clubes/${currentClub.id_club}/agregar-deportista`, deportistaForm, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowAgregarDeportistaModal(false);
        setDeportistaForm({
          id_deportista: '',
          fecha_ingreso: '',
          numero_camiseta: '',
          observaciones: ''
        });
        setSuccessMessage('Deportista agregado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al agregar deportista:', err);
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
        setError('Error al agregar deportista: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Editar club
  const handleEdit = (club) => {
    setCurrentClub(club);
    
    // Parsear redes sociales
    let redesSociales = {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: ''
    };
    
    try {
      if (club.redes_sociales) {
        const redes = typeof club.redes_sociales === 'string' 
          ? JSON.parse(club.redes_sociales) 
          : club.redes_sociales;
        
        redesSociales = { ...redesSociales, ...redes };
      }
    } catch (err) {
      console.error('Error al parsear redes sociales:', err);
    }
    
    setFormData({
      nombre: club.nombre || '',
      slug: club.slug || '',
      fecha_creacion: club.fecha_creacion?.split('T')[0] || '',
      fecha_fundacion: club.fecha_fundacion?.split('T')[0] || '',
      representante: club.representante || '',
      email: club.email || '',
      telefono: club.telefono || '',
      direccion: club.direccion || '',
      descripcion: club.descripcion || '',
      estado: club.estado || 'activo',
      redes_sociales: redesSociales,
      logo: null
    });
    
    setLogoPreview(club.logo ? `${API_URL.replace('/api', '')}/storage/${club.logo}` : null);
    setShowEditModal(true);
  };

  // Ver detalles
  const handleViewDetails = (club) => {
    setCurrentClub(club);
    setShowDetallesModal(true);
  };

  // Ver deportistas
  const handleViewDeportistas = (club) => {
    setCurrentClub(club);
    fetchDeportistasClub(club.id_club);
    setShowDeportistasModal(true);
  };

  // Ver campeonatos
  const handleViewCampeonatos = (club) => {
    setCurrentClub(club);
    fetchCampeonatosClub(club.id_club);
    setShowCampeonatosModal(true);
  };

  // Ver partidos
  const handleViewPartidos = (club) => {
    setCurrentClub(club);
    fetchPartidosClub(club.id_club);
    setShowPartidosModal(true);
  };

  // Abrir modal para agregar deportista
  const handleOpenAgregarDeportista = (club) => {
    setCurrentClub(club);
    setDeportistaForm({
      id_deportista: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      numero_camiseta: '',
      observaciones: ''
    });
    setShowAgregarDeportistaModal(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      slug: '',
      fecha_creacion: '',
      fecha_fundacion: '',
      representante: '',
      email: '',
      telefono: '',
      direccion: '',
      descripcion: '',
      estado: 'activo',
      redes_sociales: {
        facebook: '',
        twitter: '',
        instagram: '',
        youtube: ''
      },
      logo: null
    });
    setLogoPreview(null);
    setCurrentClub(null);
  };

  // Manejar cambio de logo
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
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

  // Obtener clubes filtrados
  const getFilteredClubes = () => {
    let filtered = clubes;
    
    if (filterEstado) {
      filtered = filtered.filter(c => c.estado === filterEstado);
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

  // Obtener deportista por ID
  const getDeportistaById = (id) => {
    return deportistas.find(d => d.id_deportista == id);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  // Función para calcular estadísticas manualmente
  const calcularEstadisticas = () => {
    if (clubes.length === 0) return null;
    
    const total = clubes.length;
    const activos = clubes.filter(c => c.estado === 'activo').length;
    const inactivos = clubes.filter(c => c.estado === 'inactivo').length;
    const suspendidos = clubes.filter(c => c.estado === 'suspendido').length;
    
    // Club con más deportistas
    const clubConMasDeportistas = [...clubes]
      .sort((a, b) => (b.deportistas?.length || 0) - (a.deportistas?.length || 0))
      .shift();
    
    // Club con más campeonatos
    const clubConMasCampeonatos = [...clubes]
      .sort((a, b) => (b.campeonatos?.length || 0) - (a.campeonatos?.length || 0))
      .shift();
    
    return {
      total,
      activos,
      inactivos,
      suspendidos,
      club_con_mas_deportistas: clubConMasDeportistas,
      club_con_mas_campeonatos: clubConMasCampeonatos
    };
  };

  const clubesFiltrados = getFilteredClubes();
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
                <i className="fas fa-shield-alt me-2"></i>
                Gestión de Clubes
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
                  <i className="fas fa-plus"></i> Nuevo Club
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Filtros y búsqueda */}
              <div className="filters-section mb-4">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Buscar</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre, representante, email..."
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
                  
                  <div className="col-md-3">
                    <label className="form-label">Estado</label>
                    <select 
                      className="form-select"
                      value={filterEstado}
                      onChange={(e) => setFilterEstado(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={filtrarClubes}
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
              {estadisticasCalculadas && (
                <div className="stats-section mb-4">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <div className="stat-card">
                        <h4>{estadisticasCalculadas.total}</h4>
                        <p>Total Clubes</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stat-card bg-success text-white">
                        <h4>{estadisticasCalculadas.activos}</h4>
                        <p>Activos</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stat-card bg-warning text-white">
                        <h4>{estadisticasCalculadas.inactivos}</h4>
                        <p>Inactivos</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stat-card bg-danger text-white">
                        <h4>{estadisticasCalculadas.suspendidos}</h4>
                        <p>Suspendidos</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de clubes */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando clubes...</p>
                </div>
              ) : clubesFiltrados.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-shield-alt fa-3x text-muted mb-3"></i>
                  <h4>No hay clubes registrados</h4>
                  <p>Crea tu primer club usando el botón "Nuevo Club"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Logo</th>
                        <th>Nombre</th>
                        <th>Representante</th>
                        <th>Contacto</th>
                        <th>Estado</th>
                        <th>Deportistas</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clubesFiltrados.map((club) => (
                        <tr key={`club-${club.id_club}`}>
                          <td>
                            <div className="club-logo-container">
                              {club.logo ? (
                                <img 
                                  src={`${API_URL.replace('/api', '')}/storage/${club.logo}`}
                                  alt={club.nombre}
                                  className="club-logo"
                                />
                              ) : (
                                <div className="club-logo-placeholder">
                                  <i className="fas fa-shield-alt"></i>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <strong>{club.nombre}</strong>
                            <div className="text-muted small">
                              Creado: {formatFecha(club.fecha_creacion)}
                            </div>
                            {club.fecha_fundacion && (
                              <div className="text-muted small">
                                Fundación: {formatFecha(club.fecha_fundacion)}
                              </div>
                            )}
                          </td>
                          <td>
                            <strong>{club.representante}</strong>
                            <div className="text-muted small">
                              {club.direccion || 'Sin dirección'}
                            </div>
                          </td>
                          <td>
                            <div>
                              <i className="fas fa-envelope me-1"></i>
                              <a href={`mailto:${club.email}`}>{club.email}</a>
                            </div>
                            <div className="mt-1">
                              <i className="fas fa-phone me-1"></i>
                              {club.telefono}
                            </div>
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${club.estado}`}>
                              {club.estado}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="badge bg-info me-2">
                                <i className="fas fa-users me-1"></i>
                                {club.deportistas?.length || 0}
                              </span>
                              <span className="badge bg-warning">
                                <i className="fas fa-trophy me-1"></i>
                                {club.campeonatos?.length || 0}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetails(club)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEdit(club)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewDeportistas(club)}
                                title="Ver deportistas"
                              >
                                <i className="fas fa-users"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleOpenAgregarDeportista(club)}
                                title="Agregar deportista"
                              >
                                <i className="fas fa-user-plus"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(club.id_club)}
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

      {/* Modal para crear club */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nuevo Club
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
                          <label className="form-label">Nombre del Club *</label>
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
                          <small className="text-muted">URL amigable para el club</small>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Fecha de Creación *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.fecha_creacion}
                            onChange={(e) => setFormData({...formData, fecha_creacion: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Fecha de Fundación</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.fecha_fundacion}
                            onChange={(e) => setFormData({...formData, fecha_fundacion: e.target.value})}
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
                          <label className="form-label">Estado</label>
                          <select
                            className="form-control"
                            value={formData.estado}
                            onChange={(e) => setFormData({...formData, estado: e.target.value})}
                          >
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                            <option value="suspendido">Suspendido</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Email *</label>
                          <input
                            type="email"
                            className="form-control"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label className="form-label">Teléfono *</label>
                          <input
                            type="tel"
                            className="form-control"
                            value={formData.telefono}
                            onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Dirección</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.direccion}
                        onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-control"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        rows="3"
                        placeholder="Descripción del club..."
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Logo del Club</label>
                      <div className="logo-upload-container">
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="logo-preview"
                          />
                        ) : (
                          <div className="logo-placeholder">
                            <i className="fas fa-camera fa-3x"></i>
                            <p>Click para subir logo</p>
                          </div>
                        )}
                        <input
                          type="file"
                          className="logo-input"
                          accept="image/*"
                          onChange={handleLogoChange}
                        />
                      </div>
                      <small className="text-muted d-block mt-2">
                        Tamaño máximo: 2MB. Formatos: JPG, PNG, GIF
                      </small>
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label">Redes Sociales</label>
                      <div className="social-media-inputs">
                        <div className="input-group mb-2">
                          <span className="input-group-text bg-primary text-white">
                            <i className="fab fa-facebook-f"></i>
                          </span>
                          <input
                            type="url"
                            className="form-control"
                            placeholder="Facebook URL"
                            value={formData.redes_sociales.facebook}
                            onChange={(e) => setFormData({
                              ...formData,
                              redes_sociales: {
                                ...formData.redes_sociales,
                                facebook: e.target.value
                              }
                            })}
                          />
                        </div>
                        <div className="input-group mb-2">
                          <span className="input-group-text bg-info text-white">
                            <i className="fab fa-twitter"></i>
                          </span>
                          <input
                            type="url"
                            className="form-control"
                            placeholder="Twitter URL"
                            value={formData.redes_sociales.twitter}
                            onChange={(e) => setFormData({
                              ...formData,
                              redes_sociales: {
                                ...formData.redes_sociales,
                                twitter: e.target.value
                              }
                            })}
                          />
                        </div>
                        <div className="input-group mb-2">
                          <span className="input-group-text bg-gradient-instagram text-white">
                            <i className="fab fa-instagram"></i>
                          </span>
                          <input
                            type="url"
                            className="form-control"
                            placeholder="Instagram URL"
                            value={formData.redes_sociales.instagram}
                            onChange={(e) => setFormData({
                              ...formData,
                              redes_sociales: {
                                ...formData.redes_sociales,
                                instagram: e.target.value
                              }
                            })}
                          />
                        </div>
                        <div className="input-group mb-2">
                          <span className="input-group-text bg-danger text-white">
                            <i className="fab fa-youtube"></i>
                          </span>
                          <input
                            type="url"
                            className="form-control"
                            placeholder="YouTube URL"
                            value={formData.redes_sociales.youtube}
                            onChange={(e) => setFormData({
                              ...formData,
                              redes_sociales: {
                                ...formData.redes_sociales,
                                youtube: e.target.value
                              }
                            })}
                          />
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
                  Guardar Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar club (similar al de crear pero con PUT) */}
      {/* ... código similar al modal de crear pero con handleUpdate ... */}

      {/* Modal para ver detalles */}
      {showDetallesModal && currentClub && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-shield-alt me-2"></i>
                Detalles del Club: {currentClub.nombre}
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
                    {currentClub.logo ? (
                      <img 
                        src={`${API_URL.replace('/api', '')}/storage/${currentClub.logo}`}
                        alt={currentClub.nombre}
                        className="club-logo-large"
                      />
                    ) : (
                      <div className="club-logo-large-placeholder">
                        <i className="fas fa-shield-alt fa-5x"></i>
                      </div>
                    )}
                    <h4 className="mt-3">{currentClub.nombre}</h4>
                    <span className={`badge estado-badge estado-${currentClub.estado} mt-2`}>
                      {currentClub.estado}
                    </span>
                  </div>
                  
                  <div className="info-section">
                    <h5 className="text-primary">
                      <i className="fas fa-id-card me-2"></i>Información General
                    </h5>
                    <div className="info-item">
                      <strong>Representante:</strong> {currentClub.representante}
                    </div>
                    <div className="info-item">
                      <strong>Fecha Creación:</strong> {formatFecha(currentClub.fecha_creacion)}
                    </div>
                    {currentClub.fecha_fundacion && (
                      <div className="info-item">
                        <strong>Fecha Fundación:</strong> {formatFecha(currentClub.fecha_fundacion)}
                      </div>
                    )}
                    <div className="info-item">
                      <strong>Slug:</strong> {currentClub.slug}
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
                      <a href={`mailto:${currentClub.email}`} className="ms-2">
                        {currentClub.email}
                      </a>
                    </div>
                    <div className="info-item">
                      <i className="fas fa-phone me-2 text-primary"></i>
                      <strong>Teléfono:</strong> 
                      <span className="ms-2">{currentClub.telefono}</span>
                    </div>
                    {currentClub.direccion && (
                      <div className="info-item">
                        <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                        <strong>Dirección:</strong> 
                        <span className="ms-2">{currentClub.direccion}</span>
                      </div>
                    )}
                  </div>

                  {currentClub.descripcion && (
                    <div className="info-section mb-4">
                      <h5 className="text-primary">
                        <i className="fas fa-align-left me-2"></i>Descripción
                      </h5>
                      <p className="p-3 bg-light rounded">{currentClub.descripcion}</p>
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6">
                      <div className="info-section">
                        <h5 className="text-primary">
                          <i className="fas fa-users me-2"></i>Deportistas
                        </h5>
                        <div className="text-center">
                          <h2 className="display-4 text-primary">
                            {currentClub.deportistas?.length || 0}
                          </h2>
                          <button 
                            className="btn btn-outline-primary btn-sm mt-2"
                            onClick={() => {
                              setShowDetallesModal(false);
                              handleViewDeportistas(currentClub);
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
                          <i className="fas fa-trophy me-2"></i>Campeonatos
                        </h5>
                        <div className="text-center">
                          <h2 className="display-4 text-warning">
                            {currentClub.campeonatos?.length || 0}
                          </h2>
                          <button 
                            className="btn btn-outline-warning btn-sm mt-2"
                            onClick={() => {
                              setShowDetallesModal(false);
                              handleViewCampeonatos(currentClub);
                            }}
                          >
                            Ver Detalles
                          </button>
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
                  handleEdit(currentClub);
                }}
              >
                <i className="fas fa-edit"></i> Editar
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => {
                  setShowDetallesModal(false);
                  handleOpenAgregarDeportista(currentClub);
                }}
              >
                <i className="fas fa-user-plus"></i> Agregar Deportista
              </button>
            </div>
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
                Estadísticas de Clubes
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
                        <span>Total Clubes:</span>
                        <strong>{estadisticasCalculadas.total}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Activos:</span>
                        <strong>{estadisticasCalculadas.activos}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-warning">
                        <span>Inactivos:</span>
                        <strong>{estadisticasCalculadas.inactivos}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-danger">
                        <span>Suspendidos:</span>
                        <strong>{estadisticasCalculadas.suspendidos}</strong>
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
                          className="progress-bar bg-success" 
                          style={{width: `${(estadisticasCalculadas.activos / estadisticasCalculadas.total) * 100 || 0}%`}}
                        >
                          Activos: {estadisticasCalculadas.activos}
                        </div>
                      </div>
                      <div className="progress mb-2">
                        <div 
                          className="progress-bar bg-warning" 
                          style={{width: `${(estadisticasCalculadas.inactivos / estadisticasCalculadas.total) * 100 || 0}%`}}
                        >
                          Inactivos: {estadisticasCalculadas.inactivos}
                        </div>
                      </div>
                      <div className="progress mb-2">
                        <div 
                          className="progress-bar bg-danger" 
                          style={{width: `${(estadisticasCalculadas.suspendidos / estadisticasCalculadas.total) * 100 || 0}%`}}
                        >
                          Suspendidos: {estadisticasCalculadas.suspendidos}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {estadisticasCalculadas.club_con_mas_deportistas && (
                <div className="row">
                  <div className="col-md-6">
                    <div className="stat-card-lg mb-4">
                      <h4 className="text-primary">Club con Más Deportistas</h4>
                      <div className="p-3 bg-light rounded">
                        <h5>{estadisticasCalculadas.club_con_mas_deportistas.nombre}</h5>
                        <p className="mb-1">
                          <i className="fas fa-users text-primary me-2"></i>
                          Total deportistas: {estadisticasCalculadas.club_con_mas_deportistas.deportistas?.length || 0}
                        </p>
                        <p className="mb-0">
                          <i className="fas fa-star text-warning me-2"></i>
                          Representante: {estadisticasCalculadas.club_con_mas_deportistas.representante}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {estadisticasCalculadas.club_con_mas_campeonatos && (
                <div className="row">
                  <div className="col-md-6">
                    <div className="stat-card-lg">
                      <h4 className="text-primary">Club con Más Campeonatos</h4>
                      <div className="p-3 bg-light rounded">
                        <h5>{estadisticasCalculadas.club_con_mas_campeonatos.nombre}</h5>
                        <p className="mb-1">
                          <i className="fas fa-trophy text-warning me-2"></i>
                          Total campeonatos: {estadisticasCalculadas.club_con_mas_campeonatos.campeonatos?.length || 0}
                        </p>
                        <p className="mb-0">
                          <i className="fas fa-star text-warning me-2"></i>
                          Representante: {estadisticasCalculadas.club_con_mas_campeonatos.representante}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

      {/* Modal para agregar deportista */}
      {showAgregarDeportistaModal && currentClub && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-user-plus me-2"></i>
                Agregar Deportista a {currentClub.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowAgregarDeportistaModal(false)}
              ></button>
            </div>
            <form onSubmit={handleAgregarDeportista}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="form-label">Deportista *</label>
                  <select
                    className="form-control"
                    value={deportistaForm.id_deportista}
                    onChange={(e) => setDeportistaForm({...deportistaForm, id_deportista: e.target.value})}
                    required
                  >
                    <option value="">Seleccione deportista...</option>
                    {deportistas.map(deportista => {
                      const usuario = deportista.usuario;
                      return (
                        <option key={`deportista-${deportista.id_deportista}`} value={deportista.id_deportista}>
                          {usuario?.nombre} {usuario?.apellido} - {deportista.posiciones?.[0]?.nombre || 'Sin posición'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha de Ingreso *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={deportistaForm.fecha_ingreso}
                        onChange={(e) => setDeportistaForm({...deportistaForm, fecha_ingreso: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Número de Camiseta</label>
                      <input
                        type="number"
                        className="form-control"
                        value={deportistaForm.numero_camiseta}
                        onChange={(e) => setDeportistaForm({...deportistaForm, numero_camiseta: e.target.value})}
                        min="1"
                        max="99"
                        placeholder="Ej: 10"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    value={deportistaForm.observaciones}
                    onChange={(e) => setDeportistaForm({...deportistaForm, observaciones: e.target.value})}
                    rows="3"
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  El deportista será agregado como "activo" al club
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAgregarDeportistaModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Agregar Deportista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modales para deportistas, campeonatos y partidos del club */}
      {/* Modal para editar club */}
{showEditModal && currentClub && (
  <div className="modal-overlay">
    <div className="modal-content modal-lg">
      <div className="modal-header bg-warning text-white">
        <h3>
          <i className="fas fa-edit me-2"></i>
          Editar Club: {currentClub.nombre}
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
                    <label className="form-label">Nombre del Club *</label>
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
                    <small className="text-muted">URL amigable para el club</small>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Fecha de Creación *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.fecha_creacion}
                      onChange={(e) => setFormData({...formData, fecha_creacion: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Fecha de Fundación</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.fecha_fundacion}
                      onChange={(e) => setFormData({...formData, fecha_fundacion: e.target.value})}
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
                    <label className="form-label">Estado</label>
                    <select
                      className="form-control"
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label">Teléfono *</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  rows="3"
                  placeholder="Descripción del club..."
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="form-group mb-3">
                <label className="form-label">Logo del Club</label>
                <div className="logo-upload-container">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="logo-preview"
                    />
                  ) : (
                    <div className="logo-placeholder">
                      <i className="fas fa-camera fa-3x"></i>
                      <p>Click para cambiar logo</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="logo-input"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </div>
                <div className="mt-2">
                  {currentClub.logo && !logoPreview && (
                    <div className="alert alert-info p-2">
                      <i className="fas fa-info-circle me-2"></i>
                      Logo actual: {currentClub.logo.split('/').pop()}
                    </div>
                  )}
                </div>
                <small className="text-muted d-block mt-2">
                  Tamaño máximo: 2MB. Formatos: JPG, PNG, GIF
                </small>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Redes Sociales</label>
                <div className="social-media-inputs">
                  <div className="input-group mb-2">
                    <span className="input-group-text bg-primary text-white">
                      <i className="fab fa-facebook-f"></i>
                    </span>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Facebook URL"
                      value={formData.redes_sociales.facebook}
                      onChange={(e) => setFormData({
                        ...formData,
                        redes_sociales: {
                          ...formData.redes_sociales,
                          facebook: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div className="input-group mb-2">
                    <span className="input-group-text bg-info text-white">
                      <i className="fab fa-twitter"></i>
                    </span>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Twitter URL"
                      value={formData.redes_sociales.twitter}
                      onChange={(e) => setFormData({
                        ...formData,
                        redes_sociales: {
                          ...formData.redes_sociales,
                          twitter: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div className="input-group mb-2">
                    <span className="input-group-text bg-gradient-instagram text-white">
                      <i className="fab fa-instagram"></i>
                    </span>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Instagram URL"
                      value={formData.redes_sociales.instagram}
                      onChange={(e) => setFormData({
                        ...formData,
                        redes_sociales: {
                          ...formData.redes_sociales,
                          instagram: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div className="input-group mb-2">
                    <span className="input-group-text bg-danger text-white">
                      <i className="fab fa-youtube"></i>
                    </span>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="YouTube URL"
                      value={formData.redes_sociales.youtube}
                      onChange={(e) => setFormData({
                        ...formData,
                        redes_sociales: {
                          ...formData.redes_sociales,
                          youtube: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              {currentClub && (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Al actualizar el club, se mantendrán todos sus deportistas y campeonatos asociados.
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
            Actualizar Club
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* Modal para ver deportistas del club */}
{showDeportistasModal && currentClub && (
  <div className="modal-overlay">
    <div className="modal-content modal-lg">
      <div className="modal-header bg-info text-white">
        <h3>
          <i className="fas fa-users me-2"></i>
          Deportistas del Club: {currentClub.nombre}
        </h3>
        <button 
          className="btn-close btn-close-white"
          onClick={() => setShowDeportistasModal(false)}
        ></button>
      </div>
      <div className="modal-body">
        <div className="alert alert-info mb-4">
          <i className="fas fa-info-circle me-2"></i>
          Total de deportistas: <strong>{deportistasClub.length}</strong>
        </div>

        {deportistasClub.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-user-slash fa-3x text-muted mb-3"></i>
            <h4>No hay deportistas en este club</h4>
            <p>Agrega deportistas usando el botón "Agregar Deportista"</p>
            <button 
              className="btn btn-success mt-3"
              onClick={() => {
                setShowDeportistasModal(false);
                handleOpenAgregarDeportista(currentClub);
              }}
            >
              <i className="fas fa-user-plus me-2"></i> Agregar Deportista
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Deportista</th>
                  <th>Categoría</th>
                  <th>Posición</th>
                  <th>Fecha Ingreso</th>
                  <th>Camiseta</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {deportistasClub.map((deportista, index) => {
                  const usuario = deportista.usuario;
                  const categoria = deportista.categoria;
                  const posiciones = deportista.posiciones || [];
                  
                  return (
                    <tr key={`deportista-club-${deportista.id_deportista}`}>
                      <td>{index + 1}</td>
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
                        {categoria ? (
                          <span className="badge bg-primary">{categoria.nombre}</span>
                        ) : (
                          <span className="text-muted">Sin categoría</span>
                        )}
                      </td>
                      <td>
                        {posiciones.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {posiciones.map(pos => (
                              <span key={`pos-${pos.id_posicion}`} className="badge bg-info">
                                {pos.nombre}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">Sin posición</span>
                        )}
                      </td>
                      <td>
                        {deportista.pivot?.fecha_ingreso ? (
                          formatFecha(deportista.pivot.fecha_ingreso)
                        ) : (
                          <span className="text-muted">No especificada</span>
                        )}
                      </td>
                      <td>
                        {deportista.pivot?.numero_camiseta ? (
                          <span className="badge bg-dark fs-6">
                            #{deportista.pivot.numero_camiseta}
                          </span>
                        ) : (
                          <span className="text-muted">Sin número</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${deportista.pivot?.estado === 'activo' ? 'bg-success' : 'bg-warning'}`}>
                          {deportista.pivot?.estado || 'No especificado'}
                        </span>
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
          onClick={() => setShowDeportistasModal(false)}
        >
          Cerrar
        </button>
        <button 
          type="button" 
          className="btn btn-success"
          onClick={() => {
            setShowDeportistasModal(false);
            handleOpenAgregarDeportista(currentClub);
          }}
        >
          <i className="fas fa-user-plus me-2"></i> Agregar Deportista
        </button>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={() => {
            // Exportar lista de deportistas
            alert('Funcionalidad de exportación en desarrollo');
          }}
        >
          <i className="fas fa-download me-2"></i> Exportar Lista
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal para ver campeonatos del club */}
{showCampeonatosModal && currentClub && (
  <div className="modal-overlay">
    <div className="modal-content modal-lg">
      <div className="modal-header bg-warning text-white">
        <h3>
          <i className="fas fa-trophy me-2"></i>
          Campeonatos del Club: {currentClub.nombre}
        </h3>
        <button 
          className="btn-close btn-close-white"
          onClick={() => setShowCampeonatosModal(false)}
        ></button>
      </div>
      <div className="modal-body">
        <div className="alert alert-warning mb-4">
          <i className="fas fa-info-circle me-2"></i>
          Total de campeonatos: <strong>{campeonatosClub.length}</strong>
        </div>

        {campeonatosClub.length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-trophy fa-3x text-muted mb-3"></i>
            <h4>No hay campeonatos registrados</h4>
            <p>Este club no está participando en ningún campeonato actualmente</p>
          </div>
        ) : (
          <div className="row">
            {campeonatosClub.map((campeonato) => (
              <div key={`campeonato-${campeonato.id_campeonato}`} className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header bg-gradient-warning text-white">
                    <h5 className="mb-0">{campeonato.nombre}</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <strong>Tipo:</strong> {campeonato.tipo || 'No especificado'}
                    </div>
                    <div className="mb-2">
                      <strong>Fecha Inicio:</strong> {formatFecha(campeonato.fecha_inicio)}
                    </div>
                    <div className="mb-2">
                      <strong>Fecha Fin:</strong> {campeonato.fecha_fin ? formatFecha(campeonato.fecha_fin) : 'En curso'}
                    </div>
                    <div className="mb-2">
                      <strong>Estado:</strong> 
                      <span className={`badge ms-2 ${
                        campeonato.estado === 'activo' ? 'bg-success' :
                        campeonato.estado === 'finalizado' ? 'bg-primary' :
                        campeonato.estado === 'suspendido' ? 'bg-danger' : 'bg-secondary'
                      }`}>
                        {campeonato.estado || 'No especificado'}
                      </span>
                    </div>
                    {campeonato.descripcion && (
                      <div className="mb-3">
                        <strong>Descripción:</strong>
                        <p className="mt-1 text-muted">{campeonato.descripcion}</p>
                      </div>
                    )}
                  </div>
                  <div className="card-footer bg-light">
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">
                        <i className="fas fa-calendar me-1"></i>
                        Creado: {formatFecha(campeonato.created_at)}
                      </small>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          // Ver detalles del campeonato
                          alert(`Ver detalles del campeonato: ${campeonato.nombre}`);
                        }}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
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
          onClick={() => setShowCampeonatosModal(false)}
        >
          Cerrar
        </button>
        <button 
          type="button" 
          className="btn btn-warning"
          onClick={() => {
            // Inscribir a nuevo campeonato
            alert('Funcionalidad de inscripción a campeonatos en desarrollo');
          }}
        >
          <i className="fas fa-plus me-2"></i> Inscribir en Campeonato
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal para ver partidos del club */}
{showPartidosModal && currentClub && (
  <div className="modal-overlay">
    <div className="modal-content modal-lg">
      <div className="modal-header bg-primary text-white">
        <h3>
          <i className="fas fa-futbol me-2"></i>
          Partidos del Club: {currentClub.nombre}
        </h3>
        <button 
          className="btn-close btn-close-white"
          onClick={() => setShowPartidosModal(false)}
        ></button>
      </div>
      <div className="modal-body">
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="fas fa-home me-2"></i>Partidos como Local
                </h5>
              </div>
              <div className="card-body text-center">
                <h2 className="display-4 text-success">
                  {partidosClub.local?.length || 0}
                </h2>
                <p>Total de partidos jugados en casa</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">
                  <i className="fas fa-road me-2"></i>Partidos como Visitante
                </h5>
              </div>
              <div className="card-body text-center">
                <h2 className="display-4 text-info">
                  {partidosClub.visitante?.length || 0}
                </h2>
                <p>Total de partidos jugados fuera</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h5 className="text-primary">
            <i className="fas fa-calendar-alt me-2"></i>Próximos Partidos
          </h5>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Rival</th>
                  <th>Escenario</th>
                  <th>Estado</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {[...(partidosClub.local || []), ...(partidosClub.visitante || [])]
                  .filter(p => new Date(p.fecha) > new Date())
                  .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                  .slice(0, 5)
                  .map((partido) => (
                    <tr key={`proximo-partido-${partido.id_partido}`}>
                      <td>
                        {formatFecha(partido.fecha)}
                        <div className="text-muted small">
                          {new Date(partido.fecha).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td>
                        {partido.clubLocal.id_club === currentClub.id_club ? (
                          <span className="badge bg-success">Local</span>
                        ) : (
                          <span className="badge bg-info">Visitante</span>
                        )}
                      </td>
                      <td>
                        {partido.clubLocal.id_club === currentClub.id_club 
                          ? (partido.clubVisitante?.nombre || 'Por definir')
                          : (partido.clubLocal?.nombre || 'Por definir')
                        }
                      </td>
                      <td>
                        {partido.escenario?.nombre || 'Por definir'}
                      </td>
                      <td>
                        <span className={`badge ${
                          partido.estado === 'programado' ? 'bg-warning' :
                          partido.estado === 'en_juego' ? 'bg-info' :
                          partido.estado === 'finalizado' ? 'bg-success' :
                          partido.estado === 'cancelado' ? 'bg-danger' : 'bg-secondary'
                        }`}>
                          {partido.estado}
                        </span>
                      </td>
                      <td>
                        {partido.estado === 'finalizado' ? (
                          <strong>
                            {partido.goles_local} - {partido.goles_visitante}
                          </strong>
                        ) : (
                          <span className="text-muted">Por jugar</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-4">
          <h5 className="text-primary">
            <i className="fas fa-history me-2"></i>Últimos Partidos
          </h5>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Rival</th>
                  <th>Resultado</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {[...(partidosClub.local || []), ...(partidosClub.visitante || [])]
                  .filter(p => new Date(p.fecha) <= new Date())
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  .slice(0, 5)
                  .map((partido) => (
                    <tr key={`ultimo-partido-${partido.id_partido}`}>
                      <td>{formatFecha(partido.fecha)}</td>
                      <td>
                        {partido.clubLocal.id_club === currentClub.id_club ? (
                          <span className="badge bg-success">Local</span>
                        ) : (
                          <span className="badge bg-info">Visitante</span>
                        )}
                      </td>
                      <td>
                        {partido.clubLocal.id_club === currentClub.id_club 
                          ? (partido.clubVisitante?.nombre || 'Rival desconocido')
                          : (partido.clubLocal?.nombre || 'Rival desconocido')
                        }
                      </td>
                      <td>
                        {partido.estado === 'finalizado' ? (
                          <>
                            <strong>
                              {partido.goles_local} - {partido.goles_visitante}
                            </strong>
                            <div className={`small ${(
                              (partido.clubLocal.id_club === currentClub.id_club && partido.goles_local > partido.goles_visitante) ||
                              (partido.clubVisitante?.id_club === currentClub.id_club && partido.goles_visitante > partido.goles_local)
                            ) ? 'text-success' : 'text-danger'}`}>
                              {(
                                (partido.clubLocal.id_club === currentClub.id_club && partido.goles_local > partido.goles_visitante) ||
                                (partido.clubVisitante?.id_club === currentClub.id_club && partido.goles_visitante > partido.goles_local)
                              ) ? 'Victoria' : 'Derrota'}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted">No jugado</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          partido.estado === 'programado' ? 'bg-warning' :
                          partido.estado === 'en_juego' ? 'bg-info' :
                          partido.estado === 'finalizado' ? 'bg-success' :
                          partido.estado === 'cancelado' ? 'bg-danger' : 'bg-secondary'
                        }`}>
                          {partido.estado}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            // Ver detalles del partido
                            alert(`Ver detalles del partido: ${partido.id_partido}`);
                          }}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
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
            // Programar nuevo partido
            alert('Funcionalidad para programar partidos en desarrollo');
          }}
        >
          <i className="fas fa-plus me-2"></i> Programar Partido
        </button>
        <button 
          type="button" 
          className="btn btn-info"
          onClick={() => {
            // Ver calendario completo
            alert('Funcionalidad de calendario completo en desarrollo');
          }}
        >
          <i className="fas fa-calendar me-2"></i> Calendario Completo
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal para remover deportista (similar al de agregar) */}
{/* Agrega este modal si necesitas la funcionalidad de remover deportista */}

{showAgregarDeportistaModal && currentClub && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header bg-success text-white">
        <h3>
          <i className="fas fa-user-plus me-2"></i>
          Agregar Deportista a {currentClub.nombre}
        </h3>
        <button 
          className="btn-close btn-close-white"
          onClick={() => setShowAgregarDeportistaModal(false)}
        ></button>
      </div>
      <form onSubmit={handleAgregarDeportista}>
        <div className="modal-body">
          <div className="form-group mb-3">
            <label className="form-label">Deportista *</label>
            <select
              className="form-control"
              value={deportistaForm.id_deportista}
              onChange={(e) => setDeportistaForm({...deportistaForm, id_deportista: e.target.value})}
              required
            >
              <option value="">Seleccione deportista...</option>
              {deportistas.map(deportista => {
                const usuario = deportista.usuario;
                return (
                  <option key={`deportista-option-${deportista.id_deportista}`} value={deportista.id_deportista}>
                    {usuario?.nombre} {usuario?.apellido} - {deportista.posiciones?.[0]?.nombre || 'Sin posición'}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label className="form-label">Fecha de Ingreso *</label>
                <input
                  type="date"
                  className="form-control"
                  value={deportistaForm.fecha_ingreso}
                  onChange={(e) => setDeportistaForm({...deportistaForm, fecha_ingreso: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label className="form-label">Número de Camiseta</label>
                <input
                  type="number"
                  className="form-control"
                  value={deportistaForm.numero_camiseta}
                  onChange={(e) => setDeportistaForm({...deportistaForm, numero_camiseta: e.target.value})}
                  min="1"
                  max="99"
                  placeholder="Ej: 10"
                />
              </div>
            </div>
          </div>

          <div className="form-group mb-3">
            <label className="form-label">Observaciones</label>
            <textarea
              className="form-control"
              value={deportistaForm.observaciones}
              onChange={(e) => setDeportistaForm({...deportistaForm, observaciones: e.target.value})}
              rows="3"
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            El deportista será agregado como "activo" al club. Verifica que no esté ya en otro club activo.
          </div>
        </div>
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => setShowAgregarDeportistaModal(false)}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-success">
            Agregar Deportista
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* Modal para confirmar eliminación */}
{/* Este modal se activa con window.confirm, pero puedes reemplazarlo con un modal personalizado */}

{/* Modal personalizado para confirmar eliminación */}
{/* 
const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
const [clubToDelete, setClubToDelete] = useState(null);

const handleDeleteClick = (club) => {
  setClubToDelete(club);
  setShowConfirmDeleteModal(true);
};

{showConfirmDeleteModal && clubToDelete && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header bg-danger text-white">
        <h3>
          <i className="fas fa-exclamation-triangle me-2"></i>
          Confirmar Eliminación
        </h3>
        <button 
          className="btn-close btn-close-white"
          onClick={() => {
            setShowConfirmDeleteModal(false);
            setClubToDelete(null);
          }}
        ></button>
      </div>
      <div className="modal-body">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle me-2"></i>
          <strong>¡Advertencia!</strong> Esta acción no se puede deshacer.
        </div>
        
        <p>¿Está seguro de eliminar el club <strong>{clubToDelete.nombre}</strong>?</p>
        
        <div className="alert alert-warning">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Verificación:</strong>
          <ul className="mt-2 mb-0">
            <li>Deportistas asociados: {clubToDelete.deportistas?.length || 0}</li>
            <li>Campeonatos asociados: {clubToDelete.campeonatos?.length || 0}</li>
            <li>Partidos asociados: {(clubToDelete.partidosLocal?.length || 0) + (clubToDelete.partidosVisitante?.length || 0)}</li>
          </ul>
        </div>
        
        <p className="text-danger">
          <i className="fas fa-ban me-2"></i>
          No podrá eliminar el club si tiene datos asociados activos.
        </p>
      </div>
      <div className="modal-footer">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => {
            setShowConfirmDeleteModal(false);
            setClubToDelete(null);
          }}
        >
          Cancelar
        </button>
        <button 
          type="button" 
          className="btn btn-danger"
          onClick={async () => {
            try {
              await handleDelete(clubToDelete.id_club);
              setShowConfirmDeleteModal(false);
              setClubToDelete(null);
            } catch (error) {
              console.error('Error al eliminar:', error);
            }
          }}
        >
          <i className="fas fa-trash me-2"></i> Eliminar Club
        </button>
      </div>
    </div>
  </div>
)}
*/}
    </div>
  );
};

export default Clubes;