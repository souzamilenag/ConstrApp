'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Empreendimentos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      construtora_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      nome: {
        allowNull: false,
        type: Sequelize.STRING
      },
      descricao: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      endereco: {
        allowNull: false,
        type: Sequelize.TEXT
      },
      preco: {
        allowNull: false,
        type: Sequelize.DECIMAL
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING
      },
      previsao_entrega: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      imagem_url: {
        allowNull: false,
        type: Sequelize.STRING
      },
      total_unidade: {
        allowNull: false,
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('Empreendimentos');
  }
};