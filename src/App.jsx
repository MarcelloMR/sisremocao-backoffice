import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login.jsx';
import { Home } from './pages/Home.jsx';
import { BuscarProfissionais } from './pages/BuscarProfissionais.jsx';
import { ListarProfissionais } from './pages/ListarProfissionais.jsx';
import { CadastroProfissional } from './pages/CadastroProfissional.jsx';
import { SelecionarParaAtualizar } from './pages/SelecionarParaAtualizar.jsx';
import { EditarProfissional } from './pages/EditarProfissional.jsx';
import { SelecionarParaRemover } from './pages/SelecionarParaRemover.jsx';
import { RemoverProfissional } from './pages/RemoverProfissional.jsx';
import { DisponibilidadeProfissional } from './pages/DisponibilidadeProfissional.jsx';
import { TrocarSenha } from './pages/TrocarSenha.jsx';
import { EmConstrucao } from './pages/EmConstrucao.jsx';
import { BuscarAmbulancias } from './pages/BuscarAmbulancias.jsx';
import { ListarAmbulancias } from './pages/ListarAmbulancias.jsx';
import { CadastroAmbulancia } from './pages/CadastroAmbulancia.jsx';
import { SelecionarAmbulanciaParaAtualizar } from './pages/SelecionarAmbulanciaParaAtualizar.jsx';
import { EditarAmbulancia } from './pages/EditarAmbulancia.jsx';
import { DetalharAmbulancia } from './pages/DetalharAmbulancia.jsx';
import { SelecionarAmbulanciaParaRemover } from './pages/SelecionarAmbulanciaParaRemover.jsx';
import { RemoverAmbulancia } from './pages/RemoverAmbulancia.jsx';
import { SolicitarRemocao } from './pages/SolicitarRemocao.jsx';
import { ListarMinhasRemocoes } from './pages/ListarMinhasRemocoes.jsx';
import { ListarRemocoes } from './pages/ListarRemocoes.jsx';
import { BuscarRemocoes } from './pages/BuscarRemocoes.jsx';
import { DetalharRemocao } from './pages/DetalharRemocao.jsx';
import { AlocarRemocao } from './pages/AlocarRemocao.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppLayout } from './layout/AppLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';

function RotaAdmin({ children }) {
  return <ProtectedRoute papeisPermitidos={['Admin']}>{children}</ProtectedRoute>;
}

function RotaAmbulancia({ children }) {
  return <ProtectedRoute papeisPermitidos={['Admin', 'GestorAmbulancia']}>{children}</ProtectedRoute>;
}

function RotaCliente({ children }) {
  return <ProtectedRoute papeisPermitidos={['Cliente']}>{children}</ProtectedRoute>;
}

function RotaInterna({ children }) {
  return <ProtectedRoute papeisPermitidos={['Admin', 'GestorAmbulancia', 'Regulador']}>{children}</ProtectedRoute>;
}

export default function App() {
  const { sessao } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/trocar-senha" element={sessao ? <TrocarSenha /> : <Navigate to="/login" replace />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/relatorios" element={<EmConstrucao titulo="Relatórios" />} />
        <Route path="/escala" element={<EmConstrucao titulo="Escala" />} />
        <Route path="/historico" element={<EmConstrucao titulo="Histórico" />} />

        <Route path="/remocoes/nova" element={<SolicitarRemocao />} />
        <Route
          path="/remocoes/minhas"
          element={
            <RotaCliente>
              <ListarMinhasRemocoes />
            </RotaCliente>
          }
        />
        <Route
          path="/remocoes/buscar"
          element={
            <RotaInterna>
              <BuscarRemocoes />
            </RotaInterna>
          }
        />
        <Route
          path="/remocoes/listar"
          element={
            <RotaInterna>
              <ListarRemocoes />
            </RotaInterna>
          }
        />
        <Route path="/remocoes/:codigo" element={<DetalharRemocao />} />
        <Route
          path="/remocoes/:codigo/alocar"
          element={
            <RotaInterna>
              <AlocarRemocao />
            </RotaInterna>
          }
        />

        <Route path="/ambulancias/buscar" element={<BuscarAmbulancias />} />
        <Route path="/ambulancias/listar" element={<ListarAmbulancias />} />
        <Route path="/ambulancias/:codigo" element={<DetalharAmbulancia />} />
        <Route
          path="/ambulancias/novo"
          element={
            <RotaAmbulancia>
              <CadastroAmbulancia />
            </RotaAmbulancia>
          }
        />
        <Route
          path="/ambulancias/atualizar"
          element={
            <RotaAmbulancia>
              <SelecionarAmbulanciaParaAtualizar />
            </RotaAmbulancia>
          }
        />
        <Route
          path="/ambulancias/:codigo/editar"
          element={
            <RotaAmbulancia>
              <EditarAmbulancia />
            </RotaAmbulancia>
          }
        />
        <Route
          path="/ambulancias/remover"
          element={
            <RotaAmbulancia>
              <SelecionarAmbulanciaParaRemover />
            </RotaAmbulancia>
          }
        />
        <Route
          path="/ambulancias/:codigo/remover"
          element={
            <RotaAmbulancia>
              <RemoverAmbulancia />
            </RotaAmbulancia>
          }
        />

        <Route
          path="/profissionais/buscar"
          element={
            <RotaAdmin>
              <BuscarProfissionais />
            </RotaAdmin>
          }
        />
        <Route
          path="/profissionais/listar"
          element={
            <RotaAdmin>
              <ListarProfissionais />
            </RotaAdmin>
          }
        />
        <Route
          path="/profissionais/novo"
          element={
            <RotaAdmin>
              <CadastroProfissional />
            </RotaAdmin>
          }
        />
        <Route
          path="/profissionais/atualizar"
          element={
            <RotaAdmin>
              <SelecionarParaAtualizar />
            </RotaAdmin>
          }
        />
        <Route
          path="/profissionais/:codigo/editar"
          element={
            <RotaAdmin>
              <EditarProfissional />
            </RotaAdmin>
          }
        />
        <Route
          path="/profissionais/remover"
          element={
            <RotaAdmin>
              <SelecionarParaRemover />
            </RotaAdmin>
          }
        />
        <Route
          path="/profissionais/:codigo/remover"
          element={
            <RotaAdmin>
              <RemoverProfissional />
            </RotaAdmin>
          }
        />
        <Route
          path="/profissionais/:codigo/disponibilidade"
          element={
            <RotaAdmin>
              <DisponibilidadeProfissional />
            </RotaAdmin>
          }
        />
      </Route>
    </Routes>
  );
}
