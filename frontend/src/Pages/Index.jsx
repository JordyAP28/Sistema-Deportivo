import { useState } from "react";
import "../styles/public/index.css";

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="index-container">
      {/* HEADER */}
      <header className="index-header">
        <div className="header-content">
          <div className="logo">🏆 Sistema Deportivo</div>

          <div
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </div>

          <nav className={`main-nav ${menuOpen ? "active" : ""}`}>
            <a href="#" className="nav-link">Inicio</a>
            <a href="#" className="nav-link">Eventos</a>
            <a href="#" className="nav-link">Equipos</a>
            <a href="/login" className="nav-link nav-btn">Ingresar</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h2>Gestiona tu sistema deportivo</h2>
          <p className="hero-subtitle">
            Administra torneos, equipos y resultados desde una sola plataforma
            moderna y eficiente.
          </p>

          <div className="hero-buttons">
            <a href="#" className="btn btn-primary btn-large">Comenzar</a>
            <a href="#" className="btn btn-secondary btn-large">Ver más</a>
          </div>
        </div>

        <div className="hero-image">
          <div className="sports-icons">⚽</div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2 className="section-title">Funciones Principales</h2>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Eventos</h3>
            <p>Organiza campeonatos y partidos fácilmente.</p>
            <a href="#" className="feature-link">Ver más →</a>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Equipos</h3>
            <p>Gestiona jugadores y alineaciones.</p>
            <a href="#" className="feature-link">Ver más →</a>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Estadísticas</h3>
            <p>Consulta resultados y tablas en tiempo real.</p>
            <a href="#" className="feature-link">Ver más →</a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stats-container">
          <div className="stat-item">
            <h3>120+</h3>
            <p>Eventos</p>
          </div>
          <div className="stat-item">
            <h3>80+</h3>
            <p>Equipos</p>
          </div>
          <div className="stat-item">
            <h3>500+</h3>
            <p>Jugadores</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Empieza hoy mismo</h2>
        <p>
          Optimiza la gestión deportiva con una plataforma moderna, rápida y
          segura.
        </p>

        <div className="cta-buttons">
          <a href="/registro" className="btn btn-primary btn-large">Registrarse</a>
          <a href="#" className="btn btn-outline btn-large">Contacto</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="index-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Sistema Deportivo</h3>
            <p>Plataforma de gestión deportiva moderna.</p>
          </div>

          <div className="footer-section">
            <h4>Enlaces</h4>
            <a href="#">Inicio</a>
            <a href="#">Eventos</a>
            <a href="#">Contacto</a>
          </div>

          <div className="footer-section">
            <h4>Soporte</h4>
            <a href="#">Ayuda</a>
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
          </div>
        </div>

        <div className="footer-bottom">
          © 2026 Sistema Deportivo
        </div>
      </footer>
    </div>
  );
};

export default Index;
