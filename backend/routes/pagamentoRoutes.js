const express = require('express');
const { webhookPagamento, confirmarPagamentoManual } = require('../controllers/pagamentoController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/webhook/gateway', express.raw({type: 'application/json'}), webhookPagamento);
router.put('/:id/confirmar', protect, authorize('construtora'), confirmarPagamentoManual);

module.exports = router;