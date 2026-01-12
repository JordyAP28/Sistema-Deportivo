import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/facturas.css';

const API_URL = 'http://localhost:8000/api';

const Facturas = () => {
  // Estados principales
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [showDetallesFacturaModal, setShowDetallesFacturaModal] = useState(false);
  const [showPagosModal, setShowPagosModal] = useState(false);
  const [showAgregarPagoModal, setShowAgregarPagoModal] = useState(false);
  const [showAgregarDetalleModal, setShowAgregarDetalleModal] = useState(false);
  const [showImprimirModal, setShowImprimirModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  // Estados para datos relacionados
  const [currentFactura, setCurrentFactura] = useState(null);
  const [deportistas, setDeportistas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [detallesFactura, setDetallesFactura] = useState([]);
  const [pagosFactura, setPagosFactura] = useState([]);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterMetodoPago, setFilterMetodoPago] = useState('');
  const [filterDeportista, setFilterDeportista] = useState('');
  const [filterUsuario, setFilterUsuario] = useState('');

  // Form state para nuevo/editar factura
  const [formData, setFormData] = useState({
    id_deportista: '',
    usuario_id: '',
    numero_factura: '',
    concepto: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    subtotal: 0,
    descuento: 0,
    impuesto: 0,
    total: 0,
    estado: 'pendiente',
    metodo_pago: '',
    comprobante_pago: '',
    observaciones: ''
  });

  // Form state para nuevo detalle
  const [detalleForm, setDetalleForm] = useState({
    descripcion: '',
    cantidad: 1,
    precio_unitario: 0,
    subtotal: 0
  });

  // Form state para nuevo pago
  const [pagoForm, setPagoForm] = useState({
    monto: 0,
    metodo_pago: '',
    referencia: '',
    fecha_pago: '',
    estado: 'completado',
    observaciones: ''
  });

  // Form state para email
  const [emailForm, setEmailForm] = useState({
    email: '',
    asunto: '',
    mensaje: '',
    incluir_pdf: true
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
    fetchFacturas();
    fetchDatosRelacionados();
  }, []);

  // Cargar todas las facturas
  const fetchFacturas = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/facturas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setFacturas(response.data.data);
      } else {
        setError('Error en la respuesta del servidor');
      }
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      setError('Error al cargar facturas: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos relacionados
  const fetchDatosRelacionados = async () => {
    try {
      // Cargar deportistas
      const deportistasRes = await axios.get(`${API_URL}/deportistas`, {
        headers: getAuthHeaders()
      });
      if (deportistasRes.data.success) {
        setDeportistas(deportistasRes.data.data);
      }

      // Cargar usuarios
      const usuariosRes = await axios.get(`${API_URL}/usuarios`, {
        headers: getAuthHeaders()
      });
      if (usuariosRes.data.success) {
        setUsuarios(usuariosRes.data.data);
      }
    } catch (err) {
      console.error('Error al cargar datos relacionados:', err);
    }
  };

  // Cargar estadísticas
  const fetchEstadisticas = async () => {
    try {
      const response = await axios.get(`${API_URL}/facturas/estadisticas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setEstadisticas(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Cargar detalles de una factura
  const fetchDetallesFactura = async (facturaId) => {
    try {
      const response = await axios.get(`${API_URL}/facturas/${facturaId}/detalles`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setDetallesFactura(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar detalles de factura:', err);
    }
  };

  // Cargar pagos de una factura
  const fetchPagosFactura = async (facturaId) => {
    try {
      const response = await axios.get(`${API_URL}/facturas/${facturaId}/pagos`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setPagosFactura(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar pagos de factura:', err);
    }
  };

  // Generar número de factura automáticamente
  const generarNumeroFactura = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `FAC-${timestamp}-${random}`;
  };

  // Calcular totales
  const calcularTotales = () => {
    const subtotal = parseFloat(formData.subtotal) || 0;
    const descuento = parseFloat(formData.descuento) || 0;
    const impuesto = parseFloat(formData.impuesto) || 0;
    
    const total = subtotal - descuento + impuesto;
    
    setFormData({
      ...formData,
      total: total.toFixed(2)
    });
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/facturas`, {
        params: {
          busqueda: searchTerm,
          estado: filterEstado,
          fecha_desde: filterFechaDesde,
          fecha_hasta: filterFechaHasta,
          metodo_pago: filterMetodoPago,
          id_deportista: filterDeportista,
          usuario_id: filterUsuario
        },
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setFacturas(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar facturas: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setFilterMetodoPago('');
    setFilterDeportista('');
    setFilterUsuario('');
    fetchFacturas();
  };

  // Crear factura
  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API_URL}/facturas`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchFacturas();
        setSuccessMessage('Factura creada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear factura:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al crear factura: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar factura
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentFactura) return;

    try {
      const response = await axios.put(`${API_URL}/facturas/${currentFactura.id_factura}`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchFacturas();
        setSuccessMessage('Factura actualizada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar factura:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al actualizar factura: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar factura
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta factura?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/facturas/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchFacturas();
        setSuccessMessage('Factura eliminada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar factura:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al eliminar factura: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Agregar detalle a factura
  const handleAgregarDetalle = async (e) => {
    e.preventDefault();
    
    if (!currentFactura) return;

    try {
      const response = await axios.post(
        `${API_URL}/facturas/${currentFactura.id_factura}/detalles`, 
        detalleForm,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setShowAgregarDetalleModal(false);
        resetDetalleForm();
        fetchDetallesFactura(currentFactura.id_factura);
        setSuccessMessage('Detalle agregado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al agregar detalle:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al agregar detalle: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Agregar pago a factura
  const handleAgregarPago = async (e) => {
    e.preventDefault();
    
    if (!currentFactura) return;

    try {
      const response = await axios.post(
        `${API_URL}/facturas/${currentFactura.id_factura}/pagos`, 
        pagoForm,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setShowAgregarPagoModal(false);
        resetPagoForm();
        fetchPagosFactura(currentFactura.id_factura);
        fetchFacturas(); // Actualizar estado de la factura
        setSuccessMessage('Pago registrado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al agregar pago:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al agregar pago: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Enviar factura por email
  const handleEnviarEmail = async (e) => {
    e.preventDefault();
    
    if (!currentFactura) return;

    try {
      const response = await axios.post(
        `${API_URL}/facturas/${currentFactura.id_factura}/enviar-email`, 
        emailForm,
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setShowEmailModal(false);
        resetEmailForm();
        setSuccessMessage('Factura enviada por email exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al enviar email:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al enviar email: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Ver detalles
  const handleViewDetails = (factura) => {
    setCurrentFactura(factura);
    setShowDetallesModal(true);
  };

  // Ver detalles de factura
  const handleViewDetallesFactura = (factura) => {
    setCurrentFactura(factura);
    fetchDetallesFactura(factura.id_factura);
    setShowDetallesFacturaModal(true);
  };

  // Ver pagos
  const handleViewPagos = (factura) => {
    setCurrentFactura(factura);
    fetchPagosFactura(factura.id_factura);
    setShowPagosModal(true);
  };

  // Ver estadísticas
  const handleViewEstadisticas = () => {
    fetchEstadisticas();
    setShowEstadisticasModal(true);
  };

  // Agregar pago
  const handleAddPago = (factura) => {
    setCurrentFactura(factura);
    setPagoForm({
      monto: factura.total - factura.pagos?.reduce((sum, pago) => sum + parseFloat(pago.monto), 0) || 0,
      metodo_pago: '',
      referencia: '',
      fecha_pago: new Date().toISOString().split('T')[0],
      estado: 'completado',
      observaciones: ''
    });
    setShowAgregarPagoModal(true);
  };

  // Agregar detalle
  const handleAddDetalle = (factura) => {
    setCurrentFactura(factura);
    setDetalleForm({
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0
    });
    setShowAgregarDetalleModal(true);
  };

  // Enviar por email
  const handleSendEmail = (factura) => {
    setCurrentFactura(factura);
    const deportistaEmail = factura.deportista?.usuario?.email || '';
    setEmailForm({
      email: deportistaEmail,
      asunto: `Factura ${factura.numero_factura}`,
      mensaje: `Adjunto encontrará la factura ${factura.numero_factura} por concepto de ${factura.concepto}`,
      incluir_pdf: true
    });
    setShowEmailModal(true);
  };

  // Imprimir factura
  const handlePrint = (factura) => {
    setCurrentFactura(factura);
    setShowImprimirModal(true);
  };

  // Editar factura
  const handleEdit = (factura) => {
    setCurrentFactura(factura);
    
    setFormData({
      id_deportista: factura.id_deportista || '',
      usuario_id: factura.usuario_id || '',
      numero_factura: factura.numero_factura || '',
      concepto: factura.concepto || '',
      fecha_emision: factura.fecha_emision ? factura.fecha_emision.split('T')[0] : '',
      fecha_vencimiento: factura.fecha_vencimiento ? factura.fecha_vencimiento.split('T')[0] : '',
      subtotal: factura.subtotal || 0,
      descuento: factura.descuento || 0,
      impuesto: factura.impuesto || 0,
      total: factura.total || 0,
      estado: factura.estado || 'pendiente',
      metodo_pago: factura.metodo_pago || '',
      comprobante_pago: factura.comprobante_pago || '',
      observaciones: factura.observaciones || ''
    });
    
    setShowEditModal(true);
  };

  // Resetear formularios
  const resetForm = () => {
    setFormData({
      id_deportista: '',
      usuario_id: '',
      numero_factura: generarNumeroFactura(),
      concepto: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 0,
      descuento: 0,
      impuesto: 0,
      total: 0,
      estado: 'pendiente',
      metodo_pago: '',
      comprobante_pago: '',
      observaciones: ''
    });
    setCurrentFactura(null);
  };

  const resetDetalleForm = () => {
    setDetalleForm({
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0
    });
  };

  const resetPagoForm = () => {
    setPagoForm({
      monto: 0,
      metodo_pago: '',
      referencia: '',
      fecha_pago: new Date().toISOString().split('T')[0],
      estado: 'completado',
      observaciones: ''
    });
  };

  const resetEmailForm = () => {
    setEmailForm({
      email: '',
      asunto: '',
      mensaje: '',
      incluir_pdf: true
    });
  };

  // Calcular subtotal del detalle
  const calcularSubtotalDetalle = () => {
    const cantidad = parseFloat(detalleForm.cantidad) || 0;
    const precio = parseFloat(detalleForm.precio_unitario) || 0;
    const subtotal = cantidad * precio;
    
    setDetalleForm({
      ...detalleForm,
      subtotal: subtotal.toFixed(2)
    });
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

  // Calcular saldo pendiente
  const calcularSaldoPendiente = (factura) => {
    const total = parseFloat(factura.total) || 0;
    const pagos = factura.pagos?.reduce((sum, pago) => sum + parseFloat(pago.monto), 0) || 0;
    return total - pagos;
  };

  // Obtener facturas filtradas
  const getFilteredFacturas = () => {
    let filtered = [...facturas];
    
    if (filterEstado) {
      filtered = filtered.filter(f => f.estado === filterEstado);
    }
    
    if (filterFechaDesde) {
      filtered = filtered.filter(f => new Date(f.fecha_emision) >= new Date(filterFechaDesde));
    }
    
    if (filterFechaHasta) {
      filtered = filtered.filter(f => new Date(f.fecha_emision) <= new Date(filterFechaHasta));
    }
    
    if (filterMetodoPago) {
      filtered = filtered.filter(f => f.metodo_pago === filterMetodoPago);
    }
    
    if (filterDeportista) {
      filtered = filtered.filter(f => f.id_deportista == filterDeportista);
    }
    
    if (filterUsuario) {
      filtered = filtered.filter(f => f.usuario_id == filterUsuario);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(f => 
        f.numero_factura?.toLowerCase().includes(term) ||
        f.concepto?.toLowerCase().includes(term) ||
        f.deportista?.usuario?.nombre?.toLowerCase().includes(term) ||
        f.deportista?.usuario?.apellido?.toLowerCase().includes(term) ||
        f.usuario?.nombre?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  // Calcular estadísticas generales
  const calcularEstadisticasGenerales = () => {
    if (facturas.length === 0) return null;
    
    const total = facturas.length;
    const pendientes = facturas.filter(f => f.estado === 'pendiente').length;
    const pagadas = facturas.filter(f => f.estado === 'pagada').length;
    const vencidas = facturas.filter(f => f.estado === 'vencida').length;
    const anuladas = facturas.filter(f => f.estado === 'anulada').length;
    
    // Totales monetarios
    const totalFacturado = facturas.reduce((sum, f) => sum + parseFloat(f.total || 0), 0);
    const totalPendiente = facturas
      .filter(f => f.estado === 'pendiente' || f.estado === 'vencida')
      .reduce((sum, f) => sum + calcularSaldoPendiente(f), 0);
    
    // Métodos de pago más usados
    const metodosPago = facturas.reduce((acc, f) => {
      const metodo = f.metodo_pago || 'No especificado';
      acc[metodo] = (acc[metodo] || 0) + 1;
      return acc;
    }, {});
    
    // Factura con mayor monto
    const facturaMayorMonto = [...facturas]
      .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
      .shift();
    
    return {
      total,
      pendientes,
      pagadas,
      vencidas,
      anuladas,
      totalFacturado,
      totalPendiente,
      metodosPago,
      facturaMayorMonto
    };
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  const facturasFiltradas = getFilteredFacturas();
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
                <i className="fas fa-file-invoice-dollar me-2"></i>
                Gestión de Facturas
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
                  <i className="fas fa-plus"></i> Nueva Factura
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
                        placeholder="N° factura, concepto, deportista..."
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
                      <option value="pagada">Pagada</option>
                      <option value="vencida">Vencida</option>
                      <option value="anulada">Anulada</option>
                      <option value="parcial">Parcial</option>
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
                      <option value="cheque">Cheque</option>
                      <option value="deposito">Depósito</option>
                    </select>
                  </div>
                  
                  <div className="col-md-1">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={handleSearch}
                      disabled={loading}
                      title="Aplicar filtros"
                    >
                      <i className="fas fa-filter"></i>
                    </button>
                  </div>
                </div>
                
                <div className="row g-3 mt-2">
                  <div className="col-md-3">
                    <label className="form-label">Deportista</label>
                    <select 
                      className="form-select"
                      value={filterDeportista}
                      onChange={(e) => setFilterDeportista(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {deportistas.map((deportista) => (
                        <option key={`deportista-${deportista.id_deportista}`} value={deportista.id_deportista}>
                          {deportista.usuario?.nombre} {deportista.usuario?.apellido}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-3">
                    <label className="form-label">Usuario</label>
                    <select 
                      className="form-select"
                      value={filterUsuario}
                      onChange={(e) => setFilterUsuario(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {usuarios.map((usuario) => (
                        <option key={`usuario-${usuario.id_usuario}`} value={usuario.id_usuario}>
                          {usuario.nombre} {usuario.apellido}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-3">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-info w-100"
                      onClick={handleViewEstadisticas}
                      disabled={loading}
                    >
                      <i className="fas fa-chart-bar"></i> Estadísticas
                    </button>
                  </div>
                  
                  <div className="col-md-3">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-success w-100"
                      onClick={() => {
                        // Exportar a Excel
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
                        <p>Total Facturas</p>
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
                        <h4>{estadisticasGenerales.pagadas}</h4>
                        <p>Pagadas</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-danger text-white">
                        <h4>{estadisticasGenerales.vencidas}</h4>
                        <p>Vencidas</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-primary text-white">
                        <h4>{formatMoneda(estadisticasGenerales.totalFacturado)}</h4>
                        <p>Total Facturado</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-secondary text-white">
                        <h4>{formatMoneda(estadisticasGenerales.totalPendiente)}</h4>
                        <p>Total Pendiente</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de facturas */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando facturas...</p>
                </div>
              ) : facturasFiltradas.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-file-invoice-dollar fa-3x text-muted mb-3"></i>
                  <h4>No hay facturas registradas</h4>
                  <p>Crea tu primera factura usando el botón "Nueva Factura"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>N° Factura</th>
                        <th>Deportista</th>
                        <th>Concepto</th>
                        <th>Fechas</th>
                        <th>Monto</th>
                        <th>Saldo</th>
                        <th>Estado</th>
                        <th>Pagos</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturasFiltradas.map((factura) => {
                        const saldoPendiente = calcularSaldoPendiente(factura);
                        return (
                          <tr key={`factura-${factura.id_factura}`}>
                            <td>
                              <strong>{factura.numero_factura}</strong>
                            </td>
                            <td>
                              {factura.deportista?.usuario ? (
                                <div>
                                  <div>{factura.deportista.usuario.nombre} {factura.deportista.usuario.apellido}</div>
                                  <div className="text-muted small">
                                    {factura.deportista.categoria?.nombre}
                                  </div>
                                </div>
                              ) : (
                                'No asignado'
                              )}
                            </td>
                            <td>
                              <div className="small">
                                {factura.concepto}
                              </div>
                            </td>
                            <td>
                              <div className="small">
                                <strong>Emisión:</strong> {formatFecha(factura.fecha_emision)}
                              </div>
                              <div className="small">
                                <strong>Vencimiento:</strong> {formatFecha(factura.fecha_vencimiento)}
                              </div>
                            </td>
                            <td>
                              <strong>{formatMoneda(factura.total)}</strong>
                            </td>
                            <td>
                              {saldoPendiente > 0 ? (
                                <span className="text-danger">{formatMoneda(saldoPendiente)}</span>
                              ) : (
                                <span className="text-success">{formatMoneda(0)}</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge estado-badge estado-${factura.estado}`}>
                                {factura.estado}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="badge bg-info me-2">
                                  <i className="fas fa-money-bill-wave me-1"></i>
                                  {factura.pagos?.length || 0}
                                </span>
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => handleViewPagos(factura)}
                                  title="Ver pagos"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                              </div>
                            </td>
                            <td>
                              <div className="btn-group">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleViewDetails(factura)}
                                  title="Ver detalles"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => handleEdit(factura)}
                                  title="Editar"
                                  disabled={factura.estado === 'anulada'}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => handleAddPago(factura)}
                                  title="Agregar pago"
                                  disabled={saldoPendiente <= 0 || factura.estado === 'anulada'}
                                >
                                  <i className="fas fa-money-bill-wave"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => handleViewDetallesFactura(factura)}
                                  title="Ver detalles de factura"
                                >
                                  <i className="fas fa-list"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => handlePrint(factura)}
                                  title="Imprimir"
                                >
                                  <i className="fas fa-print"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDelete(factura.id_factura)}
                                  title="Eliminar"
                                  disabled={factura.estado === 'pagada' || factura.estado === 'anulada'}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALES */}

      {/* Modal para crear factura */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nueva Factura
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
                        <option value="">Seleccione un deportista</option>
                        {deportistas.map((deportista) => (
                          <option key={`deportista-${deportista.id_deportista}`} value={deportista.id_deportista}>
                            {deportista.usuario?.nombre} {deportista.usuario?.apellido} - {deportista.categoria?.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Usuario *</label>
                      <select
                        className="form-control"
                        value={formData.usuario_id}
                        onChange={(e) => setFormData({...formData, usuario_id: e.target.value})}
                        required
                      >
                        <option value="">Seleccione un usuario</option>
                        {usuarios.map((usuario) => (
                          <option key={`usuario-${usuario.id_usuario}`} value={usuario.id_usuario}>
                            {usuario.nombre} {usuario.apellido} ({usuario.rol?.nombre})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Número de Factura *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.numero_factura}
                        onChange={(e) => setFormData({...formData, numero_factura: e.target.value})}
                        required
                        placeholder="Ej: FAC-2024-001"
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Concepto *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.concepto}
                        onChange={(e) => setFormData({...formData, concepto: e.target.value})}
                        required
                        placeholder="Descripción de la factura"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha Emisión *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha_emision}
                        onChange={(e) => setFormData({...formData, fecha_emision: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha Vencimiento *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha_vencimiento}
                        onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Subtotal</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.subtotal}
                          onChange={(e) => {
                            const subtotal = parseFloat(e.target.value) || 0;
                            setFormData({
                              ...formData,
                              subtotal: subtotal
                            });
                          }}
                          min="0"
                          step="0.01"
                          onBlur={calcularTotales}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Descuento</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.descuento}
                          onChange={(e) => {
                            const descuento = parseFloat(e.target.value) || 0;
                            setFormData({
                              ...formData,
                              descuento: descuento
                            });
                          }}
                          min="0"
                          step="0.01"
                          onBlur={calcularTotales}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="form-group mb-3">
                      <label className="form-label">Impuesto</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.impuesto}
                          onChange={(e) => {
                            const impuesto = parseFloat(e.target.value) || 0;
                            setFormData({
                              ...formData,
                              impuesto: impuesto
                            });
                          }}
                          min="0"
                          step="0.01"
                          onBlur={calcularTotales}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Total</label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <input
                          type="text"
                          className="form-control bg-light"
                          value={formatMoneda(formData.total)}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Estado *</label>
                      <select
                        className="form-control"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                        required
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="pagada">Pagada</option>
                        <option value="vencida">Vencida</option>
                        <option value="anulada">Anulada</option>
                        <option value="parcial">Parcial</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Método de Pago</label>
                      <select
                        className="form-control"
                        value={formData.metodo_pago}
                        onChange={(e) => setFormData({...formData, metodo_pago: e.target.value})}
                      >
                        <option value="">Seleccione método</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="deposito">Depósito</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Comprobante Pago</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.comprobante_pago}
                        onChange={(e) => setFormData({...formData, comprobante_pago: e.target.value})}
                        placeholder="Número de comprobante"
                      />
                    </div>
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

                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Nota:</strong> Puedes agregar los detalles de la factura después de crearla.
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
                  Guardar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles */}
      {showDetallesModal && currentFactura && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-file-invoice-dollar me-2"></i>
                Detalles de Factura: {currentFactura.numero_factura}
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
                      <i className="fas fa-user me-2"></i>Información del Cliente
                    </h5>
                    {currentFactura.deportista?.usuario ? (
                      <>
                        <div className="info-item">
                          <strong>Nombre:</strong> {currentFactura.deportista.usuario.nombre} {currentFactura.deportista.usuario.apellido}
                        </div>
                        <div className="info-item">
                          <strong>Email:</strong> {currentFactura.deportista.usuario.email}
                        </div>
                        <div className="info-item">
                          <strong>Teléfono:</strong> {currentFactura.deportista.usuario.telefono}
                        </div>
                        <div className="info-item">
                          <strong>Categoría:</strong> {currentFactura.deportista.categoria?.nombre}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted">No hay información del deportista</p>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="info-section mb-4">
                    <h5 className="text-primary">
                      <i className="fas fa-info-circle me-2"></i>Información de Factura
                    </h5>
                    <div className="info-item">
                      <strong>Número:</strong> {currentFactura.numero_factura}
                    </div>
                    <div className="info-item">
                      <strong>Estado:</strong> 
                      <span className={`badge estado-badge estado-${currentFactura.estado} ms-2`}>
                        {currentFactura.estado}
                      </span>
                    </div>
                    <div className="info-item">
                      <strong>Emisión:</strong> {formatFecha(currentFactura.fecha_emision)}
                    </div>
                    <div className="info-item">
                      <strong>Vencimiento:</strong> {formatFecha(currentFactura.fecha_vencimiento)}
                    </div>
                    <div className="info-item">
                      <strong>Método Pago:</strong> {currentFactura.metodo_pago || 'No especificado'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-section mb-4">
                <h5 className="text-primary">
                  <i className="fas fa-receipt me-2"></i>Resumen Financiero
                </h5>
                <div className="row">
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="display-6 text-primary">{formatMoneda(currentFactura.subtotal)}</div>
                      <small>Subtotal</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="display-6 text-warning">{formatMoneda(currentFactura.descuento)}</div>
                      <small>Descuento</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="display-6 text-info">{formatMoneda(currentFactura.impuesto)}</div>
                      <small>Impuesto</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center">
                      <div className="display-6 text-success">{formatMoneda(currentFactura.total)}</div>
                      <small>Total</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h5 className="text-primary">
                  <i className="fas fa-history me-2"></i>Historial de Pagos
                </h5>
                {currentFactura.pagos && currentFactura.pagos.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Monto</th>
                          <th>Método</th>
                          <th>Referencia</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentFactura.pagos.map((pago) => (
                          <tr key={`pago-${pago.id_pago}`}>
                            <td>{formatFecha(pago.fecha_pago)}</td>
                            <td>{formatMoneda(pago.monto)}</td>
                            <td>{pago.metodo_pago}</td>
                            <td>{pago.referencia || 'N/A'}</td>
                            <td>
                              <span className={`badge ${pago.estado === 'completado' ? 'bg-success' : 'bg-warning'}`}>
                                {pago.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">No hay pagos registrados</p>
                )}
              </div>

              {currentFactura.observaciones && (
                <div className="info-section mt-4">
                  <h5 className="text-primary">
                    <i className="fas fa-comment me-2"></i>Observaciones
                  </h5>
                  <p className="p-3 bg-light rounded">{currentFactura.observaciones}</p>
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
                  handleEdit(currentFactura);
                }}
                disabled={currentFactura.estado === 'anulada'}
              >
                <i className="fas fa-edit me-2"></i> Editar
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => {
                  setShowDetallesModal(false);
                  handleAddPago(currentFactura);
                }}
                disabled={calcularSaldoPendiente(currentFactura) <= 0 || currentFactura.estado === 'anulada'}
              >
                <i className="fas fa-money-bill-wave me-2"></i> Agregar Pago
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  setShowDetallesModal(false);
                  handlePrint(currentFactura);
                }}
              >
                <i className="fas fa-print me-2"></i> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar pago */}
      {showAgregarPagoModal && currentFactura && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-money-bill-wave me-2"></i>
                Registrar Pago - {currentFactura.numero_factura}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowAgregarPagoModal(false);
                  resetPagoForm();
                }}
              ></button>
            </div>
            <form onSubmit={handleAgregarPago}>
              <div className="modal-body">
                <div className="alert alert-info mb-4">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Saldo pendiente:</strong> {formatMoneda(calcularSaldoPendiente(currentFactura))}
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Monto *</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      value={pagoForm.monto}
                      onChange={(e) => setPagoForm({
                        ...pagoForm,
                        monto: parseFloat(e.target.value) || 0
                      })}
                      min="0"
                      max={calcularSaldoPendiente(currentFactura)}
                      step="0.01"
                      required
                    />
                  </div>
                  <small className="text-muted">
                    Máximo: {formatMoneda(calcularSaldoPendiente(currentFactura))}
                  </small>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Método de Pago *</label>
                      <select
                        className="form-control"
                        value={pagoForm.metodo_pago}
                        onChange={(e) => setPagoForm({...pagoForm, metodo_pago: e.target.value})}
                        required
                      >
                        <option value="">Seleccione método</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="deposito">Depósito</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha Pago *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={pagoForm.fecha_pago}
                        onChange={(e) => setPagoForm({...pagoForm, fecha_pago: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Referencia</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pagoForm.referencia}
                    onChange={(e) => setPagoForm({...pagoForm, referencia: e.target.value})}
                    placeholder="Número de referencia, transacción, etc."
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    value={pagoForm.observaciones}
                    onChange={(e) => setPagoForm({...pagoForm, observaciones: e.target.value})}
                    rows="2"
                    placeholder="Observaciones del pago..."
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-control"
                    value={pagoForm.estado}
                    onChange={(e) => setPagoForm({...pagoForm, estado: e.target.value})}
                  >
                    <option value="completado">Completado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAgregarPagoModal(false);
                    resetPagoForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  <i className="fas fa-check-circle me-2"></i> Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver estadísticas */}
      {showEstadisticasModal && estadisticas && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-chart-bar me-2"></i>
                Estadísticas de Facturación
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
                        <span>Total Facturas:</span>
                        <strong>{estadisticasGenerales?.total || 0}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-warning">
                        <span>Pendientes:</span>
                        <strong>{estadisticasGenerales?.pendientes || 0}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>Pagadas:</span>
                        <strong>{estadisticasGenerales?.pagadas || 0}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-danger">
                        <span>Vencidas:</span>
                        <strong>{estadisticasGenerales?.vencidas || 0}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 text-muted">
                        <span>Anuladas:</span>
                        <strong>{estadisticasGenerales?.anuladas || 0}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="stat-card-lg mb-4">
                    <h4 className="text-primary">Totales Monetarios</h4>
                    <div className="p-3 bg-light rounded">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Total Facturado:</span>
                        <strong className="text-primary">
                          {formatMoneda(estadisticasGenerales?.totalFacturado || 0)}
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Total Pendiente:</span>
                        <strong className="text-danger">
                          {formatMoneda(estadisticasGenerales?.totalPendiente || 0)}
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Total Pagado:</span>
                        <strong className="text-success">
                          {formatMoneda((estadisticasGenerales?.totalFacturado || 0) - (estadisticasGenerales?.totalPendiente || 0))}
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Porcentaje Cobrado:</span>
                        <strong>
                          {estadisticasGenerales?.totalFacturado > 0 
                            ? ((((estadisticasGenerales.totalFacturado - estadisticasGenerales.totalPendiente) / estadisticasGenerales.totalFacturado) * 100).toFixed(2)) 
                            : '0'}%
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {estadisticasGenerales?.facturaMayorMonto && (
                <div className="row">
                  <div className="col-md-12">
                    <div className="stat-card-lg mb-4">
                      <h4 className="text-primary">Factura con Mayor Monto</h4>
                      <div className="p-3 bg-light rounded">
                        <h5>{estadisticasGenerales.facturaMayorMonto.numero_factura}</h5>
                        <p className="mb-1">
                          <i className="fas fa-user text-primary me-2"></i>
                          Deportista: {estadisticasGenerales.facturaMayorMonto.deportista?.usuario?.nombre} {estadisticasGenerales.facturaMayorMonto.deportista?.usuario?.apellido}
                        </p>
                        <p className="mb-1">
                          <i className="fas fa-calendar text-warning me-2"></i>
                          Fecha: {formatFecha(estadisticasGenerales.facturaMayorMonto.fecha_emision)}
                        </p>
                        <p className="mb-0">
                          <i className="fas fa-money-bill-wave text-success me-2"></i>
                          Monto: {formatMoneda(estadisticasGenerales.facturaMayorMonto.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="row">
                <div className="col-md-12">
                  <div className="stat-card-lg">
                    <h4 className="text-primary">Métodos de Pago Más Usados</h4>
                    <div className="p-3 bg-light rounded">
                      {estadisticasGenerales?.metodosPago ? (
                        <div className="d-flex flex-wrap gap-2">
                          {Object.entries(estadisticasGenerales.metodosPago).map(([metodo, count]) => (
                            <div key={`metodo-${metodo}`} className="badge bg-primary p-2">
                              {metodo}: <strong>{count}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted">No hay datos de métodos de pago</p>
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
                <i className="fas fa-download me-2"></i> Exportar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para imprimir factura */}
      {showImprimirModal && currentFactura && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-print me-2"></i>
                Vista de Impresión: {currentFactura.numero_factura}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowImprimirModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="invoice-print">
                <div className="invoice-header text-center mb-4">
                  <h1>SISTEMA DEPORTIVO</h1>
                  <p className="lead">Factura de Servicios</p>
                </div>
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h5>Información del Cliente</h5>
                    {currentFactura.deportista?.usuario ? (
                      <>
                        <p><strong>Nombre:</strong> {currentFactura.deportista.usuario.nombre} {currentFactura.deportista.usuario.apellido}</p>
                        <p><strong>Email:</strong> {currentFactura.deportista.usuario.email}</p>
                        <p><strong>Teléfono:</strong> {currentFactura.deportista.usuario.telefono}</p>
                        <p><strong>Dirección:</strong> {currentFactura.deportista.usuario.direccion || 'No especificada'}</p>
                      </>
                    ) : (
                      <p>Cliente no especificado</p>
                    )}
                  </div>
                  
                  <div className="col-md-6 text-end">
                    <h5>Información de Factura</h5>
                    <p><strong>Número:</strong> {currentFactura.numero_factura}</p>
                    <p><strong>Fecha Emisión:</strong> {formatFecha(currentFactura.fecha_emision)}</p>
                    <p><strong>Fecha Vencimiento:</strong> {formatFecha(currentFactura.fecha_vencimiento)}</p>
                    <p><strong>Estado:</strong> {currentFactura.estado}</p>
                  </div>
                </div>
                
                <div className="invoice-details mb-4">
                  <h5>Concepto</h5>
                  <p>{currentFactura.concepto}</p>
                </div>
                
                <div className="invoice-totals mb-4">
                  <div className="row">
                    <div className="col-md-6 offset-md-6">
                      <table className="table table-bordered">
                        <tbody>
                          <tr>
                            <td><strong>Subtotal:</strong></td>
                            <td className="text-end">{formatMoneda(currentFactura.subtotal)}</td>
                          </tr>
                          <tr>
                            <td><strong>Descuento:</strong></td>
                            <td className="text-end">{formatMoneda(currentFactura.descuento)}</td>
                          </tr>
                          <tr>
                            <td><strong>Impuesto:</strong></td>
                            <td className="text-end">{formatMoneda(currentFactura.impuesto)}</td>
                          </tr>
                          <tr className="table-success">
                            <td><strong>TOTAL:</strong></td>
                            <td className="text-end"><strong>{formatMoneda(currentFactura.total)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                {currentFactura.observaciones && (
                  <div className="invoice-notes mb-4">
                    <h5>Observaciones</h5>
                    <p>{currentFactura.observaciones}</p>
                  </div>
                )}
                
                <div className="invoice-footer mt-5 pt-4 border-top">
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Gracias por su confianza</strong></p>
                    </div>
                    <div className="col-md-6 text-end">
                      <p>SISTEMA DEPORTIVO<br/>
                      Sistema de Gestión Deportiva<br/>
                      www.sistemadeportivo.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowImprimirModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                <i className="fas fa-print me-2"></i> Imprimir
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => {
                  setShowImprimirModal(false);
                  handleSendEmail(currentFactura);
                }}
              >
                <i className="fas fa-envelope me-2"></i> Enviar por Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para enviar email */}
      {showEmailModal && currentFactura && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-envelope me-2"></i>
                Enviar Factura por Email - {currentFactura.numero_factura}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowEmailModal(false);
                  resetEmailForm();
                }}
              ></button>
            </div>
            <form onSubmit={handleEnviarEmail}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="form-label">Email Destinatario *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({...emailForm, email: e.target.value})}
                    required
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Asunto *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={emailForm.asunto}
                    onChange={(e) => setEmailForm({...emailForm, asunto: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Mensaje *</label>
                  <textarea
                    className="form-control"
                    value={emailForm.mensaje}
                    onChange={(e) => setEmailForm({...emailForm, mensaje: e.target.value})}
                    rows="4"
                    required
                    placeholder="Escriba el mensaje del correo..."
                  />
                </div>

                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={emailForm.incluir_pdf}
                    onChange={(e) => setEmailForm({...emailForm, incluir_pdf: e.target.checked})}
                    id="incluirPDF"
                  />
                  <label className="form-check-label" htmlFor="incluirPDF">
                    Incluir PDF de la factura
                  </label>
                </div>

                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  La factura se enviará como adjunto en formato PDF.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEmailModal(false);
                    resetEmailForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-paper-plane me-2"></i> Enviar Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Facturas;