'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const empreendimentos = await queryInterface.sequelize.query(
        'SELECT id, imagens FROM empreendimentos WHERE imagens IS NOT NULL AND jsonb_typeof(imagens) = \'array\'',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      console.log(`Encontrados ${empreendimentos.length} empreendimentos para migrar o campo 'imagens'.`);

      for (const empreendimento of empreendimentos) {
        const imageUrls = empreendimento.imagens;

        if (imageUrls.length > 0 && typeof imageUrls[0] === 'object' && imageUrls[0] !== null) {
          console.log(`Empreendimento ID ${empreendimento.id} já parece estar no formato novo. Pulando.`);
          continue;
        }
        
        const newImageData = imageUrls.map(url => ({
          original: url,
          thumbnail: url
        }));

        console.log(`Atualizando empreendimento ID ${empreendimento.id}...`);

        await queryInterface.sequelize.query(
          'UPDATE empreendimentos SET imagens = :newImageData WHERE id = :id',
          {
            replacements: {
              newImageData: JSON.stringify(newImageData), 
              id: empreendimento.id
            },
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            transaction
          }
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error('Falha ao migrar o formato do campo "imagens":', err);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const empreendimentos = await queryInterface.sequelize.query(
        'SELECT id, imagens FROM empreendimentos WHERE imagens IS NOT NULL AND jsonb_typeof(imagens) = \'array\'',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      console.log(`Encontrados ${empreendimentos.length} empreendimentos para reverter o campo 'imagens'.`);

      for (const empreendimento of empreendimentos) {
        const imageDataObjects = empreendimento.imagens;
        
        if (imageDataObjects.length === 0 || typeof imageDataObjects[0] !== 'object' || imageDataObjects[0] === null) {
            console.log(`Empreendimento ID ${empreendimento.id} já parece estar no formato antigo. Pulando.`);
            continue;
        }

        const oldImageUrls = imageDataObjects.map(imgObject => imgObject.original);

        console.log(`Revertendo empreendimento ID ${empreendimento.id}...`);

        await queryInterface.sequelize.query(
          'UPDATE empreendimentos SET imagens = :oldImageUrls WHERE id = :id',
          {
            replacements: {
              oldImageUrls: JSON.stringify(oldImageUrls),
              id: empreendimento.id
            },
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            transaction
          }
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error('Falha ao reverter o formato do campo "imagens":', err);
      throw err;
    }
  }
};