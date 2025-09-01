import React, { useState, useEffect } from 'react';
import Charts from './Charts';
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
    <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
        {userName && <p className="text-gray-600 mt-2">Hola, {userName}</p>}
      </div>
      {metrics && <Charts metrics={metrics} />}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-800">Usuarios Totales</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {metrics?.users_by_day?.reduce((acc, day) => acc + day.count, 0) || 0}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h3 className="font-semibold text-green-800">Precisión del Sistema</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : '0%'}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="font-semibold text-purple-800">Sesiones Activas</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">1</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;