const db = require('../models');
const Pagamentos = db.Pagamentos;
const Compras = db.Compras;
const Unidades = db.Unidades;
const Contratos = db.Contratos;
const { sequelize } = require('../models');

exports.getPagamentosDaCompra = async (req, res) => {
    const { compraId } = req.params;
    const usuarioId = req.user.id;
    const tipoUsuario = req.user.tipo_usuario;

    try {
        const compra = await Compras.findByPk(compraId, {
            attributes: ['id', 'cliente_id'],
            include: [{
                model: Unidades, as: 'unidade', attributes: ['empreendimento_id'], required: true,
                include: [{ model: db.Empreendimentos, as: 'empreendimento', attributes: ['construtora_id'], required: true }]
            }]
        });

        if (!compra) {
            return res.status(404).json({ message: 'Compra não encontrada.' });
        }

        const isClienteDono = tipoUsuario === 'cliente' && compra.cliente_id === usuarioId;
        let isConstrutoraDona = false;
        if (tipoUsuario === 'construtora') {
            const construtora = await db.Construtoras.findOne({ where: { usuario_id: usuarioId }, attributes: ['id'] });
            isConstrutoraDona = construtora && compra.unidade?.empreendimento?.construtora_id === construtora.id;
        }

        if (!isClienteDono && !isConstrutoraDona) {
            return res.status(403).json({ message: 'Você não tem permissão para ver os pagamentos desta compra.' });
        }
        const pagamentos = await Pagamentos.findAll({
            where: { compra_id: compraId },
            order: [['createdAt', 'ASC']]
        });

        res.status(200).json(pagamentos);

    } catch (error) {
        console.error("Erro ao listar pagamentos:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.criarIntencaoPagamento = async (req, res) => {
    const { compraId } = req.params;
    const { valor, metodo_pagamento, descricao } = req.body;
    const clienteId = req.user.id;

    if (!valor || valor <= 0) {
        return res.status(400).json({ message: 'Valor do pagamento é obrigatório e deve ser positivo.' });
    }
    if (!metodo_pagamento) {
        return res.status(400).json({ message: 'Método de pagamento é obrigatório.' });
    }

    const t = await sequelize.transaction();

    try {
        const compra = await Compras.findOne({
            where: { id: compraId, cliente_id: clienteId },
            include: [
                { model: Contratos, as: 'contrato', attributes: ['status', 'cliente_assinou', 'construtora_assinou'] },
                { model: Unidades, as: 'unidade', attributes: ['id', 'numero', 'preco'], include: [{ model: db.Empreendimentos, as: 'empreendimento', attributes: ['nome'] }] }
            ],
            transaction: t
        });

        if (!compra) {
            await t.rollback();
            return res.status(404).json({ message: 'Compra não encontrada ou não pertence a você.' });
        }
        if (!(compra.contrato?.cliente_assinou && compra.contrato?.construtora_assinou)) {
            console.warn(`Pagamento iniciado para compra ${compraId} sem contrato totalmente assinado.`);
        }
        if (compra.status === 'Concluída' || compra.status === 'Cancelada') {
            await t.rollback();
            return res.status(400).json({ message: `Não é possível iniciar pagamento para uma compra com status ${compra.status}.` });
        }

        const novoPagamento = await Pagamentos.create({
            compra_id: compraId,
            valor,
            metodo_pagamento,
            status: 'Pendente',
        }, { transaction: t });
        let dadosGateway = {};
        try {
            console.log(`[SIMULAÇÃO] Chamando gateway para pagamento ${novoPagamento.id}, valor ${valor}`);
            dadosGateway = {
                gatewayTransactionId: `gw_sim_${novoPagamento.id}_${Date.now()}`,
                statusGateway: 'pending',
                paymentInfo: {
                    type: metodo_pagamento,
                    ...(metodo_pagamento === 'pix' && { qr_code: 'simula_qr_code_base64', copia_cola: 'simula_pix_copia_cola' }),
                    ...(metodo_pagamento === 'boleto' && { link_boleto: `http://exemplo.com/boleto/${novoPagamento.id}`, linha_digitavel: '12345.67890 12345.678901 12345.678902 1 12345678901234' }),
                    ...(metodo_pagamento === 'cartao_credito' && { redirect_url: `http://exemplo.com/pagamento-cartao/${novoPagamento.id}` })
                }
            };
            console.log(`[SIMULAÇÃO] Gateway respondeu:`, dadosGateway);
            novoPagamento.gateway_transaction_id = dadosGateway.gatewayTransactionId;
            await novoPagamento.save({ transaction: t });

        } catch (gatewayError) {
            console.error("Erro ao comunicar com o gateway de pagamento:", gatewayError);
            await t.rollback();
            return res.status(502).json({ message: 'Falha ao iniciar pagamento junto ao provedor.' });
        }
        await t.commit();
        res.status(201).json({
            message: 'Intenção de pagamento criada. Prossiga com o pagamento.',
            pagamentoId: novoPagamento.id,
            gatewayTransactionId: novoPagamento.gateway_transaction_id,
            paymentInfo: dadosGateway.paymentInfo
        });

    } catch (error) {
        await t.rollback();
        console.error("Erro ao criar intenção de pagamento:", error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Erro de validação.', errors: messages });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao criar intenção de pagamento.' });
    }
};

exports.webhookPagamento = async (req, res) => {
    console.log("[WEBHOOK PAGAMENTO] Corpo recebido:", req.body);
    const { transactionId, novoStatus, valorPago, dataConfirmacao } = req.body;

    if (!transactionId || !novoStatus) {
        console.warn("Webhook de pagamento com dados incompletos:", req.body);
        return res.status(400).send('Dados incompletos no webhook.');
    }

    const t = await sequelize.transaction();

    try {
        const pagamento = await Pagamentos.findOne({
            where: { gateway_transaction_id: transactionId },
            include: [{
                model: Compras,
                as: 'compra',
                include: [
                    { model: Unidades, as: 'unidade', attributes: ['id', 'status'] }
                ]
            }],
            transaction: t
        });

        if (!pagamento) {
            await t.rollback();
            console.warn(`Pagamento não encontrado para gateway_transaction_id: ${transactionId}`);
            return res.status(200).send('Pagamento não encontrado no nosso sistema.');
        }
        let nossoStatus = pagamento.status;
        let compraStatus = pagamento.compra.status;
        let unidadeStatus = pagamento.compra.unidade.status;
        let notificacaoNecessaria = false;

        if (novoStatus === 'paid' || novoStatus === 'approved' || novoStatus === 'completed') {
            nossoStatus = 'Confirmado';
            notificacaoNecessaria = true;
            if (compraStatus !== 'Concluída') {
                compraStatus = 'Concluída';
                unidadeStatus = 'Vendido';
            }

        } else if (novoStatus === 'failed' || novoStatus === 'refused' || novoStatus === 'canceled') {
            nossoStatus = 'Falhou';
            notificacaoNecessaria = true;
        } else if (novoStatus === 'pending' || novoStatus === 'processing') {
            nossoStatus = 'Processando';
        } else if (novoStatus === 'refunded') {
            nossoStatus = 'Reembolsado';
            notificacaoNecessaria = true;
        }

        pagamento.status = nossoStatus;
        if (nossoStatus === 'Confirmado' && dataConfirmacao) {
            pagamento.data_pagamento = new Date(dataConfirmacao);
        }
        await pagamento.save({ transaction: t });
        console.log(`Pagamento ${pagamento.id} atualizado para status: ${nossoStatus}`);

        if (pagamento.compra.status !== compraStatus) {
            pagamento.compra.status = compraStatus;
            await pagamento.compra.save({ transaction: t });
            console.log(`Compra ${pagamento.compra.id} atualizada para status: ${compraStatus}`);
        }
        if (pagamento.compra.unidade.status !== unidadeStatus) {
            await Unidades.update(
                { status: unidadeStatus },
                { where: { id: pagamento.compra.unidade.id }, transaction: t }
            );
            console.log(`Unidade ${pagamento.compra.unidade.id} atualizada para status: ${unidadeStatus}`);
        }
        await t.commit();
        res.status(200).send('Webhook de pagamento processado com sucesso.');

    } catch (error) {
        await t.rollback();
        console.error("Erro no webhook de pagamento:", error);
        res.status(500).send('Erro interno ao processar webhook de pagamento.');
    }
};