'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiCamera, FiAlertCircle, FiActivity, FiVideo } from 'react-icons/fi';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    cameras: 0,
    events: { total: 0, unacknowledged: 0 },
    recordings: 0,
    activeStreams: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [camerasRes, eventsRes, recordingsRes] = await Promise.all([
          api.get('/cameras'),
          api.get('/events/stats/summary'),
          api.get('/recording'),
        ]);

        setStats({
          cameras: camerasRes.data.length,
          events: {
            total: eventsRes.data.total || 0,
            unacknowledged: eventsRes.data.unacknowledged || 0,
          },
          recordings: recordingsRes.data.length || 0,
          activeStreams: camerasRes.data.filter((c: any) => c.status === 'online').length,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Câmeras</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cameras}</p>
              </div>
              <FiCamera className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.events.total}</p>
                <p className="text-xs text-red-600">{stats.events.unacknowledged} não reconhecidos</p>
              </div>
              <FiAlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gravações</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recordings}</p>
              </div>
              <FiVideo className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Streams Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeStreams}</p>
              </div>
              <FiActivity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Eventos Recentes</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600">Carregando eventos...</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

