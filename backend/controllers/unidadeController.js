const db = require('../models');
const Unidades = db.Unidades;
const Empreendimentos = db.Empreendimentos;
const Construtoras = db.Construtoras;
const { Op } = require('sequelize');
const checkOwnership = async (empreendimentoId, usuarioId) => {
    const empreendimento = await Empreendimentos.findByPk(empreendimentoId, {
        include: [{
            model: Construtoras,
            as: 'construtora',
            where: { usuario_id: usuarioId },
            required: true
        }]
    });

    if (!empreendimento) {
        throw new Error('Empreendimento não encontrado ou não pertence a esta construtora.');
    }
    return empreendimento;
};

exports.createUnidade = async (req, res) => {
    const { empreendimentoId } = req.params;
    const { numero, andar, bloco, status, preco, area, quartos, banheiros, vagas, observacoes, planta_unidade_url } = req.body;

    if (!numero || !preco) {
        return res.status(400).json({ message: 'Número e preço da unidade são obrigatórios.' });
    }

    try {
        await checkOwnership(empreendimentoId, req.user.id);

        const unidadeExistente = await Unidades.findOne({
            where: {
                empreendimento_id: empreendimentoId,
                numero: numero,
                bloco: bloco || null
            }
        });
        if (unidadeExistente) {
            return res.status(400).json({ message: `Unidade ${numero} ${bloco ? 'bloco ' + bloco : ''} já existe neste empreendimento.` });
        }


        // 3. Criar a unidade
        const novaUnidade = await Unidades.create({
            empreendimento_id: empreendimentoId,
            numero,
            andar,
            bloco,
            status: status || 'Disponível',
            preco,
            area,
            quartos,
            banheiros,
            vagas,
            observacoes,
            planta_unidade_url
        });

        await Empreendimentos.increment('total_unidade', { where: { id: empreendimentoId } });

        res.status(201).json(novaUnidade);

    } catch (error) {
        console.error("Erro ao criar unidade:", error);
        if (error.message.includes('Empreendimento não encontrado')) {
            return res.status(403).json({ message: error.message });
        }
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Erro de validação.', errors: messages });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao criar unidade.' });
    }
};

exports.getUnidadesDoEmpreendimento = async (req, res) => {
    const { empreendimentoId } = req.params;
    const { status, andar, quartos, minPreco, maxPreco, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    try {
        await checkOwnership(empreendimentoId, req.user.id);
        let whereClause = { empreendimento_id: empreendimentoId };
        if (status) whereClause.status = status;
        if (andar) whereClause.andar = andar;
        if (quartos) whereClause.quartos = quartos;
        if (minPreco) whereClause.preco = { ...whereClause.preco, [Op.gte]: parseFloat(minPreco) };
        if (maxPreco) whereClause.preco = { ...whereClause.preco, [Op.lte]: parseFloat(maxPreco) };

        // 3. Buscar as unidades com filtros e paginação
        const { count, rows } = await Unidades.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
                ['bloco', 'ASC NULLS LAST'],
                ['andar', 'ASC NULLS LAST'],
                ['numero', 'ASC']
            ]
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            unidades: rows
        });

    } catch (error) {
        console.error("Erro ao listar unidades:", error);
        if (error.message.includes('Empreendimento não encontrado')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao listar unidades.' });
    }
};

exports.getUnidadeById = async (req, res) => {
    const { id } = req.params;

    try {
        const unidade = await Unidades.findByPk(id, {
            include: [{
                model: Empreendimentos,
                as: 'empreendimento',
                attributes: ['id', 'construtora_id'],
                required: true,
                include: [{
                    model: Construtoras,
                    as: 'construtora',
                    attributes: ['id', 'usuario_id'],
                    required: true
                }]
            }]
        });

        if (!unidade) {
            return res.status(404).json({ message: 'Unidade não encontrada.' });
        }

        if (unidade.empreendimento.construtora.usuario_id !== req.user.id) {
            return res.status(403).json({ message: 'Você não tem permissão para acessar esta unidade.' });
        }

        const unidadeData = unidade.toJSON();
        delete unidadeData.empreendimento;

        res.status(200).json(unidadeData);

    } catch (error) {
        console.error("Erro ao obter unidade:", error);
        res.status(500).json({ message: 'Erro interno do servidor ao obter unidade.' });
    }
};

exports.updateUnidade = async (req, res) => {
    const { id } = req.params;
    const dadosAtualizacao = req.body;

    delete dadosAtualizacao.id;
    delete dadosAtualizacao.empreendimento_id;
    delete dadosAtualizacao.createdAt;
    delete dadosAtualizacao.updatedAt;

    if (Object.keys(dadosAtualizacao).length === 0) {
        return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' });
    }

    const needsUniquenessCheck = dadosAtualizacao.numero || dadosAtualizacao.bloco;


    try {
        const unidade = await Unidades.findByPk(id, {
            include: [{
                model: Empreendimentos,
                as: 'empreendimento',
                attributes: ['id', 'construtora_id'],
                required: true,
                include: [{
                    model: Construtoras,
                    as: 'construtora',
                    attributes: ['id', 'usuario_id'],
                    required: true
                }]
            }]
        });

        if (!unidade) {
            return res.status(404).json({ message: 'Unidade não encontrada.' });
        }
        if (unidade.empreendimento.construtora.usuario_id !== req.user.id) {
            return res.status(403).json({ message: 'Você não tem permissão para atualizar esta unidade.' });
        }
        if (needsUniquenessCheck) {
            const novoNumero = dadosAtualizacao.numero !== undefined ? dadosAtualizacao.numero : unidade.numero;
            const novoBloco = dadosAtualizacao.bloco !== undefined ? dadosAtualizacao.bloco : unidade.bloco;

            const unidadeExistente = await Unidades.findOne({
                where: {
                    empreendimento_id: unidade.empreendimento_id,
                    numero: novoNumero,
                    bloco: novoBloco || null,
                    id: { [Op.ne]: id }
                }
            });
            if (unidadeExistente) {
                return res.status(400).json({ message: `Unidade ${novoNumero} ${novoBloco ? 'bloco ' + novoBloco : ''} já existe neste empreendimento.` });
            }
        }


        // 3. Atualizar a unidade
        const unidadeAtualizada = await unidade.update(dadosAtualizacao);

        res.status(200).json(unidadeAtualizada);

    } catch (error) {
        console.error("Erro ao atualizar unidade:", error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Erro de validação.', errors: messages });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar unidade.' });
    }
};

exports.deleteUnidade = async (req, res) => {
    const { id } = req.params;

    try {
        const unidade = await Unidades.findByPk(id, {
            include: [{
                model: Empreendimentos,
                as: 'empreendimento',
                attributes: ['id', 'construtora_id'],
                required: true,
                include: [{
                    model: Construtoras,
                    as: 'construtora',
                    attributes: ['id', 'usuario_id'],
                    required: true
                }]
            }]
        });

        if (!unidade) {
            return res.status(404).json({ message: 'Unidade não encontrada.' });
        }
        if (unidade.empreendimento.construtora.usuario_id !== req.user.id) {
            return res.status(403).json({ message: 'Você não tem permissão para excluir esta unidade.' });
        }
        if (['Reservado', 'Vendido'].includes(unidade.status)) {
            return res.status(400).json({ message: `Não é possível excluir uma unidade com status ${unidade.status}. Considere desativá-la.` });
        }

        const empreendimentoId = unidade.empreendimento_id;
        await unidade.destroy();
        await Empreendimentos.decrement('total_unidade', { where: { id: empreendimentoId } });


        res.status(200).json({ message: 'Unidade excluída com sucesso.' });

    } catch (error) {
        console.error("Erro ao excluir unidade:", error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ message: 'Não é possível excluir a unidade pois existem compras ou outros registros relacionados.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao excluir unidade.' });
    }
};


exports.getUnidadesDisponiveisPublic = async (req, res) => {
    const { empreendimentoId } = req.params;
    const { andar, quartos, minPreco, maxPreco, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {

        let whereClause = {
            empreendimento_id: empreendimentoId,
            status: 'Disponível'
        };
        if (andar) whereClause.andar = andar;
        if (quartos) whereClause.quartos = quartos;
        if (minPreco) whereClause.preco = { ...whereClause.preco, [Op.gte]: parseFloat(minPreco) };
        if (maxPreco) whereClause.preco = { ...whereClause.preco, [Op.lte]: parseFloat(maxPreco) };


        const { count, rows } = await Unidades.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ['observacoes', 'updatedAt'] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
                ['bloco', 'ASC NULLS LAST'],
                ['andar', 'ASC NULLS LAST'],
                ['numero', 'ASC']
            ]
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            unidades: rows
        });

    } catch (error) {
        console.error("Erro ao listar unidades disponíveis:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};