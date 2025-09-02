import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh, FACEMESH_TESSELATION } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors } from '@mediapipe/drawing_utils';
import './FaceCamera.css';

interface FaceCameraProps {
  onFaceDetected: (embedding: number[]) => void;
  captureMode?: boolean;
}

const FaceCamera: React.FC<FaceCameraProps> = ({ onFaceDetected, captureMode = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasSentEmbedding, setHasSentEmbedding] = useState(false); // Nuevo estado
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeFaceMesh = async () => {
      try {
        if (!mounted) return;

        const faceMesh = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
          }
        });

        faceMeshRef.current = faceMesh;

        await faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        faceMesh.onResults((results) => {
          if (!mounted) return;
          
          const canvasCtx = canvasRef.current?.getContext('2d');
          if (canvasCtx && videoRef.current && canvasRef.current) {
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
              for (const landmarks of results.multiFaceLandmarks) {
                drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { 
                  color: '#4f46e570', 
                  lineWidth: 1 
                });

                if (captureMode && !hasSentEmbedding) { // Agrega la validación del nuevo estado
                  const embedding = extractEmbedding(landmarks);
                  if (embedding.length === 128 && isValidEmbedding(embedding)) {
                    onFaceDetected(embedding);
                    setHasSentEmbedding(true); // Actualiza el estado para no volver a enviar
                  }
                }
              }
            }
            canvasCtx.restore();
          }
        });

        if (videoRef.current && mounted) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && faceMeshRef.current && mounted) {
                await faceMeshRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });

          cameraRef.current = camera;
          await camera.start();
          
          if (mounted) {
            setIsReady(true);
          }
        }

      } catch (error) {
        if (mounted) {
          console.error('Error initializing face mesh:', error);
          setError('Error inicializando el sistema de detección facial. Intente recargar la página.');
        }
      }
    };

    const timer = setTimeout(() => {
      initializeFaceMesh();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.log('Error stopping camera:', e);
        }
      }
      
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch (e) {
          console.log('Error closing face mesh:', e);
        }
      }
    };
  }, [onFaceDetected, captureMode, hasSentEmbedding]);

  const isValidEmbedding = (embedding: number[]): boolean => {
    return embedding.every(val => !isNaN(val) && isFinite(val));
  };

  const extractEmbedding = (landmarks: any): number[] => {
    try {
      const keyLandmarks = Array.from({ length: 43 }, (_, i) => i);
      const embedding: number[] = [];

      keyLandmarks.forEach((index) => {
        if (landmarks[index]) {
          const { x = 0, y = 0, z = 0 } = landmarks[index];
          embedding.push(x, y, z);
        } else {
          embedding.push(0, 0, 0);
        }
      });

      while (embedding.length < 128) {
        embedding.push(0);
      }

      const finalEmbedding = embedding.slice(0, 128);
      const sum = finalEmbedding.reduce((acc, val) => acc + val * val, 0);
      const norm = Math.sqrt(sum);

      return (norm === 0 || !isFinite(norm))
        ? new Array(128).fill(0.1)
        : finalEmbedding.map(val => val / norm);

    } catch (error) {
      console.error('Error extracting embedding:', error);
      return new Array(128).fill(0.1);
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-box">
          <div className="error-icon">⚠️</div>
          <p className="error-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="face-camera">
      <video ref={videoRef} className="input-video" style={{ display: 'none' }} />
      <canvas ref={canvasRef} className="output-canvas" width={640} height={480} />

      {!isReady && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="spinner"></div>
            <p className="loading-text">Inicializando detección facial...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceCamera;
