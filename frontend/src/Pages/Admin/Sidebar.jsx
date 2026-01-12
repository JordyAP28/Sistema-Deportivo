import React from "react";

import '../../styles/admin/componente.css';
const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="title">
                ⚙️ Panel Administrativo
            </div>

            <a href="/Admin/Dashboard"><i className="fa fa-chart-line"></i> Dashboard</a>

            <hr className="text-secondary" />

            <a href="/Admin/Users"><i className="fa fa-users"></i> Usuarios</a>
            <a href="/Admin/Roles"><i className="fa fa-user-shield"></i> Roles</a>
            <a href="/Admin/Permisos"><i className="fa fa-key"></i> Permisos</a>

            <hr className="text-secondary" />

            <a href="/Admin/Deportistas"><i className="fa fa-running"></i> Deportistas</a>
            <a href="/Admin/Categorias"><i className="fa fa-layer-group"></i> Categorías</a>
            <a href="/Admin/Asistencias"><i className="fa fa-clipboard-check"></i> Asistencias</a>

            <hr className="text-secondary" />

            <a href="#"><i className="fa fa-user-friends"></i> Tutores</a>
            <a href="#"><i className="fa fa-chalkboard-teacher"></i> Instructores</a>

            <hr className="text-secondary" />

            <a href="/Admin/Cursos"><i className="fa fa-book"></i> Cursos</a>
            <a href="#"><i className="fa fa-users-rectangle"></i> Grupos de Curso</a>
            <a href="/Admin/Inscripciones"><i className="fa fa-file-signature"></i> Inscripciones</a>

            <hr className="text-secondary" />

            <a href="/Admin/Clubes"><i className="fa fa-building"></i> Clubes</a>
            <a href="/Admin/Campeonatos"><i className="fa fa-trophy"></i> Campeonatos</a>
            <a href="/Admin/Partidos"><i className="fa fa-futbol"></i> Partidos</a>

            <hr className="text-secondary" />

            <a href="/Admin/Facturas"><i className="fa fa-money-bill-wave"></i> Facturas</a>
            <a href="/Admin/Pagos"><i className="fa fa-credit-card"></i> Pagos</a>

            <hr className="text-secondary" />

            <a href="/Admin/Escenario"><i className="fa fa-map"></i> Escenarios</a>
            <a href="/Admin/Actividades"><i className="fa fa-calendar-alt"></i> Actividades</a>

            <hr className="text-secondary" />

            <a href="/Admin/Notificaciones"><i className="fa fa-bell"></i> Notificaciones</a>
            <a href="/admin/archivo"><i className="fa fa-folder-open"></i> Archivos</a>
            <a href="/admin/configuracion"><i className="fa fa-cogs"></i> Configuraciones</a>
        </div>
    );
};

export default Sidebar;