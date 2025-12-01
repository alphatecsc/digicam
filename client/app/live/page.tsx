'use client';

import { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiPlay, FiPause, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

interface Camera {
  id: number;
  name: string;
  status: string;
  location: string;
  ptz_enabled: boolean;
}

export default function LivePage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const [streaming, setStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [ptzCommand, setPtzCommand] = useState({ action: '', value: 0 });

  useEffect(() => {
    fetchCameras();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchCameras = async () => {
    try {
      const response = await api.get('/live/status');
      setCameras(response.data);
    } catch (error) {
      console.error('Erro ao carregar câmeras:', error);
    }
  };

  const startStream = (cameraId: number) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('ws://localhost:3001');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', cameraId }));
      setStreaming(true);
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'frame') {
        // Simular recebimento de frame
        console.log('Frame recebido:', data);
      }
    };
    ws.onerror = (error) => {
      console.error('Erro WebSocket:', error);
    };
    ws.onclose = () => {
      setStreaming(false);
    };
    wsRef.current = ws;
    setSelectedCamera(cameraId);
  };

  const stopStream = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStreaming(false);
    setSelectedCamera(null);
  };

  const sendPTZCommand = async (action: string, value: number) => {
    if (!selectedCamera) return;
    try {
      await api.post(`/live/ptz/${selectedCamera}`, { action, value });
    } catch (error) {
      console.error('Erro ao enviar comando PTZ:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Monitoramento Ao Vivo</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de Câmeras */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-4">Câmeras</h2>
              <div className="space-y-2">
                {cameras.map((camera) => (
                  <button
                    key={camera.id}
                    onClick={() => startStream(camera.id)}
                    className={`w-full text-left px-3 py-2 rounded ${
                      selectedCamera === camera.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{camera.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {camera.status}
                      </span>
                    </div>
                    <p className="text-xs mt-1">{camera.location}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Área de Vídeo */}
          <div className="lg:col-span-3">
            <div className="bg-black rounded-lg shadow aspect-video relative">
              {selectedCamera ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <p className="text-lg mb-2">
                        {cameras.find(c => c.id === selectedCamera)?.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {streaming ? 'Streaming ativo (simulado)' : 'Clique em uma câmera para iniciar'}
                      </p>
                    </div>
                  </div>
                  {streaming && (
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={stopStream}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <FiPause className="inline mr-2" />
                          Parar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Selecione uma câmera para visualizar
                </div>
              )}
            </div>

            {/* Controles PTZ */}
            {selectedCamera && cameras.find(c => c.id === selectedCamera)?.ptz_enabled && (
              <div className="mt-4 bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-4">Controles PTZ</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => sendPTZCommand('pan', -10)}
                    className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    ← Pan Esquerda
                  </button>
                  <button
                    onClick={() => sendPTZCommand('tilt', 10)}
                    className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    ↑ Tilt Cima
                  </button>
                  <button
                    onClick={() => sendPTZCommand('pan', 10)}
                    className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Pan Direita →
                  </button>
                  <button
                    onClick={() => sendPTZCommand('zoom', 1)}
                    className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    + Zoom In
                  </button>
                  <button
                    onClick={() => sendPTZCommand('tilt', -10)}
                    className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    ↓ Tilt Baixo
                  </button>
                  <button
                    onClick={() => sendPTZCommand('zoom', -1)}
                    className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    - Zoom Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

