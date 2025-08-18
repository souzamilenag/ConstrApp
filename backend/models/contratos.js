'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Contratos extends Model {
    static associate(models) {
      Contratos.belongsTo(models.Compras, {
        foreignKey: 'compra_id',
        as: 'compra'
      });
    }
  }
  Contratos.init({
    compra_id: DataTypes.INTEGER,
    cliente_assinou: DataTypes.BOOLEAN,
    construtora_assinou: DataTypes.BOOLEAN,
    data_assinatura: DataTypes.DATE,
    documento_url: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Contratos',
    tableName: 'contratos',
  });
  return Contratos;
};