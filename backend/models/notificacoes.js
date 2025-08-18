'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Notificacoes extends Model {
    static associate(models) {
      Notificacoes.belongsTo(models.Usuarios, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });
    }
  }
  Notificacoes.init({
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    titulo: { type: DataTypes.STRING, allowNull: false },
    mensagem: { type: DataTypes.TEXT, allowNull: false },
    tipo: DataTypes.STRING(50),
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Não Lida' },
    link: DataTypes.STRING(512),
    data_envio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'Notificacoes',
    tableName: 'notificacoes',
    timestamps: true
  });
  return Notificacoes;
};