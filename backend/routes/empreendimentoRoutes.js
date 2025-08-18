const express = require('express');
const {
    createEmpreendimento,
    getMeusEmpreendimentos,
    getMeuEmpreendimentoById,
    updateMeuEmpreendimento,
    deleteMeuEmpreendimento,
    getAllEmpreendimentosPublic,
    getEmpreendimentoByIdPublic
} = require('../controllers/empreendimentoController');
const {
    createUnidade,
    getUnidadesDoEmpreendimento,
    getUnidadesDisponiveisPublic
} = require('../controllers/unidadeController');

const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', getAllEmpreendimentosPublic);
router.get('/public/:id', getEmpreendimentoByIdPublic);
router.post('/', protect, authorize('construtora'), createEmpreendimento);
router.get('/meus', protect, authorize('construtora'), getMeusEmpreendimentos);
router.route('/:id')
    .get(protect, authorize('construtora'), getMeuEmpreendimentoById)
    .put(protect, authorize('construtora'), updateMeuEmpreendimento)
    .delete(protect, authorize('construtora'), deleteMeuEmpreendimento);
router.post('/:empreendimentoId/unidades', protect, authorize('construtora'), createUnidade);
router.get('/:empreendimentoId/unidades', protect, authorize('construtora'), getUnidadesDoEmpreendimento);
router.get('/:empreendimentoId/unidades/disponiveis', getUnidadesDisponiveisPublic);

module.exports = router;