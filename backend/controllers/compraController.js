const db = require('../models');
const Compras = db.Compras;
const Unidades = db.Unidades;
const Empreendimentos = db.Empreendimentos;
const Contratos = db.Contratos;
const Pagamentos = db.Pagamentos;
const Usuarios = db.Usuarios;
const { sequelize } = require('../models');
const { Op } = require('sequelize');

exports.iniciarCompra = async (req, res) => {
    const { unidadeId } = req.body;
    const clienteId = req.user.id;

    if (!unidadeId) {
        return res.status(400).json({ message: 'O ID da unidade é obrigatório.' });
    }

    const t = await sequelize.transaction();

    try {
        const unidade = await Unidades.findByPk(unidadeId, {
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!unidade) {
            await t.rollback();
            return res.status(404).json({ message: 'Unidade não encontrada.' });
        }

        if (unidade.status !== 'Disponível') {
            await t.rollback();
            return res.status(400).json({ message: `Esta unidade não está disponível (Status: ${unidade.status}).` });
        }

        const novaCompra = await Compras.create({
            cliente_id: clienteId,
            unidade_id: Number(unidadeId),
            status: 'Aguardando Contrato'
        }, { transaction: t });

        unidade.status = 'Reservado';
        await unidade.save({ transaction: t });

        const novoContrato = await Contratos.create({
            compra_id: novaCompra.id,
            status: 'Pendente'
        }, { transaction: t });

        await t.commit();
        res.status(201).json({
            message: 'Processo de compra iniciado com sucesso!',
            compra: novaCompra,
            contrato: novoContrato
        });

    } catch (error) {
        await t.rollback();
        console.error("Erro em iniciarCompra:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Conflito: Restrição única violada (ex: unidade já em outra compra).', error: error.errors });
        }
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ message: 'Erro de referência: Cliente ou Unidade inválida.', error: error.errors });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao iniciar a compra.' });
    }
};

exports.getMinhasCompras = async (req, res) => {
    const clienteId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    try {
        let whereClause = { cliente_id: clienteId };
        if (status) whereClause.status = status;

        const { count, rows } = await Compras.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Unidades,
                    as: 'unidade',
                    attributes: ['id', 'numero', 'andar', 'bloco', 'preco'],
                    required: false,
                    include: [{
                        model: Empreendimentos,
                        as: 'empreendimento',
                        attributes: ['id', 'nome'],
                        required: false
                    }]
                },
                {
                    model: Contratos,
                    as: 'contrato',
                    attributes: ['id', 'status', 'cliente_assinou', 'construtora_assinou', 'documento_url'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            compras: rows
        });

    } catch (error) {
        console.error("Erro ao listar minhas compras:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.getComprasDaConstrutora = async (req, res) => {
    const usuarioConstrutoraId = req.user.id;
    const { page = 1, limit = 10, status, empreendimentoId } = req.query;
    const offset = (page - 1) * limit;

    try {
        const construtora = await db.Construtoras.findOne({
            where: { usuario_id: usuarioConstrutoraId },
            attributes: ['id']
        });

        if (!construtora) {
            return res.status(403).json({ message: 'Perfil de construtora não encontrado.' });
        }

        const includeCondition = {
            model: Unidades,
            as: 'unidade',
            required: true,
            include: [{
                model: Empreendimentos,
                as: 'empreendimento',
                required: true,
                where: {
                    construtora_id: construtora.id,
                    ...(empreendimentoId && { id: empreendimentoId })
                },
                attributes: ['id', 'nome']
            }],
            attributes: ['id', 'numero', 'andar', 'bloco']
        };

        let whereClause = {};
        if (status) {
            whereClause.status = status;
        }

        const { count, rows } = await Compras.findAndCountAll({
            where: whereClause,
            include: [
                includeCondition,
                {
                    model: Usuarios,
                    as: 'cliente',
                    attributes: ['id', 'nome', 'email'],
                    required: false
                },
                {
                    model: Contratos,
                    as: 'contrato',
                    attributes: ['id', 'status', 'cliente_assinou', 'construtora_assinou'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']],
            distinct: true
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            compras: rows
        });

    } catch (error) {
        console.error("Erro ao listar compras da construtora:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.getDetalhesCompra = async (req, res) => {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const tipoUsuario = req.user.tipo_usuario;

    try {
        const compra = await Compras.findByPk(id, {
            include: [
                {
                    model: Unidades, as: 'unidade', required: false,
                    attributes: ['id', 'numero', 'andar', 'bloco', 'preco', 'empreendimento_id'],
                    include: [{
                        model: Empreendimentos, as: 'empreendimento', required: false,
                        attributes: ['id', 'nome', 'construtora_id'], // Mantém o que já tinha
                        include: [{
                            model: db.Construtoras,
                            as: 'construtora',
                            attributes: ['id', 'nome_empresa', 'cnpj', 'usuario_id'],
                            required: false
                        }]
                    }]
                },
                { model: Usuarios, as: 'cliente', attributes: ['id', 'nome', 'email'], required: false },
                { model: Contratos, as: 'contrato', required: false },
                { model: Pagamentos, as: 'pagamentos', required: false, order: [['createdAt', 'ASC']] }
            ]
        });

        if (!compra) {
            return res.status(404).json({ message: 'Compra não encontrada.' });
        }

        const isClienteDono = tipoUsuario === 'cliente' && compra.cliente_id === usuarioId;
        const construtoraIdDoEmpreendimento = compra.unidade?.empreendimento?.construtora_id;
        let isConstrutoraDona = false;
        if (tipoUsuario === 'construtora' && construtoraIdDoEmpreendimento) {
            const construtoraDoUsuario = await db.Construtoras.findOne({ where: { usuario_id: usuarioId }, attributes: ['id'] });
            isConstrutoraDona = construtoraDoUsuario && construtoraIdDoEmpreendimento === construtoraDoUsuario.id;
        }

        if (!isClienteDono && !isConstrutoraDona) {
            return res.status(403).json({ message: 'Você não tem permissão para ver esta compra.' });
        }

        res.status(200).json(compra);

    } catch (error) {
        console.error(`Erro ao buscar detalhes da compra ${id}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.updateContrato = async (req, res) => {
    const { compraId } = req.params;
    const { documento_url, status } = req.body;
    const usuarioConstrutoraId = req.user.id;

    const statusValidos = ['Pendente', 'Aguardando Assinatura Cliente', 'Aguardando Assinatura Construtora', 'Cancelado', 'Assinado'];
    if (status && !statusValidos.includes(status)) {
        return res.status(400).json({ message: `Status inválido. Válidos: ${statusValidos.join(', ')}` });
    }
    if (documento_url !== undefined && (documento_url !== null && typeof documento_url !== 'string')) {
        return res.status(400).json({ message: 'URL do documento inválida.' });
    }
    if (documento_url === undefined && status === undefined) {
        return res.status(400).json({ message: 'Nenhum dado (documento_url ou status) fornecido para atualização.' });
    }

    const t = await sequelize.transaction();

    try {
        const compra = await Compras.findByPk(compraId, {
            include: [
                { model: Contratos, as: 'contrato', required: true },
                {
                    model: Unidades, as: 'unidade', required: true, include: [{
                        model: Empreendimentos, as: 'empreendimento', required: true, include: [{
                            model: db.Construtoras, as: 'construtora', required: true,
                            where: { usuario_id: usuarioConstrutoraId }
                        }]
                    }]
                }
            ],
            transaction: t
        });

        if (!compra) {
            await t.rollback();
            return res.status(404).json({ message: 'Compra não encontrada ou você não tem permissão.' });
        }

        const contrato = compra.contrato;
        const dadosContratoUpdate = {};
        let compraStatusUpdate = null;

        if (documento_url !== undefined) {
            dadosContratoUpdate.documento_url = documento_url;
        }
        if (status !== undefined) {
            dadosContratoUpdate.status = status;
            if (status === 'Aguardando Assinatura Cliente' && compra.status === 'Aguardando Contrato') {
                compraStatusUpdate = 'Aguardando Assinaturas';
            } else if (status === 'Cancelado') {
                compraStatusUpdate = 'Cancelada';
            } else if (status === 'Assinado' && contrato.cliente_assinou && contrato.construtora_assinou) {
                compraStatusUpdate = 'Aguardando Pagamento';
            }
        }

        if (Object.keys(dadosContratoUpdate).length > 0) {
            await contrato.update(dadosContratoUpdate, { transaction: t });
        }

        if (compraStatusUpdate && compra.status !== compraStatusUpdate) {
            compra.status = compraStatusUpdate;
            await compra.save({ transaction: t });
        }

        await t.commit();

        const contratoAtualizado = await Contratos.findByPk(contrato.id);
        res.status(200).json(contratoAtualizado);

    } catch (error) {
        await t.rollback();
        console.error("Erro ao atualizar contrato:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Erro de validação.', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar contrato.' });
    }
};

exports.assinarContratoCliente = async (req, res) => {
    const { compraId } = req.params;
    const clienteId = req.user.id;
    const { nomeDigitado } = req.body;

    if (!nomeDigitado || nomeDigitado.trim() === '') {
        return res.status(400).json({ message: 'O nome digitado para assinatura é obrigatório.' });
    }
    if (nomeDigitado.trim().toLowerCase() !== req.user.nome.trim().toLowerCase()) {
        return res.status(400).json({ message: 'O nome digitado não corresponde ao seu nome cadastrado.' });
    }

    const t = await sequelize.transaction();

    try {
        const compra = await Compras.findOne({
            where: { id: compraId, cliente_id: clienteId },
            include: [{ model: Contratos, as: 'contrato', required: true }],
            transaction: t
        });

        if (!compra) {
            await t.rollback();
            return res.status(404).json({ message: 'Compra não encontrada ou não pertence a você.' });
        }
        const contrato = compra.contrato;

        if (contrato.cliente_assinou) {
            await t.rollback();
            return res.status(400).json({ message: 'Você já assinou este contrato.' });
        }

        contrato.cliente_assinou = true;
        contrato.data_assinatura = new Date();
        let compraStatusUpdate = null;

        if (!contrato.construtora_assinou) {
            contrato.status = 'Aguardando Assinatura Construtora';
            compraStatusUpdate = 'Aguardando Assinaturas';
        } else {
            contrato.status = 'Assinado';
            compraStatusUpdate = 'Aguardando Pagamento';
        }
        await contrato.save({ transaction: t });

        if (compraStatusUpdate && compra.status !== compraStatusUpdate) {
            compra.status = compraStatusUpdate;
            await compra.save({ transaction: t });
        }

        await t.commit();
        res.status(200).json({
            message: 'Contrato assinado com sucesso!',
            contrato: contrato.toJSON(),
            compraStatus: compra.status
        });

    } catch (error) {
        await t.rollback();
        console.error(`Erro ao assinar contrato (cliente) Compra ${compraId}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao processar assinatura.' });
    }
};

exports.assinarContratoConstrutora = async (req, res) => {
    const { compraId } = req.params;
    const usuarioConstrutoraId = req.user.id;

    const t = await sequelize.transaction();

    try {
        const compra = await Compras.findOne({
            where: { id: compraId },
            include: [
                { model: Contratos, as: 'contrato', required: true },
                {
                    model: Unidades, as: 'unidade', required: true, include: [{
                        model: Empreendimentos, as: 'empreendimento', required: true, include: [{
                            model: db.Construtoras, as: 'construtora', required: true,
                            where: { usuario_id: usuarioConstrutoraId }
                        }]
                    }]
                }], transaction: t
        });

        if (!compra) {
            await t.rollback();
            return res.status(404).json({ message: 'Compra não encontrada ou não pertence a esta construtora.' });
        }
        const contrato = compra.contrato;

        if (contrato.construtora_assinou) {
            await t.rollback();
            return res.status(400).json({ message: 'Construtora já assinou este contrato.' });
        }

        contrato.construtora_assinou = true;
        contrato.data_assinatura = new Date();
        let compraStatusUpdate = null;

        if (contrato.cliente_assinou) {
            contrato.status = 'Assinado';
            compraStatusUpdate = 'Aguardando Pagamento';
        } else {
            contrato.status = 'Aguardando Assinatura Cliente';
            compraStatusUpdate = 'Aguardando Assinaturas';
        }
        await contrato.save({ transaction: t });

        if (compraStatusUpdate && compra.status !== compraStatusUpdate) {
            compra.status = compraStatusUpdate;
            await compra.save({ transaction: t });
        }

        await t.commit();
        res.status(200).json({
            message: 'Contrato assinado pela construtora com sucesso!',
            contrato: contrato.toJSON(),
            compraStatus: compra.status
        });

    } catch (error) {
        await t.rollback();
        console.error(`Erro ao assinar contrato (construtora) Compra ${compraId}:`, error);
        res.status(500).json({ message: 'Erro interno do servidor ao processar assinatura.' });
    }
};


// --- Endpoint Webhook para Assinatura Real (Exemplo/Placeholder) ---
exports.webhookAssinatura = async (req, res) => {
    const { eventType, contractId, signerEmail, signedAt, status } = req.body; // Dados fictícios do webhook

    // TODO: 1. Validar a requisição do webhook (essencial!)

    const t = await sequelize.transaction();
    try {
        // TODO: 2. Encontrar o contrato pelo ID externo da plataforma (precisa salvar esse ID)
        // const contrato = await Contratos.findOne({ where: { id_externo_assinatura: contractId }, transaction: t });
        // if (!contrato) { /* ... tratamento de não encontrado ... */ }

        // --- Lógica Simulada ---
        const contrato = await Contratos.findByPk(contractId, { transaction: t }); // << USANDO ID INTERNO SÓ PARA SIMULAR
        if (!contrato) { await t.rollback(); return res.status(404).send('Contrato (simulado) não encontrado.'); }
        const compra = await Compras.findByPk(contrato.compra_id, { include: [{ model: Usuarios, as: 'cliente' }], transaction: t });
        // --- Fim Lógica Simulada ---

        let mudouStatus = false;
        let compraStatusUpdate = null;

        // 3. Atualizar status baseado no evento do webhook
        if (eventType === 'signer_signed' || eventType === 'contract_signed') { // Simplificado
            const isCliente = signerEmail === compra.cliente?.email; // Exemplo de identificação
            if (isCliente && !contrato.cliente_assinou) {
                contrato.cliente_assinou = true;
                contrato.data_assinatura = signedAt ? new Date(signedAt) : new Date();
                mudouStatus = true;
            } else if (!isCliente && !contrato.construtora_assinou) { // Assumindo que só pode ser cliente ou construtora
                contrato.construtora_assinou = true;
                contrato.data_assinatura = signedAt ? new Date(signedAt) : new Date();
                mudouStatus = true;
            }
        } else if (eventType === 'contract_completed') {
            contrato.status = 'Assinado';
            contrato.cliente_assinou = true;
            contrato.construtora_assinou = true;
            mudouStatus = true;
        } else if (eventType === 'contract_canceled' || eventType === 'contract_expired') {
            contrato.status = 'Inválido';
            mudouStatus = true;
        }

        // 4. Atualizar status da compra se necessário
        if (mudouStatus) {
            if (contrato.cliente_assinou && contrato.construtora_assinou) {
                contrato.status = 'Assinado';
                compraStatusUpdate = 'Aguardando Pagamento';
            } else if (contrato.status === 'Inválido') {
                compraStatusUpdate = 'Cancelada';
            } else if (contrato.cliente_assinou && !contrato.construtora_assinou) {
                contrato.status = 'Aguardando Assinatura Construtora';
                compraStatusUpdate = 'Aguardando Assinaturas';
            } else if (!contrato.cliente_assinou && contrato.construtora_assinou) {
                contrato.status = 'Aguardando Assinatura Cliente';
                compraStatusUpdate = 'Aguardando Assinaturas';
            }
            await contrato.save({ transaction: t });

            if (compraStatusUpdate && compra.status !== compraStatusUpdate) {
                compra.status = compraStatusUpdate;
                await compra.save({ transaction: t });

                // Reverter unidade se compra foi cancelada
                if (compraStatusUpdate === 'Cancelada') {
                    await Unidades.update(
                        { status: 'Disponível' },
                        { where: { id: compra.unidade_id }, transaction: t }
                    );
                }
            }
        }

        await t.commit();
        res.status(200).send('Webhook processado.');

    } catch (error) {
        await t.rollback();
        console.error("Erro no webhook de assinatura:", error);
        res.status(500).send('Erro interno ao processar webhook.');
    }
};