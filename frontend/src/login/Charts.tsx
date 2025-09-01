import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Metrics {
  accuracy: number;
  users_by_day: Array<{
    date: string;
    count: number;
  }>;
}

interface ChartsProps {
  metrics: Metrics;
}

const Charts: React.FC<ChartsProps> = ({ metrics }) => {
  return (
    <div className="space-y-8">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Precisión del Modelo</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[{name: 'Precisión', value: metrics.accuracy * 100}]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => [`${value}%`, 'Precisión']} />
            <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Tendencia de Registro de Usuarios</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.users_by_day}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#4f46e5"
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;