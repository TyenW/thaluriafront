import React, { Suspense } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { CarregandoPagina } from '../components/common/CarregandoPagina';
import { Loader2 } from 'lucide-react';

export const PlayerLayout: React.FC = () => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fundo">
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
    <div className="min-h-screen flex flex-col bg-fundo">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Suspense fallback={<CarregandoPagina />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="py-6 border-t border-linha bg-abismo/80 text-center text-xs text-apagado font-sans-clean">
        <p className="font-cinzel tracking-wider text-amber-500/60 mb-1">
          THALÚRIA RPG • MOTOR JAVA CANÔNICO EM EXECUÇÃO
        </p>
        <p>Todos os direitos reservados à campanha e seus exploradores.</p>
      </footer>
    </div>
  );
};
