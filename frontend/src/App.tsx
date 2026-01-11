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