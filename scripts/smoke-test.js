require('dotenv').config();

const http = require('http');

const BASE = `http://localhost:${process.env.PORT || 3000}`;

function request(method, path, { cookies = '', body = null, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        ...headers,
        ...(cookies ? { Cookie: cookies } : {}),
      },
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'] || [];
        resolve({ status: res.statusCode, body: data, setCookie, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function mergeCookies(existing, setCookie) {
  const jar = {};
  (existing || '').split(';').forEach((part) => {
    const [k, v] = part.trim().split('=');
    if (k && v) jar[k] = v;
  });
  setCookie.forEach((line) => {
    const [pair] = line.split(';');
    const [k, v] = pair.split('=');
    if (k && v) jar[k.trim()] = v.trim();
  });
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
}

async function login(email) {
  const res = await request('POST', '/auth/login', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, senha: 'demo123' }).toString(),
  });
  if (res.status !== 302 && res.status !== 200) {
    throw new Error(`Login falhou para ${email}: HTTP ${res.status}`);
  }
  const cookies = mergeCookies('', res.setCookie);
  if (!cookies.includes('token=')) {
    throw new Error(`Login sem cookie token para ${email}`);
  }
  return cookies;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function checkPage(name, path, cookies, checks) {
  const res = await request('GET', path, { cookies });
  assert(res.status === 200, `${name} (${path}): esperado 200, recebeu ${res.status}`);
  for (const [label, fn] of checks) {
    assert(fn(res.body), `${name}: ${label}`);
  }
  console.log(`  OK ${name}`);
}

async function main() {
  console.log('Smoke test FoodShare —', BASE);

  const publicRes = await request('GET', '/auth/login');
  assert(publicRes.status === 200, `/auth/login deve retornar 200, recebeu ${publicRes.status}`);
  console.log('  OK /auth/login (público)');

  const staticFiles = [
    '/js/solicitacao-detail.js',
    '/js/doacao-detail-modal.js',
    '/js/app-detail-modal-render.js',
    '/css/style.css',
  ];
  for (const file of staticFiles) {
    const res = await request('GET', file);
    assert(res.status === 200, `${file} deve existir, recebeu ${res.status}`);
    console.log(`  OK ${file}`);
  }

  const doadorCookies = await login('doador.demo@foodshare.local');
  console.log('  OK login doador');

  await checkPage('Home doador', '/', doadorCookies, [
    ['app shell', (html) => html.includes('app-shell')],
    ['modal doação', (html) => html.includes('doacao-detail-overlay')],
    ['script detail doação', (html) => html.includes('/js/doacao-detail-modal.js')],
    ['dados doações', (html) => html.includes('id="doacoes-detalhe-data"')],
    ['script solicitação detail', (html) => html.includes('/js/solicitacao-detail.js')],
    ['dados solicitações', (html) => html.includes('id="solicitacoes-detalhe-data"')],
    ['modal solicitação', (html) => html.includes('solicitacao-detail-overlay')],
  ]);

  await checkPage('Doações doador', '/doacoes', doadorCookies, [
    ['dados doações', (html) => html.includes('id="doacoes-detalhe-data"')],
    ['modal nova doação', (html) => html.includes('data-doacao-modal')],
  ]);

  await checkPage('Solicitações recebidas', '/solicitacoes/recebidas', doadorCookies, [
    ['lista pedidos', (html) => html.includes('data-solicitacoes-list')],
    ['script solicitação detail', (html) => html.includes('/js/solicitacao-detail.js')],
  ]);

  await checkPage('Histórico', '/historico', doadorCookies, [
    ['painel histórico', (html) => html.includes('app-page')],
  ]);

  await checkPage('Configurações', '/configuracoes', doadorCookies, [
    ['sem crash', (html) => !html.includes('Error') || html.includes('app-settings')],
    ['app shell', (html) => html.includes('app-shell')],
  ]);

  const receptorCookies = await login('familia.santos@foodshare.local');
  console.log('  OK login receptor');

  await checkPage('Doações receptor', '/doacoes', receptorCookies, [
    ['dashboard receptor', (html) => html.includes('receptor-dashboard') || html.includes('receptor-food-grid')],
    ['dados doações', (html) => html.includes('id="doacoes-detalhe-data"')],
    ['modal solicitar', (html) => html.includes('data-solicitacao-modal')],
  ]);

  await checkPage('Minhas solicitações', '/solicitacoes/minhas', receptorCookies, [
    ['página minhas', (html) => html.includes('solicitacoes-minhas-page')],
    ['script solicitação detail', (html) => html.includes('/js/solicitacao-detail.js')],
    ['dados solicitações', (html) => html.includes('id="solicitacoes-detalhe-data"')],
  ]);

  const redirectNova = await request('GET', '/solicitacoes/nova', { cookies: receptorCookies });
  assert(redirectNova.status === 302, `/solicitacoes/nova deve redirecionar, recebeu ${redirectNova.status}`);
  assert(
    (redirectNova.headers.location || '').includes('/doacoes'),
    `/solicitacoes/nova deve ir para /doacoes, recebeu ${redirectNova.headers.location}`
  );
  console.log('  OK redirect /solicitacoes/nova → /doacoes');

  const serializers = require('../utils/detailSerializers');
  assert(typeof serializers.buildDoacoesDetalheMap === 'function', 'detailSerializers.buildDoacoesDetalheMap');
  assert(typeof serializers.buildSolicitacoesDetalheMap === 'function', 'detailSerializers.buildSolicitacoesDetalheMap');
  console.log('  OK utils/detailSerializers.js');

  console.log('\nTodos os checks passaram.');
}

main().catch((err) => {
  console.error('\nFALHA:', err.message);
  process.exit(1);
});
