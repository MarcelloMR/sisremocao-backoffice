import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login.jsx';
import { ConfirmarEmail } from './pages/ConfirmarEmail.jsx';
import { CompletarCadastroProfissional } from './pages/CompletarCadastroProfissional.jsx';
import { MinhasRemocoesProfissional } from './pages/MinhasRemocoesProfissional.jsx';
import { Home } from './pages/Home.jsx';
import { BuscarProfissionais } from './pages/BuscarProfissionais.jsx';
import { CadastroProfissional } from './pages/CadastroProfissional.jsx';
import { SelecionarParaAtualizar } from './pages/SelecionarParaAtualizar.jsx';
import { EditarProfissional } from './pages/EditarProfissional.jsx';
import { SelecionarParaRemover } from './pages/SelecionarParaRemover.jsx';
import { RemoverProfissional } from './pages/RemoverProfissional.jsx';
import { DisponibilidadeProfissional } from './pages/DisponibilidadeProfissional.jsx';
import { TrocarSenha } from './pages/TrocarSenha.jsx';
import { EmConstrucao } from './pages/EmConstrucao.jsx';
import { BuscarAmbulancias } from './pages/BuscarAmbulancias.jsx';
import { CadastroAmbulancia } from './pages/CadastroAmbulancia.jsx';
import { SelecionarAmbulanciaParaAtualizar } from './pages/SelecionarAmbulanciaParaAtualizar.jsx';
import { EditarAmbulancia } from './pages/EditarAmbulancia.jsx';
import { DetalharAmbulancia } from './pages/DetalharAmbulancia.jsx';
import { SelecionarAmbulanciaParaRemover } from './pages/SelecionarAmbulanciaParaRemover.jsx';
import { RemoverAmbulancia } from './pages/RemoverAmbulancia.jsx';
import { BuscarClientes } from './pages/BuscarClientes.jsx';
import { CadastroCliente } from './pages/CadastroCliente.jsx';
import { DetalharCliente } from './pages/DetalharCliente.jsx';
import { EditarCliente } from './pages/EditarCliente.jsx';
import { SolicitarRemocao } from './pages/SolicitarRemocao.jsx';
import { ListarMinhasRemocoes } from './pages/ListarMinhasRemocoes.jsx';
import { BuscarRemocoes } from './pages/BuscarRemocoes.jsx';
import { DetalharRemocao } from './pages/DetalharRemocao.jsx';
import { AlocarRemocao } from './pages/AlocarRemocao.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppLayout } from './layout/AppLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';

function RotaProfissional({ children }) {
  return <ProtectedRoute papeisPermitidos={['Admin', 'Regulador']}>{children}</ProtectedRoute>;
}

// Só Admin inicia o convite de um novo profissional (Regulador não tem mais esse acesso).
function RotaCadastrarProfissional({ children }) {
  return <ProtectedRoute papeisPermitidos={['Admin']}>{children}</ProtectedRoute>;
}

function RotaAmbulancia({ children }) {
  return <ProtectedRoute papeisPermitidos={['Admin', 'Regulador']}>{children}</ProtectedRoute>;
}

function RotaCliente({ children }) {
  return <ProtectedRoute papeisPermitidos={['Cliente']}>{children}</ProtectedRoute>;
}

function RotaInterna({ children }) {
  return <ProtectedRoute papeisPermitidos={['Admin', 'Regulador']}>{children}</ProtectedRoute>;
}

function RotaProfissionalLogado({ children }) {
  return <ProtectedRoute papeisPermitidos={['Profissional']}>{children}</ProtectedRoute>;
}

// Quem pode solicitar remoção: Cliente (para si) ou Regulador (registrando pedido recebido por telefone).
function RotaSolicitarRemocao({ children }) {
  return <ProtectedRoute papeisPermitidos={['Cliente', 'Regulador']}>{children}</ProtectedRoute>;
}

function RotaGestaoCliente({ children }) {
  return <ProtectedRoute papeisPermitidos={['Admin', 'Regulador']}>{children}</ProtectedRoute>;
}

export default function App() {
  const { sessao } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/confirmar-email" element={<ConfirmarEmail />} />
      <Route path="/trocar-senha" element={sessao ? <TrocarSenha /> : <Navigate to="/login" replace />} />
      <Route
        path="/completar-cadastro"
        element={
          <RotaProfissionalLogado>
            <CompletarCadastroProfissional />
          </RotaProfissionalLogado>
        }
      />

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

        <Route
          path="/remocoes/nova"
          element={
            <RotaSolicitarRemocao>
              <SolicitarRemocao />
            </RotaSolicitarRemocao>
          }
        />
        <Route
          path="/remocoes/minhas"
          element={
            <RotaCliente>
              <ListarMinhasRemocoes />
            </RotaCliente>
          }
        />
        <Route
          path="/profissional/remocoes"
          element={
            <RotaProfissionalLogado>
              <MinhasRemocoesProfissional />
            </RotaProfissionalLogado>
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
        <Route path="/remocoes/:codigo" element={<DetalharRemocao />} />
        <Route
          path="/remocoes/:codigo/alocar"
          element={
            <RotaInterna>
              <AlocarRemocao />
            </RotaInterna>
          }
        />

        <Route
          path="/clientes/buscar"
          element={
            <RotaGestaoCliente>
              <BuscarClientes />
            </RotaGestaoCliente>
          }
        />
        <Route
          path="/clientes/novo"
          element={
            <RotaGestaoCliente>
              <CadastroCliente />
            </RotaGestaoCliente>
          }
        />
        <Route
          path="/clientes/:codigo"
          element={
            <RotaGestaoCliente>
              <DetalharCliente />
            </RotaGestaoCliente>
          }
        />
        <Route
          path="/clientes/:codigo/editar"
          element={
            <RotaGestaoCliente>
              <EditarCliente />
            </RotaGestaoCliente>
          }
        />

        <Route path="/ambulancias/buscar" element={<BuscarAmbulancias />} />
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
            <RotaProfissional>
              <BuscarProfissionais />
            </RotaProfissional>
          }
        />
        <Route
          path="/profissionais/novo"
          element={
            <RotaCadastrarProfissional>
              <CadastroProfissional />
            </RotaCadastrarProfissional>
          }
        />
        <Route
          path="/profissionais/atualizar"
          element={
            <RotaProfissional>
              <SelecionarParaAtualizar />
            </RotaProfissional>
          }
        />
        <Route
          path="/profissionais/:codigo/editar"
          element={
            <RotaProfissional>
              <EditarProfissional />
            </RotaProfissional>
          }
        />
        <Route
          path="/profissionais/remover"
          element={
            <RotaProfissional>
              <SelecionarParaRemover />
            </RotaProfissional>
          }
        />
        <Route
          path="/profissionais/:codigo/remover"
          element={
            <RotaProfissional>
              <RemoverProfissional />
            </RotaProfissional>
          }
        />
        <Route
          path="/profissionais/:codigo/disponibilidade"
          element={
            <RotaProfissional>
              <DisponibilidadeProfissional />
            </RotaProfissional>
          }
        />
      </Route>

      {/* Qualquer rota não mapeada: manda pro login (sem sessão) ou pra Home (já logado). */}
      <Route path="*" element={<Navigate to={sessao ? '/' : '/login'} replace />} />
    </Routes>
  );
}
