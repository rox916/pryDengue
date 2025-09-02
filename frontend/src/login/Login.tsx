import React, { useState, useRef } from 'react';
import FaceCamera from './FaceCamera';
import { login } from '../api';
import './login.css';

interface LoginProps {
  onFaceValidated: () => void;
}

const Login: React.FC<LoginProps> = ({ onFaceValidated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const embeddingRef = useRef<number[] | null>(null);

  const handleFaceDetected = (embedding: number[]) => {
    embeddingRef.current = embedding;
    setFaceDetected(true);
    console.log('Face detected, embedding length:', embedding.length);
    // Llama a la función de validación aquí
    handleLogin(embedding);
  };

  const handleLogin = async (embedding: number[]) => {
    if (embedding.length !== 128) {
      setMessage('Error en la captura facial. Por favor intente nuevamente');
      return;
    }

    setIsLoading(true);
    setMessage('Verificando...');

    try {
      const response = await login(embedding);
      setMessage(`¡Bienvenido ${response.nombre}!`);
      localStorage.setItem('token', response.token);

      const speech = new SpeechSynthesisUtterance(`Hola ${response.nombre}`);
      window.speechSynthesis.speak(speech);

      // Llama a la función del componente padre para cambiar la vista
      onFaceValidated();
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
          Mire a la cámara para autenticarse
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
