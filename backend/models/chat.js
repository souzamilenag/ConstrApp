'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    static associate(models) {
      Chat.belongsTo(models.Usuarios, {
        foreignKey: 'remetente_id',
        as: 'remetente'
      });
      Chat.belongsTo(models.Usuarios, {
        foreignKey: 'destinatario_id',
        as: 'destinatario'
      });
      Chat.belongsTo(models.Empreendimentos, {
        foreignKey: 'empreendimento_id',
        as: 'empreendimento'
      });
      Chat.belongsTo(models.Compras, {
        foreignKey: 'compra_id',
        as: 'compra'
      });
    }
  }
  Chat.init({
    remetente_id: { type: DataTypes.INTEGER, allowNull: false },
    destinatario_id: { type: DataTypes.INTEGER, allowNull: false },
    empreendimento_id: DataTypes.INTEGER,
    compra_id: DataTypes.INTEGER,
    mensagem: { type: DataTypes.TEXT, allowNull: false },
    data_envio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.STRING(50), defaultValue: 'Enviado' },
  }, {
    sequelize,
    modelName: 'Chat',
    tableName: 'chat',
    timestamps: true
  });
  return Chat;
};