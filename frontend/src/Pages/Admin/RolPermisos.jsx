import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/permiso.css';

const API_URL = 'http://localhost:8000/api';

const RolPermisos = () => {
  const [rolPermisos, setRolPermisos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRol, setSelectedRol] = useState('');
  const [selectedPermiso, setSelectedPermiso] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!getToken()) {
      window.location.href = '/login';
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permisosRes, rolPermisosRes] = await Promise.all([
        axios.get(`${API_URL}/roles`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/permisos`, { headers: getAuthHeaders() }),
        axios.get(`${API_URL}/rol-permisos`, { headers: getAuthHeaders() })
      ]);

      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      if (permisosRes.data.success) setPermisos(permisosRes.data.data);
      if (rolPermisosRes.data.success) setRolPermisos(rolPermisosRes.data.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      if (err.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else {
        setError('Error al cargar datos: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!selectedRol || !selectedPermiso) {
      alert('Por favor seleccione un rol y un permiso');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/rol-permisos`, {
        id_rol: selectedRol,
        id_permiso: selectedPermiso
      }, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setShowModal(false);
        setSelectedRol('');
        setSelectedPermiso('');
        fetchData();
        alert('Permiso asignado exitosamente');
      }
    } catch (err) {
      console.error('Error al asignar permiso:', err);
      if (err.response?.status === 409) {
        alert('Esta relación ya existe');
      } else if (err.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else {
        alert('Error al asignar permiso: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta asignación?\nEl rol perderá este permiso.')) return;

    try {
      const response = await axios.delete(`${API_URL}/rol-permisos/${id}`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        fetchData();
        alert('Asignación eliminada exitosamente');
      }
    } catch (err) {
      console.error('Error al eliminar asignación:', err);
      if (err.response?.status === 401) {
        alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
      } else {
        alert('Error al eliminar asignación');
      }
    }
  };

  const filterByRol = async () => {
    if (!filterRol) {
      fetchData();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/rol-permisos/rol/${filterRol}`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setRolPermisos(response.data.data);
      }
    } catch (err) {
      console.error('Error al filtrar por rol:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRolPermisos = filterRol 
    ? rolPermisos.filter(rp => rp.id_rol == filterRol)
    : rolPermisos;

  // Función para manejar logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilterRol('');
    fetchData();
  };

  // Obtener nombre del rol por ID
  const getRolName = (id) => {
    const rol = roles.find(r => r.id_rol == id);
    return rol ? rol.nombre : 'N/A';
  };

  // Obtener nombre del permiso por ID
  const getPermisoName = (id) => {
    const permiso = permisos.find(p => p.id_permiso == id);
    return permiso ? permiso.nombre : 'N/A';
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
                <i className="fas fa-link me-2"></i>
                Asignación de Permisos a Roles
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
                  <i className="fas fa-plus"></i> Nueva Asignación
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Filtro por rol */}
              <div className="filters-section mb-4">
                <div className="row align-items-center">
                  <div className="col-md-4">
                    <label className="form-label">
                      <i className="fas fa-filter me-1"></i>
                      Filtrar por Rol:
                    </label>
                    <select 
                      className="form-select"
                      value={filterRol}
                      onChange={(e) => {
                        setFilterRol(e.target.value);
                        if (e.target.value) {
                          filterByRol();
                        } else {
                          fetchData();
                        }
                      }}
                      disabled={loading}
                    >
                      <option value="">Todos los roles</option>
                      {roles.map(rol => (
                        <option key={rol.id_rol} value={rol.id_rol}>
                          {rol.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="stats-section mb-4">
                <div className="row">
                  <div className="col-md-3">
                    <div className="stat-card">
                      <h4>{filteredRolPermisos.length}</h4>
                      <p>Asignaciones Totales</p>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="stat-card">
                      <h4>{new Set(filteredRolPermisos.map(rp => rp.id_rol)).size}</h4>
                      <p>Roles con Permisos</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de asignaciones */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando asignaciones...</p>
                </div>
              ) : filteredRolPermisos.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-unlink fa-3x text-muted mb-3"></i>
                  <h4>No hay asignaciones registradas</h4>
                  <p>Crea tu primera asignación usando el botón "Nueva Asignación"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Rol</th>
                        <th>Permiso</th>
                        <th>Módulo</th>
                        <th>Slug</th>
                        <th>Descripción</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRolPermisos.map((rp) => (
                        <tr key={rp.id}>
                          <td>
                            <span className="badge bg-role">
                              <i className="fas fa-user-tag me-1"></i>
                              {getRolName(rp.id_rol)}
                            </span>
                          </td>
                          <td>
                            <strong>{getPermisoName(rp.id_permiso)}</strong>
                          </td>
                          <td>
                            <span className="badge bg-module">
                              <i className="fas fa-cube me-1"></i>
                              {rp.permiso?.modulo || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <code className="slug-text">
                              {rp.permiso?.slug || 'N/A'}
                            </code>
                          </td>
                          <td>
                            {rp.permiso?.descripcion || (
                              <span className="text-muted fst-italic">Sin descripción</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(rp.id)}
                              title="Eliminar asignación"
                            >
                              <i className="fas fa-trash"></i> Eliminar
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
        </div>
      </div>

      {/* Modal para asignar permiso */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-link me-2"></i>
                Asignar Permiso a Rol
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowModal(false);
                  setSelectedRol('');
                  setSelectedPermiso('');
                }}
              ></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="form-label">
                    <i className="fas fa-user-tag me-1"></i>
                    Seleccionar Rol *
                  </label>
                  <select
                    className="form-control"
                    value={selectedRol}
                    onChange={(e) => setSelectedRol(e.target.value)}
                    required
                  >
                    <option value="">Seleccione un rol</option>
                    {roles.map(rol => (
                      <option key={rol.id_rol} value={rol.id_rol}>
                        {rol.nombre} - {rol.descripcion || 'Sin descripción'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">
                    <i className="fas fa-key me-1"></i>
                    Seleccionar Permiso *
                  </label>
                  <select
                    className="form-control"
                    value={selectedPermiso}
                    onChange={(e) => setSelectedPermiso(e.target.value)}
                    required
                  >
                    <option value="">Seleccione un permiso</option>
                    {permisos.map(permiso => (
                      <option key={permiso.id_permiso} value={permiso.id_permiso}>
                        {permiso.nombre} ({permiso.modulo}) - {permiso.slug}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedRol && selectedPermiso && (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    Se asignará el permiso <strong>{getPermisoName(selectedPermiso)}</strong> 
                    al rol <strong>{getRolName(selectedRol)}</strong>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRol('');
                    setSelectedPermiso('');
                  }}
                >
                  <i className="fas fa-times me-1"></i>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!selectedRol || !selectedPermiso}
                >
                  <i className="fas fa-save me-1"></i>
                  Asignar Permiso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolPermisos;