import { Sequelize } from 'sequelize';


  export const sequelize = new Sequelize('neondb', process.env.NEON_ROLE || '', process.env.NEON_PASS, {
    host: process.env.NEON_HOST || '',
    dialect: 'postgres',
    port: Number(process.env.NEON_PORT) || 0 ,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // required by Neon
      }
    },
    logging: false // or true to see SQL logs
  });