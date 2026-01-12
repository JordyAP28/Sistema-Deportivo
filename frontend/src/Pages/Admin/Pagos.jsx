import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/pagos.css';

const API_URL = 'http://localhost:8000/api';

const Pagos = () => {
  // Estados principales
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [showResumenModal, setShowResumenModal] = useState(false);
  const [showConfirmarModal, setShowConfirmarModal] = useState(false);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [showSaldoModal, setShowSaldoModal] = useState(false);
  
  // Estados para datos relacionados
  const [currentPago, setCurrentPago] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [saldoInfo, setSaldoInfo] = useState(null);
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterMetodoPago, setFilterMetodoPago] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterFactura, setFilterFactura] = useState('');

  // Estados para formularios
  const [formData, setFormData] = useState({
    id_factura: '',
    numero_pago: '',
    monto: 0,
    fecha_pago: '',
    metodo_pago: '',
    referencia: '',
    comprobante: null,
    observaciones: '',
    estado: 'pendiente'
  });

  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState('');
  
  // Form state para rechazar pago
  const [rechazoForm, setRechazoForm] = useState({
    motivo: ''
  });

  // Form state para resumen
  const [resumenForm, setResumenForm] = useState({
    fecha_inicio: '',
    fecha_fin: ''
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
    fetchPagos();
    fetchFacturas();
  }, []);

  // Cargar todos los pagos
  const fetchPagos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/pagos`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setPagos(response.data.data);
      } else {
        setError('Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('Error al cargar pagos:', err);
      setError('Error al cargar pagos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar facturas
  const fetchFacturas = async () => {
    try {
      const response = await axios.get(`${API_URL}/facturas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setFacturas(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar facturas:', err);
    }
  };

  // Generar número de pago automático
  const generarNumeroPago = async () => {
    try {
      const response = await axios.get(`${API_URL}/pagos/generar-numero`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setFormData({
          ...formData,
          numero_pago: response.data.data.numero_pago
        });
      }
    } catch (err) {
      console.error('Error al generar número de pago:', err);
    }
  };

  // Obtener saldo pendiente de una factura
  const fetchSaldoPendiente = async (facturaId) => {
    try {
      const response = await axios.get(`${API_URL}/pagos/saldo-pendiente/${facturaId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setSaldoInfo(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar saldo pendiente:', err);
    }
  };

  // Obtener resumen de pagos
  const fetchResumenPagos = async (fechaInicio, fechaFin) => {
    try {
      const response = await axios.get(`${API_URL}/pagos/resumen`, {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setResumen(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar resumen:', err);
    }
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/pagos/buscar`, {
        busqueda: searchTerm
      }, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setPagos(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar pagos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar pagos localmente
  const filtrarPagos = () => {
    let filtered = [...pagos];
    
    if (filterEstado) {
      filtered = filtered.filter(p => p.estado === filterEstado);
    }
    
    if (filterMetodoPago) {
      filtered = filtered.filter(p => p.metodo_pago === filterMetodoPago);
    }
    
    if (filterFechaDesde) {
      filtered = filtered.filter(p => new Date(p.fecha_pago) >= new Date(filterFechaDesde));
    }
    
    if (filterFechaHasta) {
      filtered = filtered.filter(p => new Date(p.fecha_pago) <= new Date(filterFechaHasta));
    }
    
    if (filterFactura) {
      filtered = filtered.filter(p => p.id_factura == filterFactura);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.numero_pago?.toLowerCase().includes(term) ||
        p.referencia?.toLowerCase().includes(term) ||
        p.observaciones?.toLowerCase().includes(term) ||
        p.factura?.numero_factura?.toLowerCase().includes(term) ||
        p.factura?.deportista?.nombres?.toLowerCase().includes(term) ||
        p.factura?.deportista?.apellidos?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    setFilterMetodoPago('');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setFilterFactura('');
    fetchPagos();
  };

  // Crear pago
  const handleCreate = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    
    // Agregar campos del formulario
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Agregar archivo de comprobante si existe
    if (comprobanteFile) {
      formDataToSend.append('comprobante', comprobanteFile);
    }

    try {
      const response = await axios.post(`${API_URL}/pagos`, formDataToSend, {
        headers: getMultipartHeaders()
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchPagos();
        setSuccessMessage('Pago registrado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear pago:', err);
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
        setError('Error al crear pago: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar pago
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentPago) return;

    const formDataToSend = new FormData();
    
    // Agregar campos del formulario
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Agregar archivo de comprobante si existe
    if (comprobanteFile) {
      formDataToSend.append('comprobante', comprobanteFile);
    }

    try {
      const response = await axios.put(`${API_URL}/pagos/${currentPago.id_pago}`, formDataToSend, {
        headers: getMultipartHeaders()
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchPagos();
        setSuccessMessage('Pago actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar pago:', err);
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
        setError('Error al actualizar pago: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar pago
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este pago?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/pagos/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchPagos();
        setSuccessMessage('Pago eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar pago:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al eliminar pago: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Restaurar pago
  const handleRestore = async (id) => {
    try {
      const response = await axios.post(`${API_URL}/pagos/${id}/restore`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchPagos();
        setSuccessMessage('Pago restaurado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al restaurar pago:', err);
      setError('Error al restaurar pago: ' + (err.response?.data?.message || err.message));
    }
  };

  // Confirmar pago
  const handleConfirmar = async () => {
    if (!currentPago) return;

    try {
      const response = await axios.post(`${API_URL}/pagos/${currentPago.id_pago}/confirmar`, {}, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowConfirmarModal(false);
        fetchPagos();
        setSuccessMessage('Pago confirmado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al confirmar pago:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al confirmar pago: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Rechazar pago
  const handleRechazar = async (e) => {
    e.preventDefault();
    
    if (!currentPago) return;

    try {
      const response = await axios.post(`${API_URL}/pagos/${currentPago.id_pago}/rechazar`, rechazoForm, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowRechazarModal(false);
        setRechazoForm({ motivo: '' });
        fetchPagos();
        setSuccessMessage('Pago rechazado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al rechazar pago:', err);
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
        setError('Error al rechazar pago: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Ver detalles
  const handleViewDetails = (pago) => {
    setCurrentPago(pago);
    setShowDetallesModal(true);
  };

  // Ver comprobante
  const handleViewComprobante = (pago) => {
    setCurrentPago(pago);
    if (pago.comprobante) {
      setComprobanteUrl(`${API_URL.replace('/api', '')}/storage/${pago.comprobante}`);
      setShowComprobanteModal(true);
    } else {
      alert('No hay comprobante disponible para este pago');
    }
  };

  // Ver saldo pendiente
  const handleViewSaldo = (pago) => {
    setCurrentPago(pago);
    fetchSaldoPendiente(pago.id_factura);
    setShowSaldoModal(true);
  };

  // Ver resumen
  const handleViewResumen = () => {
    const hoy = new Date();
    const haceUnaSemana = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    setResumenForm({
      fecha_inicio: haceUnaSemana.toISOString().split('T')[0],
      fecha_fin: hoy.toISOString().split('T')[0]
    });
    
    fetchResumenPagos(
      haceUnaSemana.toISOString().split('T')[0],
      hoy.toISOString().split('T')[0]
    );
    
    setShowResumenModal(true);
  };

  // Confirmar pago modal
  const handleOpenConfirmar = (pago) => {
    setCurrentPago(pago);
    setShowConfirmarModal(true);
  };

  // Rechazar pago modal
  const handleOpenRechazar = (pago) => {
    setCurrentPago(pago);
    setShowRechazarModal(true);
  };

  // Editar pago
  const handleEdit = (pago) => {
    setCurrentPago(pago);
    
    setFormData({
      id_factura: pago.id_factura || '',
      numero_pago: pago.numero_pago || '',
      monto: pago.monto || 0,
      fecha_pago: pago.fecha_pago ? pago.fecha_pago.split('T')[0] : '',
      metodo_pago: pago.metodo_pago || '',
      referencia: pago.referencia || '',
      comprobante: null,
      observaciones: pago.observaciones || '',
      estado: pago.estado || 'pendiente'
    });
    
    setComprobanteFile(null);
    setComprobantePreview(pago.comprobante ? `${API_URL.replace('/api', '')}/storage/${pago.comprobante}` : '');
    
    setShowEditModal(true);
  };

  // Agregar pago para una factura específica
  const handleAddForFactura = (factura) => {
    resetForm();
    generarNumeroPago();
    
    setFormData({
      ...formData,
      id_factura: factura.id_factura,
      monto: factura.total - factura.pagos?.reduce((sum, p) => sum + parseFloat(p.monto), 0) || 0,
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: factura.metodo_pago || ''
    });
    
    setShowModal(true);
  };

  // Manejar cambio de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setComprobanteFile(file);
      
      // Crear preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setComprobantePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setComprobantePreview('');
      }
    }
  };

  // Resetear formularios
  const resetForm = () => {
    setFormData({
      id_factura: '',
      numero_pago: '',
      monto: 0,
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: '',
      referencia: '',
      comprobante: null,
      observaciones: '',
      estado: 'pendiente'
    });
    setComprobanteFile(null);
    setComprobantePreview('');
    setCurrentPago(null);
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

  // Formatear moneda
  const formatMoneda = (monto) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(monto || 0);
  };

  // Obtener pagos filtrados
  const getFilteredPagos = () => {
    return filtrarPagos();
  };

  // Calcular estadísticas generales
  const calcularEstadisticasGenerales = () => {
    if (pagos.length === 0) return null;
    
    const total = pagos.length;
    const confirmados = pagos.filter(p => p.estado === 'confirmado').length;
    const pendientes = pagos.filter(p => p.estado === 'pendiente').length;
    const rechazados = pagos.filter(p => p.estado === 'rechazado').length;
    
    // Totales monetarios
    const totalConfirmados = pagos
      .filter(p => p.estado === 'confirmado')
      .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
    
    const totalPendientes = pagos
      .filter(p => p.estado === 'pendiente')
      .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
    
    const totalRechazados = pagos
      .filter(p => p.estado === 'rechazado')
      .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
    
    // Métodos de pago más usados
    const metodosPago = pagos.reduce((acc, p) => {
      const metodo = p.metodo_pago || 'No especificado';
      acc[metodo] = (acc[metodo] || 0) + 1;
      return acc;
    }, {});
    
    // Pago con mayor monto
    const pagoMayorMonto = [...pagos]
      .sort((a, b) => parseFloat(b.monto) - parseFloat(a.monto))
      .shift();
    
    return {
      total,
      confirmados,
      pendientes,
      rechazados,
      totalConfirmados,
      totalPendientes,
      totalRechazados,
      metodosPago,
      pagoMayorMonto
    };
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  const pagosFiltrados = getFilteredPagos();
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
                <i className="fas fa-money-bill-wave me-2"></i>
                Gestión de Pagos
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
                    generarNumeroPago();
                    setShowModal(true);
                  }}
                  disabled={loading}
                >
                  <i className="fas fa-plus"></i> Nuevo Pago
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
                        placeholder="N° pago, referencia, factura, deportista..."
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
                      <option value="confirmado">Confirmado</option>
                      <option value="rechazado">Rechazado</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Método Pago</label>
                    <select 
                      className="form-select"
                      value={filterMetodoPago}
                      onChange={(e) => setFilterMetodoPago(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Fecha Desde</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filterFechaDesde}
                      onChange={(e) => setFilterFechaDesde(e.target.value)}
                    />
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Fecha Hasta</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filterFechaHasta}
                      onChange={(e) => setFilterFechaHasta(e.target.value)}
                    />
                  </div>
                  
                  <div className="col-md-1">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={() => {
                        const filtered = filtrarPagos();
                        setPagos(filtered);
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
                    <label className="form-label">Factura</label>
                    <select 
                      className="form-select"
                      value={filterFactura}
                      onChange={(e) => setFilterFactura(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {facturas.map((factura) => (
                        <option key={`factura-${factura.id_factura}`} value={factura.id_factura}>
                          {factura.numero_factura} - {factura.deportista?.nombres} {factura.deportista?.apellidos}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-4">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-info w-100"
                      onClick={handleViewResumen}
                      disabled={loading}
                    >
                      <i className="fas fa-chart-bar"></i> Resumen de Pagos
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
                        <p>Total Pagos</p>
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
                        <h4>{estadisticasGenerales.confirmados}</h4>
                        <p>Confirmados</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-danger text-white">
                        <h4>{estadisticasGenerales.rechazados}</h4>
                        <p>Rechazados</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-primary text-white">
                        <h4>{formatMoneda(estadisticasGenerales.totalConfirmados)}</h4>
                        <p>Total Confirmado</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-secondary text-white">
                        <h4>{formatMoneda(estadisticasGenerales.totalPendientes)}</h4>
                        <p>Total Pendiente</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de pagos */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando pagos...</p>
                </div>
              ) : pagosFiltrados.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-money-bill-wave fa-3x text-muted mb-3"></i>
                  <h4>No hay pagos registrados</h4>
                  <p>Registra tu primer pago usando el botón "Nuevo Pago"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>N° Pago</th>
                        <th>Factura</th>
                        <th>Deportista</th>
                        <th>Fecha Pago</th>
                        <th>Monto</th>
                        <th>Método</th>
                        <th>Referencia</th>
                        <th>Estado</th>
                        <th>Comprobante</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagosFiltrados.map((pago) => (
                        <tr key={`pago-${pago.id_pago}`}>
                          <td>
                            <strong>{pago.numero_pago}</strong>
                          </td>
                          <td>
                            {pago.factura ? (
                              <div>
                                <div>{pago.factura.numero_factura}</div>
                                <div className="text-muted small">
                                  {formatMoneda(pago.factura.total)}
                                </div>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>
                            {pago.factura?.deportista ? (
                              <div>
                                {pago.factura.deportista.nombres} {pago.factura.deportista.apellidos}
                              </div>
                            ) : (
                              'No asignado'
                            )}
                          </td>
                          <td>
                            {formatFecha(pago.fecha_pago)}
                          </td>
                          <td>
                            <strong>{formatMoneda(pago.monto)}</strong>
                          </td>
                          <td>
                            <span className={`badge metodo-pago metodo-${pago.metodo_pago}`}>
                              {pago.metodo_pago}
                            </span>
                          </td>
                          <td>
                            <div className="small">
                              {pago.referencia || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${pago.estado}`}>
                              {pago.estado}
                            </span>
                          </td>
                          <td>
                            {pago.comprobante ? (
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewComprobante(pago)}
                                title="Ver comprobante"
                              >
                                <i className="fas fa-file-invoice"></i>
                              </button>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetails(pago)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEdit(pago)}
                                title="Editar"
                                disabled={pago.estado === 'rechazado'}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleOpenConfirmar(pago)}
                                title="Confirmar pago"
                                disabled={pago.estado === 'confirmado' || pago.estado === 'rechazado'}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleOpenRechazar(pago)}
                                title="Rechazar pago"
                                disabled={pago.estado === 'rechazado' || pago.estado === 'confirmado'}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewSaldo(pago)}
                                title="Ver saldo pendiente"
                              >
                                <i className="fas fa-dollar-sign"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(pago.id_pago)}
                                title="Eliminar"
                                disabled={pago.estado === 'confirmado'}
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

      {/* Modal para crear pago */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nuevo Pago
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
                      <label className="form-label">Factura *</label>
                      <select
                        className="form-control"
                        value={formData.id_factura}
                        onChange={(e) => {
                          const facturaId = e.target.value;
                          setFormData({...formData, id_factura: facturaId});
                          
                          // Buscar la factura seleccionada
                          const facturaSeleccionada = facturas.find(f => f.id_factura == facturaId);
                          if (facturaSeleccionada) {
                            fetchSaldoPendiente(facturaId);
                          }
                        }}
                        required
                      >
                        <option value="">Seleccione una factura</option>
                        {facturas.map((factura) => (
                          <option key={`factura-${factura.id_factura}`} value={factura.id_factura}>
                            {factura.numero_factura} - {factura.deportista?.nombres} {factura.deportista?.apellidos} - {formatMoneda(factura.total)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Número de Pago *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.numero_pago}
                        onChange={(e) => setFormData({...formData, numero_pago: e.target.value})}
                        required
                        placeholder="Ej: PAGO-2024-000001"
                      />
                      <small className="text-muted">
                        <button 
                          type="button" 
                          className="btn btn-link btn-sm p-0"
                          onClick={generarNumeroPago}
                        >
                          <i className="fas fa-sync-alt me-1"></i> Generar automáticamente
                        </button>
                      </small>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Monto *</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.monto}
                          onChange={(e) => setFormData({
                            ...formData,
                            monto: parseFloat(e.target.value) || 0
                          })}
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>
                      {saldoInfo && (
                        <small className="text-muted">
                          Saldo pendiente: {formatMoneda(saldoInfo.saldo_pendiente)} | 
                          Máximo: {formatMoneda(saldoInfo.saldo_pendiente)}
                        </small>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha Pago *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha_pago}
                        onChange={(e) => setFormData({...formData, fecha_pago: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Método de Pago *</label>
                      <select
                        className="form-control"
                        value={formData.metodo_pago}
                        onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                        required
                      >
                        <option value="">Seleccione método</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Referencia</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.referencia}
                        onChange={(e) => setFormData({...formData, referencia: e.target.value})}
                        placeholder="Número de referencia, transacción, etc."
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
                        <option value="confirmado">Confirmado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Comprobante (Opcional)</label>
                  <div className="comprobante-upload-container">
                    {comprobantePreview ? (
                      <div className="comprobante-preview">
                        <img 
                          src={comprobantePreview} 
                          alt="Comprobante preview" 
                          className="img-fluid mb-2"
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            setComprobanteFile(null);
                            setComprobantePreview('');
                          }}
                        >
                          <i className="fas fa-times me-1"></i> Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className="comprobante-placeholder">
                        <i className="fas fa-cloud-upload-alt fa-3x mb-3"></i>
                        <p>Arrastra o haz click para subir comprobante</p>
                        <p className="text-muted small">Formatos: JPG, PNG, PDF (Max: 5MB)</p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="comprobante-input"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                    />
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

                {saldoInfo && (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Información de la factura:</strong> {saldoInfo.factura} | 
                    <strong> Total:</strong> {formatMoneda(saldoInfo.total_factura)} | 
                    <strong> Pagado:</strong> {formatMoneda(saldoInfo.total_pagado)} | 
                    <strong> Pendiente:</strong> {formatMoneda(saldoInfo.saldo_pendiente)} | 
                    <strong> Completada:</strong> {saldoInfo.completamente_pagada ? 'Sí' : 'No'}
                  </div>
                )}
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
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles del pago */}
      {showDetallesModal && currentPago && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-money-bill-wave me-2"></i>
                Detalles del Pago: {currentPago.numero_pago}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDetallesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="info-section mb-4">
                    <h5 className="text-primary">
                      <i className="fas fa-receipt me-2"></i>Información del Pago
                    </h5>
                    <div className="info-item">
                      <strong>Número:</strong> {currentPago.numero_pago}
                    </div>
                    <div className="info-item">
                      <strong>Estado:</strong> 
                      <span className={`badge estado-badge estado-${currentPago.estado} ms-2`}>
                        {currentPago.estado}
                      </span>
                    </div>
                    <div className="info-item">
                      <strong>Monto:</strong> {formatMoneda(currentPago.monto)}
                    </div>
                    <div className="info-item">
                      <strong>Fecha:</strong> {formatFecha(currentPago.fecha_pago)}
                    </div>
                    <div className="info-item">
                      <strong>Método:</strong> 
                      <span className={`badge metodo-pago metodo-${currentPago.metodo_pago} ms-2`}>
                        {currentPago.metodo_pago}
                      </span>
                    </div>
                    <div className="info-item">
                      <strong>Referencia:</strong> {currentPago.referencia || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="info-section mb-4">
                    <h5 className="text-primary">
                      <i className="fas fa-file-invoice-dollar me-2"></i>Información de Factura
                    </h5>
                    {currentPago.factura ? (
                      <>
                        <div className="info-item">
                          <strong>Número:</strong> {currentPago.factura.numero_factura}
                        </div>
                        <div className="info-item">
                          <strong>Concepto:</strong> {currentPago.factura.concepto}
                        </div>
                        <div className="info-item">
                          <strong>Total:</strong> {formatMoneda(currentPago.factura.total)}
                        </div>
                        <div className="info-item">
                          <strong>Estado:</strong> {currentPago.factura.estado}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted">No hay información de factura</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="info-section mb-4">
                    <h5 className="text-primary">
                      <i className="fas fa-user me-2"></i>Deportista
                    </h5>
                    {currentPago.factura?.deportista ? (
                      <>
                        <div className="info-item">
                          <strong>Nombre:</strong> {currentPago.factura.deportista.nombres} {currentPago.factura.deportista.apellidos}
                        </div>
                        <div className="info-item">
                          <strong>Documento:</strong> {currentPago.factura.deportista.numero_documento || 'N/A'}
                        </div>
                        <div className="info-item">
                          <strong>Categoría:</strong> {currentPago.factura.deportista.categoria?.nombre || 'N/A'}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted">No hay información del deportista</p>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  {currentPago.comprobante && (
                    <div className="info-section mb-4">
                      <h5 className="text-primary">
                        <i className="fas fa-file-invoice me-2"></i>Comprobante
                      </h5>
                      <div className="text-center">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleViewComprobante(currentPago)}
                        >
                          <i className="fas fa-eye me-2"></i> Ver Comprobante
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {currentPago.observaciones && (
                <div className="info-section">
                  <h5 className="text-primary">
                    <i className="fas fa-comment me-2"></i>Observaciones
                  </h5>
                  <p className="p-3 bg-light rounded">{currentPago.observaciones}</p>
                </div>
              )}
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
                  handleEdit(currentPago);
                }}
                disabled={currentPago.estado === 'rechazado'}
              >
                <i className="fas fa-edit me-2"></i> Editar
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => {
                  setShowDetallesModal(false);
                  handleOpenConfirmar(currentPago);
                }}
                disabled={currentPago.estado === 'confirmado' || currentPago.estado === 'rechazado'}
              >
                <i className="fas fa-check me-2"></i> Confirmar
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={() => {
                  setShowDetallesModal(false);
                  handleOpenRechazar(currentPago);
                }}
                disabled={currentPago.estado === 'rechazado' || currentPago.estado === 'confirmado'}
              >
                <i className="fas fa-times me-2"></i> Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver comprobante */}
      {showComprobanteModal && currentPago && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-file-invoice me-2"></i>
                Comprobante: {currentPago.numero_pago}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowComprobanteModal(false)}
              ></button>
            </div>
            <div className="modal-body text-center">
              {comprobanteUrl ? (
                comprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                  <iframe 
                    src={comprobanteUrl} 
                    className="comprobante-iframe"
                    title="Comprobante PDF"
                  />
                ) : (
                  <img 
                    src={comprobanteUrl} 
                    alt="Comprobante" 
                    className="img-fluid comprobante-img"
                  />
                )
              ) : (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  No se puede cargar el comprobante
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowComprobanteModal(false)}
              >
                Cerrar
              </button>
              <a 
                href={comprobanteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <i className="fas fa-download me-2"></i> Descargar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar pago */}
      {showConfirmarModal && currentPago && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-check-circle me-2"></i>
                Confirmar Pago: {currentPago.numero_pago}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowConfirmarModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>¿Está seguro de confirmar este pago?</strong>
                <ul className="mt-2 mb-0">
                  <li>El pago pasará al estado "Confirmado"</li>
                  <li>El estado de la factura se actualizará automáticamente</li>
                  <li>Esta acción no se puede deshacer</li>
                </ul>
              </div>
              
              <div className="pago-info">
                <p><strong>Número:</strong> {currentPago.numero_pago}</p>
                <p><strong>Monto:</strong> {formatMoneda(currentPago.monto)}</p>
                <p><strong>Factura:</strong> {currentPago.factura?.numero_factura || 'N/A'}</p>
                <p><strong>Estado actual:</strong> 
                  <span className={`badge estado-badge estado-${currentPago.estado} ms-2`}>
                    {currentPago.estado}
                  </span>
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowConfirmarModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={handleConfirmar}
              >
                <i className="fas fa-check me-2"></i> Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para rechazar pago */}
      {showRechazarModal && currentPago && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h3>
                <i className="fas fa-times-circle me-2"></i>
                Rechazar Pago: {currentPago.numero_pago}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowRechazarModal(false);
                  setRechazoForm({ motivo: '' });
                }}
              ></button>
            </div>
            <form onSubmit={handleRechazar}>
              <div className="modal-body">
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>¿Está seguro de rechazar este pago?</strong>
                  <ul className="mt-2 mb-0">
                    <li>El pago pasará al estado "Rechazado"</li>
                    <li>Debe proporcionar un motivo para el rechazo</li>
                    <li>El estado de la factura se actualizará automáticamente</li>
                    <li>Esta acción no se puede deshacer</li>
                  </ul>
                </div>
                
                <div className="pago-info mb-4">
                  <p><strong>Número:</strong> {currentPago.numero_pago}</p>
                  <p><strong>Monto:</strong> {formatMoneda(currentPago.monto)}</p>
                  <p><strong>Factura:</strong> {currentPago.factura?.numero_factura || 'N/A'}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Motivo del Rechazo *</label>
                  <textarea
                    className="form-control"
                    value={rechazoForm.motivo}
                    onChange={(e) => setRechazoForm({ motivo: e.target.value })}
                    rows="4"
                    placeholder="Describa el motivo del rechazo..."
                    required
                  />
                  <small className="text-muted">
                    Este motivo se agregará a las observaciones del pago
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRechazarModal(false);
                    setRechazoForm({ motivo: '' });
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger">
                  <i className="fas fa-times me-2"></i> Rechazar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver saldo pendiente */}
      {showSaldoModal && saldoInfo && currentPago && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-dollar-sign me-2"></i>
                Saldo Pendiente - {currentPago.factura?.numero_factura}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowSaldoModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="saldo-info">
                <div className="info-item">
                  <strong>Factura:</strong> {saldoInfo.factura}
                </div>
                <div className="info-item">
                  <strong>Total Factura:</strong> {formatMoneda(saldoInfo.total_factura)}
                </div>
                <div className="info-item">
                  <strong>Total Pagado:</strong> {formatMoneda(saldoInfo.total_pagado)}
                </div>
                <div className="info-item">
                  <strong>Saldo Pendiente:</strong> 
                  <span className={`ms-2 ${saldoInfo.saldo_pendiente > 0 ? 'text-danger' : 'text-success'}`}>
                    {formatMoneda(saldoInfo.saldo_pendiente)}
                  </span>
                </div>
                <div className="info-item">
                  <strong>Porcentaje Pagado:</strong> 
                  <div className="progress mt-2">
                    <div 
                      className="progress-bar bg-success" 
                      style={{width: `${saldoInfo.porcentaje_pagado}%`}}
                    >
                      {saldoInfo.porcentaje_pagado}%
                    </div>
                  </div>
                </div>
                <div className="info-item">
                  <strong>Completamente Pagada:</strong> 
                  <span className={`badge ${saldoInfo.completamente_pagada ? 'bg-success' : 'bg-warning'} ms-2`}>
                    {saldoInfo.completamente_pagada ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
              
              <div className="alert alert-info mt-4">
                <i className="fas fa-info-circle me-2"></i>
                Este saldo se actualiza automáticamente cuando se confirman o rechazan pagos.
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowSaldoModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  setShowSaldoModal(false);
                  handleAddForFactura(currentPago.factura);
                }}
                disabled={saldoInfo.completamente_pagada}
              >
                <i className="fas fa-plus-circle me-2"></i> Agregar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para resumen de pagos */}
      {showResumenModal && resumen && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-chart-bar me-2"></i>
                Resumen de Pagos
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowResumenModal(false)}
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
                      value={resumenForm.fecha_inicio}
                      onChange={(e) => setResumenForm({
                        ...resumenForm,
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
                      value={resumenForm.fecha_fin}
                      onChange={(e) => setResumenForm({
                        ...resumenForm,
                        fecha_fin: e.target.value
                      })}
                    />
                  </div>
                </div>
                
                <div className="col-md-12">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => fetchResumenPagos(resumenForm.fecha_inicio, resumenForm.fecha_fin)}
                  >
                    <i className="fas fa-sync-alt me-2"></i> Actualizar Resumen
                  </button>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="stat-card-lg text-center bg-success text-white">
                    <h4>{formatMoneda(resumen.total_confirmados || 0)}</h4>
                    <p>Total Confirmados</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="stat-card-lg text-center bg-warning text-dark">
                    <h4>{formatMoneda(resumen.total_pendientes || 0)}</h4>
                    <p>Total Pendientes</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="stat-card-lg text-center bg-danger text-white">
                    <h4>{formatMoneda(resumen.total_rechazados || 0)}</h4>
                    <p>Total Rechazados</p>
                  </div>
                </div>
              </div>

              {resumen.pagos_por_metodo && resumen.pagos_por_metodo.length > 0 && (
                <div className="row mb-4">
                  <div className="col-md-12">
                    <h5>Pagos por Método</h5>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Método</th>
                            <th>Cantidad</th>
                            <th>Total</th>
                            <th>Porcentaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumen.pagos_por_metodo.map((item) => (
                            <tr key={`metodo-${item.metodo_pago}`}>
                              <td>{item.metodo_pago}</td>
                              <td>{item.cantidad}</td>
                              <td>{formatMoneda(item.total)}</td>
                              <td>
                                <div className="progress" style={{height: '20px'}}>
                                  <div 
                                    className="progress-bar bg-primary" 
                                    style={{width: `${(item.total / resumen.total_confirmados) * 100}%`}}
                                  >
                                    {((item.total / resumen.total_confirmados) * 100).toFixed(1)}%
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

              {resumen.pagos_por_dia && resumen.pagos_por_dia.length > 0 && (
                <div className="row">
                  <div className="col-md-12">
                    <h5>Pagos por Día</h5>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Cantidad</th>
                            <th>Total</th>
                            <th>Promedio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumen.pagos_por_dia.map((item) => (
                            <tr key={`dia-${item.fecha}`}>
                              <td>{formatFecha(item.fecha)}</td>
                              <td>{item.cantidad}</td>
                              <td>{formatMoneda(item.total)}</td>
                              <td>{formatMoneda(item.total / item.cantidad)}</td>
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
                <strong>Período:</strong> {formatFecha(resumen.periodo?.fecha_inicio)} - {formatFecha(resumen.periodo?.fecha_fin)} | 
                <strong> Promedio diario:</strong> {formatMoneda(resumen.promedio_diario || 0)}
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
    </div>
  );
};

export default Pagos;