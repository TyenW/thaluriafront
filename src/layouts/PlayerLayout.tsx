import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Loader2 } from 'lucide-react';

export const PlayerLayout: React.FC = () => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090a0f]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400 mx-auto mb-3" />
          <p className="font-cinzel text-sm text-amber-200/80 tracking-widest uppercase">
            Consultando os Registros de Thalúria...
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f]">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="py-6 border-t border-[#1f2430] bg-[#07080b]/80 text-center text-xs text-[#6b7280] font-sans-clean">
        <p className="font-cinzel tracking-wider text-amber-500/60 mb-1">
          THALÚRIA RPG • MOTOR JAVA CANÔNICO EM EXECUÇÃO
        </p>
        <p>Todos os direitos reservados à campanha e seus exploradores.</p>
      </footer>
    </div>
  );
};
