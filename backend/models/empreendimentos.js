'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Empreendimentos extends Model {

    static associate(models) {
      Empreendimentos.belongsTo(models.Construtoras, {
        foreignKey: 'construtora_id',
        as: 'construtora'
      });

      Empreendimentos.hasMany(models.Unidades, {
        foreignKey: 'empreendimento_id',
        as: 'unidades'
      });
      
      Empreendimentos.hasMany(models.Agendamentos, {
        foreignKey: 'empreendimento_id',
        as: 'agendamentos'
      });
    }
  }
  Empreendimentos.init({
    construtora_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'construtoras',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descricao: {
      type: DataTypes.TEXT
    },
    endereco: {
      type: DataTypes.TEXT
    },
    preco: {
      type: DataTypes.DECIMAL(15, 2)
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Em Lançamento'
    },
    previsao_entrega: {
      type: DataTypes.DATEONLY
    },

    imagens: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    planta_url: {
      type: DataTypes.STRING(512), 
      allowNull: true
    },

    total_unidade: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Empreendimentos',
    tableName: 'empreendimentos',
    timestamps: true
  });
  return Empreendimentos;
};