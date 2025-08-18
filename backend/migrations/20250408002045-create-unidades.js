'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Unidades', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      empreendimento_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      numero: {
        allowNull: false,
        type: Sequelize.STRING
      },
      andar: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      bloco: {
        allowNull: false,
        type: Sequelize.STRING
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING
      },
      preco: {
        allowNull: false,
        type: Sequelize.DECIMAL
      },
      area: {
        allowNull: false,
        type: Sequelize.DECIMAL
      },
      quartos: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      banheiros: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      vagas: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      observacoes: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      planta_unidade_url: {
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
    await queryInterface.dropTable('Unidades');
  }
};