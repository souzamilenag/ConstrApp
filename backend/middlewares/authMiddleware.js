const jwt = require('jsonwebtoken');
const db = require('../models');
const Usuarios = db.Usuarios;
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await Usuarios.findByPk(decoded.id, {
        attributes: { exclude: ['senha'] } 
      });

      if (!req.user) {
         return res.status(401).json({ message: 'Usuário não encontrado (token inválido).' });
      }

      next();

    } catch (error) {
      console.error('Erro na autenticação do token:', error.message);
       if (error.name === 'JsonWebTokenError') {
           return res.status(401).json({ message: 'Token inválido.' });
       }
       if (error.name === 'TokenExpiredError') {
           return res.status(401).json({ message: 'Token expirado.' });
       }
      // Outros erros
      return res.status(401).json({ message: 'Não autorizado, falha na verificação do token.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Não autorizado, token não fornecido.' });
  }
};

const authorize = (...tiposPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Não autorizado, faça login primeiro.' });
        }

        if (!tiposPermitidos.includes(req.user.tipo_usuario)) {
            return res.status(403).json({ message: `Acesso negado. Rota permitida apenas para: ${tiposPermitidos.join(', ')}.` });
        }
        next();
    };
};


module.exports = { protect, authorize };