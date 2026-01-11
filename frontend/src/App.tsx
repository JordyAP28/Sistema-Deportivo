// App.js - Configuración principal de rutas
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from '../src/Pages/Index.jsx'; // Tu componente Index.jsx
import Login from '../src/Pages/Login.jsx'; // Tu componente Login.jsx
import Registro from '../src/Pages/Registro.jsx'; // Tu componente Registro.jsx

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="*" element={<h1>Página no encontrada</h1>} />
      </Routes>
    </Router>
  );
};

export default App;