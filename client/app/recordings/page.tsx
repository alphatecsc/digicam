'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { format } from 'date-fns';
import { FiPlay, FiCalendar, FiVideo } from 'react-icons/fi';

interface Recording {
  id: number;
  camera_id: number;
  camera_name: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  recording_type: string;
  file_path: string;
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cameraId: '',
    startDate: '',
    endDate: '',
    recordingType: '',
  });

  useEffect(() => {
    fetchRecordings();
  }, [filters]);

  const fetchRecordings = async () => {
    try {
      const params: any = {};
      if (filters.cameraId) params.cameraId = filters.cameraId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.recordingType) params.recordingType = filters.recordingType;

      const response = await api.get('/recording', { params });
      setRecordings(response.data);
    } catch (error) {
      console.error('Erro ao carregar gravações:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        <h1 className="text-2xl font-bold text-gray-800">Gravações</h1>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filters.recordingType}
                onChange={(e) => setFilters({ ...filters, recordingType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todos</option>
                <option value="continuous">Contínua</option>
                <option value="scheduled">Agendada</option>
                <option value="event">Evento</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ cameraId: '', startDate: '', endDate: '', recordingType: '' })}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Gravações */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold">Gravações ({recordings.length})</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recordings.map((recording) => (
              <div key={recording.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <FiVideo className="w-6 h-6 text-primary-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-800">{recording.camera_name}</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {recording.recording_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(recording.start_time), 'dd/MM/yyyy HH:mm:ss')} - 
                        {recording.end_time && format(new Date(recording.end_time), ' dd/MM/yyyy HH:mm:ss')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Duração: {formatDuration(recording.duration_seconds || 0)}
                      </p>
                    </div>
                  </div>
                  <button className="ml-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
                    <FiPlay className="inline mr-2" />
                    Reproduzir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

