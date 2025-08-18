const express = require('express');
const { getHistoricoConversa, getListaConversas } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/conversa/:destinatarioId', protect, getHistoricoConversa);
router.get('/conversas', protect, getListaConversas);


module.exports = router;