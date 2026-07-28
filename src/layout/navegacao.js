import { Home, Ambulance, CalendarClock, History, Users, Truck } from 'lucide-react';

export const ITENS_NAVEGACAO = [
  { rotulo: 'Início', caminho: '/', Icone: Home },
  {
    rotulo: 'Remoções',
    Icone: Truck,
    subitens: [
      { rotulo: 'Solicitar', caminho: '/remocoes/nova' },
      { rotulo: 'Minhas remoções', caminho: '/remocoes/minhas' },
      { rotulo: 'Buscar', caminho: '/remocoes/buscar' },
      { rotulo: 'Listar', caminho: '/remocoes/listar' },
    ],
  },
  {
    rotulo: 'Profissionais',
    Icone: Users,
    subitens: [
      { rotulo: 'Buscar', caminho: '/profissionais/buscar' },
      { rotulo: 'Listar', caminho: '/profissionais/listar' },
      { rotulo: 'Cadastrar', caminho: '/profissionais/novo' },
      { rotulo: 'Atualizar', caminho: '/profissionais/atualizar' },
      { rotulo: 'Remover', caminho: '/profissionais/remover' },
    ],
  },
  {
    rotulo: 'Ambulâncias',
    Icone: Ambulance,
    subitens: [
      { rotulo: 'Buscar', caminho: '/ambulancias/buscar' },
      { rotulo: 'Listar', caminho: '/ambulancias/listar' },
      { rotulo: 'Cadastrar', caminho: '/ambulancias/novo' },
      { rotulo: 'Atualizar', caminho: '/ambulancias/atualizar' },
      { rotulo: 'Remover', caminho: '/ambulancias/remover' },
    ],
  },
  { rotulo: 'Escala', caminho: '/escala', Icone: CalendarClock },
  { rotulo: 'Histórico', caminho: '/historico', Icone: History },
];
