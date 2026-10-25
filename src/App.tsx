import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PlayerLayout } from './layouts/PlayerLayout';
import { MasterLayout } from './layouts/MasterLayout';

// Páginas de Autenticação
import { LoginPage } from './pages/auth/LoginPage';

// Páginas do Jogador
import { PersonagensPage } from './pages/player/PersonagensPage';
import { CriarPersonagemPage } from './pages/player/CriarPersonagemPage';
import { FichaDetalhesPage } from './pages/player/FichaDetalhesPage';
import { MapaPage } from './pages/player/MapaPage';
import { BestiarioPage } from './pages/player/BestiarioPage';
import { InventarioPage } from './pages/player/InventarioPage';
import { WikiPage } from './pages/player/WikiPage';
import { VTT3DPage } from './pages/player/VTT3DPage';

// Páginas do Mestre
import { PainelMestrePage } from './pages/master/PainelMestrePage';
import { SessoesAoVivoPage } from './pages/master/SessoesAoVivoPage';
import { ControleMundoPage } from './pages/master/ControleMundoPage';
import { GerenciarJogadoresPage } from './pages/master/GerenciarJogadoresPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
          </Route>

          {/* Redirecionamento Padrão */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
