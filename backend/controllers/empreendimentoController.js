// backend/controllers/empreendimentoController.js
const db = require('../models');
const Empreendimentos = db.Empreendimentos;
const Construtoras = db.Construtoras; // Garanta que o modelo Construtoras está disponível em db
const { Op } = require('sequelize');

const getConstrutoraDoUsuario = async (usuarioId) => {
  if (!usuarioId) {
    throw new Error('ID do usuário não fornecido para buscar construtora.');
  }
  const construtora = await Construtoras.findOne({ where: { usuario_id: usuarioId } });
  if (!construtora) {
    throw new Error('Perfil de construtora não encontrado para este usuário.');
  }
  return construtora;
};

// --- CRUD da Construtora ---

exports.createEmpreendimento = async (req, res) => {
  const { nome, descricao, endereco, preco, status, previsao_entrega, imagens, planta_url } = req.body;

  if (!nome || preco === undefined || preco === null || isNaN(parseFloat(preco))) {
    return res.status(400).json({ message: 'Nome e um preço válido são obrigatórios.' });
  }
  if (imagens && !Array.isArray(imagens)) {
    return res.status(400).json({ message: 'O campo "imagens" deve ser um array de URLs.' });
  }

  try {
    const construtora = await getConstrutoraDoUsuario(req.user.id);
    const dadosCriacao = {
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      endereco: endereco?.trim() || null,
      preco: parseFloat(preco),
      status: status || 'Em Lançamento',
      previsao_entrega: previsao_entrega || null,
      imagens: imagens || null,
      planta_url: planta_url || null,
      construtora_id: construtora.id
    };

    const novoEmpreendimento = await Empreendimentos.create(dadosCriacao);
    return res.status(201).json(novoEmpreendimento);

  } catch (error) {
    console.error("Erro ao criar empreendimento:", error);
    if (error.message.includes('Perfil de construtora não encontrado')) {
      return res.status(403).json({ message: error.message + ' Não autorizado a criar empreendimentos.' });
    }
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const messages = error.errors ? error.errors.map(err => err.message) : [error.message];
      return res.status(400).json({ message: 'Erro de validação ou restrição.', errors: messages });
    }
    return res.status(500).json({ message: 'Erro interno do servidor ao criar empreendimento.' });
  }
};

exports.getMeusEmpreendimentos = async (req, res) => {
  try {
    const construtora = await getConstrutoraDoUsuario(req.user.id);
    const empreendimentos = await Empreendimentos.findAll({
      where: { construtora_id: construtora.id },
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json(empreendimentos);
  } catch (error) {
    console.error("Erro ao listar meus empreendimentos:", error);
    if (error.message.includes('Perfil de construtora não encontrado')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Erro interno do servidor ao listar empreendimentos.' });
  }
};

exports.getMeuEmpreendimentoById = async (req, res) => {
  const empreendimentoId = req.params.id;
  try {
    const construtora = await getConstrutoraDoUsuario(req.user.id);
    const empreendimento = await Empreendimentos.findOne({
      where: { id: empreendimentoId, construtora_id: construtora.id }
    });

    if (!empreendimento) {
      return res.status(404).json({ message: 'Empreendimento não encontrado ou não pertence a esta construtora.' });
    }
    return res.status(200).json(empreendimento);
  } catch (error) {
    console.error("Erro ao obter empreendimento:", error);
    if (error.message.includes('Perfil de construtora não encontrado')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Erro interno do servidor ao obter empreendimento.' });
  }
};

exports.updateMeuEmpreendimento = async (req, res) => {
  const empreendimentoId = req.params.id;
  const dadosAtualizacao = { ...req.body };

  delete dadosAtualizacao.id;
  delete dadosAtualizacao.construtora_id;
  delete dadosAtualizacao.createdAt;
  delete dadosAtualizacao.updatedAt;
  delete dadosAtualizacao.total_unidade;
  delete dadosAtualizacao.imagem_url;

  if (Object.keys(dadosAtualizacao).length === 0) {
    return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' });
  }
  if (dadosAtualizacao.imagens && !Array.isArray(dadosAtualizacao.imagens)) {
    return res.status(400).json({ message: 'O campo "imagens" deve ser um array de URLs.' });
  }

  try {
    const construtora = await getConstrutoraDoUsuario(req.user.id);
    const empreendimento = await Empreendimentos.findOne({
      where: { id: empreendimentoId, construtora_id: construtora.id }
    });

    if (!empreendimento) {
      return res.status(404).json({ message: 'Empreendimento não encontrado ou não pertence a esta construtora.' });
    }

    const empreendimentoAtualizado = await empreendimento.update(dadosAtualizacao);
    return res.status(200).json(empreendimentoAtualizado);

  } catch (error) {
    console.error("Erro ao atualizar empreendimento:", error);
    if (error.message.includes('Perfil de construtora não encontrado')) {
      return res.status(403).json({ message: error.message });
    }
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors ? error.errors.map(err => err.message) : [error.message];
      return res.status(400).json({ message: 'Erro de validação.', errors: messages });
    }
    return res.status(500).json({ message: 'Erro interno do servidor ao atualizar empreendimento.' });
  }
};

exports.deleteMeuEmpreendimento = async (req, res) => {
  const empreendimentoId = req.params.id;
  try {
    const construtora = await getConstrutoraDoUsuario(req.user.id);
    const empreendimento = await Empreendimentos.findOne({
      where: { id: empreendimentoId, construtora_id: construtora.id }
    });

    if (!empreendimento) {
      return res.status(404).json({ message: 'Empreendimento não encontrado ou não pertence a esta construtora.' });
    }

    await empreendimento.destroy();
    return res.status(200).json({ message: 'Empreendimento excluído com sucesso.' });

  } catch (error) {
    console.error("Erro ao excluir empreendimento:", error);
    if (error.message.includes('Perfil de construtora não encontrado')) {
      return res.status(403).json({ message: error.message });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Não é possível excluir o empreendimento pois existem registros relacionados.' });
    }
    return res.status(500).json({ message: 'Erro interno do servidor ao excluir empreendimento.' });
  }
};
exports.getAllEmpreendimentosPublic = async (req, res) => {
  try {
    const { search, status, construtora, minPrice, maxPrice, page = 1, limit = 6 } = req.query;

    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);

    if (isNaN(pageInt) || isNaN(limitInt) || pageInt < 1 || limitInt < 1) {
        return res.status(400).json({ message: "Parâmetros de paginação inválidos." });
    }

    const offset = (pageInt - 1) * limitInt; // <<< CÁLCULO CORRIGIDO

    let whereClause = {};
    let includeConstrutora = {
      model: Construtoras,
      as: 'construtora',
      attributes: ['id', 'nome_empresa'],
      required: false
    };

    if (construtora) {
      includeConstrutora.where = { nome_empresa: { [Op.iLike]: `%${construtora}%` } };
      includeConstrutora.required = true;
    }
    if (search) {
      whereClause[Op.or] = [
        { nome: { [Op.iLike]: `%${search}%` } },
        { descricao: { [Op.iLike]: `%${search}%` } },
        { endereco: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (status) { whereClause.status = status; }
    if (minPrice) { whereClause.preco = { ...whereClause.preco, [Op.gte]: parseFloat(minPrice) }; }
    if (maxPrice) { whereClause.preco = { ...whereClause.preco, [Op.lte]: parseFloat(maxPrice) }; }

    const { count, rows } = await Empreendimentos.findAndCountAll({
      where: whereClause,
      include: [includeConstrutora],
      limit: limitInt,
      offset: offset,
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limitInt),
      currentPage: pageInt,
      empreendimentos: rows
    });

  } catch (error) {
    console.error("Erro ao listar empreendimentos públicos:", error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

exports.getEmpreendimentoByIdPublic = async (req, res) => {
  const empreendimentoId = req.params.id;
  try {
    const empreendimento = await Empreendimentos.findByPk(empreendimentoId, {
      include: [
        {
          model: Construtoras,
          as: 'construtora',
          attributes: ['id', 'nome_empresa', 'telefone', 'email', 'usuario_id'],
          required: false // LEFT JOIN
        },
      ]
    });

    if (!empreendimento) {
      return res.status(404).json({ message: 'Empreendimento não encontrado.' });
    }
    return res.status(200).json(empreendimento);
  } catch (error) {
    console.error("Erro ao buscar detalhes do empreendimento:", error);
    return res.status(500).json({ message: 'Erro interno do servidor ao buscar detalhes do empreendimento.' });
  }
};