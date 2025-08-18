'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('agendamentos', { // Nome da tabela minúsculo
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      empreendimento_id: {
        type: Sequelize.INTEGER,
        allowNull: false, 
        references: {
          model: 'empreendimentos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      data_visita: {
        type: Sequelize.DATE, 
        allowNull: false 
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Solicitado' 
      },
      visitar_stand: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      numero_apartamento: {
        type: Sequelize.STRING(20)
      },
      observacoes: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('Agendamentos');
  }
};