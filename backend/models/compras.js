'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Compras extends Model {
    static associate(models) {
      Compras.belongsTo(models.Usuarios, {
        foreignKey: 'cliente_id',
        as: 'cliente'
      });
      Compras.belongsTo(models.Unidades, {
        foreignKey: 'unidade_id',
        as: 'unidade'
      });
      Compras.hasOne(models.Contratos, {
        foreignKey: 'compra_id',
        as: 'contrato'
      });
      Compras.hasMany(models.Pagamentos, {
        foreignKey: 'compra_id',
        as: 'pagamentos'
      });
    }
  }
  Compras.init({
    cliente_id: DataTypes.INTEGER,
    unidade_id: DataTypes.INTEGER,
    data_compra: DataTypes.DATE,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Compras',
    tableName: 'compras',
  });
  return Compras;
};