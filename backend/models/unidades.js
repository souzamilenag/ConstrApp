'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Unidades extends Model {
    static associate(models) {
      Unidades.belongsTo(models.Empreendimentos, {
        foreignKey: 'empreendimento_id',
        as: 'empreendimento'
      });
      Unidades.hasOne(models.Compras, {
        foreignKey: 'unidade_id',
        as: 'compra'
      });
    }
  }
  Unidades.init({
    empreendimento_id: DataTypes.INTEGER,
    numero: DataTypes.STRING,
    andar: DataTypes.INTEGER,
    bloco: DataTypes.STRING,
    status: DataTypes.STRING,
    preco: DataTypes.DECIMAL,
    area: DataTypes.DECIMAL,
    quartos: DataTypes.INTEGER,
    banheiros: DataTypes.INTEGER,
    vagas: DataTypes.INTEGER,
    observacoes: DataTypes.TEXT,
    planta_unidade_url: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Unidades',
    tableName: 'unidades',
  });
  return Unidades;
};