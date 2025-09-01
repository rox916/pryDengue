import React, { useRef, useEffect, useState } from 'react';
import { FaceMesh, FACEMESH_TESSELATION } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors } from '@mediapipe/drawing_utils';

interface FaceCameraProps {
  onFaceDetected: (embedding: number[]) => void;
  captureMode?: boolean;
}

const FaceCamera: React.FC<FaceCameraProps> = ({ onFaceDetected, captureMode = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>('');
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

                if (captureMode) {
                  const embedding = extractEmbedding(landmarks);
                  if (embedding.length === 128 && isValidEmbedding(embedding)) {
                    onFaceDetected(embedding);
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
  }, [onFaceDetected, captureMode]);

  const isValidEmbedding = (embedding: number[]): boolean => {
    return embedding.every(val => !isNaN(val) && isFinite(val));
  };

  const extractEmbedding = (landmarks: any): number[] => {
    try {
      const keyLandmarks = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42
      ];

      const embedding: number[] = [];

      keyLandmarks.forEach((index) => {
        if (landmarks[index]) {
          const x = landmarks[index].x || 0;
          const y = landmarks[index].y || 0;
          const z = landmarks[index].z || 0;
          
          embedding.push(
            isNaN(x) ? 0 : x,
            isNaN(y) ? 0 : y,
            isNaN(z) ? 0 : z
          );
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
      
      if (norm === 0 || !isFinite(norm)) {
        return new Array(128).fill(0.1);
      }
      
      return finalEmbedding.map(val => val / norm);
    } catch (error) {
      console.error('Error extracting embedding:', error);
      return new Array(128).fill(0.1);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️</div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <video ref={videoRef} className="input_video" style={{ display: 'none' }} />
      <canvas ref={canvasRef} className="output_canvas w-full h-auto rounded" width={640} height={480} />

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Inicializando detección facial...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceCamera;