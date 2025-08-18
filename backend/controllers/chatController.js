const db = require('../models');
const Chat = db.Chat;
const Usuarios = db.Usuarios;
const { Op } = require('sequelize');

exports.getHistoricoConversa = async (req, res) => {
    const remetenteId = req.user.id;
    const { destinatarioId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    if (!destinatarioId) {
        return res.status(400).json({ message: 'ID do destinatário é obrigatório.' });
    }

    try {
        const { count, rows } = await Chat.findAndCountAll({
            where: {
                [Op.or]: [
                    { remetente_id: remetenteId, destinatario_id: destinatarioId },
                    { remetente_id: destinatarioId, destinatario_id: remetenteId }
                ]
            },
            include: [
                { model: Usuarios, as: 'remetente', attributes: ['id', 'nome'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        const mensagensOrdenadas = rows.reverse();

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            mensagens: mensagensOrdenadas
        });

    } catch (error) {
        console.error("Erro ao buscar histórico de chat:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.getListaConversas = async (req, res) => {
    const usuarioId = req.user.id;
    try {
        console.log(`Buscando conversas para User ID: ${usuarioId}`);
        console.log("Buscando IDs de parceiros de conversa...");
        const todosChats = await Chat.findAll({
            attributes: ['remetente_id', 'destinatario_id'],
            where: { [Op.or]: [{ remetente_id: usuarioId }, { destinatario_id: usuarioId }] }
        });
        const idsOutrosUsuarios = [...new Set(
            todosChats.flatMap(c => [c.remetente_id, c.destinatario_id])
        )].filter(id => id !== usuarioId);
        console.log("IDs de parceiros encontrados:", idsOutrosUsuarios);

        const detalhesConversas = [];
        console.log("Iniciando loop para buscar detalhes de cada conversa...");

        for (const outroId of idsOutrosUsuarios) {
            console.log(`  Processando conversa com ID: ${outroId}`);
            try {
                console.log(`    Buscando última msg entre ${usuarioId} e ${outroId}...`);
                const ultimaMsg = await Chat.findOne({
                    where: {
                        [Op.or]: [
                            { remetente_id: usuarioId, destinatario_id: outroId },
                            { remetente_id: outroId, destinatario_id: usuarioId }
                        ]
                    },
                    include: [{
                        model: Usuarios,
                        as: 'remetente',
                        attributes: ['id', 'nome']
                    }],
                    order: [['createdAt', 'DESC']]
                });
                console.log(`    Última msg encontrada:`, ultimaMsg ? ultimaMsg.toJSON() : null);
                console.log(`    Buscando dados do usuário ID: ${outroId}...`);
                const outroUsuario = await Usuarios.findByPk(outroId, { attributes: ['id', 'nome', 'email'] });
                console.log(`    Dados do outro usuário:`, outroUsuario ? outroUsuario.toJSON() : null);

                if (ultimaMsg && outroUsuario) {
                    detalhesConversas.push({
                        outroUsuario: outroUsuario,
                        ultimaMensagem: ultimaMsg
                    });
                } else {
                    console.warn(`    Dados incompletos para conversa com ${outroId}. Última Msg: ${!!ultimaMsg}, Outro Usuário: ${!!outroUsuario}`);
                }
            } catch (loopError) {
                console.error(`!!! ERRO DENTRO DO LOOP para ID ${outroId}:`, loopError);

            }
        }

        console.log("Ordenando conversas...");
        detalhesConversas.sort((a, b) => new Date(b.ultimaMensagem.createdAt) - new Date(a.ultimaMensagem.createdAt));

        console.log("Enviando resposta 200...");
        res.status(200).json(detalhesConversas);

    } catch (error) {
        console.error("!!! ERRO GERAL em getListaConversas:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};