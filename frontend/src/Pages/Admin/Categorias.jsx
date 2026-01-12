import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/categoria.css';

const API_URL = 'http://localhost:8000/api';

const Categorias = () => {
  // Estados principales
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showDeportistasModal, setShowDeportistasModal] = useState(false);
  
  // Estados para datos
  const [currentCategoria, setCurrentCategoria] = useState(null);
  const [deportistasCategoria, setDeportistasCategoria] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivo, setFilterActivo] = useState('');
  const [filterGenero, setFilterGenero] = useState('');
  const [edadMinimaFilter, setEdadMinimaFilter] = useState('');
  const [edadMaximaFilter, setEdadMaximaFilter] = useState('');
  
  // Form state para nueva/editar categoría
  const [formData, setFormData] = useState({
    nombre: '',
    edad_minima: '',
    edad_maxima: '',
    genero: 'mixto',
    descripcion: '',
    activo: true
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
    fetchCategorias();
  }, []);

  // Cargar todas las categorías
  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/categorias`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setCategorias(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      setError('Error al cargar categorías: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar deportistas de una categoría
  const fetchDeportistasCategoria = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/categorias/${id}/deportistas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setDeportistasCategoria(response.data.data.deportistas);
      }
    } catch (err) {
      console.error('Error al cargar deportistas:', err);
      setError('Error al cargar deportistas: ' + (err.response?.data?.message || err.message));
    }
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      fetchCategorias();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/categorias/buscar`, {
        params: { busqueda: searchTerm },
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setCategorias(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar categorías: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar categorías
  const filtrarCategorias = async () => {
    try {
      setLoading(true);
      
      let categoriasFiltradas = [...categorias];
      
      if (filterActivo !== '') {
        const activo = filterActivo === 'true';
        categoriasFiltradas = categoriasFiltradas.filter(c => c.activo === activo);
      }
      
      if (filterGenero) {
        categoriasFiltradas = categoriasFiltradas.filter(c => c.genero === filterGenero);
      }
      
      if (edadMinimaFilter || edadMaximaFilter) {
        const min = parseInt(edadMinimaFilter) || 0;
        const max = parseInt(edadMaximaFilter) || 100;
        
        // Usar el endpoint por rango de edad
        const response = await axios.get(`${API_URL}/categorias/por-rango-edad`, {
          params: { 
            edad_minima: min, 
            edad_maxima: max 
          },
          headers: getAuthHeaders()
        });
        
        if (response.data.success) {
          setCategorias(response.data.data);
          return;
        }
      }
      
      setCategorias(categoriasFiltradas);
    } catch (err) {
      console.error('Error al filtrar:', err);
      setError('Error al filtrar categorías: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterActivo('');
    setFilterGenero('');
    setEdadMinimaFilter('');
    setEdadMaximaFilter('');
    fetchCategorias();
  };

  // Crear categoría
  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validación del frontend
    if (parseInt(formData.edad_minima) >= parseInt(formData.edad_maxima)) {
      alert('La edad máxima debe ser mayor que la edad mínima');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/categorias`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchCategorias();
        setSuccessMessage('Categoría creada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear categoría:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al crear categoría: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar categoría
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentCategoria) return;
    
    // Validación del frontend
    if (parseInt(formData.edad_minima) >= parseInt(formData.edad_maxima)) {
      alert('La edad máxima debe ser mayor que la edad mínima');
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/categorias/${currentCategoria.id_categoria}`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchCategorias();
        setSuccessMessage('Categoría actualizada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar categoría:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al actualizar categoría: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar categoría
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta categoría?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/categorias/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchCategorias();
        setSuccessMessage('Categoría eliminada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al eliminar categoría: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Restaurar categoría
  const handleRestore = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/categorias/${id}/restore`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchCategorias();
        setSuccessMessage('Categoría restaurada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al restaurar categoría:', err);
      setError('Error al restaurar categoría: ' + (err.response?.data?.message || err.message));
    }
  };

  // Obtener categorías activas
  const getCategoriasActivas = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/categorias/activas`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setCategorias(response.data.data);
      }
    } catch (err) {
      console.error('Error al obtener categorías activas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener categorías por género
  const getCategoriasPorGenero = async (genero) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/categorias/por-genero/${genero}`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setCategorias(response.data.data);
      }
    } catch (err) {
      console.error('Error al obtener categorías por género:', err);
    } finally {
      setLoading(false);
    }
  };

  // Editar categoría
  const handleEdit = (categoria) => {
    setCurrentCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      edad_minima: categoria.edad_minima,
      edad_maxima: categoria.edad_maxima,
      genero: categoria.genero,
      descripcion: categoria.descripcion || '',
      activo: categoria.activo
    });
    setShowEditModal(true);
  };

  // Ver detalles
  const handleViewDetails = (categoria) => {
    setCurrentCategoria(categoria);
    setShowDetallesModal(true);
  };

  // Ver deportistas de la categoría
  const handleViewDeportistas = async (categoria) => {
    setCurrentCategoria(categoria);
    await fetchDeportistasCategoria(categoria.id_categoria);
    setShowDeportistasModal(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      edad_minima: '',
      edad_maxima: '',
      genero: 'mixto',
      descripcion: '',
      activo: true
    });
    setCurrentCategoria(null);
  };

  // Obtener categorías filtradas
  const getFilteredCategorias = () => {
    let filtered = categorias;
    
    if (filterActivo !== '') {
      const activo = filterActivo === 'true';
      filtered = filtered.filter(c => c.activo === activo);
    }
    
    if (filterGenero) {
      filtered = filtered.filter(c => c.genero === filterGenero);
    }
    
    return filtered;
  };

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const total = categorias.length;
    const activas = categorias.filter(c => c.activo).length;
    const inactivas = total - activas;
    
    const porGenero = {
      masculino: categorias.filter(c => c.genero === 'masculino').length,
      femenino: categorias.filter(c => c.genero === 'femenino').length,
      mixto: categorias.filter(c => c.genero === 'mixto').length
    };
    
    const totalDeportistas = categorias.reduce((sum, cat) => 
      sum + (cat.deportistas ? cat.deportistas.length : 0), 0
    );
    
    return { total, activas, inactivas, porGenero, totalDeportistas };
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
                <i className="fas fa-layer-group me-2"></i>
                Gestión de Categorías
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
                  <i className="fas fa-plus"></i> Nueva Categoría
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
                        placeholder="Nombre, descripción..."
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
                      value={filterActivo}
                      onChange={(e) => setFilterActivo(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="true">Activas</option>
                      <option value="false">Inactivas</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Género</label>
                    <select 
                      className="form-select"
                      value={filterGenero}
                      onChange={(e) => setFilterGenero(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="mixto">Mixto</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Edad Mín</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Min"
                      value={edadMinimaFilter}
                      onChange={(e) => setEdadMinimaFilter(e.target.value)}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Edad Máx</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Max"
                      value={edadMaximaFilter}
                      onChange={(e) => setEdadMaximaFilter(e.target.value)}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div className="col-md-1">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={filtrarCategorias}
                      disabled={loading}
                      title="Aplicar filtros"
                    >
                      <i className="fas fa-filter"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Botones de filtros rápidos */}
              <div className="quick-filters mb-4">
                <div className="d-flex gap-2 flex-wrap">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={getCategoriasActivas}
                    disabled={loading}
                  >
                    <i className="fas fa-check-circle me-1"></i> Activas
                  </button>
                  <button 
                    className="btn btn-outline-info"
                    onClick={() => getCategoriasPorGenero('masculino')}
                    disabled={loading}
                  >
                    <i className="fas fa-male me-1"></i> Masculino
                  </button>
                  <button 
                    className="btn btn-outline-info"
                    onClick={() => getCategoriasPorGenero('femenino')}
                    disabled={loading}
                  >
                    <i className="fas fa-female me-1"></i> Femenino
                  </button>
                  <button 
                    className="btn btn-outline-info"
                    onClick={() => getCategoriasPorGenero('mixto')}
                    disabled={loading}
                  >
                    <i className="fas fa-users me-1"></i> Mixto
                  </button>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="stats-section mb-4">
                <div className="row g-3">
                  <div className="col-md-2">
                    <div className="stat-card">
                      <h4>{estadisticas.total}</h4>
                      <p>Total Categorías</p>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="stat-card">
                      <h4>{estadisticas.activas}</h4>
                      <p>Activas</p>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="stat-card">
                      <h4>{estadisticas.inactivas}</h4>
                      <p>Inactivas</p>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="stat-card">
                      <h4>{estadisticas.totalDeportistas}</h4>
                      <p>Deportistas</p>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="stat-card">
                      <h4>{estadisticas.porGenero.masculino}</h4>
                      <p>Masculino</p>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="stat-card">
                      <h4>{estadisticas.porGenero.femenino}</h4>
                      <p>Femenino</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de categorías */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando categorías...</p>
                </div>
              ) : getFilteredCategorias().length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                  <h4>No hay categorías registradas</h4>
                  <p>Crea tu primera categoría usando el botón "Nueva Categoría"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Nombre</th>
                        <th>Rango de Edad</th>
                        <th>Género</th>
                        <th>Deportistas</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredCategorias().map((categoria) => (
                        <tr key={categoria.id_categoria}>
                          <td>
                            <strong>{categoria.nombre}</strong>
                            {categoria.descripcion && (
                              <div className="text-muted small">
                                {categoria.descripcion}
                              </div>
                            )}
                          </td>
                          <td>
                            {categoria.edad_minima} - {categoria.edad_maxima} años
                          </td>
                          <td>
                            <span className={`badge genero-badge genero-${categoria.genero}`}>
                              <i className={`fas fa-${categoria.genero === 'masculino' ? 'male' : categoria.genero === 'femenino' ? 'female' : 'users'} me-1`}></i>
                              {categoria.genero}
                            </span>
                          </td>
                          <td>
                            <div className="deportistas-count">
                              <span className="badge bg-secondary">
                                {categoria.deportistas?.length || 0} deportistas
                              </span>
                              {categoria.deportistas && categoria.deportistas.length > 0 && (
                                <button 
                                  className="btn btn-sm btn-outline-primary ms-2"
                                  onClick={() => handleViewDeportistas(categoria)}
                                  title="Ver deportistas"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge estado-badge ${categoria.activo ? 'bg-success' : 'bg-danger'}`}>
                              {categoria.activo ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetails(categoria)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEdit(categoria)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(categoria.id_categoria)}
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

      {/* Modal para crear categoría */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nueva Categoría
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
                <div className="form-group mb-3">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                    placeholder="Ej: Sub-15, Juvenil, Senior"
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Edad Mínima *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.edad_minima}
                        onChange={(e) => setFormData({...formData, edad_minima: e.target.value})}
                        required
                        min="0"
                        max="100"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Edad Máxima *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.edad_maxima}
                        onChange={(e) => setFormData({...formData, edad_maxima: e.target.value})}
                        required
                        min="0"
                        max="100"
                        placeholder="100"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Género *</label>
                  <div className="genero-options">
                    {['masculino', 'femenino', 'mixto'].map((genero) => (
                      <div key={genero} className="form-check form-check-inline">
                        <input
                          type="radio"
                          className="form-check-input"
                          id={`genero-${genero}`}
                          name="genero"
                          value={genero}
                          checked={formData.genero === genero}
                          onChange={(e) => setFormData({...formData, genero: e.target.value})}
                          required
                        />
                        <label className="form-check-label" htmlFor={`genero-${genero}`}>
                          <i className={`fas fa-${genero === 'masculino' ? 'male' : genero === 'femenino' ? 'female' : 'users'} me-1`}></i>
                          {genero.charAt(0).toUpperCase() + genero.slice(1)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    rows="3"
                    placeholder="Descripción de la categoría..."
                  />
                </div>

                <div className="form-group mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="activo">
                      Categoría activa
                    </label>
                  </div>
                </div>

                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  La categoría será para edades entre {formData.edad_minima || '0'} y {formData.edad_maxima || '0'} años
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
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar categoría */}
      {showEditModal && currentCategoria && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-warning text-white">
              <h3>
                <i className="fas fa-edit me-2"></i>
                Editar Categoría
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
                  Editando categoría: <strong>{currentCategoria.nombre}</strong> (ID: {currentCategoria.id_categoria})
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Edad Mínima *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.edad_minima}
                        onChange={(e) => setFormData({...formData, edad_minima: e.target.value})}
                        required
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Edad Máxima *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.edad_maxima}
                        onChange={(e) => setFormData({...formData, edad_maxima: e.target.value})}
                        required
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Género *</label>
                  <select
                    className="form-control"
                    value={formData.genero}
                    onChange={(e) => setFormData({...formData, genero: e.target.value})}
                    required
                  >
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="mixto">Mixto</option>
                  </select>
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

                <div className="form-group mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="edit-activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="edit-activo">
                      Categoría activa
                    </label>
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
                <button type="submit" className="btn btn-warning text-white">
                  Actualizar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles */}
      {showDetallesModal && currentCategoria && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-info-circle me-2"></i>
                Detalles de la Categoría
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDetallesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-8">
                  <h4>{currentCategoria.nombre}</h4>
                  <div className="row mt-4">
                    <div className="col-md-6">
                      <h5>Información Básica</h5>
                      <p><strong>ID:</strong> {currentCategoria.id_categoria}</p>
                      <p><strong>Rango de Edad:</strong> {currentCategoria.edad_minima} - {currentCategoria.edad_maxima} años</p>
                      <p><strong>Género:</strong> 
                        <span className={`badge genero-badge genero-${currentCategoria.genero} ms-2`}>
                          {currentCategoria.genero}
                        </span>
                      </p>
                      <p><strong>Estado:</strong> 
                        <span className={`badge ${currentCategoria.activo ? 'bg-success' : 'bg-danger'} ms-2`}>
                          {currentCategoria.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h5>Estadísticas</h5>
                      <p><strong>Deportistas:</strong> {currentCategoria.deportistas?.length || 0}</p>
                      <p><strong>Fecha Creación:</strong> {new Date(currentCategoria.created_at).toLocaleDateString()}</p>
                      <p><strong>Última Actualización:</strong> {new Date(currentCategoria.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {currentCategoria.descripcion && (
                    <div className="mt-4">
                      <h5>Descripción</h5>
                      <div className="card">
                        <div className="card-body">
                          {currentCategoria.descripcion}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Información Resumida</h6>
                    </div>
                    <div className="card-body">
                      <div className="info-box">
                        <div className="info-label">Edades</div>
                        <div className="info-value">
                          {currentCategoria.edad_minima} - {currentCategoria.edad_maxima} años
                        </div>
                      </div>
                      <div className="info-box">
                        <div className="info-label">Género</div>
                        <div className="info-value">
                          <span className={`badge genero-badge genero-${currentCategoria.genero}`}>
                            {currentCategoria.genero}
                          </span>
                        </div>
                      </div>
                      <div className="info-box">
                        <div className="info-label">Estado</div>
                        <div className="info-value">
                          <span className={`badge ${currentCategoria.activo ? 'bg-success' : 'bg-danger'}`}>
                            {currentCategoria.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                      <div className="info-box">
                        <div className="info-label">Deportistas</div>
                        <div className="info-value">
                          <span className="badge bg-primary">
                            {currentCategoria.deportistas?.length || 0}
                          </span>
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
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver deportistas de la categoría */}
      {showDeportistasModal && currentCategoria && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-users me-2"></i>
                Deportistas de {currentCategoria.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDeportistasModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                Mostrando {deportistasCategoria.length} deportistas en la categoría {currentCategoria.nombre}
              </div>
              
              {deportistasCategoria.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-user-slash fa-3x text-muted mb-3"></i>
                  <h4>No hay deportistas en esta categoría</h4>
                  <p>Asigna deportistas a esta categoría desde la gestión de deportistas</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Documento</th>
                        <th>Edad</th>
                        <th>Posiciones</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deportistasCategoria.map((deportista) => (
                        <tr key={deportista.id_deportista}>
                          <td>
                            <strong>{deportista.nombres} {deportista.apellidos}</strong>
                          </td>
                          <td>
                            {deportista.tipo_documento}: {deportista.numero_documento}
                          </td>
                          <td>
                            {deportista.fecha_nacimiento ? 
                              Math.floor((new Date() - new Date(deportista.fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : 
                              'N/A'} años
                          </td>
                          <td>
                            {deportista.posiciones && deportista.posiciones.length > 0 ? (
                              <div className="posiciones-tags">
                                {deportista.posiciones.slice(0, 2).map(pos => (
                                  <span key={pos.id_posicion} className="badge bg-secondary">
                                    {pos.nombre}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted">Sin posiciones</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${deportista.estado}`}>
                              {deportista.estado}
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
                onClick={() => setShowDeportistasModal(false)}
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

export default Categorias;