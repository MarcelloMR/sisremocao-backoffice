import { Home, Ambulance, CalendarClock, History, Users, Truck, Building2, ShieldCheck } from 'lucide-react';

// Quem solicita remoção: Cliente (para si) ou Regulador (pedido recebido por telefone). Admin não solicita.
// Monta os itens de cada papel presente em `papeis` e faz a união, sem duplicar por caminho — uma
// pessoa com múltiplos papéis (ex: Profissional + Regulador) vê o menu combinado dos dois.
export function itensNavegacao(papeis = [], clienteTipo = null) {
  const eh = (papel) => papeis.includes(papel);
  const administrativo = eh('Admin') || eh('Regulador');
  const clienteAdmin = eh('Cliente') && clienteTipo === 'Admin';

  const itensRemocoes = [];
  if (eh('Cliente')) {
    itensRemocoes.push({ rotulo: 'Solicitar', caminho: '/remocoes/nova' });
    itensRemocoes.push({ rotulo: 'Minhas remoções', caminho: '/remocoes/minhas' });
  }
  if (eh('Profissional')) {
    itensRemocoes.push({ rotulo: 'Minhas remoções (profissional)', caminho: '/profissional/remocoes' });
  }
  if (eh('Regulador')) {
    itensRemocoes.push({ rotulo: 'Solicitar', caminho: '/remocoes/nova' });
  }
  if (administrativo) {
    itensRemocoes.push({ rotulo: 'Buscar', caminho: '/remocoes/buscar' });
  }

  const itensClientes = administrativo
    ? [
        { rotulo: 'Buscar', caminho: '/clientes/buscar' },
        { rotulo: 'Cadastrar', caminho: '/clientes/novo' },
      ]
    : null;

  // Gestão de profissionais é só do Admin (decisão de produto de 2026-10-12). O Regulador apenas
  // busca — e lista profissionais ao montar a equipe de uma remoção. Quem é só Profissional ou
  // Cliente não vê este menu (a API também não lista profissionais para eles).
  const itensProfissionais = administrativo ? [{ rotulo: 'Buscar', caminho: '/profissionais/buscar' }] : [];
  if (eh('Admin')) {
    itensProfissionais.push(
      { rotulo: 'Cadastrar', caminho: '/profissionais/novo' },
      { rotulo: 'Atualizar', caminho: '/profissionais/atualizar' },
      { rotulo: 'Remover', caminho: '/profissionais/remover' }
    );
  }

  // Ambulâncias: cadastrar/editar/remover é só Admin desde que Regulador passou a só consultar.
  const itensAmbulancias = [{ rotulo: 'Buscar', caminho: '/ambulancias/buscar' }];
  if (eh('Admin')) {
    itensAmbulancias.push(
      { rotulo: 'Cadastrar', caminho: '/ambulancias/novo' },
      { rotulo: 'Atualizar', caminho: '/ambulancias/atualizar' },
      { rotulo: 'Remover', caminho: '/ambulancias/remover' }
    );
  }

  const itens = [{ rotulo: 'Início', caminho: '/', Icone: Home }];

  if (itensRemocoes.length > 0) {
    itens.push({ rotulo: 'Remoções', Icone: Truck, subitens: itensRemocoes });
  }
  if (itensClientes) {
    itens.push({ rotulo: 'Clientes', Icone: Building2, subitens: itensClientes });
  }
  if (clienteAdmin) {
    itens.push({ rotulo: 'Minha Empresa', caminho: '/minha-empresa', Icone: Building2 });
  }
  if (itensProfissionais.length > 0) {
    itens.push({ rotulo: 'Profissionais', Icone: Users, subitens: itensProfissionais });
  }
  if (administrativo) {
    itens.push({ rotulo: 'Ambulâncias', Icone: Ambulance, subitens: itensAmbulancias });
    itens.push({ rotulo: 'Escala', caminho: '/escala', Icone: CalendarClock });
    itens.push({ rotulo: 'Histórico', caminho: '/historico', Icone: History });
  }
  // Trilha de auditoria (quem fez o quê): só o Admin consulta.
  if (eh('Admin')) {
    itens.push({ rotulo: 'Auditoria', caminho: '/auditoria', Icone: ShieldCheck });
  }

  return itens;
}
