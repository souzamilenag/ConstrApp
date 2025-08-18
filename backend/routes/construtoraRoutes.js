const express = require('express');
const {
    completarPerfilConstrutora,
    getMeuPerfilConstrutora,
    getMeuPerfilCompleto, 
    updateMeuPerfilCompleto
} = require('../controllers/construtoraController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/completar-perfil', protect, authorize('construtora'), completarPerfilConstrutora);
router.get('/meu-perfil', protect, authorize('construtora'), getMeuPerfilConstrutora);

router.route('/meu-perfil-completo')
    .get(protect, authorize('construtora'), getMeuPerfilCompleto) 
    .put(protect, authorize('construtora'), updateMeuPerfilCompleto);

module.exports = router;