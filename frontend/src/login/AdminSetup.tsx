import React, { useState, useRef } from 'react';
import FaceCamera from './FaceCamera';

interface AdminSetupProps {
  onSetupComplete: () => void;
}

const AdminSetup: React.FC<AdminSetupProps> = ({ onSetupComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const embeddingRef = useRef<number[] | null>(null);

  const handleFaceDetected = (embedding: number[]) => {
    embeddingRef.current = embedding;
    setFaceDetected(true);
    console.log('Admin face detected, embedding length:', embedding.length);
  };

  const handleSetupAdmin = async () => {
    if (!embeddingRef.current) {
      setMessage('Por favor capture su rostro primero');
      return;
    }

    if (embeddingRef.current.length !== 128) {
      setMessage('Error en la captura facial. Por favor intente nuevamente');
      return;
    }

    setIsLoading(true);
    setMessage('Configurando administrador...');

    try {
      const response = await fetch('http://localhost:8000/setup-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embedding: embeddingRef.current
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en la configuración');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setMessage('¡Administrador configurado exitosamente!');
      
      setTimeout(() => {
        onSetupComplete();
      }, 2000);

    } catch (error: any) {
      console.error('Admin setup error:', error);
      setMessage(error.message || 'Error configurando administrador. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Configuración Inicial</h1>
        <p className="text-gray-600 mb-6">Registre su rostro como administrador del sistema</p>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Instrucciones:</strong><br/>
          1. Posicione su rostro frente a la cámara<br/>
          2. Asegure buena iluminación<br/>
          3. Espere a que se detecte su rostro<br/>
          4. Haga clic en "Configurar Administrador"
        </p>
      </div>

      <div className="relative rounded-lg overflow-hidden border-2 border-indigo-100 mb-4">
        <FaceCamera onFaceDetected={handleFaceDetected} captureMode={true} />
        {faceDetected && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
            Rostro detectado ✓
          </div>
        )}
      </div>

      <button
        onClick={handleSetupAdmin}
        disabled={isLoading || !faceDetected}
        className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Configurando...' : 'Configurar Administrador'}
      </button>

      {isLoading && (
        <div className="flex justify-center items-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          <span className="ml-3 text-gray-600">Procesando...</span>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-lg text-center mt-4 ${message.includes('exitosamente') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Este proceso solo se ejecuta una vez. Una vez configurado, podrá acceder como administrador y registrar otros usuarios.</p>
      </div>
    </div>
  );
};

export default AdminSetup;