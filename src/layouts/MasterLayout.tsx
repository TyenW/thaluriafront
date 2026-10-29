import React, { Suspense } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { CarregandoPagina } from '../components/common/CarregandoPagina';
import { MesaProvider } from '../contexts/MesaContext';
import { Loader2, Crown } from 'lucide-react';

export const MasterLayout: React.FC = () => {
  const { usuario, loading, isMestre } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fundo">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400 mx-auto mb-3" />
          <p className="font-cinzel text-sm text-amber-200/80 tracking-widest uppercase">
            Autenticando Permissões do Mestre...
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!isMestre) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-fundo">
      <div className="bg-gradient-to-r from-red-950/60 via-amber-950/40 to-red-950/60 border-b border-amber-600/30 px-4 py-1 text-center text-xs font-cinzel text-amber-300/90 flex items-center justify-center gap-2">
        <Crown className="w-3.5 h-3.5 text-amber-400" />
        <span className="sm:hidden">MODO MESTRE</span>
        <span className="hidden sm:inline">MODO MESTRE — ACESSO TOTAL AO FOG-OF-WAR E ÀS SESSÕES AO VIVO</span>
      </div>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Mesa escolhida e relógios: usados pelo comércio, disseminação e controle do tempo */}
        <MesaProvider>
          <Suspense fallback={<CarregandoPagina />}>
            <Outlet />
          </Suspense>
        </MesaProvider>
      </main>
      <footer className="py-6 border-t border-linha bg-abismo/80 text-center text-xs text-apagado font-sans-clean">
        <p className="font-cinzel tracking-wider text-amber-500/60 mb-1">
          PAINEL ADMINISTRATIVO DO MESTRE • THALÚRIA RPG
        </p>
        <p>Operações refletidas diretamente em thaluria.db via Virtual Threads.</p>
      </footer>
    </div>
  );
};
