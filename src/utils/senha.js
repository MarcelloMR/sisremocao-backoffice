// Espelha a política de senha do backend (services/utilitarios/senha.js) para dar feedback
// imediato no formulário, sem esperar a resposta da API.
export const REGRAS_SENHA = [
  { chave: 'tamanho', rotulo: 'Ao menos 10 caracteres', testar: (senha) => senha.length >= 10 },
  { chave: 'maiuscula', rotulo: 'Uma letra maiúscula', testar: (senha) => /[A-Z]/.test(senha) },
  { chave: 'minuscula', rotulo: 'Uma letra minúscula', testar: (senha) => /[a-z]/.test(senha) },
  { chave: 'numero', rotulo: 'Um número', testar: (senha) => /[0-9]/.test(senha) },
  { chave: 'especial', rotulo: 'Um caractere especial (ex: ! @ # $)', testar: (senha) => /[^A-Za-z0-9]/.test(senha) },
];

export function senhaAtendePolitica(senha) {
  return REGRAS_SENHA.every(({ testar }) => testar(senha || ''));
}
