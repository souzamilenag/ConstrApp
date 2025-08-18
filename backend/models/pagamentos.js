'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pagamentos extends Model {
    static associate(models) {
      Pagamentos.belongsTo(models.Compras, {
        foreignKey: 'compra_id',
        as: 'compra'
      });
    }
  }
  Pagamentos.init({
    compra_id: DataTypes.INTEGER,
    data_pagamento: DataTypes.DATE,
    valor: DataTypes.DECIMAL,
    metodo_pagamento: DataTypes.STRING,
    status: DataTypes.STRING,
    gateway_transaction_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Pagamentos',
    tableName: 'pagamentos',
  });
  return Pagamentos;
};