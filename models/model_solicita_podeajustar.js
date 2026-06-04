const mongoose = require('mongoose');

const SolicitacaoSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    doacaoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doacao', required: true },
    mensagem: { type: String },
    status: { 
        type: String, 
        enum: ['pendente', 'aceita', 'recusada'], 
        default: 'pendente' 
    },
    dataCriacao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Solicitacao', SolicitacaoSchema);
