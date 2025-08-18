const express = require('express');
const {
    getUserProfile,
    getUserProfileById,
    updateUserProfile,
    changePassword 
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.get('/profile/:id', protect, getUserProfileById);
router.put('/change-password', protect, changePassword);

module.exports = router;