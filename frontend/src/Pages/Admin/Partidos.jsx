import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import Toolbar from './Topbar';
import '../../styles/admin/partidos.css';

const API_URL = 'http://localhost:8000/api';

const Partidos = () => {
  // Estados principales
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [showResultadoModal, setShowResultadoModal] = useState(false);
  const [showEstadisticasJugadorModal, setShowEstadisticasJugadorModal] = useState(false);
  const [showCalendarioModal, setShowCalendarioModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [showProximosModal, setShowProximosModal] = useState(false);
  
  // Estados para datos relacionados
  const [currentPartido, setCurrentPartido] = useState(null);
  const [campeonatos, setCampeonatos] = useState([]);
  const [clubes, setClubes] = useState([]);
  const [escenarios, setEscenarios] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [calendario, setCalendario] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [proximosPartidos, setProximosPartidos] = useState([]);
  
  // Estados para estadísticas de jugadores
  const [estadisticasJugadores, setEstadisticasJugadores] = useState([]);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState([]);
  const [jugadorForm, setJugadorForm] = useState({
    id_deportista: '',
    goles: 0,
    asistencias: 0,
    tarjetas_amarillas: 0,
    tarjetas_rojas: 0,
    minutos_jugados: 90,
    titular: true
  });

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCampeonato, setFilterCampeonato] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterResultado, setFilterResultado] = useState('');
  const [filterClub, setFilterClub] = useState('');
  const [filterEscenario, setFilterEscenario] = useState('');

  // Estados para calendario
  const [calendarioForm, setCalendarioForm] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  });

  // Form state para nuevo/editar partido
  const [formData, setFormData] = useState({
    id_campeonato: '',
    id_escenario: '',
    club_local_id: '',
    club_visitante_id: '',
    fecha: '',
    hora: '',
    goles_local: 0,
    goles_visitante: 0,
    estado: 'programado',
    arbitro: '',
    observaciones: ''
  });

  // Form state para resultado
  const [resultadoForm, setResultadoForm] = useState({
    goles_local: 0,
    goles_visitante: 0,
    estadisticas: []
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
    fetchPartidos();
    fetchDatosRelacionados();
  }, []);

  // Cargar todos los partidos
  const fetchPartidos = async () => {
  try {
    setLoading(true);
    console.log('🔍 Iniciando carga de partidos...');
    console.log('Token:', getToken());
    console.log('Headers:', getAuthHeaders());
    
    const response = await axios.get(`${API_URL}/partidos`, {
      headers: getAuthHeaders()
    });
    
    console.log('✅ Respuesta exitosa:', response.data);
    
    if (response.data.success) {
      setPartidos(response.data.data);
    } else {
      setError('Error en la respuesta del servidor: ' + response.data.message);
    }
  } catch (err) {
    console.error('❌ Error completo:', err);
    console.error('📋 Datos de respuesta:', err.response?.data);
    console.error('📊 Estado HTTP:', err.response?.status);
    console.error('📦 Headers de respuesta:', err.response?.headers);
    
    if (err.response?.status === 401) {
      setError('No autorizado. Por favor, inicia sesión nuevamente.');
      setTimeout(() => {
        handleLogout();
      }, 3000);
    } else if (err.response?.status === 500) {
      setError('Error interno del servidor. Por favor, contacta al administrador.');
      
      // Mostrar detalles si están disponibles
      if (err.response?.data?.message) {
        console.error('Mensaje de error:', err.response.data.message);
        if (err.response.data.error_details) {
          console.error('Detalles técnicos:', err.response.data.error_details);
        }
      }
    } else {
      setError('Error al cargar partidos: ' + (err.response?.data?.message || err.message));
    }
  } finally {
    setLoading(false);
  }
};

  // Cargar datos relacionados
  const fetchDatosRelacionados = async () => {
    try {
      // Cargar campeonatos
      const campeonatosRes = await axios.get(`${API_URL}/campeonatos`, {
        headers: getAuthHeaders()
      });
      if (campeonatosRes.data.success) {
        setCampeonatos(campeonatosRes.data.data);
      }

      // Cargar clubes
      const clubesRes = await axios.get(`${API_URL}/clubes`, {
        headers: getAuthHeaders()
      });
      if (clubesRes.data.success) {
        setClubes(clubesRes.data.data);
      }

      // Cargar escenarios
      const escenariosRes = await axios.get(`${API_URL}/escenarios`, {
        headers: getAuthHeaders()
      });
      if (escenariosRes.data.success) {
        setEscenarios(escenariosRes.data.data);
      }
    } catch (err) {
      console.error('Error al cargar datos relacionados:', err);
    }
  };

  // Cargar jugadores disponibles
  const fetchJugadoresDisponibles = async (clubId) => {
    try {
      const response = await axios.get(`${API_URL}/clubes/${clubId}/deportistas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setJugadoresDisponibles(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar jugadores:', err);
    }
  };

  // Cargar estadísticas del partido
  const fetchEstadisticasPartido = async (partidoId) => {
    try {
      const response = await axios.get(`${API_URL}/partidos/${partidoId}/estadisticas`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setEstadisticas(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Cargar calendario
  const fetchCalendario = async (mes, ano) => {
    try {
      const response = await axios.get(`${API_URL}/partidos/calendario`, {
        params: { mes, ano },
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setCalendario(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar calendario:', err);
    }
  };

  // Cargar historial de enfrentamientos
  const fetchHistorial = async (clubLocalId, clubVisitanteId) => {
    try {
      const response = await axios.get(`${API_URL}/partidos/historial/${clubLocalId}/${clubVisitanteId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setHistorial(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
    }
  };

  // Cargar próximos partidos
  const fetchProximosPartidos = async () => {
    try {
      const response = await axios.get(`${API_URL}/partidos/proximos`, {
        params: { dias: 7, limit: 10 },
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setProximosPartidos(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar próximos partidos:', err);
    }
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/partidos`, {
        params: {
          busqueda: searchTerm,
          estado: filterEstado,
          id_campeonato: filterCampeonato,
          fecha_desde: filterFechaDesde,
          fecha_hasta: filterFechaHasta,
          resultado: filterResultado,
          club_local_id: filterClub,
          id_escenario: filterEscenario
        },
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setPartidos(response.data.data);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError('Error al buscar partidos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterEstado('');
    setFilterCampeonato('');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setFilterResultado('');
    setFilterClub('');
    setFilterEscenario('');
    fetchPartidos();
  };

  // Crear partido
  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API_URL}/partidos`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchPartidos();
        setSuccessMessage('Partido creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al crear partido:', err);
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
        setError('Error al crear partido: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar partido
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!currentPartido) return;

    try {
      const response = await axios.put(`${API_URL}/partidos/${currentPartido.id_partido}`, formData, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowEditModal(false);
        resetForm();
        fetchPartidos();
        setSuccessMessage('Partido actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar partido:', err);
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
        setError('Error al actualizar partido: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Eliminar partido
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este partido?\nEsta acción no se puede deshacer.')) return;

    try {
      const response = await axios.delete(`${API_URL}/partidos/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        fetchPartidos();
        setSuccessMessage('Partido eliminado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al eliminar partido:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        setError('Error al eliminar partido: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Actualizar resultado del partido
  const handleUpdateResultado = async (e) => {
    e.preventDefault();
    
    if (!currentPartido) return;

    try {
      const response = await axios.post(`${API_URL}/partidos/${currentPartido.id_partido}/resultado`, resultadoForm, {
        headers: getAuthHeaders()
      });
      
      if (response.data.success) {
        setShowResultadoModal(false);
        resetResultadoForm();
        fetchPartidos();
        setSuccessMessage('Resultado actualizado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error al actualizar resultado:', err);
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        let errorMessage = 'Errores de validación:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        setError('Error al actualizar resultado: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Agregar estadística de jugador
  const handleAddEstadisticaJugador = () => {
    if (!jugadorForm.id_deportista) {
      alert('Seleccione un jugador');
      return;
    }

    const jugador = jugadoresDisponibles.find(j => j.id_deportista == jugadorForm.id_deportista);
    
    if (jugador) {
      const nuevaEstadistica = {
        ...jugadorForm,
        nombre: `${jugador.nombre} ${jugador.apellido}`,
        numero: jugador.numero || 'N/A'
      };

      setResultadoForm({
        ...resultadoForm,
        estadisticas: [...resultadoForm.estadisticas, nuevaEstadistica]
      });

      // Resetear formulario de jugador
      setJugadorForm({
        id_deportista: '',
        goles: 0,
        asistencias: 0,
        tarjetas_amarillas: 0,
        tarjetas_rojas: 0,
        minutos_jugados: 90,
        titular: true
      });
    }
  };

  // Eliminar estadística de jugador
  const handleRemoveEstadisticaJugador = (index) => {
    const nuevasEstadisticas = [...resultadoForm.estadisticas];
    nuevasEstadisticas.splice(index, 1);
    setResultadoForm({
      ...resultadoForm,
      estadisticas: nuevasEstadisticas
    });
  };

  // Ver detalles
  const handleViewDetails = (partido) => {
    setCurrentPartido(partido);
    fetchEstadisticasPartido(partido.id_partido);
    setShowDetallesModal(true);
  };

  // Ver estadísticas
  const handleViewEstadisticas = (partido) => {
    setCurrentPartido(partido);
    fetchEstadisticasPartido(partido.id_partido);
    setShowEstadisticasModal(true);
  };

  // Ver calendario
  const handleViewCalendario = () => {
    fetchCalendario(calendarioForm.mes, calendarioForm.ano);
    setShowCalendarioModal(true);
  };

  // Ver historial
  const handleViewHistorial = (partido) => {
    setCurrentPartido(partido);
    fetchHistorial(partido.club_local_id, partido.club_visitante_id);
    setShowHistorialModal(true);
  };

  // Ver próximos partidos
  const handleViewProximos = () => {
    fetchProximosPartidos();
    setShowProximosModal(true);
  };

  // Configurar resultado
  const handleSetResultado = (partido) => {
    setCurrentPartido(partido);
    
    // Cargar jugadores de ambos equipos
    fetchJugadoresDisponibles(partido.club_local_id);
    
    setResultadoForm({
      goles_local: partido.goles_local || 0,
      goles_visitante: partido.goles_visitante || 0,
      estadisticas: partido.estadisticas || []
    });
    
    setShowResultadoModal(true);
  };

  // Editar partido
  const handleEdit = (partido) => {
    setCurrentPartido(partido);
    
    setFormData({
      id_campeonato: partido.id_campeonato || '',
      id_escenario: partido.id_escenario || '',
      club_local_id: partido.club_local_id || '',
      club_visitante_id: partido.club_visitante_id || '',
      fecha: partido.fecha ? partido.fecha.split('T')[0] : '',
      hora: partido.hora || '',
      goles_local: partido.goles_local || 0,
      goles_visitante: partido.goles_visitante || 0,
      estado: partido.estado || 'programado',
      arbitro: partido.arbitro || '',
      observaciones: partido.observaciones || ''
    });
    
    setShowEditModal(true);
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      id_campeonato: '',
      id_escenario: '',
      club_local_id: '',
      club_visitante_id: '',
      fecha: '',
      hora: '',
      goles_local: 0,
      goles_visitante: 0,
      estado: 'programado',
      arbitro: '',
      observaciones: ''
    });
    setCurrentPartido(null);
  };

  // Resetear formulario de resultado
  const resetResultadoForm = () => {
    setResultadoForm({
      goles_local: 0,
      goles_visitante: 0,
      estadisticas: []
    });
    setCurrentPartido(null);
    setJugadoresDisponibles([]);
    setJugadorForm({
      id_deportista: '',
      goles: 0,
      asistencias: 0,
      tarjetas_amarillas: 0,
      tarjetas_rojas: 0,
      minutos_jugados: 90,
      titular: true
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

  // Formatear fecha y hora
  const formatFechaHora = (fechaString, horaString) => {
    if (!fechaString) return 'No especificada';
    const fecha = new Date(fechaString);
    
    let horaFormato = '';
    if (horaString) {
      const [horas, minutos] = horaString.split(':');
      fecha.setHours(horas, minutos);
      horaFormato = fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return `${formatFecha(fechaString)} ${horaFormato ? 'a las ' + horaFormato : ''}`;
  };

  // Calcular resultado
  const calcularResultado = (partido) => {
    if (partido.estado !== 'finalizado') {
      return 'Por jugar';
    }
    
    if (partido.goles_local > partido.goles_visitante) {
      return `Victoria Local (${partido.goles_local}-${partido.goles_visitante})`;
    } else if (partido.goles_local < partido.goles_visitante) {
      return `Victoria Visitante (${partido.goles_local}-${partido.goles_visitante})`;
    } else {
      return `Empate (${partido.goles_local}-${partido.goles_visitante})`;
    }
  };

  // Obtener partidos filtrados
  const getFilteredPartidos = () => {
    let filtered = [...partidos];
    
    if (filterEstado) {
      filtered = filtered.filter(p => p.estado === filterEstado);
    }
    
    if (filterCampeonato) {
      filtered = filtered.filter(p => p.id_campeonato == filterCampeonato);
    }
    
    if (filterFechaDesde) {
      filtered = filtered.filter(p => new Date(p.fecha) >= new Date(filterFechaDesde));
    }
    
    if (filterFechaHasta) {
      filtered = filtered.filter(p => new Date(p.fecha) <= new Date(filterFechaHasta));
    }
    
    if (filterClub) {
      filtered = filtered.filter(p => 
        p.club_local_id == filterClub || p.club_visitante_id == filterClub
      );
    }
    
    if (filterEscenario) {
      filtered = filtered.filter(p => p.id_escenario == filterEscenario);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.arbitro?.toLowerCase().includes(term) ||
        p.campeonato?.nombre?.toLowerCase().includes(term) ||
        p.clubLocal?.nombre?.toLowerCase().includes(term) ||
        p.clubVisitante?.nombre?.toLowerCase().includes(term) ||
        p.escenario?.nombre?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  // Calcular estadísticas generales
  const calcularEstadisticasGenerales = () => {
    if (partidos.length === 0) return null;
    
    const total = partidos.length;
    const finalizados = partidos.filter(p => p.estado === 'finalizado').length;
    const programados = partidos.filter(p => p.estado === 'programado').length;
    const enJuego = partidos.filter(p => p.estado === 'en_juego').length;
    const suspendidos = partidos.filter(p => p.estado === 'suspendido').length;
    const cancelados = partidos.filter(p => p.estado === 'cancelado').length;
    
    // Total goles
    const totalGoles = partidos.reduce((sum, p) => 
      sum + (p.goles_local || 0) + (p.goles_visitante || 0), 0
    );
    
    // Partidos por campeonato
    const partidosPorCampeonato = partidos.reduce((acc, p) => {
      const nombre = p.campeonato?.nombre || 'Sin campeonato';
      acc[nombre] = (acc[nombre] || 0) + 1;
      return acc;
    }, {});
    
    // Escenario más usado
    const escenarioMasUsado = [...partidos]
      .reduce((acc, p) => {
        const nombre = p.escenario?.nombre || 'Sin escenario';
        acc[nombre] = (acc[nombre] || 0) + 1;
        return acc;
      }, {});
    
    const escenarioTop = Object.entries(escenarioMasUsado)
      .sort((a, b) => b[1] - a[1])
      .shift();
    
    return {
      total,
      finalizados,
      programados,
      enJuego,
      suspendidos,
      cancelados,
      totalGoles,
      promedioGoles: finalizados > 0 ? (totalGoles / finalizados).toFixed(2) : 0,
      partidosPorCampeonato,
      escenarioTop: escenarioTop ? { nombre: escenarioTop[0], partidos: escenarioTop[1] } : null
    };
  };

  const partidosFiltrados = getFilteredPartidos();
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
                <i className="fas fa-futbol me-2"></i>
                Gestión de Partidos
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
                  <i className="fas fa-plus"></i> Nuevo Partido
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
                        placeholder="Árbitro, club, escenario..."
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
                      <option value="programado">Programado</option>
                      <option value="en_juego">En Juego</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="suspendido">Suspendido</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Campeonato</label>
                    <select 
                      className="form-select"
                      value={filterCampeonato}
                      onChange={(e) => setFilterCampeonato(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {campeonatos.map((campeonato) => (
                        <option key={`campeonato-${campeonato.id_campeonato}`} value={campeonato.id_campeonato}>
                          {campeonato.nombre}
                        </option>
                      ))}
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
                    <label className="form-label">Club</label>
                    <select 
                      className="form-select"
                      value={filterClub}
                      onChange={(e) => setFilterClub(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {clubes.map((club) => (
                        <option key={`club-${club.id_club}`} value={club.id_club}>
                          {club.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-3">
                    <label className="form-label">Escenario</label>
                    <select 
                      className="form-select"
                      value={filterEscenario}
                      onChange={(e) => setFilterEscenario(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {escenarios.map((escenario) => (
                        <option key={`escenario-${escenario.id_escenario}`} value={escenario.id_escenario}>
                          {escenario.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">Resultado</label>
                    <select 
                      className="form-select"
                      value={filterResultado}
                      onChange={(e) => setFilterResultado(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="local">Victoria Local</option>
                      <option value="visitante">Victoria Visitante</option>
                      <option value="empate">Empate</option>
                    </select>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-info w-100"
                      onClick={handleViewCalendario}
                      disabled={loading}
                    >
                      <i className="fas fa-calendar-alt"></i> Calendario
                    </button>
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label">&nbsp;</label>
                    <button 
                      className="btn btn-success w-100"
                      onClick={handleViewProximos}
                      disabled={loading}
                    >
                      <i className="fas fa-forward"></i> Próximos
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
                        <p>Total Partidos</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-warning text-white">
                        <h4>{estadisticasGenerales.programados}</h4>
                        <p>Programados</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-primary text-white">
                        <h4>{estadisticasGenerales.enJuego}</h4>
                        <p>En Juego</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-success text-white">
                        <h4>{estadisticasGenerales.finalizados}</h4>
                        <p>Finalizados</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-info text-white">
                        <h4>{estadisticasGenerales.totalGoles}</h4>
                        <p>Total Goles</p>
                      </div>
                    </div>
                    <div className="col-md-2">
                      <div className="stat-card bg-danger text-white">
                        <h4>{parseFloat(estadisticasGenerales.promedioGoles)}</h4>
                        <p>Promedio Goles</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de partidos */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando partidos...</p>
                </div>
              ) : partidosFiltrados.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-futbol fa-3x text-muted mb-3"></i>
                  <h4>No hay partidos registrados</h4>
                  <p>Crea tu primer partido usando el botón "Nuevo Partido"</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Fecha/Hora</th>
                        <th>Campeonato</th>
                        <th>Local</th>
                        <th>vs</th>
                        <th>Visitante</th>
                        <th>Resultado</th>
                        <th>Escenario</th>
                        <th>Árbitro</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partidosFiltrados.map((partido) => (
                        <tr key={`partido-${partido.id_partido}`}>
                          <td>
                            <div className="small">
                              <strong>{formatFecha(partido.fecha)}</strong>
                            </div>
                            <div className="text-muted small">
                              {partido.hora}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary">
                              {partido.campeonato?.nombre || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {partido.clubLocal?.logo && (
                                <img 
                                  src={`${API_URL.replace('/api', '')}/storage/${partido.clubLocal.logo}`}
                                  alt={partido.clubLocal.nombre}
                                  className="club-logo-sm me-2"
                                />
                              )}
                              <span>{partido.clubLocal?.nombre}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-secondary">VS</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {partido.clubVisitante?.logo && (
                                <img 
                                  src={`${API_URL.replace('/api', '')}/storage/${partido.clubVisitante.logo}`}
                                  alt={partido.clubVisitante.nombre}
                                  className="club-logo-sm me-2"
                                />
                              )}
                              <span>{partido.clubVisitante?.nombre}</span>
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
                            <div className="small">
                              {partido.escenario?.nombre || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <div className="small">
                              {partido.arbitro || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge estado-badge estado-${partido.estado}`}>
                              {partido.estado}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewDetails(partido)}
                                title="Ver detalles"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleEdit(partido)}
                                title="Editar"
                                disabled={partido.estado === 'finalizado'}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleSetResultado(partido)}
                                title="Actualizar resultado"
                                disabled={partido.estado === 'finalizado'}
                              >
                                <i className="fas fa-futbol"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleViewHistorial(partido)}
                                title="Historial"
                              >
                                <i className="fas fa-history"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(partido.id_partido)}
                                title="Eliminar"
                                disabled={partido.estado === 'finalizado'}
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

      {/* Modal para crear partido */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-plus-circle me-2"></i>
                Nuevo Partido
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
                      <label className="form-label">Campeonato *</label>
                      <select
                        className="form-control"
                        value={formData.id_campeonato}
                        onChange={(e) => setFormData({...formData, id_campeonato: e.target.value})}
                        required
                      >
                        <option value="">Seleccione un campeonato</option>
                        {campeonatos.map((campeonato) => (
                          <option key={`campeonato-${campeonato.id_campeonato}`} value={campeonato.id_campeonato}>
                            {campeonato.nombre} ({campeonato.categoria})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Escenario *</label>
                      <select
                        className="form-control"
                        value={formData.id_escenario}
                        onChange={(e) => setFormData({...formData, id_escenario: e.target.value})}
                        required
                      >
                        <option value="">Seleccione un escenario</option>
                        {escenarios.map((escenario) => (
                          <option key={`escenario-${escenario.id_escenario}`} value={escenario.id_escenario}>
                            {escenario.nombre} - {escenario.ubicacion}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Club Local *</label>
                      <select
                        className="form-control"
                        value={formData.club_local_id}
                        onChange={(e) => setFormData({...formData, club_local_id: e.target.value})}
                        required
                      >
                        <option value="">Seleccione club local</option>
                        {clubes.map((club) => (
                          <option key={`club-local-${club.id_club}`} value={club.id_club}>
                            {club.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Club Visitante *</label>
                      <select
                        className="form-control"
                        value={formData.club_visitante_id}
                        onChange={(e) => setFormData({...formData, club_visitante_id: e.target.value})}
                        required
                      >
                        <option value="">Seleccione club visitante</option>
                        {clubes
                          .filter(club => club.id_club !== formData.club_local_id)
                          .map((club) => (
                            <option key={`club-visitante-${club.id_club}`} value={club.id_club}>
                              {club.nombre}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Hora *</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.hora}
                        onChange={(e) => setFormData({...formData, hora: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Estado *</label>
                      <select
                        className="form-control"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                        required
                      >
                        <option value="programado">Programado</option>
                        <option value="en_juego">En Juego</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="suspendido">Suspendido</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Árbitro</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.arbitro}
                        onChange={(e) => setFormData({...formData, arbitro: e.target.value})}
                        placeholder="Nombre del árbitro"
                      />
                    </div>
                  </div>
                </div>

                {formData.estado === 'finalizado' && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Goles Local</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.goles_local}
                          onChange={(e) => setFormData({...formData, goles_local: parseInt(e.target.value) || 0})}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Goles Visitante</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.goles_visitante}
                          onChange={(e) => setFormData({...formData, goles_visitante: parseInt(e.target.value) || 0})}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    rows="3"
                    placeholder="Observaciones sobre el partido..."
                  />
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
                  Guardar Partido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar partido */}
      {showEditModal && currentPartido && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-warning text-white">
              <h3>
                <i className="fas fa-edit me-2"></i>
                Editar Partido
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
                <div className="alert alert-info mb-4">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Información del partido:</strong> {currentPartido.clubLocal?.nombre} vs {currentPartido.clubVisitante?.nombre}
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Escenario</label>
                      <select
                        className="form-control"
                        value={formData.id_escenario}
                        onChange={(e) => setFormData({...formData, id_escenario: e.target.value})}
                      >
                        <option value="">Seleccione un escenario</option>
                        {escenarios.map((escenario) => (
                          <option key={`escenario-edit-${escenario.id_escenario}`} value={escenario.id_escenario}>
                            {escenario.nombre} - {escenario.ubicacion}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Hora</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.hora}
                        onChange={(e) => setFormData({...formData, hora: e.target.value})}
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
                        <option value="programado">Programado</option>
                        <option value="en_juego">En Juego</option>
                        <option value="finalizado">Finalizado</option>
                        <option value="suspendido">Suspendido</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {formData.estado === 'finalizado' && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Goles Local</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.goles_local}
                          onChange={(e) => setFormData({...formData, goles_local: parseInt(e.target.value) || 0})}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      <div className="form-group mb-3">
                        <label className="form-label">Goles Visitante</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.goles_visitante}
                          onChange={(e) => setFormData({...formData, goles_visitante: parseInt(e.target.value) || 0})}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label className="form-label">Árbitro</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.arbitro}
                        onChange={(e) => setFormData({...formData, arbitro: e.target.value})}
                        placeholder="Nombre del árbitro"
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
                    placeholder="Observaciones sobre el partido..."
                  />
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
                  Actualizar Partido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles del partido */}
      {showDetallesModal && currentPartido && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-futbol me-2"></i>
                Detalles del Partido
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowDetallesModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="team-card text-center mb-4">
                    <div className="team-logo mb-3">
                      {currentPartido.clubLocal?.logo && (
                        <img 
                          src={`${API_URL.replace('/api', '')}/storage/${currentPartido.clubLocal.logo}`}
                          alt={currentPartido.clubLocal.nombre}
                          className="team-logo-large"
                        />
                      )}
                    </div>
                    <h4>{currentPartido.clubLocal?.nombre}</h4>
                    <p className="text-muted">Local</p>
                    {currentPartido.goles_local !== null && (
                      <div className="score-display">
                        <span className="score-number">{currentPartido.goles_local}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="team-card text-center mb-4">
                    <div className="team-logo mb-3">
                      {currentPartido.clubVisitante?.logo && (
                        <img 
                          src={`${API_URL.replace('/api', '')}/storage/${currentPartido.clubVisitante.logo}`}
                          alt={currentPartido.clubVisitante.nombre}
                          className="team-logo-large"
                        />
                      )}
                    </div>
                    <h4>{currentPartido.clubVisitante?.nombre}</h4>
                    <p className="text-muted">Visitante</p>
                    {currentPartido.goles_visitante !== null && (
                      <div className="score-display">
                        <span className="score-number">{currentPartido.goles_visitante}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="info-section mb-4">
                <h5 className="text-primary">
                  <i className="fas fa-info-circle me-2"></i>Información del Partido
                </h5>
                <div className="row">
                  <div className="col-md-6">
                    <div className="info-item">
                      <strong>Campeonato:</strong> {currentPartido.campeonato?.nombre || 'N/A'}
                    </div>
                    <div className="info-item">
                      <strong>Fecha:</strong> {formatFechaHora(currentPartido.fecha, currentPartido.hora)}
                    </div>
                    <div className="info-item">
                      <strong>Escenario:</strong> {currentPartido.escenario?.nombre || 'N/A'}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="info-item">
                      <strong>Estado:</strong> 
                      <span className={`badge estado-badge estado-${currentPartido.estado} ms-2`}>
                        {currentPartido.estado}
                      </span>
                    </div>
                    <div className="info-item">
                      <strong>Árbitro:</strong> {currentPartido.arbitro || 'N/A'}
                    </div>
                    <div className="info-item">
                      <strong>Ubicación:</strong> {currentPartido.escenario?.ubicacion || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {currentPartido.observaciones && (
                <div className="info-section mb-4">
                  <h5 className="text-primary">
                    <i className="fas fa-comment me-2"></i>Observaciones
                  </h5>
                  <p className="p-3 bg-light rounded">{currentPartido.observaciones}</p>
                </div>
              )}

              {estadisticas && estadisticas.estadisticas && estadisticas.estadisticas.length > 0 && (
                <div className="info-section">
                  <h5 className="text-primary">
                    <i className="fas fa-chart-bar me-2"></i>Estadísticas del Partido
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Jugador</th>
                          <th>Goles</th>
                          <th>Asistencias</th>
                          <th>Amarillas</th>
                          <th>Rojas</th>
                          <th>Minutos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estadisticas.estadisticas.map((est) => (
                          <tr key={`est-${est.id_estadistica}`}>
                            <td>{est.deportista?.usuario?.nombre || 'N/A'}</td>
                            <td><span className="badge bg-success">{est.goles}</span></td>
                            <td><span className="badge bg-primary">{est.asistencias}</span></td>
                            <td><span className="badge bg-warning">{est.tarjetas_amarillas}</span></td>
                            <td><span className="badge bg-danger">{est.tarjetas_rojas}</span></td>
                            <td>{est.minutos_jugados}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                  handleEdit(currentPartido);
                }}
                disabled={currentPartido.estado === 'finalizado'}
              >
                <i className="fas fa-edit me-2"></i> Editar
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => {
                  setShowDetallesModal(false);
                  handleSetResultado(currentPartido);
                }}
                disabled={currentPartido.estado === 'finalizado'}
              >
                <i className="fas fa-futbol me-2"></i> Actualizar Resultado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para actualizar resultado */}
      {showResultadoModal && currentPartido && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-futbol me-2"></i>
                Actualizar Resultado: {currentPartido.clubLocal?.nombre} vs {currentPartido.clubVisitante?.nombre}
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowResultadoModal(false);
                  resetResultadoForm();
                }}
              ></button>
            </div>
            <form onSubmit={handleUpdateResultado}>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-5">
                    <div className="team-card text-center">
                      <h5>{currentPartido.clubLocal?.nombre}</h5>
                      <div className="form-group mt-3">
                        <label className="form-label">Goles</label>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={resultadoForm.goles_local}
                          onChange={(e) => setResultadoForm({
                            ...resultadoForm,
                            goles_local: parseInt(e.target.value) || 0
                          })}
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-2 text-center">
                    <div className="vs-text">VS</div>
                  </div>
                  
                  <div className="col-md-5">
                    <div className="team-card text-center">
                      <h5>{currentPartido.clubVisitante?.nombre}</h5>
                      <div className="form-group mt-3">
                        <label className="form-label">Goles</label>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={resultadoForm.goles_visitante}
                          onChange={(e) => setResultadoForm({
                            ...resultadoForm,
                            goles_visitante: parseInt(e.target.value) || 0
                          })}
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info mb-4">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Importante:</strong> Una vez actualizado el resultado, el partido se marcará como finalizado.
                </div>

                <h5 className="mb-3">
                  <i className="fas fa-user-friends me-2"></i>
                  Estadísticas de Jugadores
                </h5>

                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Agregar Estadística de Jugador</h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label className="form-label">Jugador</label>
                          <select
                            className="form-control"
                            value={jugadorForm.id_deportista}
                            onChange={(e) => setJugadorForm({
                              ...jugadorForm,
                              id_deportista: e.target.value
                            })}
                          >
                            <option value="">Seleccionar jugador</option>
                            {jugadoresDisponibles.map((jugador) => (
                              <option key={`jugador-${jugador.id_deportista}`} value={jugador.id_deportista}>
                                {jugador.nombre} {jugador.apellido} (#{jugador.numero || 'N/A'})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="col-md-2">
                        <div className="form-group mb-3">
                          <label className="form-label">Goles</label>
                          <input
                            type="number"
                            className="form-control"
                            value={jugadorForm.goles}
                            onChange={(e) => setJugadorForm({
                              ...jugadorForm,
                              goles: parseInt(e.target.value) || 0
                            })}
                            min="0"
                          />
                        </div>
                      </div>
                      
                      <div className="col-md-2">
                        <div className="form-group mb-3">
                          <label className="form-label">Asistencias</label>
                          <input
                            type="number"
                            className="form-control"
                            value={jugadorForm.asistencias}
                            onChange={(e) => setJugadorForm({
                              ...jugadorForm,
                              asistencias: parseInt(e.target.value) || 0
                            })}
                            min="0"
                          />
                        </div>
                      </div>
                      
                      <div className="col-md-2">
                        <div className="form-group mb-3">
                          <label className="form-label">Minutos</label>
                          <input
                            type="number"
                            className="form-control"
                            value={jugadorForm.minutos_jugados}
                            onChange={(e) => setJugadorForm({
                              ...jugadorForm,
                              minutos_jugados: parseInt(e.target.value) || 90
                            })}
                            min="0"
                            max="120"
                          />
                        </div>
                      </div>
                      
                      <div className="col-md-2">
                        <label className="form-label">&nbsp;</label>
                        <button
                          type="button"
                          className="btn btn-primary w-100"
                          onClick={handleAddEstadisticaJugador}
                          disabled={!jugadorForm.id_deportista}
                        >
                          <i className="fas fa-plus"></i> Agregar
                        </button>
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-check mb-3">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={jugadorForm.titular}
                            onChange={(e) => setJugadorForm({
                              ...jugadorForm,
                              titular: e.target.checked
                            })}
                            id="titularCheck"
                          />
                          <label className="form-check-label" htmlFor="titularCheck">
                            Titular
                          </label>
                        </div>
                      </div>
                      
                      <div className="col-md-3">
                        <div className="form-group mb-3">
                          <label className="form-label">Tarjetas Amarillas</label>
                          <input
                            type="number"
                            className="form-control"
                            value={jugadorForm.tarjetas_amarillas}
                            onChange={(e) => setJugadorForm({
                              ...jugadorForm,
                              tarjetas_amarillas: parseInt(e.target.value) || 0
                            })}
                            min="0"
                            max="2"
                          />
                        </div>
                      </div>
                      
                      <div className="col-md-3">
                        <div className="form-group mb-3">
                          <label className="form-label">Tarjetas Rojas</label>
                          <input
                            type="number"
                            className="form-control"
                            value={jugadorForm.tarjetas_rojas}
                            onChange={(e) => setJugadorForm({
                              ...jugadorForm,
                              tarjetas_rojas: parseInt(e.target.value) || 0
                            })}
                            min="0"
                            max="1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {resultadoForm.estadisticas.length > 0 && (
                  <div className="card">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">Estadísticas Registradas ({resultadoForm.estadisticas.length})</h6>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Jugador</th>
                              <th>Goles</th>
                              <th>Asistencias</th>
                              <th>Amarillas</th>
                              <th>Rojas</th>
                              <th>Minutos</th>
                              <th>Titular</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultadoForm.estadisticas.map((est, index) => (
                              <tr key={`est-${index}`}>
                                <td>{est.nombre}</td>
                                <td><span className="badge bg-success">{est.goles}</span></td>
                                <td><span className="badge bg-primary">{est.asistencias}</span></td>
                                <td><span className="badge bg-warning">{est.tarjetas_amarillas}</span></td>
                                <td><span className="badge bg-danger">{est.tarjetas_rojas}</span></td>
                                <td>{est.minutos_jugados}'</td>
                                <td>
                                  {est.titular ? (
                                    <span className="badge bg-success">Sí</span>
                                  ) : (
                                    <span className="badge bg-secondary">No</span>
                                  )}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveEstadisticaJugador(index)}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowResultadoModal(false);
                    resetResultadoForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  <i className="fas fa-check-circle me-2"></i> Guardar Resultado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver calendario */}
      {showCalendarioModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-primary text-white">
              <h3>
                <i className="fas fa-calendar-alt me-2"></i>
                Calendario de Partidos
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowCalendarioModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Mes</label>
                    <select
                      className="form-control"
                      value={calendarioForm.mes}
                      onChange={(e) => setCalendarioForm({
                        ...calendarioForm,
                        mes: parseInt(e.target.value)
                      })}
                    >
                      {Array.from({length: 12}, (_, i) => i + 1).map((mes) => (
                        <option key={`mes-${mes}`} value={mes}>
                          {new Date(2000, mes - 1, 1).toLocaleString('es-ES', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="form-group mb-3">
                    <label className="form-label">Año</label>
                    <input
                      type="number"
                      className="form-control"
                      value={calendarioForm.ano}
                      onChange={(e) => setCalendarioForm({
                        ...calendarioForm,
                        ano: parseInt(e.target.value)
                      })}
                      min="2000"
                      max="2100"
                    />
                  </div>
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">&nbsp;</label>
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => fetchCalendario(calendarioForm.mes, calendarioForm.ano)}
                  >
                    <i className="fas fa-sync-alt me-2"></i> Actualizar
                  </button>
                </div>
              </div>

              {calendario ? (
                <div>
                  <h4 className="text-center mb-4">
                    {calendario.mes} {calendario.ano}
                  </h4>
                  
                  {Object.keys(calendario.calendario || {}).length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                      <h4>No hay partidos programados</h4>
                      <p>No hay partidos programados para este mes</p>
                    </div>
                  ) : (
                    <div className="calendario-container">
                      {Object.entries(calendario.calendario).map(([fecha, partidosDia]) => (
                        <div key={`dia-${fecha}`} className="calendario-dia mb-4">
                          <h5 className="bg-light p-3 rounded">
                            <i className="fas fa-calendar-day me-2"></i>
                            {formatFecha(fecha)}
                          </h5>
                          <div className="row">
                            {partidosDia.map((partido) => (
                              <div key={`cal-partido-${partido.id_partido}`} className="col-md-6 mb-3">
                                <div className="card">
                                  <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <strong>{partido.clubLocal?.nombre}</strong> vs{' '}
                                        <strong>{partido.clubVisitante?.nombre}</strong>
                                      </div>
                                      <span className="badge bg-primary">
                                        {partido.hora}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-muted small">
                                      <i className="fas fa-trophy me-1"></i>
                                      {partido.campeonato?.nombre}
                                      <i className="fas fa-map-marker-alt ms-3 me-1"></i>
                                      {partido.escenario?.nombre}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando calendario...</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowCalendarioModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  const hoy = new Date();
                  setCalendarioForm({
                    mes: hoy.getMonth() + 1,
                    ano: hoy.getFullYear()
                  });
                  fetchCalendario(hoy.getMonth() + 1, hoy.getFullYear());
                }}
              >
                <i className="fas fa-calendar-day me-2"></i> Mes Actual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver historial */}
      {showHistorialModal && historial && currentPartido && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-info text-white">
              <h3>
                <i className="fas fa-history me-2"></i>
                Historial de Enfrentamientos
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowHistorialModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="text-center mb-4">
                <h4>
                  {currentPartido.clubLocal?.nombre} vs {currentPartido.clubVisitante?.nombre}
                </h4>
                <p className="text-muted">Historial de todos los enfrentamientos</p>
              </div>

              <div className="stats-section mb-4">
                <div className="row">
                  <div className="col-md-4">
                    <div className="stat-card text-center">
                      <h4>{historial.estadisticas?.total_partidos || 0}</h4>
                      <p>Total Partidos</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="stat-card text-center bg-success text-white">
                      <h4>{historial.estadisticas?.victorias_local || 0}</h4>
                      <p>Victorias {currentPartido.clubLocal?.nombre}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="stat-card text-center bg-primary text-white">
                      <h4>{historial.estadisticas?.victorias_visitante || 0}</h4>
                      <p>Victorias {currentPartido.clubVisitante?.nombre}</p>
                    </div>
                  </div>
                </div>
              </div>

              {historial.partidos && historial.partidos.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Fecha</th>
                        <th>Campeonato</th>
                        <th>Resultado</th>
                        <th>Goles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.partidos.map((partido) => (
                        <tr key={`hist-${partido.id_partido}`}>
                          <td>{formatFecha(partido.fecha)}</td>
                          <td>{partido.campeonato?.nombre}</td>
                          <td>
                            {partido.goles_local > partido.goles_visitante ? (
                              <span className="badge bg-success">Victoria Local</span>
                            ) : partido.goles_local < partido.goles_visitante ? (
                              <span className="badge bg-primary">Victoria Visitante</span>
                            ) : (
                              <span className="badge bg-warning">Empate</span>
                            )}
                          </td>
                          <td>
                            <strong>{partido.goles_local}</strong> - <strong>{partido.goles_visitante}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-history fa-3x text-muted mb-3"></i>
                  <h4>No hay historial de enfrentamientos</h4>
                  <p>Este será el primer partido entre estos clubes</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowHistorialModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para próximos partidos */}
      {showProximosModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header bg-success text-white">
              <h3>
                <i className="fas fa-forward me-2"></i>
                Próximos Partidos
              </h3>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowProximosModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {proximosPartidos.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                  <h4>No hay partidos próximos</h4>
                  <p>No hay partidos programados para los próximos días</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Fecha/Hora</th>
                        <th>Campeonato</th>
                        <th>Local</th>
                        <th>vs</th>
                        <th>Visitante</th>
                        <th>Escenario</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proximosPartidos.map((partido) => (
                        <tr key={`prox-${partido.id_partido}`}>
                          <td>
                            <div className="small">
                              <strong>{formatFecha(partido.fecha)}</strong>
                            </div>
                            <div className="text-muted small">
                              {partido.hora}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary">
                              {partido.campeonato?.nombre}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {partido.clubLocal?.logo && (
                                <img 
                                  src={`${API_URL.replace('/api', '')}/storage/${partido.clubLocal.logo}`}
                                  alt={partido.clubLocal.nombre}
                                  className="club-logo-sm me-2"
                                />
                              )}
                              <span>{partido.clubLocal?.nombre}</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-secondary">VS</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {partido.clubVisitante?.logo && (
                                <img 
                                  src={`${API_URL.replace('/api', '')}/storage/${partido.clubVisitante.logo}`}
                                  alt={partido.clubVisitante.nombre}
                                  className="club-logo-sm me-2"
                                />
                              )}
                              <span>{partido.clubVisitante?.nombre}</span>
                            </div>
                          </td>
                          <td>{partido.escenario?.nombre}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewDetails(partido)}
                              title="Ver detalles"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
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
                onClick={() => setShowProximosModal(false)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={fetchProximosPartidos}
              >
                <i className="fas fa-sync-alt me-2"></i> Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partidos;