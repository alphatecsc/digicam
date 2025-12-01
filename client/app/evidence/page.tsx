'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiPlus, FiEdit, FiTrash2, FiFileText, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';

interface Evidence {
  id: number;
  title: string;
  description: string;
  incident_type: string;
  incident_date: string;
  location: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function EvidencePage() {
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<Evidence | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incidentType: '',
    incidentDate: '',
    location: '',
    status: 'open',
    priority: 'medium',
  });

  useEffect(() => {
    fetchEvidences();
  }, []);

  const fetchEvidences = async () => {
    try {
      const response = await api.get('/evidence');
      setEvidences(response.data);
    } catch (error) {
      console.error('Erro ao carregar evidências:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvidence) {
        await api.put(`/evidence/${editingEvidence.id}`, formData);
      } else {
        await api.post('/evidence', formData);
      }
      setShowModal(false);
      setEditingEvidence(null);
      resetForm();
      fetchEvidences();
    } catch (error) {
      console.error('Erro ao salvar evidência:', error);
      alert('Erro ao salvar evidência');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      incidentType: '',
      incidentDate: '',
      location: '',
      status: 'open',
      priority: 'medium',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta evidência?')) return;
    try {
      await api.delete(`/evidence/${id}`);
      fetchEvidences();
    } catch (error) {
      console.error('Erro ao deletar evidência:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-800">Evidence (Ocorrências)</h1>
          <button
            onClick={() => {
              setEditingEvidence(null);
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FiPlus className="mr-2" />
            Nova Evidência
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {evidences.map((evidence) => (
            <div key={evidence.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start">
                  <FiFileText className="w-6 h-6 text-primary-600 mr-3 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">{evidence.title}</h3>
                    {evidence.description && (
                      <p className="text-sm text-gray-600 mt-1">{evidence.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(evidence.priority)}`}>
                    {evidence.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${getStatusColor(evidence.status)}`}>
                    {evidence.status}
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {evidence.incident_type && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Tipo:</span> {evidence.incident_type}
                  </p>
                )}
                {evidence.location && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Local:</span> {evidence.location}
                  </p>
                )}
                {evidence.incident_date && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Data:</span>{' '}
                    {format(new Date(evidence.incident_date), 'dd/MM/yyyy HH:mm')}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Criado em: {format(new Date(evidence.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingEvidence(evidence);
                    setFormData({
                      title: evidence.title,
                      description: evidence.description || '',
                      incidentType: evidence.incident_type || '',
                      incidentDate: evidence.incident_date ? evidence.incident_date.split('T')[0] : '',
                      location: evidence.location || '',
                      status: evidence.status,
                      priority: evidence.priority,
                    });
                    setShowModal(true);
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <FiEdit className="inline mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(evidence.id)}
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
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingEvidence ? 'Editar Evidência' : 'Nova Evidência'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Incidente
                    </label>
                    <input
                      type="text"
                      value={formData.incidentType}
                      onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data do Incidente
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.incidentDate}
                      onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="open">Aberto</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="closed">Fechado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
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

