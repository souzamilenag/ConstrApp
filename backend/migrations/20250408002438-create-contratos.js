'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Contratos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      compra_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      cliente_assinou: {
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      construtora_assinou: {
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      data_assinatura: {
        allowNull: false,
        type: Sequelize.DATE
      },
      documento_url: {
        allowNull: false,
        type: Sequelize.STRING
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Contratos');
  }
};