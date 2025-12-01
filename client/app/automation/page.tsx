'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiPlus, FiEdit, FiTrash2, FiZap } from 'react-icons/fi';

interface AutomationRule {
  id: number;
  name: string;
  description: string;
  trigger_event_type: string;
  trigger_conditions: any;
  actions: any[];
  is_active: boolean;
  priority: number;
}

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerEventType: '',
    triggerConditions: {},
    actions: [],
    isActive: true,
    priority: 0,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await api.get('/automation/rules');
      setRules(response.data);
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await api.put(`/automation/rules/${editingRule.id}`, formData);
      } else {
        await api.post('/automation/rules', formData);
      }
      setShowModal(false);
      setEditingRule(null);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error('Erro ao salvar regra:', error);
      alert('Erro ao salvar regra');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      triggerEventType: '',
      triggerConditions: {},
      actions: [],
      isActive: true,
      priority: 0,
    });
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      triggerEventType: rule.trigger_event_type,
      triggerConditions: rule.trigger_conditions || {},
      actions: rule.actions || [],
      isActive: rule.is_active,
      priority: rule.priority,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta regra?')) return;
    try {
      await api.delete(`/automation/rules/${id}`);
      fetchRules();
    } catch (error) {
      console.error('Erro ao deletar regra:', error);
      alert('Erro ao deletar regra');
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
          <h1 className="text-2xl font-bold text-gray-800">Regras de Automação</h1>
          <button
            onClick={() => {
              setEditingRule(null);
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
          {rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <FiZap className="w-6 h-6 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-800">{rule.name}</h3>
                    {rule.description && (
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rule.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    Prioridade: {rule.priority}
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Trigger:</span> {rule.trigger_event_type}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ações:</span> {rule.actions?.length || 0} ação(ões)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(rule)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <FiEdit className="inline mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
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
                {editingRule ? 'Editar Regra' : 'Nova Regra'}
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
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Evento Trigger
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.triggerEventType}
                    onChange={(e) => setFormData({ ...formData, triggerEventType: e.target.value })}
                    placeholder="Ex: motion_detected, tripwire_crossed"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    Regra Ativa
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                    />
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

