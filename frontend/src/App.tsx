// App.js - Configuración principal de rutas
import React from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Index from '../src/Pages/Index.jsx';
import Login from '../src/Pages/Login.jsx';
import Registro from '../src/Pages/Registro.jsx';



// rutas para admin
import AdminDashboard from './Pages/Admin/Dashboard.jsx';
import AdminUsers from './Pages/Admin/Usuarios.jsx';
import AdminRoles from './Pages/Admin/Roles.jsx';
import AdminPermisos from './Pages/Admin/Permisos.jsx';
import AdminRolPermisos from './Pages/Admin/RolPermisos.jsx';
import AdminDeportista from './Pages/Admin/Deportista.jsx';
import AdminCategoria from './Pages/Admin/Categorias.jsx';
import AdminAsistencia from './Pages/Admin/Asistencias.jsx';
import AdminCurso from './Pages/Admin/Cursos.jsx';
import AdminInscripciones from './Pages/Admin/InscripcionesCursos.jsx';
import AdminClub from './Pages/Admin/Clubes.jsx';
import AdminCampeonato from './Pages/Admin/Campeonatos.jsx';
import AdminPartido from './Pages/Admin/Partidos.jsx';
import AdminFactura from './Pages/Admin/Facturas.jsx';
import AdminPago from './Pages/Admin/Pagos.jsx'
import AdminEscenario from './Pages/Admin/Escenarios.jsx';
import AdminActividad from './Pages/Admin/Actividades.jsx';
import AdminNotificaciones from './Pages/Admin/Notificaciones.jsx';

// rutas para deportista
import DeportistaDashboard from './Pages/Deportitsta/Dashboard.jsx';

// rutas para secretario
import SecretarioDashboard from './Pages/Secretario/Dashboard.jsx';



// Componente para proteger rutas
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  // Si hay roles específicos permitidos, verificar
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.id_rol)) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Rutas publicas */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        
        {/* Rutas protegidas */}
        {/* Rutas admin */}
        <Route path="/Admin/Dashboard" element={<ProtectedRoute allowedRoles={[1]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/Admin/Users" element={<ProtectedRoute allowedRoles={[1]}><AdminUsers /></ProtectedRoute>} />
        <Route path="/Admin/Roles" element={<ProtectedRoute allowedRoles={[1]}><AdminRoles /></ProtectedRoute>} />
        <Route path="/Admin/Permisos" element={<ProtectedRoute allowedRoles={[1]}><AdminPermisos /></ProtectedRoute>} />
        <Route path="/Admin/RolPermisos" element={<ProtectedRoute allowedRoles={[1]}><AdminRolPermisos /></ProtectedRoute>} />
        <Route path="/Admin/Deportistas" element={<ProtectedRoute allowedRoles={[1]}><AdminDeportista /></ProtectedRoute>} />
        <Route path="/Admin/Categorias" element={<ProtectedRoute allowedRoles={[1]}><AdminCategoria /></ProtectedRoute>} />
        <Route path="/Admin/Asistencias" element={<ProtectedRoute allowedRoles={[1]}><AdminAsistencia /></ProtectedRoute>} />
        <Route path="/Admin/Cursos" element={<ProtectedRoute allowedRoles={[1]}><AdminCurso /></ProtectedRoute>} />
        <Route path="/Admin/Inscripciones" element={<ProtectedRoute allowedRoles={[1]}><AdminInscripciones /></ProtectedRoute>} />
        <Route path="/Admin/Clubes" element={<ProtectedRoute allowedRoles={[1]}><AdminClub /></ProtectedRoute>} />
        <Route path="/Admin/Campeonatos" element={<ProtectedRoute allowedRoles={[1]}><AdminCampeonato /></ProtectedRoute>} />
        <Route path="/Admin/Partidos" element={<ProtectedRoute allowedRoles={[1]}><AdminPartido /></ProtectedRoute>} />
        <Route path="/Admin/Facturas" element={<ProtectedRoute allowedRoles={[1]}><AdminFactura /></ProtectedRoute>} />
        <Route path="/Admin/Pagos" element={<ProtectedRoute allowedRoles={[1]}><AdminPago /></ProtectedRoute>} />
        <Route path="/Admin/Escenario" element={<ProtectedRoute allowedRoles={[1]}><AdminEscenario /></ProtectedRoute>} />
        <Route path="/Admin/Actividades" element={<ProtectedRoute allowedRoles={[1]}><AdminActividad /></ProtectedRoute>} />
        <Route path="/Admin/Notificaciones" element={<ProtectedRoute allowedRoles={[1]}><AdminNotificaciones /></ProtectedRoute>} />

        {/* Rutas deportista */}
        <Route path="/Deportista/Dashboard" element={<ProtectedRoute allowedRoles={[2]}><DeportistaDashboard /></ProtectedRoute>} />


        {/* Rutas secretario */}
        <Route path="/Secretario/Dashboard" element={<ProtectedRoute allowedRoles={[3]}><SecretarioDashboard /></ProtectedRoute>} />

        
        <Route path="*" element={<h1>Página no encontrada</h1>} />
      </Routes>
    </Router>
  );
};

export default App;