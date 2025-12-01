'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiPlus, FiEdit, FiTrash2, FiShield } from 'react-icons/fi';

interface Perimeter {
  id: number;
  camera_id: number;
  camera_name: string;
  name: string;
  zone_type: string;
  object_types: string[];
  sensitivity: number;
  is_active: boolean;
}

export default function PerimeterPage() {
  const [perimeters, setPerimeters] = useState<Perimeter[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    cameraId: '',
    name: '',
    zoneType: 'entry',
    objectTypes: [] as string[],
    sensitivity: 50,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [perimetersRes, camerasRes] = await Promise.all([
        api.get('/dva/perimeter'),
        api.get('/cameras'),
      ]);
      setPerimeters(perimetersRes.data);
      setCameras(camerasRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        cameraId: parseInt(formData.cameraId),
        zoneCoordinates: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
      };
      
      await api.post('/dva/perimeter', payload);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar perimeter:', error);
      alert('Erro ao salvar perimeter');
    }
  };

  const resetForm = () => {
    setFormData({
      cameraId: '',
      name: '',
      zoneType: 'entry',
      objectTypes: [],
      sensitivity: 50,
      isActive: true,
    });
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
          <h1 className="text-2xl font-bold text-gray-800">Perimeter (Cerca Virtual)</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Nova Regra
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {perimeters.map((perimeter) => (
            <div key={perimeter.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <FiShield className="w-6 h-6 text-primary-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-800">{perimeter.name}</h3>
                    <p className="text-sm text-gray-600">{perimeter.camera_name}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  perimeter.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {perimeter.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tipo de Zona:</span> {perimeter.zone_type}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Sensibilidade:</span> {perimeter.sensitivity}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Nova Regra Perimeter</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Câmera
                  </label>
                  <select
                    required
                    value={formData.cameraId}
                    onChange={(e) => setFormData({ ...formData, cameraId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione uma câmera</option>
                    {cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Zona
                  </label>
                  <select
                    value={formData.zoneType}
                    onChange={(e) => setFormData({ ...formData, zoneType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="entry">Entrada</option>
                    <option value="exit">Saída</option>
                    <option value="restricted">Restrita</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

