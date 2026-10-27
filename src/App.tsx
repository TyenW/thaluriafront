import { Suspense, lazy, type ComponentType } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PlayerLayout } from './layouts/PlayerLayout';
import { MasterLayout } from './layouts/MasterLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { CarregandoPagina } from './components/common/CarregandoPagina';

/** Carrega a página só quando a rota é aberta (cada uma vira um arquivo separado no build). */
const sobDemanda = <M extends Record<string, unknown>>(carregar: () => Promise<M>, nome: keyof M) =>
  lazy(async () => ({ default: (await carregar())[nome] as ComponentType }));

// Páginas do Jogador
const PersonagensPage = sobDemanda(() => import('./pages/player/PersonagensPage'), 'PersonagensPage');
const CriarPersonagemPage = sobDemanda(() => import('./pages/player/CriarPersonagemPage'), 'CriarPersonagemPage');
const FichaDetalhesPage = sobDemanda(() => import('./pages/player/FichaDetalhesPage'), 'FichaDetalhesPage');
const MapaPage = sobDemanda(() => import('./pages/player/MapaPage'), 'MapaPage');
const BestiarioPage = sobDemanda(() => import('./pages/player/BestiarioPage'), 'BestiarioPage');
const InventarioPage = sobDemanda(() => import('./pages/player/InventarioPage'), 'InventarioPage');
const WikiPage = sobDemanda(() => import('./pages/player/WikiPage'), 'WikiPage');
const VTT3DPage = sobDemanda(() => import('./pages/player/VTT3DPage'), 'VTT3DPage');

// Páginas do Mestre
const PainelMestrePage = sobDemanda(() => import('./pages/master/PainelMestrePage'), 'PainelMestrePage');
const SessoesAoVivoPage = sobDemanda(() => import('./pages/master/SessoesAoVivoPage'), 'SessoesAoVivoPage');
const ControleMundoPage = sobDemanda(() => import('./pages/master/ControleMundoPage'), 'ControleMundoPage');
const GerenciarJogadoresPage = sobDemanda(() => import('./pages/master/GerenciarJogadoresPage'), 'GerenciarJogadoresPage');
const GerenciarMundoPage = sobDemanda(() => import('./pages/master/GerenciarMundoPage'), 'GerenciarMundoPage');
const ComercioPage = sobDemanda(() => import('./pages/master/ComercioPage'), 'ComercioPage');
const ForjaPage = sobDemanda(() => import('./pages/master/ForjaPage'), 'ForjaPage');
const DisseminacaoPage = sobDemanda(() => import('./pages/master/DisseminacaoPage'), 'DisseminacaoPage');

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<CarregandoPagina />}>
          <Routes>
            {/* Rota Pública de Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rotas Autenticadas do Jogador */}
            <Route element={<PlayerLayout />}>
              <Route path="/" element={<PersonagensPage />} />
              <Route path="/criar" element={<CriarPersonagemPage />} />
              <Route path="/fichas/:id" element={<FichaDetalhesPage />} />
              <Route path="/mapa" element={<MapaPage />} />
              <Route path="/bestiario" element={<BestiarioPage />} />
              <Route path="/inventario" element={<InventarioPage />} />
              <Route path="/wiki" element={<WikiPage />} />
              <Route path="/vtt3d" element={<VTT3DPage />} />
            </Route>

            {/* Rotas Administrativas do Mestre */}
            <Route path="/mestre" element={<MasterLayout />}>
              <Route index element={<PainelMestrePage />} />
              <Route path="sessoes" element={<SessoesAoVivoPage />} />
              <Route path="mundo" element={<ControleMundoPage />} />
              <Route path="jogadores" element={<GerenciarJogadoresPage />} />
              <Route path="comercio" element={<ComercioPage />} />
              <Route path="forja" element={<ForjaPage />} />
              <Route path="disseminacao" element={<DisseminacaoPage />} />
              <Route path="gerenciar" element={<GerenciarMundoPage />} />
            </Route>

            {/* Redirecionamento Padrão */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
