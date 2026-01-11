import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, LogOut, Menu, Bell } from 'lucide-react';
import '../../styles/admin/componente.css';

const Topbar = ({ title = "Dashboard", showMenuButton = false, onMenuClick }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState(3);

    useEffect(() => {
        cargarUsuario();
    }, []);

    const cargarUsuario = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const userLocal = localStorage.getItem('user');
            if (userLocal) {
                setUser(JSON.parse(userLocal));
                setLoading(false);
                return;
            }

            // Usando la ruta correcta de tu API
            const response = await axios.get('http://localhost:8000/api/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            setLoading(false);
        } catch (err) {
            console.error('Error cargando usuario:', err);
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            await axios.post(
                'http://localhost:8000/api/logout',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                }
            );
        } catch (e) {
            console.error('Error en logout:', e);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };

    const getUserInitials = () => {
        if (!user) return 'U';
        const nombre = user.nombre?.charAt(0) || '';
        const apellido = user.apellido?.charAt(0) || '';
        return `${nombre}${apellido}`.toUpperCase();
    };

    if (loading) {
        return (
            <header className="topbar">
                <div className="topbar-left">
                    <div className="animate-pulse h-6 w-48 bg-gray-200 rounded"></div>
                </div>
            </header>
        );
    }

    return (
        <header className="topbar">
            <div className="topbar-left">
                {showMenuButton && (
                    <button className="menu-toggle" onClick={onMenuClick}>
                        <Menu size={24} />
                    </button>
                )}
                <h2>{title}</h2>
                {user?.rol?.nombre && (
                    <span className="role">
                        <Shield size={14} />
                        {user.rol.nombre}
                    </span>
                )}
            </div>

            <div className="topbar-right">
                <div className="notifications">
                    <button className="notification-btn">
                        <Bell size={20} />
                        {notifications > 0 && (
                            <span className="notification-badge">{notifications}</span>
                        )}
                    </button>
                </div>
                
                <div className="user-info">
                    <div className="user-avatar">
                        {getUserInitials()}
                    </div>
                    <div className="user-details">
                        <span className="user-name">
                            {user?.nombre} {user?.apellido}
                        </span>
                        <span className="user-email">{user?.email}</span>
                    </div>
                </div>

                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={18} />
                    <span className="logout-text">Salir</span>
                </button>
            </div>
        </header>
    );
};

export default Topbar;