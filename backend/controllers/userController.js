const db = require('../models');
const Usuarios = db.Usuarios;
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

exports.getUserProfile = async (req, res) => {
  const usuario = req.user;

  if (usuario) {
    res.status(200).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario,
      createdAt: usuario.createdAt
    });
  } else {
    res.status(404).json({ message: 'Usuário não encontrado.' });
  }
};
exports.getUserProfileById = async (req, res) => {
  const userIdToFind = req.params.id;

  try {
    const user = await db.Usuarios.findByPk(userIdToFind, {
      attributes: ['id', 'nome']
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json(user);

  } catch (error) {
    console.error(`Erro ao buscar perfil do usuário ${userIdToFind}:`, error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

exports.updateUserProfile = async (req, res) => {
  const { nome, email } = req.body;
  const usuarioId = req.user.id;

  try {
    const usuario = await Usuarios.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (nome) usuario.nome = nome.trim();
    if (email) {
      const emailExistente = await Usuarios.findOne({ where: { email: email.trim(), id: { [Op.ne]: usuarioId } } }); if (emailExistente) {
        return res.status(400).json({ message: 'Este email já está em uso por outra conta.' });
      }
      usuario.email = email.trim();
    }

    const usuarioAtualizado = await usuario.save();

    const { senha, ...dadosParaRetorno } = usuarioAtualizado.toJSON();
    res.status(200).json(dadosParaRetorno);

  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error);
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Erro de validação ou email duplicado.', errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

exports.changePassword = async (req, res) => {
  const { senhaAntiga, novaSenha } = req.body;
  const usuarioId = req.user.id;

  if (!senhaAntiga || !novaSenha) {
    return res.status(400).json({ message: 'Senha antiga e nova senha são obrigatórias.' });
  }
  if (novaSenha.length < 6) {
    return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const usuario = await Usuarios.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const isMatch = await bcrypt.compare(senhaAntiga, usuario.senha);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha antiga incorreta.' });
    }

    usuario.senha = novaSenha;
    await usuario.save();

    res.status(200).json({ message: 'Senha alterada com sucesso.' });

  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
