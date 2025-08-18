'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat', { 
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT 
      },
      remetente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      destinatario_id: {
        type: Sequelize.INTEGER,
        allowNull: false, // Adicionar
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' 
      },
      empreendimento_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'empreendimentos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      compra_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'compras', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' 
      },
      mensagem: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data_envio: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW 
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'Enviado'
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
    await queryInterface.dropTable('Chats');
  }
};