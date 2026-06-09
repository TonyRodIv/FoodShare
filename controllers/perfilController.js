const prisma = require('../config/database');

// Lógica de cálculo das Badges com base no número de doações do usuário
function calcularBadges(totalDoacoes) {
  const badges = [
    { id: 'iniciante', nome: 'Semente Solidária', descricao: 'Fez sua 1ª doação', meta: 1, icon: '🌱', cor: '#10b981' },
    { id: 'frequente', nome: 'Mão na Roda', descricao: 'Atingiu 5 doações', meta: 5, icon: '🤝', cor: '#3b82f6' },
    { id: 'heroi', nome: 'Herói FoodShare', descricao: 'Completou 10 doações', meta: 10, icon: '🦸‍♂️', cor: '#a855f7' },
    { id: 'lenda', nome: 'Lenda da Partilha', descricao: 'Incríveis 25 doações', meta: 25, icon: '👑', cor: '#f59e0b' },
  ];

  return badges.map(badge => ({
    ...badge,
    atingida: totalDoacoes >= badge.meta,
    progresso: Math.min(100, (totalDoacoes / badge.meta) * 100)
  }));
}

exports.showPerfil = async (req, res) => {
  try {
    const usuarioId = res.locals.usuario.id;

    // Buscar os posts do perfil do usuário
    const posts = await prisma.postPerfil.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
    });

    // Contar total de doações (neste caso, todas criadas pelo usuário)
    const totalDoacoes = await prisma.doacao.count({
      where: { usuarioId },
    });

    // Calcular badges ativas e inativas
    const badges = calcularBadges(totalDoacoes);

    res.render('perfil/index', {
      posts,
      totalDoacoes,
      badges
    });
  } catch (error) {
    console.error('[PerfilController] Erro ao carregar perfil:', error);
    res.status(500).render('error', { statusCode: 500 });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { texto } = req.body;
    const usuarioId = res.locals.usuario.id;

    if (!texto || texto.trim().length === 0) {
      return res.redirect('/perfil');
    }

    await prisma.postPerfil.create({
      data: {
        texto: texto.trim(),
        usuarioId,
      },
    });

    res.redirect('/perfil');
  } catch (error) {
    console.error('[PerfilController] Erro ao criar post:', error);
    res.status(500).render('error', { statusCode: 500 });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const usuarioId = res.locals.usuario.id;

    const post = await prisma.postPerfil.findUnique({ where: { id: postId } });
    if (!post || post.usuarioId !== usuarioId) {
      return res.status(403).render('error', { statusCode: 403, error: new Error('Não autorizado') });
    }

    await prisma.postPerfil.delete({ where: { id: postId } });
    res.redirect('/perfil');
  } catch (error) {
    console.error('[PerfilController] Erro ao excluir post:', error);
    res.status(500).render('error', { statusCode: 500 });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    const usuarioId = res.locals.usuario.id;

    if (!req.file) {
      return res.redirect('/perfil'); // Pode adicionar flash message de erro depois
    }

    // Caminho que será salvo no banco de dados e acessado pelo frontend
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { avatar: avatarUrl }
    });

    // Atualiza o avatar no locals provisoriamente, se necessário, ou a aplicação pegará no próximo request.
    // O ideal seria atualizar o JWT, mas para simplificar, apenas atualizamos no DB e quem usa o JWT precisará relogar 
    // ou pegar do banco. O correto aqui para refletir no Header é atualizar o cookie do JWT, já que app.js lê do JWT.
    // Como app.js (req, res, next) seta locals.usuario com jwt.verify, não atualizar o token não vai atualizar na tela se a tela usar locals.usuario.avatar.
    // Para resolver isso, vamos gerar um novo token e setar o cookie, ou ler o avatar no showPerfil.
    // O mais seguro é gerar novo token:
    const jwt = require('jsonwebtoken');
    const usuarioAtualizado = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    
    // Removendo senha para o payload
    const { senha, ...usuarioPayload } = usuarioAtualizado;
    
    const token = jwt.sign(usuarioPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.redirect('/perfil');
  } catch (error) {
    console.error('[PerfilController] Erro ao fazer upload do avatar:', error);
    res.status(500).render('error', { statusCode: 500 });
  }
};
