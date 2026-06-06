require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = 'demo123';
const DEMO_EMAIL_SUFFIX = '@foodshare.local';

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date;
}

const doadorDemo = {
  nome: 'Mercado Solidário Demo',
  email: `doador.demo${DEMO_EMAIL_SUFFIX}`,
  telefone: '(11) 3000-1000',
  role: 'doador',
};

const receptoresDemo = [
  { nome: 'Família Santos', email: `familia.santos${DEMO_EMAIL_SUFFIX}`, telefone: '(11) 91234-5678' },
  { nome: 'ONG Alimenta', email: `ong.alimenta${DEMO_EMAIL_SUFFIX}`, telefone: '(11) 99876-5432' },
  { nome: 'Comunidade Vila Nova', email: `vila.nova${DEMO_EMAIL_SUFFIX}`, telefone: '(11) 97654-3210' },
  { nome: 'Centro Comunitário Esperança', email: `centro.esperanca${DEMO_EMAIL_SUFFIX}`, telefone: '(11) 93456-7890' },
  { nome: 'Lar das Crianças', email: `lar.criancas${DEMO_EMAIL_SUFFIX}`, telefone: '(11) 94567-8901' },
  { nome: 'Grupo Mãos que Ajudam', email: `maos.ajudam${DEMO_EMAIL_SUFFIX}`, telefone: '(11) 95678-9012' },
  { nome: 'Associação Bairro Novo', email: `bairro.novo${DEMO_EMAIL_SUFFIX}`, telefone: '(11) 96789-0123' },
  { nome: 'Projeto Refeição Solidária', email: `refeicao.solidaria${DEMO_EMAIL_SUFFIX}`, telefone: '(11) 97890-1234' },
];

const doacoesDemo = [
  {
    status: 'disponivel',
    observacoes: 'Cesta de grãos da despensa, embalagens lacradas.',
    itens: [
      { nome: 'Arroz integral 5kg', quantidade: 4, categoria: 'grãos', validade: addDays(50) },
      { nome: 'Feijão carioca 1kg', quantidade: 6, categoria: 'grãos', validade: addDays(70) },
      { nome: 'Aveia em flocos 500g', quantidade: 3, categoria: 'grãos', validade: addDays(90) },
    ],
    solicitacoes: [
      { receptor: 'familia.santos', quantidade: 2, status: 'pendente', observacoes: 'Para 4 pessoas nesta semana.' },
      { receptor: 'bairro.novo', quantidade: 1, status: 'pendente', observacoes: 'Distribuição no mutirão de sábado.' },
    ],
  },
  {
    status: 'disponivel',
    observacoes: 'Excedente de hortifruti do dia, refrigerado.',
    itens: [
      { nome: 'Banana prata (cacho)', quantidade: 5, categoria: 'frutas', validade: addDays(4) },
      { nome: 'Tomate salada', quantidade: 20, categoria: 'frutas', validade: addDays(5) },
      { nome: 'Alface americana', quantidade: 12, categoria: 'frutas', validade: addDays(3) },
    ],
    solicitacoes: [
      { receptor: 'vila.nova', quantidade: 8, status: 'pendente', observacoes: 'Para o café comunitário de domingo.' },
      { receptor: 'centro.esperanca', quantidade: 5, status: 'recusado', observacoes: 'Quantidade maior que a necessidade atual.' },
    ],
  },
  {
    status: 'disponivel',
    observacoes: 'Enlatados e industrializados com validade confortável.',
    itens: [
      { nome: 'Sardinha em lata 125g', quantidade: 24, categoria: 'industrializados', validade: addDays(180) },
      { nome: 'Extrato de tomate 340g', quantidade: 10, categoria: 'industrializados', validade: addDays(120) },
      { nome: 'Biscoito cream cracker', quantidade: 15, categoria: 'industrializados', validade: addDays(60) },
    ],
    solicitacoes: [
      { receptor: 'maos.ajudam', quantidade: 10, status: 'pendente', observacoes: 'Para kits de emergência do bairro.' },
      { receptor: 'lar.criancas', quantidade: 6, status: 'cancelado', observacoes: 'Solicitação cancelada — já recebemos de outra fonte.' },
    ],
  },
  {
    status: 'disponivel',
    observacoes: 'Itens diversos para complementar cestas básicas.',
    itens: [
      { nome: 'Açúcar cristal 1kg', quantidade: 8, categoria: 'outros', validade: addDays(365) },
      { nome: 'Óleo de soja 900ml', quantidade: 6, categoria: 'outros', validade: addDays(150) },
      { nome: 'Sal refinado 1kg', quantidade: 4, categoria: 'outros', validade: addDays(300) },
    ],
    solicitacoes: [
      { receptor: 'refeicao.solidaria', quantidade: 3, status: 'pendente', observacoes: 'Para preparo de refeições da semana.' },
    ],
  },
  {
    status: 'reservado',
    observacoes: 'Laticínios próximos do vencimento, bem conservados.',
    itens: [
      { nome: 'Leite integral 1L', quantidade: 12, categoria: 'laticínios', validade: addDays(6) },
      { nome: 'Iogurte natural 170g', quantidade: 20, categoria: 'laticínios', validade: addDays(8) },
      { nome: 'Queijo minas frescal', quantidade: 4, categoria: 'laticínios', validade: addDays(5) },
    ],
    solicitacoes: [
      { receptor: 'ong.alimenta', quantidade: 15, status: 'aprovado', observacoes: 'Distribuição no almoço comunitário.' },
    ],
  },
  {
    status: 'reservado',
    observacoes: 'Proteínas congeladas, retirada no mesmo dia.',
    itens: [
      { nome: 'Frango inteiro congelado', quantidade: 6, categoria: 'carnes', validade: addDays(10) },
      { nome: 'Ovos brancos (dúzia)', quantidade: 10, categoria: 'carnes', validade: addDays(14) },
    ],
    solicitacoes: [
      { receptor: 'lar.criancas', quantidade: 4, status: 'aprovado', observacoes: 'Para merenda das crianças acolhidas.' },
      { receptor: 'familia.santos', quantidade: 2, status: 'recusado', observacoes: 'Quantidade já reservada para outro receptor.' },
    ],
  },
  {
    status: 'reservado',
    observacoes: 'Macarrão e molhos para refeição coletiva.',
    itens: [
      { nome: 'Macarrão parafuso 500g', quantidade: 12, categoria: 'grãos', validade: addDays(100) },
      { nome: 'Molho de tomate sachê', quantidade: 15, categoria: 'industrializados', validade: addDays(80) },
    ],
    solicitacoes: [
      { receptor: 'centro.esperanca', quantidade: 10, status: 'aprovado', observacoes: 'Jantar solidário de sexta-feira.' },
    ],
  },
  {
    status: 'entregue',
    observacoes: 'Pães e bolos do dia anterior, entregues pela manhã.',
    itens: [
      { nome: 'Pão francês', quantidade: 40, categoria: 'outros', validade: addDays(1) },
      { nome: 'Bolo de cenoura (fatias)', quantidade: 20, categoria: 'outros', validade: addDays(3) },
    ],
    solicitacoes: [
      { receptor: 'refeicao.solidaria', quantidade: 35, status: 'aprovado', observacoes: 'Café da manhã do projeto — entregue.' },
    ],
  },
  {
    status: 'entregue',
    observacoes: 'Cesta básica completa entregue à família cadastrada.',
    itens: [
      { nome: 'Arroz branco 5kg', quantidade: 2, categoria: 'grãos', validade: addDays(40) },
      { nome: 'Feijão preto 1kg', quantidade: 4, categoria: 'grãos', validade: addDays(55) },
      { nome: 'Farinha de mandioca 1kg', quantidade: 2, categoria: 'grãos', validade: addDays(30) },
    ],
    solicitacoes: [
      { receptor: 'familia.santos', quantidade: 2, status: 'aprovado', observacoes: 'Cesta mensal — entregue em 02/06.' },
    ],
  },
  {
    status: 'entregue',
    observacoes: 'Sopas e caldos para o inverno, já distribuídos.',
    itens: [
      { nome: 'Sopa de legumes instantânea', quantidade: 18, categoria: 'industrializados', validade: addDays(200) },
      { nome: 'Caldo de galinha em cubos', quantidade: 12, categoria: 'industrializados', validade: addDays(180) },
    ],
    solicitacoes: [
      { receptor: 'vila.nova', quantidade: 15, status: 'aprovado', observacoes: 'Distribuído no ponto de apoio da comunidade.' },
      { receptor: 'bairro.novo', quantidade: 5, status: 'aprovado', observacoes: 'Complemento para famílias do bairro.' },
    ],
  },
];

async function main() {
  const senhaHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  await prisma.usuario.deleteMany({
    where: { email: { endsWith: DEMO_EMAIL_SUFFIX } },
  });

  const doador = await prisma.usuario.create({
    data: { ...doadorDemo, senha: senhaHash },
  });

  const receptores = {};
  for (const receptor of receptoresDemo) {
    receptores[receptor.email.split('@')[0]] = await prisma.usuario.create({
      data: { ...receptor, role: 'receptor', senha: senhaHash },
    });
  }

  let totalSolicitacoes = 0;

  for (const doacao of doacoesDemo) {
    const criada = await prisma.doacao.create({
      data: {
        usuarioId: doador.id,
        status: doacao.status,
        observacoes: doacao.observacoes,
        itens: { create: doacao.itens },
      },
    });

    for (const sol of doacao.solicitacoes) {
      await prisma.solicitacao.create({
        data: {
          doacaoId: criada.id,
          usuarioId: receptores[sol.receptor].id,
          quantidade: sol.quantidade,
          status: sol.status,
          observacoes: sol.observacoes,
        },
      });
      totalSolicitacoes += 1;
    }
  }

  console.log(
    `Seed concluído: 1 doador, ${receptoresDemo.length} receptores, ${doacoesDemo.length} doações, ${totalSolicitacoes} solicitações.`
  );
}

main()
  .catch((err) => {
    console.error('Erro no seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });