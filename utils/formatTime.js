const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function mesAtual() {
  return MESES[new Date().getMonth()];
}

function formatValidade(date) {
  const d = new Date(date);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}`;
}

function timeAgo(date) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `Há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Há ${diffH} ${diffH === 1 ? 'hora' : 'horas'}`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `Há ${diffD} ${diffD === 1 ? 'dia' : 'dias'}`;

  const diffM = Math.floor(diffD / 30);
  return `Há ${diffM} ${diffM === 1 ? 'mês' : 'meses'}`;
}

function isExpired(validade) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(validade) < today;
}

function donationDisplayStatus(doacao) {
  if (isExpired(doacao.validade)) return 'expirado';
  if (doacao.status === 'disponivel') return 'ativo';
  if (doacao.status === 'reservado') return 'reservado';
  if (doacao.status === 'entregue') return 'entregue';
  return doacao.status;
}

function donationStatusLabel(displayStatus) {
  const map = {
    ativo: 'Ativo',
    disponivel: 'Disponível',
    reservado: 'Reservado',
    entregue: 'Entregue',
    expirado: 'Expirado',
    ultimas: 'Últimas unid.',
  };
  return map[displayStatus] || displayStatus;
}

function solicitationDisplayStatus(status) {
  const map = {
    pendente: 'pendente',
    aprovado: 'aprovado',
    recusado: 'recusado',
    cancelado: 'cancelado',
  };
  return map[status] || status;
}

function solicitationPillKey(status) {
  if (status === 'aprovado') return 'aceito';
  return solicitationDisplayStatus(status);
}

function solicitationPillLabel(status) {
  const map = {
    pendente: 'Pendente',
    aprovado: 'Aceito',
    recusado: 'Recusado',
    cancelado: 'Cancelado',
  };
  return map[status] || status;
}

const RECEPTOR_CATEGORY_FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'grãos', label: 'Grãos' },
  { key: 'frutas', label: 'Frutas' },
  { key: 'laticínios', label: 'Laticínios' },
  { key: 'padaria', label: 'Padaria' },
  { key: 'enlatados', label: 'Enlatados' },
];

const RECEPTOR_FILTER_KEYS = RECEPTOR_CATEGORY_FILTERS.map((f) => f.key).filter((k) => k !== 'todos');

function categoryFilterKey(categoria) {
  const c = String(categoria || '').toLowerCase().normalize('NFC');
  const direct = RECEPTOR_FILTER_KEYS.find((key) => c === key || c.startsWith(key));
  if (direct) return direct;
  if (c.includes('grão') || c.includes('grao') || c.includes('cereal')) return 'grãos';
  if (c.includes('fruta') || c.includes('vegeta') || c.includes('legume')) return 'frutas';
  if (c.includes('latic')) return 'laticínios';
  if (c.includes('padaria') || c.includes('pão') || c.includes('pao') || c.includes('bolo')) return 'padaria';
  if (c.includes('industrial') || c.includes('enlat')) return 'enlatados';
  return 'outros';
}

function categoryIconVariant(categoria) {
  const key = categoryFilterKey(categoria);
  if (key === 'frutas' || key === 'padaria') return 'amber';
  if (key === 'enlatados') return 'blue';
  return 'green';
}

function formatCategoryLabel(categoria) {
  if (!categoria) return 'Sem categoria';
  return categoria.charAt(0).toUpperCase() + categoria.slice(1);
}

function formatDateShort(date) {
  const d = new Date(date);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

module.exports = {
  mesAtual,
  formatValidade,
  timeAgo,
  isExpired,
  donationDisplayStatus,
  donationStatusLabel,
  solicitationDisplayStatus,
  solicitationPillKey,
  solicitationPillLabel,
  RECEPTOR_CATEGORY_FILTERS,
  categoryFilterKey,
  categoryIconVariant,
  formatCategoryLabel,
  formatDateShort,
};
