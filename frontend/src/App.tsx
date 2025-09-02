import React, { useState, useEffect } from 'react';
import Login from './login/Login';
import Register from './login/Register';
import Dashboard from './login/Dashboard';
import AdminSetup from './login/AdminSetup';
import './App.css';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('login');
  const [adminConfigured, setAdminConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/check-admin');
      const data = await response.json();
      setAdminConfigured(data.admin_configured);

      if (!data.admin_configured) {
        setCurrentView('admin-setup');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetup = () => {
    setAdminConfigured(true);
    setCurrentView('login');
  };

  const renderView = () => {
    if (!adminConfigured && currentView !== 'admin-setup') {
      return <AdminSetup onSetupComplete={handleAdminSetup} />;
    }

    switch (currentView) {
      case 'admin-setup':
        return <AdminSetup onSetupComplete={handleAdminSetup} />;
      case 'login':
        return <Login />;
      case 'register':
        return <Register />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <Login />;
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-box">
          <div className="spinner"></div>
          <p className="loading-text">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="app-navbar">
        <div className="navbar-content">
          <h1 className="navbar-title">Autenticación Facial</h1>

          {adminConfigured && (
            <div className="navbar-buttons">
              <button
                onClick={() => setCurrentView('login')}
                className={`nav-btn ${currentView === 'login' ? 'active' : ''}`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setCurrentView('register')}
                className={`nav-btn ${currentView === 'register' ? 'active' : ''}`}
              >
                Registrar
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              >
                Panel
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="app-main">{renderView()}</main>
    </div>
  );
};

export default App;
