'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiPlus, FiEdit, FiTrash2, FiUser, FiShield } from 'react-icons/fi';
import { format } from 'date-fns';

interface Person {
  id: number;
  name: string;
  photo_path: string;
  is_authorized: boolean;
  notes: string;
}

interface RecognizedFace {
  id: number;
  camera_id: number;
  camera_name: string;
  person_id: number;
  person_name: string;
  detected_at: string;
  is_authorized: boolean;
  confidence: number;
}

export default function FacesPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [recognitions, setRecognitions] = useState<RecognizedFace[]>([]);
  const [activeTab, setActiveTab] = useState<'persons' | 'recognitions'>('persons');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    photoPath: '',
    isAuthorized: true,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'persons') {
        const response = await api.get('/faces/persons');
        setPersons(response.data);
      } else {
        const response = await api.get('/faces/recognized');
        setRecognitions(response.data);
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
      await api.post('/faces/persons', formData);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar pessoa:', error);
      alert('Erro ao salvar pessoa');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      photoPath: '',
      isAuthorized: true,
      notes: '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta pessoa?')) return;
    try {
      await api.delete(`/faces/persons/${id}`);
      fetchData();
    } catch (error) {
      console.error('Erro ao deletar pessoa:', error);
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
          <h1 className="text-2xl font-bold text-gray-800">Reconhecimento Facial</h1>
          {activeTab === 'persons' && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <FiPlus className="mr-2" />
              Nova Pessoa
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('persons')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'persons'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pessoas Cadastradas
            </button>
            <button
              onClick={() => setActiveTab('recognitions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recognitions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-700'
              }`}
            >
              Reconhecimentos
            </button>
          </nav>
        </div>

        {/* Conteúdo */}
        {activeTab === 'persons' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {persons.map((person) => (
              <div key={person.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <FiUser className="w-8 h-8 text-primary-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-800">{person.name}</h3>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    person.is_authorized
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {person.is_authorized ? 'Autorizada' : 'Não Autorizada'}
                  </span>
                </div>
                {person.notes && (
                  <p className="text-sm text-gray-600 mb-4">{person.notes}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(person.id)}
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
              <h2 className="font-semibold">Reconhecimentos ({recognitions.length})</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recognitions.map((recognition) => (
                <div key={recognition.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {recognition.is_authorized ? (
                        <FiShield className="w-6 h-6 text-green-600 mt-1" />
                      ) : (
                        <FiUser className="w-6 h-6 text-red-600 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-800">
                            {recognition.person_name || 'Desconhecido'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            recognition.is_authorized
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {recognition.is_authorized ? 'Autorizado' : 'Não Autorizado'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Câmera: {recognition.camera_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Confiança: {recognition.confidence?.toFixed(2)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(recognition.detected_at), 'dd/MM/yyyy HH:mm:ss')}
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
              <h2 className="text-xl font-bold mb-4">Nova Pessoa</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
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
                    Caminho da Foto
                  </label>
                  <input
                    type="text"
                    value={formData.photoPath}
                    onChange={(e) => setFormData({ ...formData, photoPath: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="/path/to/photo.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAuthorized}
                    onChange={(e) => setFormData({ ...formData, isAuthorized: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Pessoa Autorizada</label>
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

