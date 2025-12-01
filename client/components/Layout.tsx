'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  FiHome, FiVideo, FiCamera, FiSettings, FiBarChart2, 
  FiAlertCircle, FiUsers, FiMenu, FiX, FiLogOut,
  FiPlay, FiDatabase, FiGrid, FiMonitor, FiEye,
  FiShield, FiFileText, FiActivity, FiZap
} from 'react-icons/fi';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Monitoramento Ao Vivo', href: '/live', icon: FiVideo },
    { name: 'Câmeras', href: '/cameras', icon: FiCamera },
    { name: 'Gravações', href: '/recordings', icon: FiPlay },
    { name: 'Reprodução', href: '/playback', icon: FiPlay },
    { name: 'Mosaicos', href: '/mosaic', icon: FiGrid },
    { name: 'Insight', href: '/insight', icon: FiMonitor },
    { name: 'Detecção de Movimento', href: '/motion', icon: FiEye },
    { name: 'DVA - Tripwire', href: '/dva/tripwire', icon: FiBarChart2 },
    { name: 'DVA - Perimeter', href: '/dva/perimeter', icon: FiShield },
    { name: 'Contagem', href: '/dva/counting', icon: FiBarChart2 },
    { name: 'Reconhecimento Facial', href: '/faces', icon: FiUsers },
    { name: 'LPR - Placas', href: '/lpr', icon: FiFileText },
    { name: 'Evidence', href: '/evidence', icon: FiFileText },
    { name: 'Forensics', href: '/forensics', icon: FiActivity },
    { name: 'Eventos', href: '/events', icon: FiAlertCircle },
    { name: 'Automação', href: '/automation', icon: FiZap },
    { name: 'Usuários', href: '/users', icon: FiUsers },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Digicam VMS</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-5 px-2 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="mr-3 w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white mt-4"
          >
            <FiLogOut className="mr-3 w-5 h-5" />
            Sair
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm h-16 flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            {menuItems.find(item => item.href === pathname)?.name || 'Digicam VMS'}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

