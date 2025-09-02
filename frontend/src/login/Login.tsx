import React, { useState, useRef } from 'react';
import FaceCamera from './FaceCamera';
import { login } from './api';
import './login.css';

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
      const errorMessage =
        error?.response?.data?.detail ||
        'Autenticación fallida. Por favor intente nuevamente.';
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1 className="login-title">Inicio de Sesión Facial</h1>
        <p className="login-subtitle">
          Mire a la cámara y presione el botón para autenticarse
        </p>
      </div>

      <div className="camera-wrapper">
        <FaceCamera onFaceDetected={handleFaceDetected} captureMode={true} />
        {faceDetected && (
          <div className="face-detected-badge">
            Rostro detectado ✓
          </div>
        )}
      </div>

      <button
        onClick={handleLogin}
        disabled={isLoading || !faceDetected}
        className="login-button"
      >
        {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
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
            message.includes('Bienvenido') ? 'success' : 'error'
          }`}
        >
          {message}
        </div>
      )}

      <div className="login-footer">
        <p>
          Para mejores resultados, asegure buena iluminación y mire directamente
          a la cámara
        </p>
      </div>
    </div>
  );
};

export default Login;
