'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiPlus, FiBarChart2 } from 'react-icons/fi';

interface CountingZone {
  id: number;
  camera_id: number;
  camera_name: string;
  object_type: string;
  count_in: number;
  count_out: number;
  count_total: number;
}

export default function CountingPage() {
  const [zones, setZones] = useState<CountingZone[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [zonesRes, camerasRes] = await Promise.all([
        api.get('/dva/counting'),
        api.get('/cameras'),
      ]);
      setZones(zonesRes.data);
      setCameras(camerasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Contagem de Objetos</h1>
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <FiPlus className="mr-2" />
            Nova Zona de Contagem
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <FiBarChart2 className="w-6 h-6 text-primary-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-800">{zone.camera_name}</h3>
                  <p className="text-sm text-gray-600">Tipo: {zone.object_type}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Entrada:</span>
                  <span className="text-lg font-bold text-green-600">{zone.count_in}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Saída:</span>
                  <span className="text-lg font-bold text-red-600">{zone.count_out}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-800">Total:</span>
                  <span className="text-xl font-bold text-primary-600">{zone.count_total}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

