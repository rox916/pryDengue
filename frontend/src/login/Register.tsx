import React, { useState, useRef } from 'react';
import FaceCamera from './FaceCamera';
import { register } from './api';
import './Register.css';

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
      const errorMessage =
        error?.response?.data?.detail ||
        'Registro fallido. Por favor intente nuevamente.';
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-header">
        <h1 className="register-title">Registrar Nuevo Usuario</h1>
        <p className="register-subtitle">
          Agregue su biometría facial al sistema
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="nombre" className="form-label">
          Nombre Completo
        </label>
        <input
          type="text"
          id="nombre"
          placeholder="Ingrese su nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="camera-wrapper">
        <FaceCamera onFaceDetected={handleFaceDetected} captureMode={true} />
        {faceDetected && (
          <div className="face-detected-badge">Rostro detectado ✓</div>
        )}
      </div>

      <button
        onClick={handleRegister}
        disabled={isLoading || !faceDetected}
        className="register-button"
      >
        {isLoading ? 'Registrando...' : 'Registrar Usuario'}
      </button>

      {isLoading && (
        <div className="loading-container">
          <div className="spinner-small"></div>
          <span className="loading-text">Procesando...</span>
        </div>
      )}

      {message && (
        <div
          className={`message-box ${
            message.includes('exitosamente') ? 'success' : 'error'
          }`}
        >
          {message}
        </div>
      )}

      <div className="register-footer">
        <p>
          Posicione su rostro en el marco y asegure buenas condiciones de
          iluminación
        </p>
      </div>
    </div>
  );
};

export default Register;