// backend/controllers/uploadController.js
'use strict';
const path = require('path');
const sharp = require('sharp');

exports.uploadPlantaFile = (req, res) => {

    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    const filePath = req.file.path;

    const formattedPath = `/${filePath.replace(/\\/g, "/")}`;

    console.log(`[uploadController] Arquivo '${req.file.originalname}' salvo em '${formattedPath}'`);
    res.status(201).json({
        message: 'Arquivo enviado com sucesso!',
        filePath: formattedPath 
    });
};

exports.uploadEmpreendimentoImages = async (req, res) => {
    if (!req.files || req.files.length === 0) { /* ... */ }

    const fileProcessingPromises = req.files.map(async (file) => {
        const originalPath = `/${file.path.replace(/\\/g, "/")}`;
        const thumbFilename = `thumb-${file.filename}`;
        const thumbPath = `/uploads/${thumbFilename}`;

        await sharp(file.path)
            .resize(150, 100) 
            .toFile(path.join('uploads', thumbFilename)); 


        return { original: originalPath, thumbnail: thumbPath };
    });

    const processedFiles = await Promise.all(fileProcessingPromises);

 if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Nenhum arquivo de imagem recebido pelo servidor.' });
    }

    const filePaths = req.files.map(file => `/${file.path.replace(/\\/g, "/")}`);

    res.status(201).json({
        message: `${req.files.length} imagens enviadas com sucesso!`,
        filePaths: filePaths // <<< A chave é exatamente 'filePaths'?
    });
};