const express = require('express');
const { webhookPagamento } = require('../controllers/pagamentoController');
const router = express.Router();

router.post('/webhook/gateway', express.raw({type: 'application/json'}), webhookPagamento);

module.exports = router;