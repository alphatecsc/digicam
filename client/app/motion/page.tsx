'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { format } from 'date-fns';
import { FiEye, FiAlertCircle } from 'react-icons/fi';

interface MotionDetection {
  id: number;
  camera_id: number;
  camera_name: string;
  detected_at: string;
  confidence: number;
  is_alert: boolean;
}

export default function MotionPage() {
  const [detections, setDetections] = useState<MotionDetection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetections();
  }, []);

  const fetchDetections = async () => {
    try {
      const response = await api.get('/motion');
      setDetections(response.data);
    } catch (error) {
      console.error('Erro ao carregar detecções:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Detecção de Movimento</h1>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold">Detecções ({detections.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {detections.map((detection) => (
              <div key={detection.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  {detection.is_alert ? (
                    <FiAlertCircle className="w-6 h-6 text-red-600 mt-1" />
                  ) : (
                    <FiEye className="w-6 h-6 text-blue-600 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800">{detection.camera_name}</span>
                      {detection.is_alert && (
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
                          Alerta
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Confiança: {detection.confidence?.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(detection.detected_at), 'dd/MM/yyyy HH:mm:ss')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

