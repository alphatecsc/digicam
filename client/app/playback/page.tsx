'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { format } from 'date-fns';
import { FiSearch, FiBookmark, FiPlay } from 'react-icons/fi';

export default function PlaybackPage() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'bookmarks'>('search');
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    cameraId: '',
    startDate: '',
    endDate: '',
    keywords: '',
  });

  useEffect(() => {
    if (activeTab === 'search') {
      fetchRecordings();
    } else {
      fetchBookmarks();
    }
  }, [activeTab, searchParams]);

  const fetchRecordings = async () => {
    try {
      const params: any = {};
      if (searchParams.cameraId) params.cameraId = searchParams.cameraId;
      if (searchParams.startDate) params.startDate = searchParams.startDate;
      if (searchParams.endDate) params.endDate = searchParams.endDate;
      if (searchParams.keywords) params.keywords = searchParams.keywords;

      const response = await api.get('/playback/search', { params });
      setRecordings(response.data);
    } catch (error) {
      console.error('Erro ao buscar gravações:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await api.get('/playback/bookmarks');
      setBookmarks(response.data);
    } catch (error) {
      console.error('Erro ao carregar marcadores:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold text-gray-800">Reprodução e Pesquisa</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiSearch className="inline mr-2" />
              Buscar Gravações
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookmarks'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiBookmark className="inline mr-2" />
              Marcadores
            </button>
          </nav>
        </div>

        {activeTab === 'search' ? (
          <>
            {/* Filtros de Busca */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={searchParams.startDate}
                    onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={searchParams.endDate}
                    onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Palavras-chave
                  </label>
                  <input
                    type="text"
                    value={searchParams.keywords}
                    onChange={(e) => setSearchParams({ ...searchParams, keywords: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Buscar..."
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setSearchParams({ cameraId: '', startDate: '', endDate: '', keywords: '' })}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </div>

            {/* Resultados */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold">Resultados ({recordings.length})</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recordings.map((recording) => (
                  <div key={recording.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-800">{recording.camera_name}</span>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {recording.recording_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {format(new Date(recording.start_time), 'dd/MM/yyyy HH:mm:ss')}
                        </p>
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
          </>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold">Marcadores ({bookmarks.length})</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-800">{bookmark.camera_name}</span>
                      </div>
                      {bookmark.description && (
                        <p className="text-sm text-gray-600 mt-1">{bookmark.description}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(bookmark.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                      </p>
                    </div>
                    <button className="ml-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
                      <FiPlay className="inline mr-2" />
                      Ir para
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

