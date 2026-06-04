router.post('/solicitar/:doacaoId', async (req, res) => {
    try {
        const novaSolicitacao = new Solicitacao({
            usuarioId: req.user._id, // Assumindo que a autenticação (Pessoa 1) passa o user logado
            doacaoId: req.params.doacaoId,
            mensagem: req.body.mensagem
        });
        await novaSolicitacao.save();
        res.redirect('/minhas-solicitacoes');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao criar solicitação");
    }
});
