import React, { useState, useEffect } from 'react';
import Charts from './Charts'; // Asumiendo que Charts también ha sido modificado
import './Dashboard.css'; // Importa el archivo CSS
import { getMetrics } from './api';

const Dashboard: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserName(payload.sub);

      const speech = new SpeechSynthesisUtterance(`Hola ${payload.sub}`);
      window.speechSynthesis.speak(speech);
    }

    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const metricsData = await getMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error al obtener métricas:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Panel de Control</h1>
        {userName && <p className="dashboard-greeting">Hola, {userName}</p>}
      </div>
      {metrics && <Charts metrics={metrics} />}
      <div className="metrics-grid">
        <div className="metric-card blue-card">
          <h3 className="metric-title">Usuarios Totales</h3>
          <p className="metric-value">
            {metrics?.users_by_day?.reduce((acc, day) => acc + day.count, 0) || 0}
          </p>
        </div>
        <div className="metric-card green-card">
          <h3 className="metric-title">Precisión del Sistema</h3>
          <p className="metric-value">
            {metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : '0%'}
          </p>
        </div>
        <div className="metric-card purple-card">
          <h3 className="metric-title">Sesiones Activas</h3>
          <p className="metric-value">1</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;