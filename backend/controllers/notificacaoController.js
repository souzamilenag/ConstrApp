const db = require('../models');
const Notificacoes = db.Notificacoes;
const { Op } = require('sequelize');
exports.getMinhasNotificacoes = async (req, res) => {
    const usuarioId = req.user.id;
    const { page = 1, limit = 15, status } = req.query;
    const offset = (page - 1) * limit;

    try {
        let whereClause = { usuario_id: usuarioId };
        if (status && ['Lida', 'Não Lida'].includes(status)) {
            whereClause.status = status;
        }

        const { count, rows } = await Notificacoes.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });
        const countNaoLidas = await Notificacoes.count({
            where: { usuario_id: usuarioId, status: 'Não Lida' }
        });


        res.status(200).json({
            totalItems: count,
            totalNaoLidas: countNaoLidas,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            notificacoes: rows
        });

    } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.marcarComoLida = async (req, res) => {
    const usuarioId = req.user.id;
    const marcarTodas = req.body.marcarTodas === true; // Ex: {"marcarTodas": true}

    if (!marcarTodas) {
        return res.status(400).json({ message: 'É necessário indicar para marcar todas.' }); // Ou 'IDs de notificação inválidos ou ausentes.'
    }

    try {
        let whereClause = {
            usuario_id: usuarioId,
            status: 'Não Lida'
        };
        const [affectedRows] = await Notificacoes.update(
            { status: 'Lida' },
            { where: whereClause }
        );

        console.log(`Marcadas como lidas: ${affectedRows} notificações para usuário ${usuarioId}`);

        res.status(200).json({ message: `${affectedRows} notificações marcadas como lidas.` });

    } catch (error) {
        console.error("Erro ao marcar notificações como lidas:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};