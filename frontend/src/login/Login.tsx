import React, { useState, useRef } from 'react';
import FaceCamera from './FaceCamera';
import { login } from './api';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const embeddingRef = useRef<number[] | null>(null);

  const handleFaceDetected = (embedding: number[]) => {
    embeddingRef.current = embedding;
    setFaceDetected(true);
    console.log('Face detected, embedding length:', embedding.length);
  };

  const handleLogin = async () => {
    if (!embeddingRef.current) {
      setMessage('Por favor capture su rostro primero');
      return;
    }

    if (embeddingRef.current.length !== 128) {
      setMessage('Error en la captura facial. Por favor intente nuevamente');
      return;
    }

    setIsLoading(true);
    setMessage('Verificando...');

    try {
      const response = await login(embeddingRef.current);
      setMessage(`¡Bienvenido ${response.nombre}!`);
      localStorage.setItem('token', response.token);
      
      const speech = new SpeechSynthesisUtterance(`Hola ${response.nombre}`);
      window.speechSynthesis.speak(speech);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.response?.data?.detail || 'Autenticación fallida. Por favor intente nuevamente.';
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Inicio de Sesión Facial</h1>
        <p className="text-gray-600 mb-6">Mire a la cámara y presione el botón para autenticarse</p>
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
        onClick={handleLogin}
        disabled={isLoading || !faceDetected}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
      </button>

      {isLoading && (
        <div className="flex justify-center items-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Procesando...</span>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-lg text-center mt-4 ${message.includes('Bienvenido') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Para mejores resultados, asegure buena iluminación y mire directamente a la cámara</p>
      </div>
    </div>
  );
};

export default Login;