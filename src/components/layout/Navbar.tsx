import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Database,
  Store,
  Anvil,
  Waypoints,
  Dices,
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
  X,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { LogoThaluria } from './LogoThaluria';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  highlight?: boolean;
}

/**
 * completo: ícone + nome; compacto: só ícones (o item ativo mantém o nome);
 * gaveta: menu hambúrguer. O modo é escolhido medindo o espaço livre, não por breakpoint fixo.
 */
type ModoNav = 'completo' | 'compacto' | 'gaveta';

/** Abaixo disto a barra de ícones fica apertada demais para o toque: sempre gaveta. */
const LARGURA_MIN_BARRA = 768;

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
  { label: 'Mesas', path: '/mestre/mesas', icon: <Dices className="w-4 h-4" /> },
  { label: 'Sessões', path: '/mestre/sessoes', icon: <UserCheck className="w-4 h-4" />, highlight: true },
  { label: 'Fog-of-War', path: '/mestre/mundo', icon: <Globe className="w-4 h-4" /> },
  { label: 'Mapa', path: '/mapa', icon: <MapIcon className="w-4 h-4" /> },
  { label: 'Jogadores', path: '/mestre/jogadores', icon: <Users className="w-4 h-4" /> },
  { label: 'Comércio', path: '/mestre/comercio', icon: <Store className="w-4 h-4" /> },
  { label: 'Forja', path: '/mestre/forja', icon: <Anvil className="w-4 h-4" /> },
  { label: 'Disseminação', path: '/mestre/disseminacao', icon: <Waypoints className="w-4 h-4" /> },
  { label: 'Gerenciar', path: '/mestre/gerenciar', icon: <Database className="w-4 h-4" /> },
];

const ItemBarra: React.FC<{ item: NavItem; ativo: boolean; compacto: boolean; medida?: boolean }> = ({ item, ativo, compacto, medida }) => {
  const mostrarNome = !compacto || ativo;
  const classe = `relative flex items-center gap-1.5 h-9 rounded-md font-cinzel text-[11px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap border ${
    mostrarNome ? 'px-2.5' : 'px-2'
  } ${
    ativo
      ? 'text-pergaminho bg-ouro/15 border-ouro/50 shadow-[0_0_12px_rgba(212,175,55,0.2)] font-bold'
      : 'text-nevoa hover:text-pergaminho hover:bg-white/5 border-transparent'
  }`;
  const conteudo = (
    <>
      <span className={ativo ? 'text-amber-400' : 'text-nevoa'}>{item.icon}</span>
      {mostrarNome && <span>{item.label}</span>}
      {item.badge && mostrarNome && (
        <span className="text-[10px] px-1.5 py-0.5 bg-purple-950/90 text-purple-300 border border-purple-500/40 rounded leading-none">{item.badge}</span>
      )}
      {item.highlight &&
        (mostrarNome ? (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        ) : (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        ))}
    </>
  );
  // A cópia usada só para medir não pode virar um link duplicado.
  if (medida) return <span className={classe}>{conteudo}</span>;
  return (
    <Link
      to={item.path}
      className={classe}
      title={mostrarNome ? undefined : item.badge ? `${item.label} (${item.badge})` : item.label}
      aria-label={mostrarNome ? undefined : item.label}
      aria-current={ativo ? 'page' : undefined}
    >
      {conteudo}
    </Link>
  );
};

const MenuUsuario: React.FC<{ aoSair: () => void }> = ({ aoSair }) => {
  const { usuario, isMestre } = useAuth();
  const location = useLocation();
  const [aberto, setAberto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);

  useEffect(() => setAberto(false), [location.pathname]);

  useEffect(() => {
    if (!aberto) return;
    const clicarFora = (e: PointerEvent) => {
      if (!caixaRef.current?.contains(e.target as Node)) setAberto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('pointerdown', clicarFora);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', clicarFora);
      document.removeEventListener('keydown', tecla);
    };
  }, [aberto]);

  if (!usuario) return null;
  const inicial = usuario.username.trim().charAt(0).toUpperCase() || '?';

  return (
    <div ref={caixaRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 h-10 pl-1 pr-1.5 sm:pr-2.5 rounded-full border border-linha-forte/70 bg-painel-alto/60 hover:border-amber-500/50 transition-colors cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={`Conta de ${usuario.username}`}
      >
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-full font-cinzel text-sm font-black text-abismo ${
            isMestre ? 'bg-gradient-to-br from-red-400 to-red-700' : 'bg-gradient-to-br from-amber-300 to-amber-700'
          }`}
          aria-hidden="true"
        >
          {inicial}
        </span>
        <span className="hidden lg:block max-w-[8rem] truncate font-cinzel text-xs font-bold text-pergaminho">{usuario.username}</span>
        <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-nevoa transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-linha-forte bg-abismo shadow-2xl p-2 z-50"
        >
          <div className="px-3 py-2.5 border-b border-linha mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-cinzel text-sm font-bold text-pergaminho truncate">{usuario.username}</span>
              <Badge variant={isMestre ? 'danger' : 'gold'}>{usuario.papel}</Badge>
            </div>
            <div className="text-[11px] text-nevoa font-sans-clean mt-1">
              {isMestre ? (
                <span className="text-amber-400/90 font-cinzel">Mestre do Jogo</span>
              ) : (
                <span>
                  Pity: <strong className="text-amber-300">+{usuario.pity}</strong> • Limite: <strong className="text-amber-300">{usuario.limiteFichas} fichas</strong>
                </span>
              )}
            </div>
          </div>

          {/* Alternar Mestre -> Jogador para testes rápidos */}
          {isMestre && (
            <Link
              to="/"
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-cinzel text-amber-300/90 hover:bg-amber-500/10 transition-colors"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              Ver como jogador
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={aoSair}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-cinzel text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Encerrar sessão
          </button>
        </div>
      )}
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { usuario, logout, isMestre } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [modo, setModo] = useState<ModoNav>('gaveta');

  const espacoRef = useRef<HTMLDivElement>(null);
  const hamburguerRef = useRef<HTMLButtonElement>(null);
  const medidaCompletaRef = useRef<HTMLDivElement>(null);
  const medidaCompactaRef = useRef<HTMLDivElement>(null);

  const currentNav = isMestre ? masterNavItems : playerNavItems;

  const isActive = (path: string) => {
    // Raízes ('/' e '/mestre') só ficam ativas na própria página, não nas filhas.
    if (path === '/' || path === '/mestre') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  // Escolhe o modo pelo espaço que sobra entre a logo e o menu do usuário.
  useLayoutEffect(() => {
    const espaco = espacoRef.current;
    const completa = medidaCompletaRef.current;
    const compacta = medidaCompactaRef.current;
    if (!espaco || !completa || !compacta) return;

    const ajustar = () => {
      if (window.innerWidth < LARGURA_MIN_BARRA) return setModo('gaveta');
      // Com a gaveta ativa o botão hambúrguer ocupa espaço que a barra teria.
      const hamburguer = hamburguerRef.current;
      const livre = espaco.clientWidth + (hamburguer ? hamburguer.offsetWidth + 8 : 0);
      if (completa.offsetWidth <= livre) setModo('completo');
      else if (compacta.offsetWidth <= livre) setModo('compacto');
      else setModo('gaveta');
    };

    ajustar();
    const observador = new ResizeObserver(ajustar);
    [espaco, completa, compacta].forEach((el) => observador.observe(el));
    window.addEventListener('resize', ajustar);
    return () => {
      observador.disconnect();
      window.removeEventListener('resize', ajustar);
    };
  }, [isMestre, usuario?.username]);

  useEffect(() => {
    if (modo !== 'gaveta') setMenuAberto(false);
  }, [modo]);

  useEffect(() => {
    if (!menuAberto) return;
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setMenuAberto(false);
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [menuAberto]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const barra = (compacto: boolean, medida = false) =>
    currentNav.map((item) => <ItemBarra key={item.path} item={item} ativo={isActive(item.path)} compacto={compacto} medida={medida} />);

  return (
    <header className="sticky top-0 z-50 border-b border-linha shadow-2xl">
      {/* Fundo numa camada própria para o blur não embaçar a gaveta e o overlay. */}
      <div className="absolute inset-0 -z-10 bg-fundo/95 backdrop-blur-md" aria-hidden="true" />

      <div className="relative max-w-7xl 2xl:max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-3 lg:gap-4">
          <Link to="/" className="flex items-center shrink-0 select-none rounded-md group" title="Thalúria RPG">
            <LogoThaluria className="h-11 sm:h-12 group-hover:brightness-110 transition-[filter]" />
          </Link>

          {/* Espaço livre da barra; flex-1 faz a largura não depender do conteúdo. */}
          <div ref={espacoRef} className="flex-1 min-w-0 flex justify-center">
            {modo !== 'gaveta' && (
              <nav aria-label="Navegação principal" className="flex items-center gap-1">
                {barra(modo === 'compacto')}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {usuario ? (
              <MenuUsuario aoSair={handleLogout} />
            ) : (
              <Link to="/login" className="btn-gold text-xs px-3.5 py-1.5 rounded font-cinzel">
                Entrar
              </Link>
            )}

            {modo === 'gaveta' && (
              <button
                ref={hamburguerRef}
                type="button"
                onClick={() => setMenuAberto((v) => !v)}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-painel-alto border border-linha-forte text-texto hover:text-amber-400 hover:border-amber-500/50 transition-colors cursor-pointer"
                aria-label={menuAberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
                aria-expanded={menuAberto}
                aria-controls="gaveta-navegacao"
              >
                {menuAberto ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cópias invisíveis para medir quanto cada modo ocupa. */}
      <div aria-hidden="true" className="absolute left-0 top-0 h-0 overflow-hidden invisible pointer-events-none">
        <div ref={medidaCompletaRef} className="flex w-max items-center gap-1">
          {barra(false, true)}
        </div>
        <div ref={medidaCompactaRef} className="flex w-max items-center gap-1">
          {barra(true, true)}
        </div>
      </div>

      {/* Gaveta: sobrepõe a página e rola por dentro, então nunca passa da tela. */}
      {modo === 'gaveta' && menuAberto && (
        <>
          <div className="absolute inset-x-0 top-full h-[100dvh] bg-black/60 backdrop-blur-[2px]" onClick={() => setMenuAberto(false)} aria-hidden="true" />
          <div
            id="gaveta-navegacao"
            className="absolute inset-x-0 top-full border-t border-linha bg-abismo shadow-2xl max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain"
          >
            <nav aria-label="Navegação principal" className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {currentNav.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuAberto(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-lg font-cinzel text-xs font-semibold uppercase tracking-wider transition-all border ${
                      active
                        ? 'text-pergaminho bg-ouro/20 border-ouro/50 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                        : 'text-texto-2 hover:text-pergaminho hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className={active ? 'text-amber-400' : 'text-nevoa'}>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-500/40 rounded">{item.badge}</span>
                      )}
                      {item.highlight && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
