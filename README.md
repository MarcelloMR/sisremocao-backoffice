# sisRemoção — Backoffice

Interface interna (React + Vite + Tailwind) para os papéis internos do sistema (Admin, Regulador,
Gestor, GestorAmbulancia). Identidade visual da Pró Coração.

Telas implementadas:
- **Login** — autenticação por e-mail/senha (JWT).
- **Visão Geral** (`/`) — **ainda placeholder** (cartões e listas com dado estático); ver
  "Próximas telas" abaixo.
- **Profissionais** (menu lateral com submenu, todas só Admin):
  - **Buscar** (`/profissionais/buscar`) — filtro por nome/tipo, com ações Editar/Remover por linha
    (filtro opcional; sem filtro mostra todos os ativos).
  - **Cadastrar** (`/profissionais/novo`) — processo "Cadastrar Profissional"; a máscara do CPF é
    validada no envio; se o cadastro tiver e-mail, cria a conta de login com senha temporária.
  - **Atualizar** (`/profissionais/atualizar` → `/profissionais/:codigo/editar`) — busca e edita;
    nome, sobrenome e CPF ficam bloqueados (RN: não editáveis após o cadastro).
  - **Remover** (`/profissionais/remover` → `/profissionais/:codigo/remover`) — busca e confirma;
    é soft delete (`ativo=false`), preserva histórico.
  - **Disponibilidade** (`/profissionais/:codigo/disponibilidade`) — grade de dias da semana x
    horários; usado na checagem de conflito ao escalar equipe numa remoção.
- **Ambulâncias** (GestorAmbulancia/Admin):
  - **Buscar** (`/ambulancias/buscar`) — filtro por status/disponibilidade (`?disponivel=true`/
    `?incluirInativos=true`), com ações Detalhar/Editar/Remover por linha.
  - **Cadastrar/Editar/Detalhar** — inclui dados do carro (placa, modelo, chassi etc.).
  - **Remover** — soft delete (`ativo=false`), preserva histórico.
- **Remoções**:
  - **Solicitar** (`/remocoes/nova`, só Cliente) — formulário com busca de endereço (autocomplete
    via `/geocoding/buscar`, Nominatim/OpenStreetMap) para origem e destino; a remoção é sempre
    vinculada ao cliente do usuário autenticado.
  - **Minhas remoções** (`/remocoes/minhas`, só Cliente) — remoções do próprio cliente.
  - **Buscar** (`/remocoes/buscar`, papéis internos) — filtros por status/cliente/profissional/data.
  - **Detalhar** (`/remocoes/:codigo`) — dados completos da remoção, equipe e ambulância alocadas.
  - **Alocar** (`/remocoes/:codigo/alocar`, Regulador/Admin) — seleciona ambulância disponível e
    equipe; trata o conflito de disponibilidade (`409` do backend) com pop-up listando os
    profissionais em conflito e checkbox "Confirmar mesmo assim".
- **Trocar Senha** (`/trocar-senha`) — obrigatória no primeiro login quando a conta foi criada
  automaticamente (cadastro de profissional pelo Admin, com senha temporária enviada por e-mail).
  `ProtectedRoute` força o redirecionamento enquanto `deveTrocarSenha` estiver ativo.

## Rodando localmente

Pré-requisito: a API do sisRemocao rodando em `http://localhost:3000` (veja o README do backend)
e ao menos um usuário Admin criado (`node scripts/seedAdmin.js email senha` na pasta do backend).

```powershell
npm install
```

Sem travar o terminal (Windows):

```powershell
Start-Process powershell -ArgumentList '-NoExit','-Command','npm run dev'
```

Ou direto, se não precisar do terminal livre:

```powershell
npm run dev
```

Abre em `http://localhost:5173`. A URL da API é configurada em `.env` (`VITE_API_URL`).

### Derrubar o servidor

```powershell
Get-Process node | Stop-Process -Force
```

### Build de produção

```powershell
npm run build
npm run lint
```

## Estrutura

- `src/api/client.js` — wrapper de `fetch` para a API (injeta o token JWT, trata erros).
- `src/context/AuthContext.jsx` — sessão do usuário (login/logout), persistida em `localStorage`.
- `src/components/ProtectedRoute.jsx` — bloqueia rotas por autenticação e, opcionalmente, por papel.
- `src/layout/` — `Sidebar`, `Topbar`, `AppLayout` (chumbo `#2B303A`, vermelho `#D9251B`, azul-petróleo
  `#557A82` — tokens definidos em `src/index.css`).
- `src/pages/` — `Login`, `Home`, `BuscarProfissionais`, `CadastroProfissional`,
  `SelecionarParaAtualizar`, `EditarProfissional`, `SelecionarParaRemover`, `RemoverProfissional`,
  `DisponibilidadeProfissional`, `TrocarSenha`, `EmConstrucao`.
- `src/components/TabelaProfissionais.jsx` — tabela com filtro opcional e ações Editar/Remover,
  reusada por Buscar/Atualizar/Remover (não há mais tela "Listar" separada — Buscar sem filtro já
  mostra todos).
- `src/components/ProfissionalFormulario.jsx` — formulário compartilhado entre Cadastrar e Editar
  (`bloquearIdentidade` desabilita nome/sobrenome/CPF e omite esses campos do payload no modo edição).
- `src/utils/senha.js` — espelha a política de senha do backend pra feedback imediato no formulário.
- `src/assets/logo/` — ícone e lockup extraídos do PDF vetorial da marca.

## Próximas telas (não implementadas ainda)

**Dashboard (Visão Geral) com dados reais** — hoje é 100% estático (`src/pages/Home.jsx`):
cartões de resumo (solicitações pendentes, remoções em andamento, ambulâncias disponíveis,
apólices vencendo) e as listas "Fila de Solicitações"/"Remoções Executadas" são placeholders
fixos. Falta:
- endpoint(s) de resumo/KPIs no backend (não existe hoje — precisaria ser criado);
- conectar `Home.jsx` a esses endpoints.

KPIs/relatórios mais elaborados (Gestor) também dependem desse mesmo trabalho de backend.
