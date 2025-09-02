import React, { useState, useEffect } from 'react';
import Login from './login/Login';
import Register from './login/Register';
import Dashboard from './login/Dashboard';
import AdminSetup from './login/AdminSetup';
import FaceCamera from './login/FaceCamera';
import './App.css';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('login');
  const [adminConfigured, setAdminConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Nuevo estado para la autenticación

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

  const handleFaceValidationSuccess = () => {
    // Esta función se llamará desde Login.tsx
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const renderView = () => {
    // Si la autenticación no es exitosa, siempre redirige a la vista de login.
    // Esto evita que se pueda acceder al dashboard directamente.
    if (!isAuthenticated) {
      if (!adminConfigured && currentView !== 'admin-setup') {
        return <AdminSetup onSetupComplete={handleAdminSetup} />;
      }
      switch (currentView) {
        case 'admin-setup':
          return <AdminSetup onSetupComplete={handleAdminSetup} />;
        case 'register':
          return <Register />;
        default:
          return <Login onFaceValidated={handleFaceValidationSuccess} />;
      }
    }

    // Si la autenticación es exitosa, muestra el dashboard
    return <Dashboard />;
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
          {isAuthenticated && (
            <div className="navbar-buttons">
              {/* Elimina los botones de navegación si el usuario está autenticado */}
            </div>
          )}
        </div>
      </nav>
      <main className="app-main">{renderView()}</main>
    </div>
  );
};

export default App;
