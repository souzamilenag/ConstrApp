const express = require('express');
const {
    iniciarCompra,
    getMinhasCompras,
    getComprasDaConstrutora,
    getDetalhesCompra,
    updateContrato,
    assinarContratoCliente,
    assinarContratoConstrutora,
} = require('../controllers/compraController');
const {
    getPagamentosDaCompra,
    criarIntencaoPagamento
} = require('../controllers/pagamentoController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();
router.post('/iniciar', protect, authorize('cliente'), iniciarCompra);
router.get('/minhas', protect, authorize('cliente'), getMinhasCompras);
router.get('/construtora', protect, authorize('construtora'), getComprasDaConstrutora);
router.get('/:id', protect, getDetalhesCompra);
router.put('/:compraId/contrato', protect, authorize('construtora'), updateContrato);
router.get('/:compraId/pagamentos', protect, getPagamentosDaCompra);
router.post('/:compraId/pagamentos/iniciar', protect, authorize('cliente'), criarIntencaoPagamento);
router.post('/:compraId/assinar-cliente', protect, authorize('cliente'), assinarContratoCliente);
router.post('/:compraId/assinar-construtora', protect, authorize('construtora'), assinarContratoConstrutora);


module.exports = router;