const express = require('express');
const {
    createUnidade,
    getUnidadesDoEmpreendimento,
    getUnidadeById,
    updateUnidade,
    deleteUnidade,
    getUnidadesDisponiveisPublic
} = require('../controllers/unidadeController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

router.route('/:id')
    .get(protect, authorize('construtora'), getUnidadeById)
    .put(protect, authorize('construtora'), updateUnidade)
    .delete(protect, authorize('construtora'), deleteUnidade);

module.exports = router;
