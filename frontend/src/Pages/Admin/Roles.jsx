import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/rol.css';

// URL base de la API - AJUSTA ESTO SEGÚN TU CONFIGURACIÓN
const API_URL = 'http://localhost:8000/api';

const Roles = () => {
  // Estados principales
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  
  // Estados para login
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  
  // Estados para formularios y modales
  const [showForm, setShowForm] = useState(false);
  const [showPermisosModal, setShowPermisosModal] = useState(false);
  const [selectedRol, setSelectedRol] = useState(null);
  const [editingRol, setEditingRol] = useState(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  
  // Estado para formulario
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    activo: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  
  // Estado para permisos
  const [permisos, setPermisos] = useState([]);
  const [selectedPermisos, setSelectedPermisos] = useState([]);
  const [permisosLoading, setPermisosLoading] = useState(false);
  const [savingPermisos, setSavingPermisos] = useState(false);

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

  // Función de login (adaptada a tu API)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginData)
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la autenticación');
      }
      
      if (data.success && data.token) {
        // Guardar token según preferencia del usuario (USANDO TU PATRÓN)
        if (loginData.remember) {
          localStorage.setItem('auth_token', data.token);
        } else {
          localStorage.setItem('auth_token', data.token); // Usamos localStorage para consistencia
        }
        
        // También guardar info del usuario si viene en la respuesta
        if (data.data) {
          localStorage.setItem('user', JSON.stringify(data.data));
        }
        
        setShowLogin(false);
        setLoginError(null);
        fetchRoles(); // Intentar cargar roles nuevamente
      } else {
        setLoginError(data.message || 'Error en la autenticación');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Error de conexión');
    } finally {
      setLoginLoading(false);
    }
  };

  // Función de logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setShowLogin(true);
    setRoles([]);
  };

  // Fetch roles desde tu API (USANDO TU PATRÓN EXACTO)
  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    
    try {
      // Si no hay token, mostrar login
      if (!hasToken()) {
        setShowLogin(true);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/roles`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Roles response status:', response.status);
      
      if (response.status === 401) {
        // Token inválido o expirado
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        setShowLogin(true);
        return;
      }
      
      if (response.status === 403) {
        setUnauthorized(true);
        setError('No tienes permisos para acceder a los roles');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Roles data:', data);
      
      if (data.success) {
        setRoles(data.data || []);
        setShowLogin(false);
      } else {
        setError(data.message || 'Error al cargar los roles');
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(err.message || 'Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  // Fetch permisos desde tu API
  const fetchPermisos = async () => {
    try {
      setPermisosLoading(true);
      
      const response = await fetch(`${API_URL}/permisos`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPermisos(data.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching permisos:', err);
    } finally {
      setPermisosLoading(false);
    }
  };

  // Obtener información del usuario actual
  const getCurrentUser = async () => {
    try {
      if (!hasToken()) return null;
      
      const response = await fetch(`${API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (err) {
      console.error('Error getting user:', err);
    }
    return null;
  };

  useEffect(() => {
    // Verificar si ya hay token al cargar el componente
    if (hasToken()) {
      fetchRoles();
    } else {
      setShowLogin(true);
      setLoading(false);
    }
  }, []);

  // Filtro de roles
  const filteredRoles = roles.filter(rol => {
    const matchesSearch = rol.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rol.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rol.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = !showActiveOnly || rol.activo;
    return matchesSearch && matchesActive;
  });

  // Handlers para el formulario de roles
  const handleCreate = () => {
    setFormData({
      nombre: '',
      slug: '',
      descripcion: '',
      activo: true
    });
    setFormErrors({});
    setEditingRol(null);
    setShowForm(true);
  };

  const handleEdit = (rol) => {
    setFormData({
      nombre: rol.nombre || '',
      slug: rol.slug || '',
      descripcion: rol.descripcion || '',
      activo: rol.activo !== undefined ? rol.activo : true
    });
    setFormErrors({});
    setEditingRol(rol);
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const generateSlug = (nombre) => {
    return nombre
      .toLowerCase()
      .replace(/[áäàâ]/g, 'a')
      .replace(/[éëèê]/g, 'e')
      .replace(/[íïìî]/g, 'i')
      .replace(/[óöòô]/g, 'o')
      .replace(/[úüùû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNombreChange = (e) => {
    const nombre = e.target.value;
    setFormData(prev => ({
      ...prev,
      nombre,
      slug: generateSlug(nombre)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido';
    } else if (formData.slug.length > 100) {
      newErrors.slug = 'El slug no puede exceder 100 caracteres';
    }
    
    if (formData.descripcion && formData.descripcion.length > 500) {
      newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setFormLoading(true);
    
    try {
      const url = editingRol ? `${API_URL}/roles/${editingRol.id_rol}` : `${API_URL}/roles`;
      const method = editingRol ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          setFormErrors(data.errors);
        } else {
          throw new Error(data.message || 'Error al guardar el rol');
        }
        return;
      }
      
      if (data.success) {
        alert(editingRol ? 'Rol actualizado exitosamente' : 'Rol creado exitosamente');
        setShowForm(false);
        fetchRoles();
      } else {
        alert(data.message || 'Error al guardar el rol');
      }
    } catch (err) {
      alert(err.message || 'Error de conexión');
    } finally {
      setFormLoading(false);
    }
  };

  // Handlers para permisos
  const handleAssignPermisos = (rol) => {
    setSelectedRol(rol);
    setSelectedPermisos(rol.permisos?.map(p => p.id_permiso) || []);
    fetchPermisos();
    setShowPermisosModal(true);
  };

  const handlePermisoToggle = (permisoId) => {
    setSelectedPermisos(prev => {
      if (prev.includes(permisoId)) {
        return prev.filter(id => id !== permisoId);
      } else {
        return [...prev, permisoId];
      }
    });
  };

  const handleSelectAllPermisos = () => {
    if (selectedPermisos.length === permisos.length) {
      setSelectedPermisos([]);
    } else {
      setSelectedPermisos(permisos.map(p => p.id_permiso));
    }
  };

  const handleSavePermisos = async (e) => {
    e.preventDefault();
    
    if (!selectedRol) return;
    
    setSavingPermisos(true);
    
    try {
      const response = await fetch(`${API_URL}/roles/${selectedRol.id_rol}/asignar-permisos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          permisos: selectedPermisos
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al asignar permisos');
      }
      
      if (data.success) {
        alert('Permisos asignados exitosamente');
        setShowPermisosModal(false);
        fetchRoles();
      } else {
        alert(data.message || 'Error al asignar permisos');
      }
    } catch (err) {
      alert(err.message || 'Error de conexión');
    } finally {
      setSavingPermisos(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este rol?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`${API_URL}/roles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchRoles();
      } else {
        alert(data.message || 'Error al eliminar el rol');
      }
    } catch (err) {
      alert('Error de conexión al servidor');
    }
  };

  const handleToggleActive = async (rol) => {
    const newStatus = !rol.activo;
    const confirmMessage = newStatus 
      ? '¿Activar este rol?' 
      : '¿Desactivar este rol?';
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(`${API_URL}/roles/${rol.id_rol}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...rol,
          activo: newStatus
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchRoles();
      } else {
        alert(data.message || 'Error al actualizar el rol');
      }
    } catch (err) {
      alert('Error de conexión al servidor');
    }
  };

  // Agrupar permisos por categoría
  const permisosByCategory = permisos.reduce((acc, permiso) => {
    const category = permiso.categoria || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permiso);
    return acc;
  }, {});

  // Botón de debug para verificar token
  const DebugPanel = () => (
    <div className="debug-panel" style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#f8f9fa',
      padding: '10px',
      borderRadius: '5px',
      border: '1px solid #ddd',
      zIndex: 1000,
      fontSize: '12px'
    }}>
      <strong>Debug Info:</strong>
      <div>Token: {hasToken() ? '✅ Presente' : '❌ Ausente'}</div>
      <div>URL API: {API_URL}</div>
      <button 
        onClick={() => {
          console.log('Token actual:', getToken());
          console.log('Usuario en localStorage:', localStorage.getItem('user'));
        }}
        style={{marginTop: '5px', padding: '2px 5px'}}
      >
        Ver en consola
      </button>
    </div>
  );

  // Renderizado condicional para login
  if (showLogin) {
    return (
      <>
        <div className="roles-container">
          <Sidebar />
          <div className="roles-content">
            <Toolbar />
            <main className="roles-main">
              <div className="auth-container">
                <div className="auth-card">
                  <div className="auth-header">
                    <h2><i className="fas fa-lock"></i> Autenticación Requerida</h2>
                    <p>Necesitas iniciar sesión para acceder a la gestión de roles</p>
                  </div>
                  
                  <form onSubmit={handleLogin} className="auth-form">
                    {loginError && (
                      <div className="alert alert-error">
                        <i className="fas fa-exclamation-circle"></i>
                        {loginError}
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label htmlFor="email">Email:</label>
                      <input
                        type="email"
                        id="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        placeholder="admin@test.com"
                        required
                        disabled={loginLoading}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="password">Contraseña:</label>
                      <input
                        type="password"
                        id="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        placeholder="admin123"
                        required
                        disabled={loginLoading}
                      />
                    </div>
                    
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={loginData.remember}
                          onChange={(e) => setLoginData({...loginData, remember: e.target.checked})}
                          disabled={loginLoading}
                        />
                        <span>Recordar sesión</span>
                      </label>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn-primary btn-block"
                      disabled={loginLoading}
                    >
                      {loginLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Iniciando sesión...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
                        </>
                      )}
                    </button>
                  </form>
                  
                  <div className="auth-footer">
                    <p><strong>Credenciales de prueba:</strong></p>
                    <div className="test-credentials">
                      <p><i className="fas fa-user-shield"></i> Admin: admin@test.com / admin123</p>
                      <p><i className="fas fa-user-tag"></i> Secretaria: secretaria@test.com / secretaria123</p>
                    </div>
                    <p className="auth-help">
                      <i className="fas fa-info-circle"></i> Si no tienes cuenta, crea un usuario desde tu API
                    </p>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <DebugPanel />
      </>
    );
  }

  // Renderizado para no autorizado (403)
  if (unauthorized) {
    return (
      <>
        <div className="roles-container">
          <Sidebar />
          <div className="roles-content">
            <Toolbar />
            <main className="roles-main">
              <div className="unauthorized-container">
                <div className="unauthorized-icon">
                  <i className="fas fa-user-lock"></i>
                </div>
                <h2>Permisos Insuficientes</h2>
                <p>Tu cuenta no tiene permisos para acceder a la gestión de roles.</p>
                <p className="unauthorized-detail">
                  <strong>Requiere:</strong> Rol de Administrador o Secretaria
                </p>
                <div className="unauthorized-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => window.history.back()}
                  >
                    <i className="fas fa-arrow-left"></i> Volver atrás
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt"></i> Cerrar sesión
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
        <DebugPanel />
      </>
    );
  }

  // Renderizado normal
  if (loading) {
    return (
      <>
        <div className="roles-container">
          <Sidebar />
          <div className="roles-content">
            <Toolbar />
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Cargando roles...</p>
            </div>
          </div>
        </div>
        <DebugPanel />
      </>
    );
  }

  return (
    <>
      <div className="roles-container">
        <Sidebar />
        <div className="roles-content">
          <Toolbar />
          
          <main className="roles-main">
            {/* Header con botón de logout */}
            <div className="roles-header">
              <h1>
                <i className="fas fa-user-tag"></i> Gestión de Roles
                <span className="header-subtitle">
                  ({roles.length} roles)
                </span>
              </h1>
              <div className="header-actions">
                <button 
                  className="btn-secondary"
                  onClick={fetchRoles}
                  title="Actualizar lista"
                >
                  <i className="fas fa-sync-alt"></i> Actualizar
                </button>
                <button 
                  className="btn-secondary btn-logout"
                  onClick={handleLogout}
                  title="Cerrar sesión"
                >
                  <i className="fas fa-sign-out-alt"></i> Cerrar sesión
                </button>
                <button className="btn-primary" onClick={handleCreate}>
                  <i className="fas fa-plus"></i> Nuevo Rol
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="roles-filters">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Buscar roles por nombre, slug o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filter-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showActiveOnly}
                    onChange={(e) => setShowActiveOnly(e.target.checked)}
                  />
                  <span>Mostrar solo activos</span>
                </label>
                
                <div className="roles-count">
                  <i className="fas fa-filter"></i> {filteredRoles.length} de {roles.length} roles
                </div>
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i>
                {error}
                <button 
                  className="btn-retry"
                  onClick={fetchRoles}
                >
                  <i className="fas fa-redo"></i> Reintentar
                </button>
              </div>
            )}

            {/* Tabla de roles */}
            <div className="roles-table-container">
              <div className="table-responsive">
                {filteredRoles.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-users-slash"></i>
                    <h3>No hay roles disponibles</h3>
                    <p>{searchTerm || showActiveOnly ? 'Intenta con otros filtros' : 'Comienza creando un nuevo rol'}</p>
                    {!searchTerm && !showActiveOnly && (
                      <button className="btn-primary" onClick={handleCreate}>
                        <i className="fas fa-plus"></i> Crear Primer Rol
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="roles-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Slug</th>
                        <th>Descripción</th>
                        <th>Permisos</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoles.map((rol) => (
                        <tr key={rol.id_rol}>
                          <td>
                            <code className="role-id">#{rol.id_rol}</code>
                          </td>
                          <td>
                            <div className="role-name">
                              <span className="role-icon">
                                <i className="fas fa-user-tag"></i>
                              </span>
                              {rol.nombre}
                            </div>
                          </td>
                          <td>
                            <code className="role-slug">{rol.slug}</code>
                          </td>
                          <td className="role-description">
                            {rol.descripcion || <span className="text-muted">Sin descripción</span>}
                          </td>
                          <td>
                            <span className="permisos-count">
                              <i className="fas fa-key"></i> {rol.permisos?.length || 0}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${rol.activo ? 'active' : 'inactive'}`}>
                              <i className={`fas ${rol.activo ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                              {rol.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-icon btn-info"
                                onClick={() => handleAssignPermisos(rol)}
                                title="Asignar permisos"
                              >
                                <i className="fas fa-key"></i>
                              </button>
                              
                              <button
                                className="btn-icon btn-edit"
                                onClick={() => handleEdit(rol)}
                                title="Editar"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              
                              <button
                                className={`btn-icon ${rol.activo ? 'btn-warning' : 'btn-success'}`}
                                onClick={() => handleToggleActive(rol)}
                                title={rol.activo ? 'Desactivar' : 'Activar'}
                              >
                                <i className={rol.activo ? 'fas fa-toggle-on' : 'fas fa-toggle-off'}></i>
                              </button>
                              
                              <button
                                className="btn-icon btn-danger"
                                onClick={() => handleDelete(rol.id_rol)}
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
                )}
              </div>
            </div>

            {/* Modal para crear/editar rol */}
            {showForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2>{editingRol ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
                    <button 
                      className="btn-close" 
                      onClick={() => setShowForm(false)}
                      disabled={formLoading}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <form onSubmit={handleFormSubmit} className="rol-form">
                    <div className="form-group">
                      <label htmlFor="nombre">
                        Nombre *
                        {formErrors.nombre && <span className="error-text"> - {formErrors.nombre}</span>}
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleNombreChange}
                        className={formErrors.nombre ? 'input-error' : ''}
                        placeholder="Ej: Administrador"
                        maxLength={100}
                        disabled={formLoading}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="slug">
                        Slug *
                        {formErrors.slug && <span className="error-text"> - {formErrors.slug}</span>}
                      </label>
                      <input
                        type="text"
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleFormChange}
                        className={formErrors.slug ? 'input-error' : ''}
                        placeholder="Ej: admin"
                        maxLength={100}
                        disabled={formLoading}
                        required
                      />
                      <small className="form-help">
                        Identificador único para el rol (se genera automáticamente)
                      </small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="descripcion">
                        Descripción
                        {formErrors.descripcion && <span className="error-text"> - {formErrors.descripcion}</span>}
                      </label>
                      <textarea
                        id="descripcion"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleFormChange}
                        className={formErrors.descripcion ? 'input-error' : ''}
                        placeholder="Descripción del rol..."
                        rows={3}
                        maxLength={500}
                        disabled={formLoading}
                      />
                    </div>
                    
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="activo"
                          checked={formData.activo}
                          onChange={handleFormChange}
                          disabled={formLoading}
                        />
                        <span>Rol activo</span>
                      </label>
                    </div>
                    
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowForm(false)}
                        disabled={formLoading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={formLoading}
                      >
                        {formLoading ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            {editingRol ? 'Actualizando...' : 'Creando...'}
                          </>
                        ) : (
                          <>
                            <i className={editingRol ? 'fas fa-save' : 'fas fa-plus'}></i>
                            {editingRol ? 'Actualizar Rol' : 'Crear Rol'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal para asignar permisos */}
            {showPermisosModal && selectedRol && (
              <div className="modal-overlay">
                <div className="modal-content wide-modal">
                  <div className="modal-header">
                    <h2>Asignar Permisos a: {selectedRol.nombre}</h2>
                    <button 
                      className="btn-close" 
                      onClick={() => {
                        setShowPermisosModal(false);
                        setSelectedRol(null);
                      }}
                      disabled={savingPermisos}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <form onSubmit={handleSavePermisos}>
                    <div className="permisos-header">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={handleSelectAllPermisos}
                        disabled={permisosLoading || savingPermisos}
                      >
                        {selectedPermisos.length === permisos.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                      </button>
                      <div className="selected-count">
                        {selectedPermisos.length} de {permisos.length} permisos seleccionados
                      </div>
                    </div>
                    
                    {permisosLoading ? (
                      <div className="loading-permisos">
                        <div className="spinner"></div>
                        <p>Cargando permisos...</p>
                      </div>
                    ) : (
                      <div className="permisos-grid">
                        {Object.keys(permisosByCategory).length > 0 ? (
                          Object.entries(permisosByCategory).map(([category, categoryPermisos]) => (
                            <div key={category} className="permiso-category">
                              <h3 className="category-title">
                                <i className="fas fa-folder"></i> {category}
                              </h3>
                              <div className="permiso-list">
                                {categoryPermisos.map(permiso => (
                                  <label key={permiso.id_permiso} className="permiso-item">
                                    <input
                                      type="checkbox"
                                      checked={selectedPermisos.includes(permiso.id_permiso)}
                                      onChange={() => handlePermisoToggle(permiso.id_permiso)}
                                      disabled={savingPermisos}
                                    />
                                    <div className="permiso-info">
                                      <span className="permiso-name">{permiso.nombre}</span>
                                      <span className="permiso-description">{permiso.descripcion || 'Sin descripción'}</span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="empty-state">
                            <i className="fas fa-exclamation-triangle"></i>
                            <h3>No hay permisos disponibles</h3>
                            <p>Asegúrate de que el endpoint /api/permisos esté configurado</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setShowPermisosModal(false);
                          setSelectedRol(null);
                        }}
                        disabled={savingPermisos}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={savingPermisos || permisosLoading || permisos.length === 0}
                      >
                        {savingPermisos ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> Guardando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i> Guardar Permisos
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      <DebugPanel />
    </>
  );
};

export default Roles;