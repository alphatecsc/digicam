'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiPlus, FiEdit, FiTrash2, FiFileText, FiShield } from 'react-icons/fi';
import { format } from 'date-fns';

interface AuthorizedPlate {
  id: number;
  plate_number: string;
  country: string;
  owner_name: string;
  vehicle_type: string;
  is_active: boolean;
}

interface PlateDetection {
  id: number;
  camera_id: number;
  camera_name: string;
  plate_number: string;
  detected_at: string;
  is_authorized: boolean;
  is_blacklisted: boolean;
  confidence: number;
}

export default function LPRPage() {
  const [authorizedPlates, setAuthorizedPlates] = useState<AuthorizedPlate[]>([]);
  const [detections, setDetections] = useState<PlateDetection[]>([]);
  const [activeTab, setActiveTab] = useState<'authorized' | 'detections'>('authorized');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: '',
    country: 'BR',
    ownerName: '',
    vehicleType: '',
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'authorized') {
        const response = await api.get('/lpr/authorized');
        setAuthorizedPlates(response.data);
      } else {
        const response = await api.get('/lpr/detections');
        setDetections(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/lpr/authorized', formData);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Erro ao salvar placa:', error);
      alert(error.response?.data?.error || 'Erro ao salvar placa');
    }
  };

  const resetForm = () => {
    setFormData({
      plateNumber: '',
      country: 'BR',
      ownerName: '',
      vehicleType: '',
      isActive: true,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta placa?')) return;
    try {
      await api.delete(`/lpr/authorized/${id}`);
      fetchData();
    } catch (error) {
      console.error('Erro ao deletar placa:', error);
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
          <h1 className="text-2xl font-bold text-gray-800">LPR - Leitura de Placas</h1>
          {activeTab === 'authorized' && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiPlus className="mr-2" />
              Nova Placa Autorizada
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('authorized')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'authorized'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Placas Autorizadas
            </button>
            <button
              onClick={() => setActiveTab('detections')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'detections'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Detecções
            </button>
          </nav>
        </div>

        {/* Conteúdo */}
        {activeTab === 'authorized' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {authorizedPlates.map((plate) => (
              <div key={plate.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{plate.plate_number}</h3>
                    <p className="text-sm text-gray-600">{plate.country}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    plate.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {plate.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div className="space-y-2">
                  {plate.owner_name && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Proprietário:</span> {plate.owner_name}
                    </p>
                  )}
                  {plate.vehicle_type && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Tipo:</span> {plate.vehicle_type}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleDelete(plate.id)}
                    className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    <FiTrash2 className="inline mr-1" />
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold">Detecções de Placas ({detections.length})</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {detections.map((detection) => (
                <div key={detection.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {detection.is_authorized ? (
                        <FiShield className="w-6 h-6 text-green-600 mt-1" />
                      ) : (
                        <FiFileText className="w-6 h-6 text-red-600 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-800 text-lg">
                            {detection.plate_number}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            detection.is_authorized
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {detection.is_authorized ? 'Autorizada' : 'Não Autorizada'}
                          </span>
                          {detection.is_blacklisted && (
                            <span className="px-2 py-1 text-xs rounded bg-black text-white">
                              Blacklist
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Câmera: {detection.camera_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Confiança: {detection.confidence?.toFixed(2)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(detection.detected_at), 'dd/MM/yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Nova Placa Autorizada</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="ABC1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proprietário
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Veículo
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Carro, Moto, etc."
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Placa Ativa</label>
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

