// backend/migrations/xxxxxxxxxxxx-update-empreendimentos-for-carousel-and-plant.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'empreendimentos', // Nome da tabela
        'imagens',         // Nome da nova coluna
        {
          type: Sequelize.JSONB,
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'empreendimentos', // Nome da tabela
        'planta_url',      // Nome da nova coluna
        {
          type: Sequelize.STRING(512),
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.removeColumn(
        'empreendimentos', // Nome da tabela
        'imagem_url',      // Nome da coluna a ser removida
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
       await queryInterface.addColumn(
        'empreendimentos',
        'imagem_url',
        {
          type: Sequelize.STRING(512),
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.removeColumn(
        'empreendimentos',
        'planta_url',
        { transaction }
      );

      await queryInterface.removeColumn(
        'empreendimentos',
        'imagens',
        { transaction }
      );
      
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};