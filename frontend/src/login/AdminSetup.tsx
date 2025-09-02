import React, { useState, useRef } from 'react';
import FaceCamera from './FaceCamera';
import './AdminSetup.css'; // Asegúrate de crear este archivo e importarlo

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
    <div className="admin-setup-container">
      <div className="admin-setup-header">
        <div className="icon-container">
          <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="admin-title">Configuración Inicial</h1>
        <p className="admin-subtitle">Registre su rostro como administrador del sistema</p>
      </div>

      <div className="instructions-box">
        <p className="instructions-text">
          <strong>Instrucciones:</strong><br/>
          1. Posicione su rostro frente a la cámara<br/>
          2. Asegure buena iluminación<br/>
          3. Espere a que se detecte su rostro<br/>
          4. Haga clic en "Configurar Administrador"
        </p>
      </div>

      <div className="camera-container">
        <FaceCamera onFaceDetected={handleFaceDetected} captureMode={true} />
        {faceDetected && (
          <div className="face-detected-badge">
            Rostro detectado ✓
          </div>
        )}
      </div>

      <button
        onClick={handleSetupAdmin}
        disabled={isLoading || !faceDetected}
        className="admin-button"
      >
        {isLoading ? 'Configurando...' : 'Configurar Administrador'}
      </button>

      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Procesando...</span>
        </div>
      )}

      {message && (
        <div className={`message-box ${message.includes('exitosamente') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="disclaimer-text">
        <p>Este proceso solo se ejecuta una vez. Una vez configurado, podrá acceder como administrador y registrar otros usuarios.</p>
      </div>
    </div>
  );
};

export default AdminSetup;