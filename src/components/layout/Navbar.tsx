import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Database,
  Shield, 
  Map as MapIcon, 
  BookOpen, 
  Package, 
  Box, 
  Crown, 
  LogOut, 
  Users, 
  Globe, 
  ScrollText,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  highlight?: boolean;
}

export const Navbar: React.FC = () => {
  const { usuario, logout, isMestre } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    // Raízes ('/' e '/mestre') só ficam ativas na própria página, não nas filhas.
    if (path === '/' || path === '/mestre') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const playerNavItems: NavItem[] = [
    { label: 'Personagens', path: '/', icon: <Shield className="w-4 h-4" /> },
    { label: 'Mapa', path: '/mapa', icon: <MapIcon className="w-4 h-4" /> },
    { label: 'Bestiário', path: '/bestiario', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Inventário & Moedas', path: '/inventario', icon: <Package className="w-4 h-4" /> },
    { label: 'Wiki & Regras', path: '/wiki', icon: <ScrollText className="w-4 h-4" /> },
    { label: 'VTT 3D', path: '/vtt3d', icon: <Box className="w-4 h-4" />, badge: 'Em Breve' },
  ];

  const masterNavItems: NavItem[] = [
    { label: 'Painel', path: '/mestre', icon: <Crown className="w-4 h-4" /> },
    { label: 'Sessões', path: '/mestre/sessoes', icon: <UserCheck className="w-4 h-4" />, highlight: true },
    { label: 'Fog-of-War', path: '/mestre/mundo', icon: <Globe className="w-4 h-4" /> },
    { label: 'Mapa', path: '/mapa', icon: <MapIcon className="w-4 h-4" /> },
    { label: 'Jogadores', path: '/mestre/jogadores', icon: <Users className="w-4 h-4" /> },
    { label: 'Gerenciar', path: '/mestre/gerenciar', icon: <Database className="w-4 h-4" /> },
  ];

  const currentNav = isMestre ? masterNavItems : playerNavItems;

  return (
    <header className="sticky top-0 z-50 bg-fundo/95 backdrop-blur-md border-b border-linha shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand - Apenas o nome Thaluria */}
          <Link 
            to="/" 
            className="flex items-center group shrink-0 select-none py-1"
            title="Thalúria RPG"
          >
            <span className="font-cinzel text-xl sm:text-2xl font-black tracking-[0.22em] uppercase gold-gradient-text drop-shadow-[0_2px_12px_rgba(212,175,55,0.35)] group-hover:brightness-125 transition-all">
              Thaluria
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 flex-1 min-w-0 justify-center mx-2">
            {currentNav.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-cinzel text-[11px] 2xl:text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                    active
                      ? 'text-pergaminho bg-ouro/15 border border-ouro/50 shadow-[0_0_12px_rgba(212,175,55,0.2)] font-bold'
                      : 'text-nevoa hover:text-pergaminho hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className={active ? 'text-amber-400' : 'text-nevoa'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-950/90 text-purple-300 border border-purple-500/40 rounded leading-none">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  )}
                </Link>
              );
            })}

            {/* Alternar Mestre <-> Jogador para testes rápidos */}
            {isMestre && (
              <Link
                to="/"
                className="flex items-center gap-1.5 ml-1 px-2 py-1.5 rounded text-[11px] font-cinzel text-amber-400/80 border border-amber-600/30 hover:border-amber-400/60 hover:bg-amber-400/10 transition-colors whitespace-nowrap"
                title="Visualizar plataforma na perspectiva de jogador"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Visão Jogador</span>
              </Link>
            )}
          </nav>

          {/* User Profile, Actions & Mobile Hamburger Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {usuario ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="font-cinzel text-xs font-bold text-pergaminho max-w-[120px] truncate">
                      {usuario.username}
                    </span>
                    <Badge variant={isMestre ? 'danger' : 'gold'}>
                      {usuario.papel}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-nevoa font-sans-clean mt-0.5">
                    {isMestre ? (
                      <span className="text-amber-400/80 font-cinzel">Mestre do Jogo</span>
                    ) : (
                      <span>Pity: <strong className="text-amber-300">+{usuario.pity}</strong> • Limite: <strong className="text-amber-300">{usuario.limiteFichas}</strong></span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center justify-center p-2 text-nevoa hover:text-red-400 hover:bg-red-950/30 rounded-lg border border-linha-forte/60 hover:border-red-900/50 transition-colors cursor-pointer"
                  title="Encerrar Sessão"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-gold text-xs px-3.5 py-1.5 rounded font-cinzel"
              >
                Entrar
              </Link>
            )}

            {/* Botão Hambúrguer Mobile / Tablet */}
            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              className="flex xl:hidden items-center justify-center p-2 rounded-lg bg-painel-alto border border-linha-forte text-texto hover:text-amber-400 hover:border-amber-500/50 transition-colors cursor-pointer"
              aria-label={menuAberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
              aria-expanded={menuAberto}
            >
              {menuAberto ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Gaveta / Dropdown Mobile & Tablet */}
      {menuAberto && (
        <div className="xl:hidden border-t border-linha bg-abismo/98 px-4 pt-4 pb-6 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
          {usuario && (
            <div className="mb-4 pb-3 border-b border-linha flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-cinzel text-sm font-bold text-pergaminho">
                    {usuario.username}
                  </span>
                  <Badge variant={isMestre ? 'danger' : 'gold'}>
                    {usuario.papel}
                  </Badge>
                </div>
                <div className="text-[11px] text-nevoa font-sans-clean mt-0.5">
                  {isMestre ? (
                    <span className="text-amber-400/90 font-cinzel">Autoridade Máxima</span>
                  ) : (
                    <span>Pity: <strong className="text-amber-300">+{usuario.pity}</strong> • Limite: <strong className="text-amber-300">{usuario.limiteFichas} fichas</strong></span>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 border border-red-700/50 hover:bg-red-900/60 rounded text-xs text-red-200 font-cinzel transition-all cursor-pointer"
                title="Encerrar Sessão"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          )}

          <nav className="space-y-1.5">
            {currentNav.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuAberto(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg font-cinzel text-xs font-semibold uppercase tracking-wider transition-all ${
                    active
                      ? 'text-pergaminho bg-ouro/20 border border-ouro/50 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                      : 'text-texto-2 hover:text-pergaminho hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-amber-400' : 'text-nevoa'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-500/40 rounded">
                        {item.badge}
                      </span>
                    )}
                    {item.highlight && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                </Link>
              );
            })}

            {isMestre && (
              <Link
                to="/"
                onClick={() => setMenuAberto(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-cinzel text-amber-300/90 border border-amber-600/40 hover:bg-amber-500/10 transition-colors mt-2"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Alternar para Visão de Jogador</span>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

