import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/permiso.css';

const API_URL = 'http://localhost:8000/api';

const Permisos = () => {
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPermiso, setCurrentPermiso] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modulos, setModulos] = useState([]);
  const [roles, setRoles] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    modulo: '',
    roles: []
  });

  // Función para obtener el token (USANDO TU PATRÓN)
  const getToken = () => {
    const token = localStorage.getItem('auth_token');
    console.log('Token obtenido:', token ? 'Sí' : 'No');
    return token;
  };

  // Función para verificar si hay token
  const hasToken = () => {
    const token = getToken();
    return !!token;
  };

  // Función para obtener headers (USANDO TU PATRÓN)
  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Configurar axios interceptor para incluir token en todas las peticiones
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          console.log('Sesión expirada, redirigiendo a login...');
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    if (!hasToken()) {
      window.location.href = '/login';
      return;
    }
    fetchPermisos();
    fetchRoles();
  }, []);

  const fetchPermisos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/permisos`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setPermisos(response.data.data);
        // Extraer módulos únicos
        const modulosUnicos = [...new Set(response.data.data.map(p => p.modulo))];
        setModulos(modulosUnicos);
      }
    } catch (err) {
      console.error('Error en fetchPermisos:', err);
      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else {
        setError('Error al cargar permisos: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/roles`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setRoles(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar roles:', err);
      if (err.response?.status === 401) {
        // El interceptor ya manejará la redirección
      }
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      fetchPermisos();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/permisos/buscar`, {
        params: { busqueda: searchTerm },
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setPermisos(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar permisos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validación básica del frontend
    if (!formData.nombre || !formData.slug || !formData.modulo) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/permisos`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchPermisos();
        alert('Permiso creado exitosamente');
      }
    } catch (err) {
      console.error('Error al crear permiso:', err);
      if (err.response?.status === 422) {
        // Mostrar errores de validación
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else if (err.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else {
        alert('Error al crear permiso: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentPermiso) return;
    
    // Validación básica del frontend
    if (!formData.nombre || !formData.slug || !formData.modulo) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      const response = await axios.put(`${API_URL}/permisos/${currentPermiso.id_permiso}`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchPermisos();
        alert('Permiso actualizado exitosamente');
      }
    } catch (err) {
      console.error('Error al actualizar permiso:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else if (err.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else {
        alert('Error al actualizar permiso: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este permiso?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/permisos/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchPermisos();
        alert('Permiso eliminado exitosamente');
      }
    } catch (err) {
      console.error('Error al eliminar permiso:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else if (err.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else {
        alert('Error al eliminar permiso: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleEdit = (permiso) => {
    setCurrentPermiso(permiso);
    setFormData({
      nombre: permiso.nombre,
      slug: permiso.slug,
      descripcion: permiso.descripcion || '',
      modulo: permiso.modulo,
      roles: permiso.roles?.map(r => r.id_rol) || []
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      slug: '',
      descripcion: '',
      modulo: '',
      roles: []
    });
    setCurrentPermiso(null);
  };

  const handleRoleToggle = (roleId) => {
    const updatedRoles = formData.roles.includes(roleId)
      ? formData.roles.filter(id => id !== roleId)
      : [...formData.roles, roleId];
    setFormData({ ...formData, roles: updatedRoles });
  };

  const filterByModule = async (modulo) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/permisos/modulo/${modulo}`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setPermisos(response.data.data);
      }
    } catch (err) {
      console.error('Error al filtrar por módulo:', err);
      if (err.response?.status === 401) {
        // El interceptor ya manejará la redirección
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    fetchPermisos();
  };

  // Función para manejar logout
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
          {/* Mensaje de error */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError('')}
              ></button>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h2>
                <i className="fas fa-key me-2"></i>
                Gestión de Permisos
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
                  <i className="fas fa-plus"></i> Nuevo Permiso
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Filtros y búsqueda */}
              <div className="filters-section">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Buscar permisos por nombre, slug, descripción o módulo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={loading}
                  />
                  <button 
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      <i className="fas fa-search"></i>
                    )}
                  </button>
                </div>

                <div className="module-filters">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => fetchPermisos()}
                    disabled={loading}
                  >
                    <i className="fas fa-list"></i> Todos
                  </button>
                  {modulos.map((modulo) => (
                    <button
                      key={modulo}
                      className="btn btn-outline-info"
                      onClick={() => filterByModule(modulo)}
                      disabled={loading}
                    >
                      <i className="fas fa-folder"></i> {modulo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="stats-section mb-4">
                <div className="row">
                  <div className="col-md-3">
                    <div className="stat-card">
                      <h4>{permisos.length}</h4>
                      <p>Total Permisos</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="stat-card">
                      <h4>{modulos.length}</h4>
                      <p>Módulos</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de permisos */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando permisos...</p>
                </div>
              ) : permisos.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <h4>No hay permisos registrados</h4>
                  <p>Crea tu primer permiso usando el botón "Nuevo Permiso"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Nombre</th>
                        <th>Slug</th>
                        <th>Módulo</th>
                        <th>Descripción</th>
                        <th>Roles Asignados</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permisos.map((permiso) => (
                        <tr key={permiso.id_permiso}>
                          <td>
                            <strong>{permiso.nombre}</strong>
                            <div className="text-muted small">
                              ID: {permiso.id_permiso}
                            </div>
                          </td>
                          <td>
                            <code className="slug-text">{permiso.slug}</code>
                          </td>
                          <td>
                            <span className="badge bg-module">
                              <i className="fas fa-cube me-1"></i>
                              {permiso.modulo}
                            </span>
                          </td>
                          <td>
                            {permiso.descripcion || (
                              <span className="text-muted fst-italic">Sin descripción</span>
                            )}
                          </td>
                          <td>
                            {permiso.roles && permiso.roles.length > 0 ? (
                              <div className="role-tags">
                                {permiso.roles.slice(0, 3).map(role => (
                                  <span key={role.id_rol} className="badge bg-role">
                                    <i className="fas fa-user-tag me-1"></i>
                                    {role.nombre}
                                  </span>
                                ))}
                                {permiso.roles.length > 3 && (
                                  <span className="badge bg-secondary">
                                    +{permiso.roles.length - 3} más
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="badge bg-warning">
                                <i className="fas fa-exclamation-circle me-1"></i>
                                Sin asignar
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(permiso)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => {
                                  // Ver detalles
                                  alert(`Detalles del permiso:\n\nNombre: ${permiso.nombre}\nSlug: ${permiso.slug}\nMódulo: ${permiso.modulo}\nDescripción: ${permiso.descripcion || 'Ninguna'}\nID: ${permiso.id_permiso}`);
                                }}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(permiso.id_permiso)}
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

      {/* Modal para crear permiso */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nuevo Permiso
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
                      <label className="form-label">
                        <i className="fas fa-tag me-1"></i>
                        Nombre *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        required
                        placeholder="Ej: Crear Usuarios"
                      />
                      <small className="form-text text-muted">Nombre descriptivo del permiso</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">
                        <i className="fas fa-code me-1"></i>
                        Slug *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                        required
                        placeholder="Ej: crear-usuarios"
                      />
                      <small className="form-text text-muted">Identificador único en minúsculas y con guiones</small>
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">
                    <i className="fas fa-cube me-1"></i>
                    Módulo *
                  </label>
                  <select
                    className="form-control"
                    value={formData.modulo}
                    onChange={(e) => setFormData({...formData, modulo: e.target.value})}
                    required
                  >
                    <option value="">Seleccione un módulo</option>
                    {modulos.map(modulo => (
                      <option key={modulo} value={modulo}>{modulo}</option>
                    ))}
                    <option value="new">+ Crear nuevo módulo</option>
                  </select>
                  {formData.modulo === 'new' && (
                    <input
                      type="text"
                      className="form-control mt-2"
                      placeholder="Nombre del nuevo módulo"
                      onChange={(e) => setFormData({...formData, modulo: e.target.value})}
                    />
                  )}
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">
                    <i className="fas fa-align-left me-1"></i>
                    Descripción
                  </label>
                  <textarea
                    className="form-control"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    rows="3"
                    placeholder="Descripción opcional del permiso..."
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">
                    <i className="fas fa-users me-1"></i>
                    Asignar a Roles
                  </label>
                  <div className="role-checkboxes-container">
                    {roles.length === 0 ? (
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        No hay roles disponibles. Crea roles primero.
                      </div>
                    ) : (
                      roles.map(role => (
                        <div key={role.id_rol} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`role-${role.id_rol}`}
                            checked={formData.roles.includes(role.id_rol)}
                            onChange={() => handleRoleToggle(role.id_rol)}
                          />
                          <label className="form-check-label" htmlFor={`role-${role.id_rol}`}>
                            <span className="badge bg-secondary me-1">{role.nombre}</span>
                            <small className="text-muted">{role.descripcion || 'Sin descripción'}</small>
                          </label>
                        </div>
                      ))
                    )}
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
                  <i className="fas fa-times me-1"></i>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  <i className="fas fa-save me-1"></i>
                  Crear Permiso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar permiso */}
      {showEditModal && currentPermiso && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-warning text-white">
              <h3>
                <i className="fas fa-edit me-2"></i>
                Editar Permiso
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
                  Editando permiso: <strong>{currentPermiso.nombre}</strong> (ID: {currentPermiso.id_permiso})
                </div>

                <div className="row">
                  <div className="col-md-6">
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
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Módulo *</label>
                  <select
                    className="form-control"
                    value={formData.modulo}
                    onChange={(e) => setFormData({...formData, modulo: e.target.value})}
                    required
                  >
                    <option value="">Seleccione módulo</option>
                    {modulos.map(modulo => (
                      <option key={modulo} value={modulo}>{modulo}</option>
                    ))}
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
                  <label className="form-label">Roles Asignados</label>
                  <div className="role-checkboxes-container">
                    {roles.map(role => (
                      <div key={role.id_rol} className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`edit-role-${role.id_rol}`}
                          checked={formData.roles.includes(role.id_rol)}
                          onChange={() => handleRoleToggle(role.id_rol)}
                        />
                        <label className="form-check-label" htmlFor={`edit-role-${role.id_rol}`}>
                          {role.nombre}
                        </label>
                      </div>
                    ))}
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
                  Actualizar Permiso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Permisos;