// backend/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middlewares/authMiddleware');

const {
    uploadPlantaFile,
    uploadEmpreendimentoImages
} = require('../controllers/uploadController');

const router = express.Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

function checkFileType(file, cb) {
    const filetypes = /pdf|jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true); // Aceita o arquivo
    } else {
        cb(new Error('Apenas arquivos do tipo PDF, JPG, JPEG, PNG, WEBP são permitidos!'), false);
    }
}

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de tamanho de arquivo de 10MB
    }
});

router.post(
    '/planta',
    protect,
    authorize('construtora'), 
    upload.single('plantaFile'),
    uploadPlantaFile 
);

router.post(
    '/empreendimento-imagens',
    protect,
    authorize('construtora'),
    upload.array('imageFiles', 10),
    uploadEmpreendimentoImages 
);

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.warn("[Multer Error Caught]", error);
        return res.status(400).json({ message: `Erro de Upload: ${error.message}` });
    } else if (error) {
        console.warn("[File Filter Error Caught]", error);
        return res.status(400).json({ message: error.message });
    }
    next(error);
});


module.exports = router;