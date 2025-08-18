const express = require('express');
const {
    getMinhasNotificacoes,
    marcarComoLida
} = require('../controllers/notificacaoController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(protect);
router.get('/', getMinhasNotificacoes);
router.put('/marcar-como-lida', marcarComoLida);

module.exports = router;