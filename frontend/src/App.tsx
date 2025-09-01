import React, { useState, useEffect } from 'react';
//import Login from './login/Login';
import Register from './login/Register';
import Dashboard from './login/Dashboard';
import AdminSetup from './login/AdminSetup';

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
      case 'register':
        return <Register />;
      case 'dashboard':
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">Autenticación Facial</h1>
              </div>
            </div>
            {adminConfigured && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('login')}
                  className={`px-4 py-2 rounded-md font-medium ${currentView === 'login' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className={`px-4 py-2 rounded-md font-medium ${currentView === 'register' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Registrar
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 rounded-md font-medium ${currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Panel
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;