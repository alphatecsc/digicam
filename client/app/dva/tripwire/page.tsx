'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiPlus, FiEdit, FiTrash2, FiBarChart2 } from 'react-icons/fi';

interface Tripwire {
  id: number;
  camera_id: number;
  camera_name: string;
  name: string;
  line_coordinates: any;
  direction: string;
  object_types: string[];
  sensitivity: number;
  is_active: boolean;
}

export default function TripwirePage() {
  const [tripwires, setTripwires] = useState<Tripwire[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTripwire, setEditingTripwire] = useState<Tripwire | null>(null);
  const [formData, setFormData] = useState({
    cameraId: '',
    name: '',
    direction: 'both',
    objectTypes: [] as string[],
    sensitivity: 50,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tripwiresRes, camerasRes] = await Promise.all([
        api.get('/dva/tripwire'),
        api.get('/cameras'),
      ]);
      setTripwires(tripwiresRes.data);
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
        lineCoordinates: [{ x: 0, y: 0 }, { x: 100, y: 100 }], // Simulado
      };
      
      if (editingTripwire) {
        await api.put(`/dva/tripwire/${editingTripwire.id}`, payload);
      } else {
        await api.post('/dva/tripwire', payload);
      }
      setShowModal(false);
      setEditingTripwire(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar tripwire:', error);
      alert('Erro ao salvar tripwire');
    }
  };

  const resetForm = () => {
    setFormData({
      cameraId: '',
      name: '',
      direction: 'both',
      objectTypes: [],
      sensitivity: 50,
      isActive: true,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta regra?')) return;
    try {
      await api.delete(`/dva/tripwire/${id}`);
      fetchData();
    } catch (error) {
      console.error('Erro ao deletar tripwire:', error);
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
          <h1 className="text-2xl font-bold text-gray-800">Tripwire (Linha de Pedestre)</h1>
          <button
            onClick={() => {
              setEditingTripwire(null);
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
          {tripwires.map((tripwire) => (
            <div key={tripwire.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <FiBarChart2 className="w-6 h-6 text-primary-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-800">{tripwire.name}</h3>
                    <p className="text-sm text-gray-600">{tripwire.camera_name}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  tripwire.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {tripwire.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Direção:</span> {tripwire.direction}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Objetos:</span> {tripwire.object_types?.join(', ') || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Sensibilidade:</span> {tripwire.sensitivity}%
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingTripwire(tripwire);
                    setFormData({
                      cameraId: tripwire.camera_id.toString(),
                      name: tripwire.name,
                      direction: tripwire.direction,
                      objectTypes: tripwire.object_types || [],
                      sensitivity: tripwire.sensitivity,
                      isActive: tripwire.is_active,
                    });
                    setShowModal(true);
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <FiEdit className="inline mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(tripwire.id)}
                  className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <FiTrash2 className="inline mr-1" />
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingTripwire ? 'Editar Tripwire' : 'Nova Regra Tripwire'}
              </h2>
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
                    Direção
                  </label>
                  <select
                    value={formData.direction}
                    onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="both">Ambas</option>
                    <option value="AtoB">A para B</option>
                    <option value="BtoA">B para A</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sensibilidade
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.sensitivity}
                    onChange={(e) => setFormData({ ...formData, sensitivity: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">{formData.sensitivity}%</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Regra Ativa</label>
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

