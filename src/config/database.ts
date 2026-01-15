import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    timezone: "+07:00", 
    dialectOptions: {
      charset: "utf8mb4",
    },
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    
    retry: {
      max: 3,
      timeout: 10000, 
    },
    
    pool: {
      max: 10, 
      min: 0, 
      acquire: 30000, 
      idle: 10000, 
    },
  }
);

export default sequelize;
