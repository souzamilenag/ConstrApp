const db = require('../models');
const Agendamentos = db.Agendamentos;
const Empreendimentos = db.Empreendimentos;
const Construtoras = db.Construtoras;
const Usuarios = db.Usuarios;
const { Op } = require('sequelize');
const { criarNotificacao } = require('../services/notificacaoService');
const { io } = global;

exports.createAgendamento = async (req, res) => {
    const { empreendimentoId, data_visita, visitar_stand, numero_apartamento, observacoes } = req.body;
    const clienteId = req.user.id;

    if (!empreendimentoId || !data_visita) {
        return res.status(400).json({ message: 'ID do empreendimento e data da visita são obrigatórios.' });
    }

    // Validar data_visita, não pode ser passado
    const agora = new Date();
    const dataVisitaDate = new Date(data_visita);
    if (isNaN(dataVisitaDate) || dataVisitaDate <= agora) {
        return res.status(400).json({ message: 'Data da visita inválida ou no passado.' });
    }

    if (visitar_stand === false && !numero_apartamento) {
        return res.status(400).json({ message: 'Número do apartamento é obrigatório se não for visita ao stand.' });
    }

    try {
        const empreendimento = await Empreendimentos.findByPk(empreendimentoId, {
            include: [{ model: Construtoras, as: 'construtora', attributes: ['usuario_id'] }]
        });
        if (!empreendimento) {
            return res.status(404).json({ message: 'Empreendimento não encontrado.' });
        }

        // Cria agendamento
        const novoAgendamento = await Agendamentos.create({
            cliente_id: clienteId,
            empreendimento_id: empreendimentoId,
            data_visita: dataVisitaDate,
            visitar_stand: visitar_stand !== undefined ? visitar_stand : true,
            numero_apartamento: visitar_stand === false ? numero_apartamento : null,
            observacoes,
            status: 'Solicitado' // Status inicial
        });

        res.status(201).json(novoAgendamento);

    } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Erro de validação.', errors: messages });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao criar agendamento.' });
    }
};

exports.getMeusAgendamentos = async (req, res) => {
    const clienteId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    try {
        let whereClause = { cliente_id: clienteId };
        if (status) whereClause.status = status;

        const { count, rows } = await Agendamentos.findAndCountAll({
            where: whereClause,
            include: [{
                model: Empreendimentos,
                as: 'empreendimento',
                attributes: ['id', 'nome']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['data_visita', 'DESC']]
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            agendamentos: rows
        });

    } catch (error) {
        console.error("Erro ao listar meus agendamentos:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.getAgendamentosDaConstrutora = async (req, res) => {
    const usuarioConstrutoraId = req.user.id;
    const { page = 1, limit = 10, status, empreendimentoId } = req.query;
    const offset = (page - 1) * limit;

    try {
        const construtora = await Construtoras.findOne({
            where: { usuario_id: usuarioConstrutoraId },
            attributes: ['id']
        });
        if (!construtora) {
            return res.status(403).json({ message: 'Perfil de construtora não encontrado.' });
        }

        let idsEmpreendimentosConstrutora = await Empreendimentos.findAll({
            where: { construtora_id: construtora.id },
            attributes: ['id']
        }).then(emps => emps.map(e => e.id));

        if (idsEmpreendimentosConstrutora.length === 0) {
            return res.status(200).json({ totalItems: 0, totalPages: 0, currentPage: 1, agendamentos: [] });
        }

        let whereClause = {
            empreendimento_id: { [Op.in]: idsEmpreendimentosConstrutora }
        };

        if (status) whereClause.status = status;
        if (empreendimentoId && idsEmpreendimentosConstrutora.includes(parseInt(empreendimentoId))) {
            whereClause.empreendimento_id = empreendimentoId;
        } else if (empreendimentoId) {
            return res.status(200).json({ totalItems: 0, totalPages: 0, currentPage: 1, agendamentos: [] });
        }

        const { count, rows } = await Agendamentos.findAndCountAll({
            where: whereClause,
            include: [
                { model: Empreendimentos, as: 'empreendimento', attributes: ['id', 'nome'] },
                { model: Usuarios, as: 'cliente', attributes: ['id', 'nome', 'email'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['data_visita', 'ASC']]
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            agendamentos: rows
        });

    } catch (error) {
        console.error("Erro ao listar agendamentos da construtora:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.updateStatusAgendamento = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const usuarioConstrutoraId = req.user.id;

    const statusValidos = ['Confirmado', 'Cancelado', 'Realizado'];
    if (!status || !statusValidos.includes(status)) {
        return res.status(400).json({ message: `Status inválido. Válidos: ${statusValidos.join(', ')}` });
    }

    try {
        const agendamento = await Agendamentos.findByPk(id, {
            include: [{
                model: Empreendimentos,
                as: 'empreendimento',
                attributes: ['id', 'nome'],
                required: true,
                include: [{
                    model: Construtoras,
                    as: 'construtora',
                    attributes: ['id', 'usuario_id'],
                    where: { usuario_id: usuarioConstrutoraId },
                    required: true
                }]
            }, {
                model: Usuarios,
                as: 'cliente',
                attributes: ['id', 'nome']
            }]
        });

        if (!agendamento) {
            return res.status(404).json({ message: 'Agendamento não encontrado ou não pertence aos seus empreendimentos.' });
        }

        agendamento.status = status;
        await agendamento.save();

        res.status(200).json(agendamento);

    } catch (error) {
        console.error("Erro ao atualizar status do agendamento:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.cancelAgendamento = async (req, res) => {
    const { id } = req.params;
    const clienteId = req.user.id;

    try {
        const agendamento = await Agendamentos.findOne({
            where: {
                id: id,
                cliente_id: clienteId
            }
        });

        if (!agendamento) {
            return res.status(404).json({ message: 'Agendamento não encontrado ou não pertence a você.' });
        }

        if (agendamento.status !== 'Solicitado') {
            return res.status(400).json({ message: `Não é possível cancelar um agendamento com status ${agendamento.status}. Entre em contato com a construtora.` });
        }

        agendamento.status = 'Cancelado';
        await agendamento.save();

        res.status(200).json({ message: 'Agendamento cancelado com sucesso.' });

    } catch (error) {
        console.error("Erro ao cancelar agendamento:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
    await criarNotificacao(
        agendamento.cliente_id,
        `Agendamento ${status}`,
        `Seu agendamento para ${agendamento.empreendimento.nome} foi ${status}.`,
        'agendamento',
        `/meus-agendamentos/${agendamento.id}`,
        io
    );
};