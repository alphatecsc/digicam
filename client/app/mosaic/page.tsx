'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { FiPlus, FiEdit, FiTrash2, FiGrid } from 'react-icons/fi';

interface Mosaic {
  id: number;
  name: string;
  layout_config: any;
  is_default: boolean;
}

export default function MosaicPage() {
  const [mosaics, setMosaics] = useState<Mosaic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMosaics();
  }, []);

  const fetchMosaics = async () => {
    try {
      const response = await api.get('/mosaic');
      setMosaics(response.data);
    } catch (error) {
      console.error('Erro ao carregar mosaicos:', error);
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Mosaicos Personalizados</h1>
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <FiPlus className="mr-2" />
            Novo Mosaico
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mosaics.map((mosaic) => (
            <div key={mosaic.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <FiGrid className="w-6 h-6 text-primary-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-800">{mosaic.name}</h3>
                  </div>
                </div>
                {mosaic.is_default && (
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                    Padrão
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  <FiEdit className="inline mr-1" />
                  Editar
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                  <FiTrash2 className="inline mr-1" />
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

