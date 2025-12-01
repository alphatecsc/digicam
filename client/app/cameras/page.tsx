'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiPlus, FiEdit, FiTrash2, FiVideo } from 'react-icons/fi';

interface Camera {
  id: number;
  name: string;
  ip_address: string;
  location: string;
  status: string;
  ptz_enabled: boolean;
  recording_enabled: boolean;
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    port: '',
    streamUrl: '',
    location: '',
    ptzEnabled: false,
    recordingEnabled: false,
  });

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const response = await api.get('/cameras');
      setCameras(response.data);
    } catch (error) {
      console.error('Erro ao carregar câmeras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCamera) {
        await api.put(`/cameras/${editingCamera.id}`, formData);
      } else {
        await api.post('/cameras', formData);
      }
      setShowModal(false);
      setEditingCamera(null);
      setFormData({
        name: '',
        ipAddress: '',
        port: '',
        streamUrl: '',
        location: '',
        ptzEnabled: false,
        recordingEnabled: false,
      });
      fetchCameras();
    } catch (error) {
      console.error('Erro ao salvar câmera:', error);
      alert('Erro ao salvar câmera');
    }
  };

  const handleEdit = (camera: Camera) => {
    setEditingCamera(camera);
    setFormData({
      name: camera.name,
      ipAddress: camera.ip_address || '',
      port: '',
      streamUrl: '',
      location: camera.location || '',
      ptzEnabled: camera.ptz_enabled,
      recordingEnabled: camera.recording_enabled,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta câmera?')) return;
    try {
      await api.delete(`/cameras/${id}`);
      fetchCameras();
    } catch (error) {
      console.error('Erro ao deletar câmera:', error);
      alert('Erro ao deletar câmera');
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
          <h1 className="text-2xl font-bold text-gray-800">Câmeras</h1>
          <button
            onClick={() => {
              setEditingCamera(null);
              setFormData({
                name: '',
                ipAddress: '',
                port: '',
                streamUrl: '',
                location: '',
                ptzEnabled: false,
                recordingEnabled: false,
              });
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Nova Câmera
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera) => (
            <div key={camera.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <FiVideo className="w-6 h-6 text-primary-600 mr-2" />
                  <div>
                    <h3 className="font-semibold text-gray-800">{camera.name}</h3>
                    <p className="text-sm text-gray-600">{camera.location}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  camera.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {camera.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">IP: {camera.ip_address || 'N/A'}</p>
                <div className="flex gap-2">
                  {camera.ptz_enabled && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">PTZ</span>
                  )}
                  {camera.recording_enabled && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Gravação</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(camera)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <FiEdit className="inline mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(camera.id)}
                  className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
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
                {editingCamera ? 'Editar Câmera' : 'Nova Câmera'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.ptzEnabled}
                      onChange={(e) => setFormData({ ...formData, ptzEnabled: e.target.checked })}
                      className="mr-2"
                    />
                    PTZ Habilitado
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recordingEnabled}
                      onChange={(e) => setFormData({ ...formData, recordingEnabled: e.target.checked })}
                      className="mr-2"
                    />
                    Gravação Habilitada
                  </label>
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

