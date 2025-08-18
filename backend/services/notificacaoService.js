const db = require('../models');
const Notificacoes = db.Notificacoes;

/**
 * @param {number} usuarioId 
 * @param {string} titulo 
 * @param {string} mensagem 
 * @param {string} [tipo]
 * @param {string} [link]
 * @param {object} [io] 
 * @param {object} [transaction] 
 */
async function criarNotificacao(usuarioId, titulo, mensagem, tipo = null, link = null, io = null, transaction = null) {
    try {
        if (!usuarioId || !titulo || !mensagem) {
            console.warn('Tentativa de criar notificação com dados faltando:', { usuarioId, titulo, mensagem });
            return null; 
        }

        const novaNotificacao = await Notificacoes.create({
            usuario_id: usuarioId,
            titulo,
            mensagem,
            tipo,
            link,
            status: 'Não Lida'
        }, { transaction });

        console.log(`Notificação criada para usuário ${usuarioId}: ${titulo}`);

        if (io) {
             if (global.onlineUsers && global.onlineUsers[usuarioId]) { 
                 const socketId = global.onlineUsers[usuarioId];
                 io.to(socketId).emit('novaNotificacao', novaNotificacao.toJSON());
                 console.log(`Notificação emitida via Socket.IO para usuário ${usuarioId} (socket ${socketId})`);
             } else {
                 console.log(`Usuário ${usuarioId} offline ou onlineUsers não acessível globalmente. Notificação não emitida via socket.`);
             }
        }

        return novaNotificacao;

    } catch (error) {
        console.error('Erro ao criar notificação:', error);
        return null;
    }
}

module.exports = {
    criarNotificacao
};
