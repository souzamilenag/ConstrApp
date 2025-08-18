'use strict';
const db = require('../models');
const Construtoras = db.Construtoras;
const Usuarios = db.Usuarios;
const { Op } = require('sequelize');

exports.completarPerfilConstrutora = async (req, res) => {
    const usuarioId = req.user.id;
    const { nome_empresa, cnpj, email, telefone, endereco } = req.body;

    if (!nome_empresa || !cnpj || !email) {
        return res.status(400).json({ message: 'Nome da empresa, CNPJ e Email de contato são obrigatórios.' });
    }
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    if (cnpjLimpo.length !== 14) {
        return res.status(400).json({ message: 'CNPJ inválido. Deve conter 14 dígitos.' });
    }

    try {
        const perfilExistente = await Construtoras.findOne({ where: { usuario_id: usuarioId } });
        if (perfilExistente) {
            return res.status(400).json({ message: 'Perfil de construtora já existe para este usuário.' });
        }
        const cnpjExistente = await Construtoras.findOne({ where: { cnpj: cnpjLimpo } });
        if (cnpjExistente) {
            return res.status(400).json({ message: 'Este CNPJ já está cadastrado.' });
        }

        const novoPerfil = await Construtoras.create({
            usuario_id: usuarioId,
            nome_empresa: nome_empresa.trim(),
            cnpj: cnpjLimpo,
            email: email.trim(),
            telefone: telefone?.trim() || null,
            endereco: endereco?.trim() || null
        });

        return res.status(201).json(novoPerfil);

    } catch (error) {
        console.error("Erro ao completar perfil da construtora:", error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors ? error.errors.map(err => err.message) : [error.message];
            return res.status(400).json({ message: 'Erro de validação ou campo duplicado.', errors: messages });
        }
        return res.status(500).json({ message: 'Erro interno do servidor ao salvar perfil.' });
    }
};

exports.getMeuPerfilConstrutora = async (req, res) => {
    const usuarioId = req.user.id;
    try {
        const perfil = await Construtoras.findOne({ where: { usuario_id: usuarioId } });
        if (!perfil) {
            // Retorna 404 para o AuthContext saber que precisa completar o cadastro
            return res.status(404).json({ message: 'Perfil de construtora não encontrado.' });
        }
        return res.status(200).json(perfil);
    } catch (error) {
        console.error("Erro ao buscar perfil da construtora:", error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.getMeuPerfilCompleto = async (req, res) => {
    const usuarioId = req.user.id;
    try {
        const usuario = await Usuarios.findByPk(usuarioId, {
            attributes: { exclude: ['senha'] },
            include: [{
                model: Construtoras,
                as: 'construtora', // Alias da associação Usuario -> Construtora
                required: true // INNER JOIN
            }]
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Perfil completo de construtora não encontrado.' });
        }

        return res.status(200).json(usuario);

    } catch (error) {
        console.error("Erro ao buscar perfil completo da construtora:", error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

exports.updateMeuPerfilCompleto = async (req, res) => {
    const usuarioId = req.user.id;
    const {
        nome, email,
        nome_empresa, cnpj, telefone, endereco, email_empresa // Dados de Construtoras
    } = req.body;

    const t = await db.sequelize.transaction();

    try {
        const usuario = await Usuarios.findByPk(usuarioId, {
            include: [{ model: Construtoras, as: 'construtora', required: true }],
            transaction: t
        });
        if (!usuario) {
            await t.rollback();
            return res.status(404).json({ message: 'Perfil não encontrado.' });
        }
        const construtora = usuario.construtora;

        if (nome) usuario.nome = nome.trim();
        if (email) {
            const emailExistente = await Usuarios.findOne({ where: { email: email.trim(), id: { [Op.ne]: usuarioId } } });
            if (emailExistente) { /* ... */ }
            usuario.email = email.trim();
        }
        await usuario.save({ transaction: t });

        if (nome_empresa) construtora.nome_empresa = nome_empresa.trim();
        if (cnpj) {
            const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
            if (cnpjLimpo.length !== 14) {
                await t.rollback();
                return res.status(400).json({ message: 'CNPJ inválido. Deve conter 14 dígitos.' });
            }
            const cnpjExistente = await Construtoras.findOne({ where: { cnpj: cnpjLimpo, id: { [Op.ne]: construtora.id } } });
            if (cnpjExistente) {
                await t.rollback();
                return res.status(400).json({ message: 'Este CNPJ já está cadastrado em outra conta.' });
            }
            construtora.cnpj = cnpjLimpo;
        }
        if (telefone) construtora.telefone = telefone.trim();
        if (endereco) construtora.endereco = endereco.trim();
        if (email_empresa) construtora.email = email_empresa.trim();
        await construtora.save({ transaction: t });

        await t.commit();

        const usuarioAtualizado = await Usuarios.findByPk(usuarioId, {
            attributes: { exclude: ['senha'] },
            include: [{ model: Construtoras, as: 'construtora' }]
        });

        return res.status(200).json(usuarioAtualizado);

    } catch (error) {
        await t.rollback();
        console.error("Erro ao atualizar perfil completo da construtora:", error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Erro de validação ou campo duplicado.', errors: error.errors.map(e => e.message) });
        }
        return res.status(500).json({ message: 'Erro interno do servidor ao atualizar o perfil.' });
    }
};