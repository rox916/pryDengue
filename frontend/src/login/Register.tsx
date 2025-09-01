import React, { useState, useRef } from 'react';
import FaceCamera from './FaceCamera';
import { register } from './api';

const Register: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const embeddingRef = useRef<number[] | null>(null);

  const handleFaceDetected = (embedding: number[]) => {
    embeddingRef.current = embedding;
    setFaceDetected(true);
    console.log('Face detected, embedding length:', embedding.length);
  };

  const handleRegister = async () => {
    if (!nombre.trim()) {
      setMessage('Por favor ingrese un nombre');
      return;
    }

    if (!embeddingRef.current) {
      setMessage('Por favor capture su rostro primero');
      return;
    }

    if (embeddingRef.current.length !== 128) {
      setMessage('Error en la captura facial. Por favor intente nuevamente');
      return;
    }

    setIsLoading(true);
    setMessage('Registrando...');

    try {
      await register(nombre, embeddingRef.current);
      setMessage('¡Usuario registrado exitosamente!');
      setNombre('');
      embeddingRef.current = null;
      setFaceDetected(false);
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error?.response?.data?.detail || 'Registro fallido. Por favor intente nuevamente.';
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Registrar Nuevo Usuario</h1>
        <p className="text-gray-600 mb-6">Agregue su biometría facial al sistema</p>
      </div>

      <div className="mb-4">
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre Completo
        </label>
        <input
          type="text"
          id="nombre"
          placeholder="Ingrese su nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
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
        onClick={handleRegister}
        disabled={isLoading || !faceDetected}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Registrando...' : 'Registrar Usuario'}
      </button>

      {isLoading && (
        <div className="flex justify-center items-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Procesando...</span>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-lg text-center mt-4 ${message.includes('exitosamente') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Posicione su rostro en el marco y asegure buenas condiciones de iluminación</p>
      </div>
    </div>
  );
};

export default Register;