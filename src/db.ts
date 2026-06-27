import { Sequelize } from 'sequelize';


  export const sequelize = new Sequelize('neondb', 'neondb_owner', 'npg_3txTZMuzU5GJ', {
    host: 'ep-misty-union-ac7r0jeh-pooler.sa-east-1.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // required by Neon
      }
    },
    logging: false // or true to see SQL logs
  });