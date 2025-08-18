'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Agendamentos extends Model {
    static associate(models) {
      Agendamentos.belongsTo(models.Usuarios, {
        foreignKey: 'cliente_id',
        as: 'cliente'
      });
      Agendamentos.belongsTo(models.Empreendimentos, {
        foreignKey: 'empreendimento_id',
        as: 'empreendimento'
      });
    }
  }
  Agendamentos.init({
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    empreendimento_id: { type: DataTypes.INTEGER, allowNull: false },
    data_visita: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Solicitado' },
    visitar_stand: { type: DataTypes.BOOLEAN, defaultValue: true },
    numero_apartamento: DataTypes.STRING(20),
    observacoes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Agendamentos',
    tableName: 'agendamentos',
    timestamps: true
  });
  return Agendamentos;
};