'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
   // ...
await queryInterface.createTable('notificacoes', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER
  },
  usuario_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  titulo: {
    type: Sequelize.STRING,
    allowNull: false 
  },
  mensagem: {
    type: Sequelize.TEXT,
    allowNull: false 
  },
  tipo: {
    type: Sequelize.STRING(50)
  },
  status: {
    type: Sequelize.STRING(50),
    allowNull: false,
    defaultValue: 'Não Lida'
  },
  link: {
    type: Sequelize.STRING(512) 
  },
  data_envio: {
    type: Sequelize.DATE, 
    defaultValue: Sequelize.NOW 
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
    await queryInterface.dropTable('Notificacoes');
  }
};