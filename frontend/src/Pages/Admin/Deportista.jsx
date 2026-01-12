import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/deportista.css';

const API_URL = 'http://localhost:8000/api';

const Deportistas = () => {
  // Estados principales
  const [deportistas, setDeportistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPosicionesModal, setShowPosicionesModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  
  // Estados para datos
  const [currentDeportista, setCurrentDeportista] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [posiciones, setPosiciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [deportistaPosiciones, setDeportistaPosiciones] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterGenero, setFilterGenero] = useState('');
  
  // Estados para estadísticas
  const [estadisticasGenerales, setEstadisticasGenerales] = useState(null);
  
  // Form state para nuevo/editar deportista
  const [formData, setFormData] = useState({
    id_usuario: '',
    id_categoria: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    genero: '',
    tipo_documento: 'CC',
    numero_documento: '',
    foto: null,
    fotoPreview: '',
    direccion: '',
    correo: '',
    telefono: '',
    altura: '',
    peso: '',
    pie_habil: 'derecho',
    numero_camiseta: '',
    estado: 'activo',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    contacto_emergencia_relacion: '',
    posiciones: []
  });

  // Form state para posiciones
  const [posicionesForm, setPosicionesForm] = useState([]);
  const [selectedPosiciones, setSelectedPosiciones] = useState([]);

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
    fetchData();
    fetchEstadisticasGenerales();
  }, []);

  // Cargar todos los datos necesarios
  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        deportistasRes, 
        categoriasRes, 
        posicionesRes, 
        usuariosRes,
        deportistaPosicionesRes
      ] = await Promise.all([
        axios.get(`${API_URL}/deportistas`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/categorias`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/posiciones`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/usuarios`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/deportista-posiciones`, { headers: getAuthHeaders() })
      ]);

      if (deportistasRes.data.success) setDeportistas(deportistasRes.data.data);
      if (categoriasRes.data.success) setCategorias(categoriasRes.data.data);
      if (posicionesRes.data.success) setPosiciones(posicionesRes.data.data);
      if (usuariosRes.data.success) setUsuarios(usuariosRes.data.data);
      if (deportistaPosicionesRes.data.success) setDeportistaPosiciones(deportistaPosicionesRes.data.data);
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas generales
  const fetchEstadisticasGenerales = async () => {
    try {
      const response = await axios.get(`${API_URL}/deportistas/estadisticas`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setEstadisticasGenerales(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      fetchData();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/deportistas/buscar`, {
        params: { busqueda: searchTerm },
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setDeportistas(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar deportistas: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar deportistas
  const filtrarDeportistas = async () => {
    try {
      setLoading(true);
      
      let deportistasFiltrados = [...deportistas];
      
      if (filterEstado) {
        deportistasFiltrados = deportistasFiltrados.filter(d => d.estado === filterEstado);
      }
      
      if (filterCategoria) {
        deportistasFiltrados = deportistasFiltrados.filter(d => d.id_categoria == filterCategoria);
      }
      
      if (filterGenero) {
        deportistasFiltrados = deportistasFiltrados.filter(d => d.genero === filterGenero);
      }
      
      setDeportistas(deportistasFiltrados);
    } catch (err) {
      console.error('Error al filtrar:', err);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    setFilterCategoria('');
    setFilterGenero('');
    fetchData();
  };

  // Crear deportista
  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      // Agregar campos al FormData
      Object.keys(formData).forEach(key => {
        if (key === 'foto' && formData.foto instanceof File) {
          formDataToSend.append('foto', formData.foto);
        } else if (key === 'posiciones' && formData.posiciones.length > 0) {
          formData.posiciones.forEach((pos, index) => {
            formDataToSend.append(`posiciones[${index}]`, pos);
          });
        } else if (formData[key] !== '' && formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.post(`${API_URL}/deportistas`, formDataToSend, {
        headers: getAuthHeadersMultipart()
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchData();
        setSuccessMessage('Deportista creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear deportista:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al crear deportista: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar deportista
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentDeportista) return;
    
    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'foto' && formData.foto instanceof File) {
          formDataToSend.append('foto', formData.foto);
        } else if (key === 'posiciones' && formData.posiciones.length > 0) {
          formData.posiciones.forEach((pos, index) => {
            formDataToSend.append(`posiciones[${index}]`, pos);
          });
        } else if (formData[key] !== currentDeportista[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.post(`${API_URL}/deportistas/${currentDeportista.id_deportista}?_method=PUT`, formDataToSend, {
        headers: getAuthHeadersMultipart()
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchData();
        setSuccessMessage('Deportista actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar deportista:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al actualizar deportista: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar deportista
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este deportista?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/deportistas/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchData();
        setSuccessMessage('Deportista eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar deportista:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al eliminar deportista: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Restaurar deportista
  const handleRestore = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/deportistas/${id}/restore`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchData();
        setSuccessMessage('Deportista restaurado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al restaurar deportista:', err);
      setError('Error al restaurar deportista: ' + (err.response?.data?.message || err.message));
    }
  };

  // Asignar posiciones
  const handleAsignarPosiciones = async (e) => {
    e.preventDefault();
    
    if (!currentDeportista) return;
    
    try {
      const response = await axios.post(
        `${API_URL}/deportistas/${currentDeportista.id_deportista}/asignar-posiciones`,
        { 
          posiciones: posicionesForm.map((pos, index) => ({
            id_posicion: pos.id_posicion,
            principal: pos.principal
          }))
        },
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setShowPosicionesModal(false);
        setPosicionesForm([]);
        fetchData();
        setSuccessMessage('Posiciones asignadas exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al asignar posiciones:', err);
      setError('Error al asignar posiciones: ' + (err.response?.data?.message || err.message));
    }
  };

  // Editar deportista
  const handleEdit = (deportista) => {
    setCurrentDeportista(deportista);
    setFormData({
      id_usuario: deportista.id_usuario || '',
      id_categoria: deportista.id_categoria || '',
      nombres: deportista.nombres || '',
      apellidos: deportista.apellidos || '',
      fecha_nacimiento: deportista.fecha_nacimiento ? deportista.fecha_nacimiento.split('T')[0] : '',
      genero: deportista.genero || '',
      tipo_documento: deportista.tipo_documento || 'CC',
      numero_documento: deportista.numero_documento || '',
      foto: null,
      fotoPreview: deportista.foto ? `${API_URL}/storage/${deportista.foto}` : '',
      direccion: deportista.direccion || '',
      correo: deportista.correo || '',
      telefono: deportista.telefono || '',
      altura: deportista.altura || '',
      peso: deportista.peso || '',
      pie_habil: deportista.pie_habil || 'derecho',
      numero_camiseta: deportista.numero_camiseta || '',
      estado: deportista.estado || 'activo',
      contacto_emergencia_nombre: deportista.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: deportista.contacto_emergencia_telefono || '',
      contacto_emergencia_relacion: deportista.contacto_emergencia_relacion || '',
      posiciones: deportista.posiciones?.map(p => p.id_posicion) || []
    });
    setShowEditModal(true);
  };

  // Ver detalles
  const handleViewDetails = (deportista) => {
    setCurrentDeportista(deportista);
    setShowDetallesModal(true);
  };

  // Ver estadísticas deportivas
  const handleViewStats = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/deportistas/${id}/estadisticas-deportivas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setCurrentDeportista({
          ...currentDeportista,
          estadisticasData: response.data.data
        });
        setShowEstadisticasModal(true);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Ver historial médico
  const handleViewMedicalHistory = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/deportistas/${id}/historial-medico`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        alert(`Historial médico:\n\n${response.data.data.lesiones.map(l => 
          `${l.tipo_lesion} - ${l.descripcion} (${l.fecha_lesion})`
        ).join('\n')}`);
      }
    } catch (err) {
      console.error('Error al cargar historial médico:', err);
    }
  };

  // Ver asistencias
  const handleViewAsistencias = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/deportistas/${id}/asistencias`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        alert(`Asistencias:\n\n${response.data.data.map(a => 
          `${a.actividad?.nombre} - ${a.fecha} (${a.estado})`
        ).join('\n')}`);
      }
    } catch (err) {
      console.error('Error al cargar asistencias:', err);
    }
  };

  // Gestionar posiciones
  const handleManagePosiciones = (deportista) => {
    setCurrentDeportista(deportista);
    
    // Preparar el formulario de posiciones
    const posicionesActuales = deportistaPosiciones
      .filter(dp => dp.id_deportista == deportista.id_deportista)
      .map(dp => ({
        id: dp.id,
        id_posicion: dp.id_posicion,
        posicion_nombre: dp.posicion?.nombre,
        principal: dp.principal
      }));
    
    setPosicionesForm(posicionesActuales.length > 0 ? posicionesActuales : []);
    setSelectedPosiciones(deportista.posiciones?.map(p => p.id_posicion) || []);
    setShowPosicionesModal(true);
  };

  // Agregar posición al formulario
  const addPosicionToForm = () => {
    if (selectedPosiciones.length > 0) {
      const newPosiciones = selectedPosiciones.map(id => {
        const posicionExistente = posicionesForm.find(p => p.id_posicion == id);
        if (posicionExistente) return posicionExistente;
        
        const posicion = posiciones.find(p => p.id_posicion == id);
        return {
          id: null,
          id_posicion: id,
          posicion_nombre: posicion?.nombre,
          principal: posicionesForm.length === 0 // La primera es principal por defecto
        };
      });
      
      setPosicionesForm([...posicionesForm, ...newPosiciones]);
      setSelectedPosiciones([]);
    }
  };

  // Eliminar posición del formulario
  const removePosicionFromForm = (index) => {
    const newPosiciones = [...posicionesForm];
    newPosiciones.splice(index, 1);
    
    // Si se eliminó la posición principal y hay más posiciones, marcar la primera como principal
    if (newPosiciones.length > 0 && !newPosiciones.some(p => p.principal)) {
      newPosiciones[0].principal = true;
    }
    
    setPosicionesForm(newPosiciones);
  };

  // Marcar posición como principal
  const setPosicionPrincipal = (index) => {
    const newPosiciones = posicionesForm.map((pos, i) => ({
      ...pos,
      principal: i === index
    }));
    setPosicionesForm(newPosiciones);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      id_usuario: '',
      id_categoria: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: '',
      genero: '',
      tipo_documento: 'CC',
      numero_documento: '',
      foto: null,
      fotoPreview: '',
      direccion: '',
      correo: '',
      telefono: '',
      altura: '',
      peso: '',
      pie_habil: 'derecho',
      numero_camiseta: '',
      estado: 'activo',
      contacto_emergencia_nombre: '',
      contacto_emergencia_telefono: '',
      contacto_emergencia_relacion: '',
      posiciones: []
    });
    setCurrentDeportista(null);
  };

  // Manejar cambio de archivo (foto)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        foto: file,
        fotoPreview: URL.createObjectURL(file)
      });
    }
  };

  // Obtener edad a partir de la fecha de nacimiento
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // Obtener deportistas filtrados
  const getFilteredDeportistas = () => {
    let filtered = deportistas;
    
    if (filterEstado) {
      filtered = filtered.filter(d => d.estado === filterEstado);
    }
    
    if (filterCategoria) {
      filtered = filtered.filter(d => d.id_categoria == filterCategoria);
    }
    
    if (filterGenero) {
      filtered = filtered.filter(d => d.genero === filterGenero);
    }
    
    return filtered;
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

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
                <i className="fas fa-users me-2"></i>
                Gestión de Deportistas
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
                  <i className="fas fa-plus"></i> Nuevo Deportista
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
                        placeholder="Nombre, apellido, documento..."
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
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="lesionado">Lesionado</option>
                      <option value="suspendido">Suspendido</option>
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
                      {categorias.map(cat => (
                        <option key={cat.id_categoria} value={cat.id_categoria}>
                          {cat.nombre}
                        </option>
                      ))}
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
                    </select>
                  </div>
                  
                  <div className="col-md-3">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={filtrarDeportistas}
                      disabled={loading}
                    >
                      <i className="fas fa-filter me-1"></i> Aplicar Filtros
                    </button>
                  </div>
                </div>
              </div>

              {/* Estadísticas generales */}
              {estadisticasGenerales && (
                <div className="stats-section mb-4">
                  <div className="row g-3">
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticasGenerales.total}</h4>
                        <p>Total Deportistas</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticasGenerales.activos}</h4>
                        <p>Activos</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card">
                        <h4>{estadisticasGenerales.lesionados}</h4>
                        <p>Lesionados</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stat-card">
                        <h4>{estadisticasGenerales.por_genero?.find(g => g.genero === 'masculino')?.total || 0}</h4>
                        <p>Hombres</p>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stat-card">
                        <h4>{estadisticasGenerales.por_genero?.find(g => g.genero === 'femenino')?.total || 0}</h4>
                        <p>Mujeres</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de deportistas */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando deportistas...</p>
                </div>
              ) : getFilteredDeportistas().length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-user-slash fa-3x text-muted mb-3"></i>
                  <h4>No hay deportistas registrados</h4>
                  <p>Crea tu primer deportista usando el botón "Nuevo Deportista"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Foto</th>
                        <th>Nombre</th>
                        <th>Documento</th>
                        <th>Edad</th>
                        <th>Categoría</th>
                        <th>Posiciones</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredDeportistas().map((deportista) => (
                        <tr key={deportista.id_deportista}>
                          <td>
                            {deportista.foto ? (
                              <img 
                                src={`${API_URL}/storage/${deportista.foto}`} 
                                alt={deportista.nombres}
                                className="deportista-foto"
                              />
                            ) : (
                              <div className="deportista-foto-placeholder">
                                <i className="fas fa-user"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <strong>{deportista.nombres} {deportista.apellidos}</strong>
                            <div className="text-muted small">
                              {deportista.correo || 'Sin correo'}
                            </div>
                          </td>
                          <td>
                            {deportista.tipo_documento}: {deportista.numero_documento}
                          </td>
                          <td>
                            {calcularEdad(deportista.fecha_nacimiento)} años
                            <div className="text-muted small">
                              {deportista.genero === 'masculino' ? '♂' : '♀'} {deportista.genero}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-categoria">
                              {deportista.categoria?.nombre || 'N/A'}
                            </span>
                          </td>
                          <td>
                            {deportista.posiciones && deportista.posiciones.length > 0 ? (
                              <div className="posiciones-tags">
                                {deportista.posiciones.slice(0, 2).map(pos => (
                                  <span 
                                    key={pos.id_posicion} 
                                    className={`badge ${pos.pivot?.principal ? 'bg-primary' : 'bg-secondary'}`}
                                    title={pos.pivot?.principal ? 'Posición principal' : ''}
                                  >
                                    {pos.nombre}
                                  </span>
                                ))}
                                {deportista.posiciones.length > 2 && (
                                  <span className="badge bg-info">
                                    +{deportista.posiciones.length - 2}
                                  </span>
                                )}
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
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetails(deportista)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEdit(deportista)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleManagePosiciones(deportista)}
                                title="Gestionar posiciones"
                              >
                                <i className="fas fa-map-marker-alt"></i>
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
                                      onClick={() => handleViewStats(deportista.id_deportista)}
                                    >
                                      <i className="fas fa-chart-line me-2"></i>
                                      Estadísticas
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item"
                                      onClick={() => handleViewMedicalHistory(deportista.id_deportista)}
                                    >
                                      <i className="fas fa-file-medical me-2"></i>
                                      Historial médico
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item"
                                      onClick={() => handleViewAsistencias(deportista.id_deportista)}
                                    >
                                      <i className="fas fa-calendar-check me-2"></i>
                                      Asistencias
                                    </button>
                                  </li>
                                  <li><hr className="dropdown-divider" /></li>
                                  <li>
                                    <button 
                                      className="dropdown-item text-danger"
                                      onClick={() => handleDelete(deportista.id_deportista)}
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

      {/* Modal para crear deportista */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nuevo Deportista
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
                      <label className="form-label">Nombres *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombres}
                        onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Apellidos *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.apellidos}
                        onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Tipo Documento *</label>
                      <select
                        className="form-control"
                        value={formData.tipo_documento}
                        onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
                        required
                      >
                        <option value="CC">Cédula de Ciudadanía</option>
                        <option value="TI">Tarjeta de Identidad</option>
                        <option value="CE">Cédula de Extranjería</option>
                        <option value="PA">Pasaporte</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Número Documento *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.numero_documento}
                        onChange={(e) => setFormData({...formData, numero_documento: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha Nacimiento *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha_nacimiento}
                        onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Género *</label>
                      <select
                        className="form-control"
                        value={formData.genero}
                        onChange={(e) => setFormData({...formData, genero: e.target.value})}
                        required
                      >
                        <option value="">Seleccione...</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Categoría *</label>
                      <select
                        className="form-control"
                        value={formData.id_categoria}
                        onChange={(e) => setFormData({...formData, id_categoria: e.target.value})}
                        required
                      >
                        <option value="">Seleccione categoría...</option>
                        {categorias.map(cat => (
                          <option key={cat.id_categoria} value={cat.id_categoria}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Usuario</label>
                      <select
                        className="form-control"
                        value={formData.id_usuario}
                        onChange={(e) => setFormData({...formData, id_usuario: e.target.value})}
                      >
                        <option value="">Seleccione usuario...</option>
                        {usuarios.map(user => (
                          <option key={user.id_usuario} value={user.id_usuario}>
                            {user.nombre} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Correo</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.correo}
                        onChange={(e) => setFormData({...formData, correo: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Foto</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {formData.fotoPreview && (
                    <img 
                      src={formData.fotoPreview} 
                      alt="Preview" 
                      className="img-preview mt-2"
                    />
                  )}
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Posiciones</label>
                  <select
                    className="form-control"
                    multiple
                    value={formData.posiciones}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({...formData, posiciones: selected});
                    }}
                  >
                    {posiciones.map(pos => (
                      <option key={pos.id_posicion} value={pos.id_posicion}>
                        {pos.nombre}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">Mantén presionado Ctrl para seleccionar múltiples posiciones</small>
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
                  Crear Deportista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar deportista */}
      {showEditModal && currentDeportista && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-warning text-white">
              <h3>
                <i className="fas fa-edit me-2"></i>
                Editar Deportista
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
                {/* Contenido similar al modal de creación pero con datos precargados */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Nombres *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombres}
                        onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Apellidos *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.apellidos}
                        onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* ... resto de campos similares al modal de creación ... */}

                <div className="form-group mb-3">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-control"
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="lesionado">Lesionado</option>
                    <option value="suspendido">Suspendido</option>
                  </select>
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
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para gestionar posiciones */}
      {showPosicionesModal && currentDeportista && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-map-marker-alt me-2"></i>
                Gestionar Posiciones
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowPosicionesModal(false);
                  setPosicionesForm([]);
                }}
              ></button>
            </div>
            <form onSubmit={handleAsignarPosiciones}>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Asignando posiciones a: <strong>{currentDeportista.nombres} {currentDeportista.apellidos}</strong>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Seleccionar Posiciones</label>
                  <div className="input-group mb-3">
                    <select
                      className="form-control"
                      value={selectedPosiciones}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedPosiciones(selected);
                      }}
                      multiple
                    >
                      {posiciones.map(pos => (
                        <option key={pos.id_posicion} value={pos.id_posicion}>
                          {pos.nombre}
                        </option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={addPosicionToForm}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Posiciones Asignadas</label>
                  {posicionesForm.length === 0 ? (
                    <div className="alert alert-warning">
                      No hay posiciones asignadas
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Posición</th>
                            <th>Principal</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {posicionesForm.map((pos, index) => (
                            <tr key={index}>
                              <td>{pos.posicion_nombre}</td>
                              <td>
                                <div className="form-check">
                                  <input
                                    type="radio"
                                    className="form-check-input"
                                    name="posicionPrincipal"
                                    checked={pos.principal}
                                    onChange={() => setPosicionPrincipal(index)}
                                  />
                                </div>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => removePosicionFromForm(index)}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPosicionesModal(false);
                    setPosicionesForm([]);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={posicionesForm.length === 0}
                >
                  Guardar Posiciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles */}
      {showDetallesModal && currentDeportista && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-id-card me-2"></i>
                Detalles del Deportista
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDetallesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-4 text-center">
                  {currentDeportista.foto ? (
                    <img 
                      src={`${API_URL}/storage/${currentDeportista.foto}`} 
                      alt={currentDeportista.nombres}
                      className="img-fluid rounded mb-3"
                    />
                  ) : (
                    <div className="deportista-foto-grande">
                      <i className="fas fa-user fa-5x text-muted"></i>
                    </div>
                  )}
                  <h4>{currentDeportista.nombres} {currentDeportista.apellidos}</h4>
                  <span className={`badge estado-badge estado-${currentDeportista.estado}`}>
                    {currentDeportista.estado}
                  </span>
                </div>
                <div className="col-md-8">
                  <div className="row">
                    <div className="col-md-6">
                      <h5>Información Personal</h5>
                      <p><strong>Documento:</strong> {currentDeportista.tipo_documento}: {currentDeportista.numero_documento}</p>
                      <p><strong>Edad:</strong> {calcularEdad(currentDeportista.fecha_nacimiento)} años</p>
                      <p><strong>Género:</strong> {currentDeportista.genero}</p>
                      <p><strong>Fecha Nacimiento:</strong> {new Date(currentDeportista.fecha_nacimiento).toLocaleDateString()}</p>
                    </div>
                    <div className="col-md-6">
                      <h5>Contacto</h5>
                      <p><strong>Correo:</strong> {currentDeportista.correo || 'N/A'}</p>
                      <p><strong>Teléfono:</strong> {currentDeportista.telefono || 'N/A'}</p>
                      <p><strong>Dirección:</strong> {currentDeportista.direccion || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="row mt-3">
                    <div className="col-md-6">
                      <h5>Información Deportiva</h5>
                      <p><strong>Categoría:</strong> {currentDeportista.categoria?.nombre || 'N/A'}</p>
                      <p><strong>Posiciones:</strong> {currentDeportista.posiciones?.map(p => p.nombre).join(', ') || 'N/A'}</p>
                      <p><strong>N° Camiseta:</strong> {currentDeportista.numero_camiseta || 'N/A'}</p>
                      <p><strong>Pie hábil:</strong> {currentDeportista.pie_habil || 'N/A'}</p>
                    </div>
                    <div className="col-md-6">
                      <h5>Medidas</h5>
                      <p><strong>Altura:</strong> {currentDeportista.altura ? `${currentDeportista.altura}m` : 'N/A'}</p>
                      <p><strong>Peso:</strong> {currentDeportista.peso ? `${currentDeportista.peso}kg` : 'N/A'}</p>
                    </div>
                  </div>
                  
                  {currentDeportista.contacto_emergencia_nombre && (
                    <div className="row mt-3">
                      <div className="col-12">
                        <h5>Contacto de Emergencia</h5>
                        <p><strong>Nombre:</strong> {currentDeportista.contacto_emergencia_nombre}</p>
                        <p><strong>Teléfono:</strong> {currentDeportista.contacto_emergencia_telefono}</p>
                        <p><strong>Relación:</strong> {currentDeportista.contacto_emergencia_relacion}</p>
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

      {/* Modal para estadísticas deportivas */}
      {showEstadisticasModal && currentDeportista?.estadisticasData && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-chart-line me-2"></i>
                Estadísticas Deportivas
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowEstadisticasModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <h4>{currentDeportista.estadisticasData.deportista}</h4>
              
              <div className="row mt-4">
                <div className="col-md-3">
                  <div className="stat-card">
                    <h4>{currentDeportista.estadisticasData.totales.goles || 0}</h4>
                    <p>Goles</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card">
                    <h4>{currentDeportista.estadisticasData.totales.asistencias || 0}</h4>
                    <p>Asistencias</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card">
                    <h4>{currentDeportista.estadisticasData.totales.partidos_jugados || 0}</h4>
                    <p>Partidos</p>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card">
                    <h4>{currentDeportista.estadisticasData.totales.minutos_jugados || 0}</h4>
                    <p>Minutos</p>
                  </div>
                </div>
              </div>

              <h5 className="mt-4">Historial de Partidos</h5>
              {currentDeportista.estadisticasData.estadisticas.length > 0 ? (
                <div className="table-responsive mt-2">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Partido</th>
                        <th>Goles</th>
                        <th>Asistencias</th>
                        <th>T. Amarillas</th>
                        <th>T. Rojas</th>
                        <th>Minutos</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDeportista.estadisticasData.estadisticas.map((est, index) => (
                        <tr key={index}>
                          <td>{est.partido?.nombre || 'Partido'}</td>
                          <td>{est.goles}</td>
                          <td>{est.asistencias}</td>
                          <td>{est.tarjetas_amarillas}</td>
                          <td>{est.tarjetas_rojas}</td>
                          <td>{est.minutos_jugados}</td>
                          <td>{new Date(est.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No hay estadísticas registradas</p>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deportistas;