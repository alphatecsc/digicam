'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiCheck, FiAlertCircle, FiInfo, FiXCircle } from 'react-icons/fi';
import { format } from 'date-fns';

interface Event {
  id: number;
  event_type: string;
  source_module: string;
  camera_id: number;
  camera_name: string;
  severity: string;
  message: string;
  is_acknowledged: boolean;
  created_at: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: '',
    isAcknowledged: '',
    sourceModule: '',
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      const params: any = {};
      if (filters.severity) params.severity = filters.severity;
      if (filters.isAcknowledged !== '') params.isAcknowledged = filters.isAcknowledged;
      if (filters.sourceModule) params.sourceModule = filters.sourceModule;

      const response = await api.get('/events', { params });
      setEvents(response.data);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (eventId: number) => {
    try {
      await api.post(`/events/${eventId}/acknowledge`);
      fetchEvents();
    } catch (error) {
      console.error('Erro ao reconhecer evento:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <FiXCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
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
        <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severidade
              </label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todas</option>
                <option value="critical">Crítico</option>
                <option value="warning">Aviso</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.isAcknowledged}
                onChange={(e) => setFilters({ ...filters, isAcknowledged: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todos</option>
                <option value="false">Não Reconhecidos</option>
                <option value="true">Reconhecidos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Módulo
              </label>
              <select
                value={filters.sourceModule}
                onChange={(e) => setFilters({ ...filters, sourceModule: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todos</option>
                <option value="motion">Movimento</option>
                <option value="dva">DVA</option>
                <option value="lpr">LPR</option>
                <option value="face">Facial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Eventos */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold">Eventos ({events.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {events.map((event) => (
              <div
                key={event.id}
                className={`p-4 border-l-4 ${getSeverityColor(event.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getSeverityIcon(event.severity)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-800">{event.event_type}</span>
                        <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                          {event.source_module}
                        </span>
                        {event.camera_name && (
                          <span className="text-xs text-gray-600">
                            Câmera: {event.camera_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                  {!event.is_acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(event.id)}
                      className="ml-4 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      <FiCheck className="inline mr-1" />
                      Reconhecer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

