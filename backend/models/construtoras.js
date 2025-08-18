'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Construtoras extends Model {
    static associate(models) {
      Construtoras.belongsTo(models.Usuarios, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });
      Construtoras.hasMany(models.Empreendimentos, {
        foreignKey: 'construtora_id',
        as: 'empreendimentos'
      });
    }
  }
  Construtoras.init({
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    nome_empresa: { type: DataTypes.STRING, allowNull: false },
    cnpj: { type: DataTypes.STRING, allowNull: false, unique: true },
    telefone: DataTypes.STRING,
    endereco: DataTypes.TEXT,
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } }
  }, {
    sequelize,
    modelName: 'Construtoras',
    tableName: 'construtoras',
    timestamps: true
  });
  return Construtoras;
};