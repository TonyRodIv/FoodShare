router.post('/:id/aceitar', async (req, res) => {
    await Solicitacao.findByIdAndUpdate(req.params.id, { status: 'aceita' });
    // Lógica opcional: mudar o status do item doado para "indisponível" aqui
    res.redirect('back');
});

router.post('/:id/recusar', async (req, res) => {
    await Solicitacao.findByIdAndUpdate(req.params.id, { status: 'recusada' });
    res.redirect('back');
});
