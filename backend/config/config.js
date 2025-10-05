// backend/config/config.js
require('dotenv').config();

const sslConfig = process.env.NODE_ENV === 'production' && process.env.RENDER
  ? {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }
  : {};


module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres'
  },

  production: {
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    port: parseInt(process.env.PROD_DB_PORT, 10) || 5432,
    dialect: 'postgres',
    ...sslConfig
  }
};