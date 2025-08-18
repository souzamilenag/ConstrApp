const express = require('express');
const {
    createAgendamento,
    getMeusAgendamentos,
    getAgendamentosDaConstrutora,
    updateStatusAgendamento,
    cancelAgendamento
} = require('../controllers/agendamentoController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/', protect, authorize('cliente'), createAgendamento);
router.get('/meus', protect, authorize('cliente'), getMeusAgendamentos);
router.get('/construtora', protect, authorize('construtora'), getAgendamentosDaConstrutora);
router.put('/:id/status', protect, authorize('construtora'), updateStatusAgendamento);
router.delete('/:id', protect, authorize('cliente'), cancelAgendamento);

module.exports = router;