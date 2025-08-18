// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const Usuarios = db.Usuarios;

const gerarToken = (id, tipo_usuario) => {
  return jwt.sign(
    { id, tipo_usuario },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

exports.register = async (req, res) => {
  const { nome, email, senha, tipo_usuario } = req.body;

  if (!nome || !email || !senha || !tipo_usuario) {
    return res.status(400).json({ message: 'Por favor, forneça todos os campos obrigatórios.' });
  }

  try {
    const usuarioExistente = await Usuarios.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'Este email já está cadastrado.' });
    }

    const novoUsuario = await Usuarios.create({
      nome,
      email,
      senha,
      tipo_usuario,
    });

    const token = gerarToken(novoUsuario.id, novoUsuario.tipo_usuario);

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      token,
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        tipo_usuario: novoUsuario.tipo_usuario,
      },
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({ message: 'Erro de validação.', errors: messages });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.' });
  }
};

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Por favor, forneça email e senha.' });
  }

  try {
    const usuario = await Usuarios.findOne({ where: { email } });

    if (!usuario || !(await usuario.validarSenha(senha))) {
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }

    const token = gerarToken(usuario.id, usuario.tipo_usuario);

    res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario,
      },
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao fazer login.' });
  }
};